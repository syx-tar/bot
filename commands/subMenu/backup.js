/**
 * Backup System Handler
 * Creates a zip of the configured directories and sends it to the owner
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { Readable } = require('stream');
const FormData = require('form-data');
const axios = require('axios');

// Variable to store the auto backup interval
let autoBackupInterval = null;

module.exports = {
  // Handle callback queries for backup
  handleCallback: async function(button) {
    try {
      const chatId = button.message.chat.id;
      const messageId = button.message.message_id;
      const userId = button.from.id;
      const data = button.data;
      
      // Check if user is owner
      if (!global.owner.includes(userId.toString())) {
        await global.answerCallbackQuery(button.id, { 
          text: global.permissionMessages.owner, 
          show_alert: true 
        });
        return true;
      }
      
      // Handle different backup menu actions
      switch (data) {
        case 'menu_backup':
          return await showBackupMenu(button);
        
        case 'backup_start':
          return await startBackup(button);
          
        case 'backup_toggle':
          return await toggleAutoBackup(button);
          
        default:
          return false;
      }
    } catch (error) {
      console.error('Error handling backup menu callback:', error.message);
      return false;
    }
  },
  
  // Initialize auto backup on bot start
  initialize: async function() {
    if (global.autoBackup && global.autoBackup.enabled) {
      startAutoBackupInterval();
    }
  }
};

// Show backup menu
async function showBackupMenu(button) {
  try {
    await global.answerCallbackQuery(button.id);
    
    const backupPaths = global.backupPaths || ['/root/Vynix', '/root/Vynix2'];
    const excludeItems = global.backupExclude || ['node_modules', 'temp/*', 'package-lock.json'];
    
    const pathsText = backupPaths.map(p => `- ${p}`).join('\n');
    const excludeText = excludeItems.map(e => `- ${e}`).join('\n');
    
    // Check auto backup status
    const autoBackupStatus = global.autoBackup.enabled ? 
      '✅ Auto Backup: <b>Enabled</b> (Every hour)' : 
      '❌ Auto Backup: <b>Disabled</b>';
    
    await global.editMessageText(
      '📦 <b>BACKUP SYSTEM</b> 📦\n\n' +
      'This utility will create a backup of your system and send it to you.\n\n' +
      '<b>Paths to backup:</b>\n' + pathsText + '\n\n' +
      '<b>Excluded items:</b>\n' + excludeText + '\n\n' +
      autoBackupStatus,
      {
        chat_id: button.message.chat.id,
        message_id: button.message.message_id,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '▶️ Start Manual Backup', callback_data: 'backup_start' }
            ],
            [
              { 
                text: global.autoBackup.enabled ? '🔴 Disable Auto Backup' : '🟢 Enable Auto Backup', 
                callback_data: 'backup_toggle' 
              }
            ],
            [{ text: '◀️ Back to Admin Panel', callback_data: 'menu_admin' }]
          ]
        }
      }
    );
    return true;
  } catch (editError) {
    console.error('Error displaying backup menu:', editError.message);
    return false;
  }
}

// Start backup process
async function startBackup(button, isAutoBackup = false) {
  try {
    let chatId, messageId;
    
    if (button) {
      chatId = button.message.chat.id;
      messageId = button.message.message_id;
      
      // Answer callback query first
      await global.answerCallbackQuery(button.id, {
        text: 'Starting backup process...',
        show_alert: false
      });
      
      // Edit message to show progress
      await global.editMessageText(
        '📦 <b>Creating Backup</b> 📦\n\n' +
        'Please wait, creating backup archive...',
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⏱️ Processing...', callback_data: 'backup_processing' }]
            ]
          }
        }
      );
    } else if (isAutoBackup) {
      // For auto backup, we need to find the owner chat ID
      chatId = global.owner[0]; // Use first owner as default
    }

    // Create backup
    try {
      const zipBuffer = await createBackup();
      
      if (button) {
        // Update progress message for manual backup
        await global.editMessageText(
          '📦 <b>Backup Created</b> 📦\n\n' +
          'Backup has been created successfully! Sending file...',
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML'
          }
        );
      }

      // Create current date for filename
      const date = new Date();
      const dateStr = date.toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const filename = `backup_${dateStr}.zip`;
      
      // Create a temporary directory if it doesn't exist
      const tempDir = '/tmp';
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Save buffer to a temporary file
      const tempFilePath = path.join(tempDir, filename);
      fs.writeFileSync(tempFilePath, zipBuffer);
      console.log(`Backup file saved to ${tempFilePath}`);
      
      // Track success count
      let successCount = 0;
      let sentMessages = []; // Store information about sent messages

      // Try to send the file using a direct API request through apiRequest
      for (const ownerId of global.owner) {
        try {
          console.log(`Sending backup to owner ${ownerId}...`);
          
          // Create form data with file
          const form = new FormData();
          form.append('chat_id', ownerId);
          form.append('caption', `📦 ${isAutoBackup ? 'Auto ' : ''}Backup completed on ${date.toLocaleString()}\nSize: ${(zipBuffer.length / (1024 * 1024)).toFixed(2)} MB`);
          form.append('document', fs.createReadStream(tempFilePath), {
            filename: filename,
            contentType: 'application/zip'
          });
          
          // Send document using axios
          const response = await axios.post(
            `${global.localBotApiUrl}/bot${global.BotToken}/sendDocument`,
            form,
            {
              headers: form.getHeaders()
            }
          );
          
          if (response.status !== 200 || !response.data.ok) {
            console.error(`Error sending backup to owner ${ownerId}: ${JSON.stringify(response.data)}`);
          } else {
            console.log(`Successfully sent backup to owner ${ownerId}`);
            successCount++;
            
            // Store message info for auto backup tracking
            if (response.data.result && response.data.result.message_id) {
              sentMessages.push({
                chat_id: ownerId,
                message_id: response.data.result.message_id,
                filename: filename,
                timestamp: date.getTime(),
                size: zipBuffer.length
              });
            }
          }
        } catch (sendError) {
          console.error(`Error sending backup to owner ${ownerId}:`, sendError.message);
        }
      }
      
      // Clean up the temporary file
      try {
        fs.unlinkSync(tempFilePath);
        console.log(`Temporary file ${tempFilePath} deleted`);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', cleanupError.message);
      }
      
      // Update backup.json with new backup information
      if (sentMessages.length > 0) {
        try {
          updateBackupInfo(sentMessages, isAutoBackup);
        } catch (updateError) {
          console.error('Error updating backup info:', updateError.message);
        }
      }
      
      if (button) {
        // Update message after sending - now we know if any files were successfully sent
        await global.editMessageText(
          '✅ <b>Backup Complete</b> ✅\n\n' +
          `Backup has been created and sent to ${successCount} of ${global.owner.length} owner(s).\n` +
          `Filename: <code>${filename}</code>\n` +
          `Size: ${(zipBuffer.length / (1024 * 1024)).toFixed(2)} MB\n` +
          `Created: ${date.toLocaleString()}`,
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📦 Create Another Backup', callback_data: 'menu_backup' }],
                [{ text: '◀️ Back to Admin Panel', callback_data: 'menu_admin' }]
              ]
            }
          }
        );
      }
      
      return {
        success: true,
        sentMessages: sentMessages,
        filename: filename
      };

    } catch (backupError) {
      console.error('Error creating backup:', backupError);
      
      if (button) {
        // Update message on error
        await global.editMessageText(
          '❌ <b>Backup Failed</b> ❌\n\n' +
          `Error: ${backupError.message}`,
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔄 Try Again', callback_data: 'menu_backup' }],
                [{ text: '◀️ Back to Admin Panel', callback_data: 'menu_admin' }]
              ]
            }
          }
        );
      }
      
      return {
        success: false,
        error: backupError.message
      };
    }
    
    return true;
  } catch (error) {
    console.error('Error in backup process:', error.message);
    return false;
  }
}

// Create backup archive
async function createBackup() {
  return new Promise((resolve, reject) => {
    try {
      const backupPaths = global.backupPaths || ['/root/Vynix', '/root/Vynix2'];
      const excludeItems = global.backupExclude || ['node_modules', 'temp/*', 'package-lock.json'];
      
      // Create archive
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression level
      });
      
      // Create output buffer
      const chunks = [];
      
      // Listen for all archive data to be written
      archive.on('data', (chunk) => chunks.push(chunk));
      
      // Good practice to catch warnings (ie stat failures and other non-blocking errors)
      archive.on('warning', (err) => {
        console.warn('Archive warning:', err);
      });
      
      // Good practice to catch this error explicitly
      archive.on('error', (err) => {
        reject(err);
      });
      
      // Finalize archive when done
      archive.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
      
      // Define function to check if a path should be excluded
      const isExcluded = (filepath) => {
        // Convert to relative path if inside one of the backup paths
        let relativePath = filepath;
        for (const backupPath of backupPaths) {
          if (filepath.startsWith(backupPath + '/')) {
            relativePath = filepath.substring(backupPath.length + 1);
            break;
          }
        }
        
        // Check if path should be excluded
        for (const excludePattern of excludeItems) {
          // For patterns ending with *, do prefix matching
          if (excludePattern.endsWith('*')) {
            const prefix = excludePattern.slice(0, -1);
            if (relativePath.startsWith(prefix)) {
              return true;
            }
          } else if (relativePath === excludePattern || relativePath.startsWith(excludePattern + '/')) {
            // Exact match or directory
            return true;
          }
        }
        return false;
      };
      
      // Helper function to add directory to archive
      const addDirectoryToArchive = (dirPath, baseDir, folderPrefix) => {
        const files = fs.readdirSync(dirPath);
        
        for (const file of files) {
          const fullPath = path.join(dirPath, file);
          const relativePath = path.relative(baseDir, fullPath);
          
          // Skip if excluded
          if (isExcluded(fullPath)) {
            continue;
          }
          
          // Check if it's a directory
          if (fs.statSync(fullPath).isDirectory()) {
            addDirectoryToArchive(fullPath, baseDir, folderPrefix);
          } else {
            // Add file to archive with folder prefix
            const nameInZip = path.join(folderPrefix, relativePath);
            archive.file(fullPath, { name: nameInZip });
          }
        }
      };
      
      // Process each backup path
      for (const dirPath of backupPaths) {
        if (fs.existsSync(dirPath)) {
          // Get the name of the directory for use as folder name in zip
          const folderName = path.basename(dirPath);
          console.log(`Adding ${dirPath} to backup with folder prefix: ${folderName}`);
          addDirectoryToArchive(dirPath, dirPath, folderName);
        } else {
          console.warn(`Warning: Backup path ${dirPath} does not exist, skipping`);
        }
      }
      
      // Finalize the archive
      archive.finalize();
      
    } catch (error) {
      reject(error);
    }
  });
}

// Toggle auto backup
async function toggleAutoBackup(button) {
  try {
    // Get current status
    const currentStatus = global.autoBackup.enabled;
    
    // Toggle status
    global.autoBackup.enabled = !currentStatus;
    
    if (global.autoBackup.enabled) {
      // Start auto backup interval
      startAutoBackupInterval();
    } else {
      // Stop auto backup interval
      clearAutoBackupInterval();
    }
    
    // Save the configuration to persist between restarts (optional)
    saveAutoBackupConfig();
    
    // Show success message
    await global.answerCallbackQuery(button.id, {
      text: `Auto backup ${global.autoBackup.enabled ? 'enabled' : 'disabled'} successfully!`,
      show_alert: true
    });
    
    // Update menu
    return await showBackupMenu(button);
  } catch (error) {
    console.error('Error toggling auto backup:', error.message);
    return false;
  }
}

// Start auto backup interval
function startAutoBackupInterval() {
  // Clear any existing interval
  clearAutoBackupInterval();
  
  // Set up new interval
  autoBackupInterval = setInterval(async () => {
    console.log('Running scheduled auto backup...');
    try {
      // Load existing backup info
      const backupInfo = loadBackupInfo();
      
      // Delete previous auto backup messages if they exist
      await deletePreviousBackups(backupInfo.backups.filter(b => b.isAuto));
      
      // Run auto backup
      await startBackup(null, true);
    } catch (error) {
      console.error('Error in auto backup:', error.message);
    }
  }, global.autoBackup.interval);
  
  console.log(`Auto backup scheduled to run every ${global.autoBackup.interval / 60000} minutes`);
}

// Clear auto backup interval
function clearAutoBackupInterval() {
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval);
    autoBackupInterval = null;
    console.log('Auto backup interval stopped');
  }
}

// Save auto backup configuration
function saveAutoBackupConfig() {
  try {
    // TODO: Implement saving to a config file if needed
    console.log(`Auto backup ${global.autoBackup.enabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('Error saving auto backup config:', error.message);
  }
}

// Load backup information from JSON file
function loadBackupInfo() {
  try {
    const backupDbPath = global.autoBackup.backupDb;
    
    if (!fs.existsSync(backupDbPath)) {
      // Initialize with empty data if file doesn't exist
      const initialData = {
        lastBackup: null,
        backups: []
      };
      fs.writeFileSync(backupDbPath, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    
    const data = JSON.parse(fs.readFileSync(backupDbPath, 'utf-8'));
    return data;
  } catch (error) {
    console.error('Error loading backup info:', error.message);
    return { lastBackup: null, backups: [] };
  }
}

// Update backup information in JSON file
function updateBackupInfo(sentMessages, isAutoBackup = false) {
  try {
    const backupDbPath = global.autoBackup.backupDb;
    const backupInfo = loadBackupInfo();
    
    // Create new backup entry
    const newBackup = {
      timestamp: Date.now(),
      filename: sentMessages[0].filename,
      isAuto: isAutoBackup,
      messages: sentMessages
    };
    
    // Add to backups array
    backupInfo.backups.push(newBackup);
    
    // Update lastBackup timestamp
    backupInfo.lastBackup = Date.now();
    
    // Save back to file
    fs.writeFileSync(backupDbPath, JSON.stringify(backupInfo, null, 2));
    
    console.log(`Backup info updated, ${isAutoBackup ? 'auto' : 'manual'} backup recorded`);
    return true;
  } catch (error) {
    console.error('Error updating backup info:', error.message);
    return false;
  }
}

// Delete previous backup messages
async function deletePreviousBackups(backups) {
  if (!backups || backups.length === 0) {
    return;
  }
  
  for (const backup of backups) {
    if (backup.messages && backup.messages.length) {
      for (const message of backup.messages) {
        try {
          // Delete message using Telegram API
          await axios.post(
            `${global.localBotApiUrl}/bot${global.BotToken}/deleteMessage`,
            {
              chat_id: message.chat_id,
              message_id: message.message_id
            }
          );
          console.log(`Deleted previous backup message: ${message.chat_id}:${message.message_id}`);
        } catch (error) {
          console.error(`Error deleting message ${message.chat_id}:${message.message_id}:`, error.message);
        }
      }
    }
  }
  
  // Clean up backups array in the backup.json file
  try {
    const backupInfo = loadBackupInfo();
    // Keep only backups that are not in the deleted list
    backupInfo.backups = backupInfo.backups.filter(b => 
      !backups.some(delBackup => 
        delBackup.timestamp === b.timestamp && 
        delBackup.filename === b.filename
      )
    );
    
    // Save updated backup info
    const backupDbPath = global.autoBackup.backupDb;
    fs.writeFileSync(backupDbPath, JSON.stringify(backupInfo, null, 2));
  } catch (error) {
    console.error('Error updating backup info after deletion:', error.message);
  }
}
