const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const lockfile = require('proper-lockfile');

const DOWNLOAD_QUEUE_PATH = path.join(__dirname, '..', 'database', 'download.json');
const MAIN_DB_PATH = path.join(__dirname, '..', 'database', 'database.json');
const ID_DB_DIR = path.join(__dirname, '..', 'database', 'ID');

let isWorkerRunning = false;

// --- Utility Functions ---

/**
 * Safely reads and parses a JSON file with locking.
 * @param {string} filePath The path to the JSON file.
 * @returns {Promise<any>} The parsed JSON data.
 */
async function readJsonFile(filePath) {
    try {
        await fs.access(filePath); // Check if file exists
        const release = await lockfile.lock(filePath, { retries: 5 });
        const content = await fs.readFile(filePath, 'utf8');
        await release();
        return JSON.parse(content);
    } catch (error) {
        if (error.code === 'ENOENT') { // File doesn't exist
            return null;
        }
        throw error;
    }
}

/**
 * Safely writes data to a JSON file with locking.
 * @param {string} filePath The path to the JSON file.
 * @param {any} data The data to write.
 */
async function writeJsonFile(filePath, data) {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    const release = await lockfile.lock(filePath, { retries: 5 });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    await release();
}

/**
 * Generates a unique ID.
 * @returns {string}
 */
function generateUniqueId() {
    return crypto.randomBytes(32).toString('hex');
}

// --- Core Functions (Placeholders) ---

async function startScan(chatId) {
    console.log(`[Downloader] Starting scan for chat ID: ${chatId}`);

    if (!global.userClient) {
        console.error('[Downloader] User client is not initialized.');
        return;
    }

    try {
        const client = global.userClient;
        const targetChatId = isNaN(parseInt(chatId)) ? chatId : parseInt(chatId);

        // Get existing message IDs to avoid duplicates
        const chatDbPath = path.join(ID_DB_DIR, `${targetChatId}.json`);
        const chatDb = await readJsonFile(chatDbPath);
        const existingMessageIds = new Set(chatDb ? chatDb.map(item => item.messageId) : []);

        const downloadQueue = await readJsonFile(DOWNLOAD_QUEUE_PATH) || [];
        const queuedMessageIds = new Set(downloadQueue.map(item => item.messageId));

        let newFilesFound = 0;
        let lastNomor = downloadQueue.length > 0 ? Math.max(...downloadQueue.map(f => parseInt(f.nomor))) : 0;

        console.log(`[Downloader] Scanning messages in ${targetChatId}. This might take some time...`);

        const messages = await client.getMessages(targetChatId, { limit: null });

        for (const message of messages) {
            if (!message || (!message.media && !message.document)) continue;
            if (existingMessageIds.has(message.id) || queuedMessageIds.has(message.id)) continue;

            const media = message.media;
            const doc = message.document;
            let mediaType;
            let mimeType;

            if (media && (media.photo || media.video)) {
                mediaType = media.photo ? 'photo' : 'video';
                mimeType = media.mimeType;
            } else if (doc) {
                if (doc.mimeType.startsWith('audio/')) {
                    mediaType = 'audio';
                } else {
                    mediaType = 'document';
                }
                mimeType = doc.mimeType;
            } else {
                continue; // Not a supported type
            }

            newFilesFound++;
            lastNomor++;

            const downloadJob = {
                id: generateUniqueId(),
                chatId: targetChatId.toString(),
                messageId: message.id,
                timestamp: message.date * 1000,
                retryCount: 0,
                maxRetries: 5, // A more reasonable max retries
                downloaded: false,
                partialFilePath: null,
                mediaType: mediaType,
                mimeType: mimeType,
                nomor: lastNomor.toString()
            };

            downloadQueue.push(downloadJob);
            queuedMessageIds.add(message.id);
        }

        if (newFilesFound > 0) {
            await writeJsonFile(DOWNLOAD_QUEUE_PATH, downloadQueue);
            console.log(`[Downloader] Found and queued ${newFilesFound} new files from chat ${targetChatId}.`);
        } else {
            console.log(`[Downloader] No new files to download from chat ${targetChatId}.`);
        }

    } catch (error) {
        console.error(`[Downloader] Error during scan for chat ID ${chatId}:`, error);
        // Optionally, send a message back to the user
    } finally {
        console.log(`[Downloader] Scan for ${chatId} finished. Triggering worker.`);
        runDownloadWorker(); // Trigger worker regardless of scan outcome
    }
}

// --- Helper for file size ---
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


async function runDownloadWorker() {
    if (isWorkerRunning) {
        console.log('[Downloader] Worker is already running.');
        return;
    }
    isWorkerRunning = true;
    console.log('[Downloader] Download worker started.');

    try {
        while (true) {
            const downloadQueue = await readJsonFile(DOWNLOAD_QUEUE_PATH) || [];
            if (downloadQueue.length === 0) {
                break; // No more items to download
            }

            // Get the job with the smallest 'nomor'
            downloadQueue.sort((a, b) => parseInt(a.nomor) - parseInt(b.nomor));
            const job = downloadQueue[0];

            console.log(`[Downloader] Processing job #${job.nomor} for message ${job.messageId} in chat ${job.chatId}`);

            let success = false;
            try {
                const message = await global.userClient.getMessages(job.chatId, { ids: job.messageId });
                if (!message || message.length === 0) throw new Error('Message not found or inaccessible.');

                const fileBuffer = await global.userClient.downloadMedia(message[0], {});

                const extension = message[0].file.ext || '.dat';
                const newFileName = `${generateUniqueId()}${extension}`;
                const filePath = path.join(global.download, newFileName);

                await fs.mkdir(path.dirname(filePath), { recursive: true });
                await fs.writeFile(filePath, fileBuffer);

                console.log(`[Downloader] Successfully downloaded ${newFileName}`);

                // --- Post-download processing ---
                const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
                const fileSize = formatBytes(fileBuffer.length);

                // 1. Add to main database.json
                const mainDb = await readJsonFile(MAIN_DB_PATH) || [];
                const newDbId = mainDb.length > 0 ? Math.max(...mainDb.map(item => item.id)) + 1 : 1;

                const dbEntry = {
                    id: newDbId,
                    uploaded: false,
                    user_id: job.chatId,
                    username: "undefined", // Username is not easily available here
                    date: new Date().toISOString().split('T')[0],
                    type: job.mediaType,
                    caption: message[0].text || "",
                    file_name: newFileName,
                    file_size: fileSize,
                    mime_type: job.mimeType,
                    location: filePath,
                    hash: fileHash,
                    watermark: false,
                    encrypted: false
                };
                mainDb.push(dbEntry);
                await writeJsonFile(MAIN_DB_PATH, mainDb);

                // 2. Add to chat-specific ID/{chatId}.json
                const chatDbPath = path.join(ID_DB_DIR, `${job.chatId}.json`);
                const chatDb = await readJsonFile(chatDbPath) || [];
                const chatDbEntry = {
                    ...job,
                    downloaded: true,
                    completed: true,
                    databaseId: newDbId,
                    fileName: newFileName,
                    location: filePath,
                };
                delete chatDbEntry.partialFilePath;
                chatDb.push(chatDbEntry);
                await writeJsonFile(chatDbPath, chatDb);

                success = true;

            } catch (downloadError) {
                console.error(`[Downloader] Failed to download job #${job.nomor}. Error: ${downloadError.message}`);
                job.retryCount++;
            }

            // Update the queue
            const currentQueue = await readJsonFile(DOWNLOAD_QUEUE_PATH) || [];
            const jobIndex = currentQueue.findIndex(j => j.id === job.id);

            if (jobIndex !== -1) {
                if (success || job.retryCount >= job.maxRetries) {
                    // Remove job if successful or max retries reached
                    currentQueue.splice(jobIndex, 1);
                } else {
                    // Update retry count if failed
                    currentQueue[jobIndex] = job;
                }
            }
            await writeJsonFile(DOWNLOAD_QUEUE_PATH, currentQueue);
        }
    } catch (error) {
        console.error('[Downloader] A critical error occurred in the download worker:', error);
    } finally {
        isWorkerRunning = false;
        console.log('[Downloader] Download worker finished.');
    }
}

module.exports = {
    startScan
};
