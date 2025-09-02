// Configuration fille for Telegram Bot

// Bot configuration
global.BotToken = '8260173465:AAExvWb_KDtXduVC4llW4u56JwWvA7bEVgg'; // Your bot token
global.localBotApiUrl = 'http://localhost:9999'; // Local Bot API server URL
global.webhookUrl = 'https://syxtar.web.id/webhook2'; // Webhook URL

// User client configuration
global.API_ID = '20950991'; // Your Telegram API ID
global.API_HASH = '13cb1c740560770754c868f85cb88ab3'; // Your Telegram API Hash
global.sessionString = '1AQAOMTQ5LjE1NC4xNzUuNTUBu0kry8/DXEP3z5CbKDAHeW7uPsRI3lODdkNc+Ad/9ggRvvg1vMemvXGqkjvfhlq/mrCl+qfNpbFLzHhuNJmiTT6nxGg8P7kSa6KnbtY6YwY9VG5i060jpRYvi6IUuKBnIXIbVmeVuOLpAiyJtG33BxVrhR6B3NIbxyX+PotLdV6AAmymIDZq2wtz0GKiepHd67L4JOWviZTmyYNnTtrXFWndNc1+4zyMpFCTLC05nibLFDHLkCrM9GTbrpTr6j4QG+Utz2QIHEQzF8zjMInDxNuRQGn5IRj04tCPfZDxkOdh4ebc3aWRHNvzATx/8ULEnorTIalS3Z9pdsyUSCVI2iY='; // Will be automatically filled during authentication

// Server configuration
global.port = 3001; // Port for the webhook server

// Download configuration
global.download = '/root/Anjay'; // Directory for downloaded files

// Owner configuration
global.owner = ['8101248060', '6302541202']; // Replace with your Telegram user ID
global.adminIds = ['8101248060']; // Array of admin IDs that have admin permissions regardless of chat

// Backup configuration
global.backupExclude = ['node_modules', 'temp/*', 'package-lock.json']; // Files and directories to exclude from backup
global.backupPaths = ['/root/Vynix', '/root/Vynix2', '/root/tb', '/root/tb00', '/root/tb01']; // Paths to backup
global.autoBackup = {
  enabled: false, // Auto backup is disabled by default
  interval: 60 * 60 * 1000, // Backup interval in milliseconds (1 hour)
  backupDb: 'database/backup.json' // Path to store backup information
};

// Other settings
global.debug = true; // Enable debug logging
global.verboseDebug = false; // Enable verbose debug (prints all update fields)
global.enableCloudLogout = true; // Whether to attempt to log out from cloud API

module.exports = {
  // Export function to reload config
  reloadConfig: function() {
    delete require.cache[require.resolve('./config.js')];
    require('./config.js');
    console.log('✅ Configuration reloaded');
  },
  adminIds: global.adminIds
}; 
