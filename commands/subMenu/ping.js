const os = require('os');
const process = require('process');

/**
 * Ping Menu Handler
 */

module.exports = {
  // Handle callback queries for ping menu
  handleCallback: async function(button) {
    try {
      const data = button.data;
      
      // Handle different ping menu actions
      if (data === 'menu_ping' || data === 'ping_refresh') {
        return await showServerStats(button);
      }
      
      return false;
    } catch (error) {
      console.error('Error handling ping menu callback:', error.message);
      return false;
    }
  }
};

/**
 * Get uptime in human readable format
 * @returns {string} Formatted uptime
 */
function getUptimeString() {
  const uptime = process.uptime();
  
  const days = Math.floor(uptime / (24 * 60 * 60));
  const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((uptime % (60 * 60)) / 60);
  const seconds = Math.floor(uptime % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  
  return parts.join(' ');
}

/**
 * Format bytes to human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get CPU usage information
 * @returns {Object} CPU info
 */
function getCpuInfo() {
  const cpus = os.cpus();
  const cpuCount = cpus.length;
  const cpuModel = cpus[0].model;
  const loadAvg = os.loadavg();
  
  return {
    model: cpuModel,
    cores: cpuCount,
    loadAvg: loadAvg
  };
}

/**
 * Get memory usage information
 * @returns {Object} Memory info
 */
function getMemoryInfo() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsage = (usedMem / totalMem * 100).toFixed(2);
  
  const processMemory = process.memoryUsage();
  
  return {
    total: formatBytes(totalMem),
    free: formatBytes(freeMem),
    used: formatBytes(usedMem),
    percentage: memUsage,
    process: {
      rss: formatBytes(processMemory.rss),
      heapTotal: formatBytes(processMemory.heapTotal),
      heapUsed: formatBytes(processMemory.heapUsed)
    }
  };
}

/**
 * Get system information
 * @returns {Object} System info
 */
function getSystemInfo() {
  return {
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    hostname: os.hostname(),
    nodeVersion: process.version
  };
}

/**
 * Generate server stats message
 * @param {number} pingTime - Response time in ms
 * @returns {string} Formatted message
 */
function generateServerStatsMessage(pingTime) {
  const uptime = getUptimeString();
  const cpuInfo = getCpuInfo();
  const memInfo = getMemoryInfo();
  const sysInfo = getSystemInfo();
  
  let message = `🖥️ *SERVER INFORMATION* 🖥️\n\n`;
  
  // Ping & Uptime
  message += `⏱️ *Response Time:* ${pingTime}ms\n`;
  message += `⏳ *Uptime:* ${uptime}\n\n`;
  
  // System Info
  message += `🔧 *SYSTEM DETAILS*\n`;
  message += `🌐 Platform: ${sysInfo.platform} (${sysInfo.arch})\n`;
  message += `💻 OS: ${sysInfo.release}\n`;
  message += `📌 Hostname: ${sysInfo.hostname}\n`;
  message += `⚙️ Node.js: ${sysInfo.nodeVersion}\n\n`;
  
  // CPU Info
  message += `🔄 *CPU INFORMATION*\n`;
  message += `🧠 Model: ${cpuInfo.model.trim()}\n`;
  message += `🧮 Cores: ${cpuInfo.cores}\n`;
  message += `📊 Load Avg: ${cpuInfo.loadAvg[0].toFixed(2)}, ${cpuInfo.loadAvg[1].toFixed(2)}, ${cpuInfo.loadAvg[2].toFixed(2)}\n\n`;
  
  // Memory Info
  message += `💾 *MEMORY USAGE*\n`;
  message += `📦 Total: ${memInfo.total}\n`;
  message += `📈 Used: ${memInfo.used} (${memInfo.percentage}%)\n`;
  message += `📉 Free: ${memInfo.free}\n\n`;
  
  // Bot Process Memory
  message += `🤖 *BOT PROCESS MEMORY*\n`;
  message += `📊 RSS: ${memInfo.process.rss}\n`;
  message += `🧩 Heap: ${memInfo.process.heapUsed} / ${memInfo.process.heapTotal}\n`;
  
  // Add timestamp
  message += `\n⏰ *Updated:* ${new Date().toLocaleTimeString()}`;
  
  return message;
}

/**
 * Show server statistics
 * @param {Object} button - Callback query object
 */
async function showServerStats(button) {
  try {
    const chatId = button.message.chat.id;
    const messageId = button.message.message_id;
    
    // Show loading message
    await global.editMessageText(
      '🔄 *Getting server information...*\n\n⏳ Please wait...',
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      }
    );
    
    // Measure response time without using global.bot.getMe()
    const startTime = new Date();
    // Use a simple Telegram API call to measure ping
    await global.answerCallbackQuery(button.id, { text: '' });
    const endTime = new Date();
    const pingTime = endTime - startTime;
    
    // Generate and send the stats message
    const statsMessage = generateServerStatsMessage(pingTime);
    
    await global.editMessageText(
      statsMessage,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Refresh Stats', callback_data: 'ping_refresh' }],
            [{ text: '◀️ Back to Main Menu', callback_data: 'menu_main' }]
          ]
        }
      }
    );
    return true;
  } catch (error) {
    console.error('Error showing server stats:', error.message);
    
    try {
      await global.editMessageText(
        '⚠️ *Error Getting Server Information*\n\n❌ An unexpected error occurred while fetching server stats.\n\n🔄 Please try again later.',
        {
          chat_id: button.message.chat.id,
          message_id: button.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Try Again', callback_data: 'ping_refresh' }],
              [{ text: '◀️ Back to Main Menu', callback_data: 'menu_main' }]
            ]
          }
        }
      );
      return true;
    } catch (secondError) {
      console.error('Could not show error message:', secondError);
      return false;
    }
  }
}
