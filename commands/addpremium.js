/**
 * Add Premium Status Command - Owner only
 * Usage: /addpremium <username>
 */

module.exports = {
  name: 'addpremium',
  description: 'Add premium status to a user by username',
  owner: true, // Only the bot owner can use this command
  
  async execute(message, args) {
    const chatId = message.chat.id;
    
    // Check if username is provided
    if (!args.length) {
      await global.sendMessage(
        chatId,
        '*❌ Error:* Please provide a username.\n\nUsage: `/addpremium username`',
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    // Extract username (remove @ if present)
    let username = args[0];
    if (username.startsWith('@')) {
      username = username.substring(1);
    }
    
    // Get all users from database
    const users = global.DB.getAllUsers();
    
    // Find user with matching username
    let userFound = false;
    let targetUserId = null;
    
    for (const userId in users) {
      if (users[userId].username && users[userId].username.toLowerCase() === username.toLowerCase()) {
        targetUserId = userId;
        userFound = true;
        break;
      }
    }
    
    if (!userFound) {
      await global.sendMessage(
        chatId,
        `*❌ Error:* User with username *${username}* not found in database.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    // Update user's premium status
    const user = users[targetUserId];
    
    // Check if user is already premium
    if (user.is_premium === true) {
      await global.sendMessage(
        chatId,
        `*ℹ️ Info:* User *${user.first_name}* (@${user.username}) is already a premium user.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    // Update user data with premium status
    const userData = {
      ...user,
      is_premium: true
    };
    
    // Save to database
    global.DB.updateUser(userData);
    
    // Force save database to ensure changes persist
    try {
      const fs = require('fs');
      const path = require('path');
      const DB_FILE = path.join(__dirname, '..', 'database', 'database.json');
      const currentDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      
      // Update the premium status directly in the file
      if (currentDb.users && currentDb.users[targetUserId]) {
        currentDb.users[targetUserId].is_premium = true;
        fs.writeFileSync(DB_FILE, JSON.stringify(currentDb, null, 2), 'utf8');
        console.log(`✅ Premium status saved for user ${user.username}`);
      }
    } catch (error) {
      console.error('❌ Error updating premium status:', error.message);
    }
    
    // Send confirmation message
    await global.sendMessage(
      chatId,
      `*✅ Success:* Premium status added to *${user.first_name}* (@${user.username}).`,
      { parse_mode: 'Markdown' }
    );
  }
}; 