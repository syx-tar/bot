/**
 * Premium Users List Command - Owner only
 * Shows all users with premium status
 */

module.exports = {
  name: 'premiumlist',
  description: 'List all premium users',
  owner: true, // Only the bot owner can use this command
  
  async execute(message, args) {
    const chatId = message.chat.id;
    
    // Get all users from database
    const users = global.DB.getAllUsers();
    
    // Filter premium users
    const premiumUsers = Object.values(users).filter(user => user.is_premium === true);
    
    // Check if there are premium users
    if (premiumUsers.length === 0) {
      await global.sendMessage(
        chatId,
        '*ℹ️ Info:* There are no premium users in the database.',
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    // Create the premium users list
    let messageText = '*📋 Premium Users List:*\n\n';
    
    premiumUsers.forEach((user, index) => {
      const username = user.username ? `@${user.username}` : 'No username';
      messageText += `${index + 1}. ${user.first_name} ${user.last_name || ''} (${username})\n`;
    });
    
    messageText += `\n*Total Premium Users: ${premiumUsers.length}*`;
    
    // Send the list
    await global.sendMessage(
      chatId,
      messageText,
      { parse_mode: 'Markdown' }
    );
  }
}; 