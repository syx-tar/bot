// Index file for Telegram Bot
// Handles process signals and automatic restarts

const main = require('./main');

// Load configuration
require('./config');

// Initialize bot
async function start() {
  try {
    console.log('🚀 Starting Telegram Bot...');
    await main.initializeBot();
  } catch (error) {
    console.error('❌ Error starting bot:', error);
    process.exit(1);
  }
}

// Handle process signals for graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  await shutdown();
});

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  await shutdown();
});

process.on('SIGHUP', async () => {
  console.log('🔄 SIGHUP received. Restarting bot...');
  await shutdown();
  start();
});

process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught exception:', error);
  await shutdown();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  await shutdown();
  process.exit(1);
});

// Shutdown function
async function shutdown() {
  try {
    console.log('🔄 Shutting down...');
    // Perform any cleanup here if needed
    console.log('✅ Shutdown complete');
    // Explicitly exit the process with success code
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Start the bot
start();

// Export for testing purposes
module.exports = { start, shutdown }; 