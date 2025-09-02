// Users command for Telegram Bot

module.exports = {
  name: 'users',
  description: 'List users who have interacted with the bot',
  execute: async (message, args) => {
    const chatId = message.chat.id;
    
    try {
      // Get all users from database
      const users = global.DB.getAllUsers();
      const userCount = Object.keys(users).length;
      
      // Create formatted user list
      let userListMessage = `👥 *Bot Users (${userCount})*\n\n`;
      
      // Sort users by interaction count (most active first)
      const sortedUsers = Object.values(users)
        .sort((a, b) => (b.interactions || 0) - (a.interactions || 0))
        .slice(0, 10); // Limit to top 10 to avoid message too long errors
      
      sortedUsers.forEach((user, index) => {
        const username = user.username 
          ? `@${user.username}` 
          : `${user.first_name || ''} ${user.last_name || ''}`.trim();
        
        userListMessage += `${index + 1}. ${username} - ${user.interactions || 0} interactions\n`;
      });
      
      if (userCount > 10) {
        userListMessage += `\n_...and ${userCount - 10} more users_`;
      }
      
      await global.sendMessage(
        chatId,
        userListMessage,
        { parse_mode: 'Markdown' }
      );
      
      console.log(`✅ Users command executed for user ${message.from.id} (${chatId})`);
    } catch (error) {
      console.error(`❌ Error executing users command: ${error.message}`);
    }
  }
}; 