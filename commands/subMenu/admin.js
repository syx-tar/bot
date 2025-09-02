/**
 * Admin Panel Menu Handler
 */

module.exports = {
  // Handle callback queries for admin menu
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
      
      // Handle different admin menu actions
      switch (data) {
        case 'menu_admin':
          return await showAdminMenu(button);
        
        case 'menu_backup':
          // Forward to backup handler
          if (global.menuHandlers && global.menuHandlers.get('backup')) {
            return await global.menuHandlers.get('backup').handleCallback(button);
          } else {
            await global.sendMessage(
              chatId,
              '*Backup Module Error*\nBackup module not found or not loaded correctly.',
              { parse_mode: 'Markdown' }
            );
          }
          return true;
          
        case 'menu_scan':
          // Forward to scan handler
          if (global.menuHandlers && global.menuHandlers.get('scan')) {
            return await global.menuHandlers.get('scan').handleCallback(button);
          } else {
            await global.sendMessage(
              chatId,
              '*Scan Module Error*\nScan module not found or not loaded correctly.',
              { parse_mode: 'Markdown' }
            );
          }
          return true;
          
        default:
          return false;
      }
    } catch (error) {
      console.error('Error handling admin menu callback:', error.message);
      return false;
    }
  }
};

// Show admin menu
async function showAdminMenu(button) {
  try {
    await global.answerCallbackQuery(button.id);
    
    await global.editMessageText(
      '👑 *ADMIN PANEL* 👑\n\n' +
      'Welcome to the administrator panel.\n\n' +
      'Please select an option below:',
      {
        chat_id: button.message.chat.id,
        message_id: button.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📦 Backup System', callback_data: 'menu_backup' }
            ],
            [
              { text: '🔍 Scan Chats', callback_data: 'menu_scan' }
            ],
            [{ text: '◀️ Back to Main Menu', callback_data: 'menu_main' }]
          ]
        }
      }
    );
    return true;
  } catch (editError) {
    // If the error is "message is not modified", just ignore it and answer the callback query
    if (editError.description && editError.description.includes('message is not modified')) {
      console.log('Admin menu already displayed, ignoring edit error');
      return true;
    } else {
      // For other errors, log and return false
      console.error('Error displaying admin menu:', editError.message);
      return false;
    }
  }
}
