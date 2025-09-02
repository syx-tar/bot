// Stats command for Telegram Bot

module.exports = {
  name: 'stats',
  premium: true,
  description: 'Show bot statistics',
  execute: async (message, args) => {
    const chatId = message.chat.id;
    
    try {
      // Get database statistics
      const stats = global.DB.getStats();
      const lastUpdated = new Date(stats.lastUpdated);
      const formattedDate = lastUpdated.toLocaleString();
      
      // Format the statistics message
      const statsMessage = `📊 *Bot Statistics*\n\n` +
        `👤 Total Users: *${stats.totalUsers}*\n` +
        `💬 Total Messages: *${stats.totalMessages}*\n` +
        `🔠 Commands Used: *${stats.commandsUsed}*\n` +
        `🕒 Last Updated: *${formattedDate}*`;
      
      await global.sendMessage(
        chatId,
        statsMessage,
        { parse_mode: 'Markdown' }
      );
      
      console.log(`✅ Stats command executed for user ${message.from.id} (${chatId})`);
    } catch (error) {
      console.error(`❌ Error executing stats command: ${error.message}`);
    }
  }
}; 