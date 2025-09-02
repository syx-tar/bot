/**
 * Get ID Menu Handler
 * Mendapatkan ID dari user, bot, group, atau channel
 */

module.exports = {
  // Handle callback queries for getId menu
  handleCallback: async function(button) {
    try {
      const data = button.data;
      const chatId = button.message.chat.id;
      const messageId = button.message.message_id;
      const chatType = button.message.chat.type;
      
      // Periksa apakah chat type adalah private
      if (chatType !== 'private') {
        // Jika bukan private chat, tolak akses dan tampilkan alert
        await global.answerCallbackQuery(button.id, {
          text: global.permissionMessages.private,
          show_alert: true
        });
        
        return true;
      }
      
      if (data === 'menu_getId') {
        return await showGetIdMenu(button);
      } else if (data === 'getId_select') {
        return await showSelectionKeyboard(button);
      }
      
      return false;
    } catch (error) {
      console.error('Error handling getId menu callback:', error.message);
      return false;
    }
  }
};

/**
 * Show Get ID menu with instructions
 * @param {Object} button - Callback query object
 */
async function showGetIdMenu(button) {
  try {
    const chatId = button.message.chat.id;
    const messageId = button.message.message_id;
    
    // Create menu message
    const message = 
      '🆔 *GET ID INFORMATION* 🆔\n\n' +
      'Dapatkan ID dari berbagai entitas Telegram dengan mudah.\n\n' +
      '*Contoh ID:*\n' +
      '👤 User: `123456789`\n' +
      '🤖 Bot: `123456789`\n' +
      '👥 Group: `-123456789`\n' +
      '📢 Channel: `-1001234567890`\n\n' +
      '❓ Gunakan tombol "Select Entity" untuk memilih user, bot, group, atau channel dan mendapatkan ID-nya.';
    
    // Edit message with instructions
    await global.editMessageText(
      message,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔍 Select Entity', callback_data: 'getId_select' }],
            [{ text: '◀️ Back to Main Menu', callback_data: 'menu_main' }]
          ]
        }
      }
    );
    
    // Answer callback query
    await global.answerCallbackQuery(button.id);
    
    return true;
  } catch (error) {
    console.error('Error showing getId menu:', error.message);
    return false;
  }
}

/**
 * Show selection keyboard for entities
 * @param {Object} button - Callback query object
 */
async function showSelectionKeyboard(button) {
  try {
    const chatId = button.message.chat.id;
    const messageId = button.message.message_id;
    
    // Hapus pesan menu_getId terlebih dahulu
    await global.deleteMessage(chatId, messageId);
    
    // Send message with reply keyboard
    await global.sendMessage(
      chatId,
      '🔍 *Pilih Entitas Telegram*\n\n' +
      'Silakan pilih jenis entitas yang ingin Anda dapatkan ID-nya:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [
              {
                text: '👤 Select User',
                request_user: {
                  user_is_bot: false,
                  request_id: 1
                }
              },
              {
                text: '🤖 Select Bot',
                request_user: {
                  user_is_bot: true,
                  request_id: 2
                }
              }
            ],
            [
              {
                text: '👥 Select Group',
                request_chat: {
                  chat_is_channel: false,
                  bot_is_member: false,
                  request_id: 3
                }
              },
              {
                text: '📢 Select Channel',
                request_chat: {
                  chat_is_channel: true,
                  bot_is_member: false,
                  request_id: 4
                }
              }
            ],
            [{ text: '❌ Close Selection' }]
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }
    );
    
    // Answer the callback query
    await global.answerCallbackQuery(button.id);
    
    return true;
  } catch (error) {
    console.error('Error showing selection keyboard:', error.message);
    return false;
  }
}
