// Help command for Telegram Bot

module.exports = {
  name: 'help',
  description: 'Show available commands',
  execute: async (message, args) => {
    const chatId = message.chat.id;
    
    try {
      // Build help message with all available commands
      let helpText = '📋 *Available Commands*\n\n';
      
      // Use the global commands Map to list all commands
      global.commands.forEach((command, name) => {
        helpText += `/${name} - ${command.description || 'No description'}\n`;
      });
      
      helpText += '\nThis bot is connected to a local Bot API server.';
      
      await global.sendMessage(
        chatId,
        helpText,
        { parse_mode: 'Markdown' }
      );
      
      console.log(`✅ Help command executed for user ${message.from.id} (${chatId})`);
    } catch (error) {
      console.error(`❌ Error executing help command: ${error.message}`);
    }
  }
}; 