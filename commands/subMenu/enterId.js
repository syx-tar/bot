const downloader = require('../../lib/download');
const userState = new Map();

module.exports = {
  handleCallback: async function(button) {
    const chatId = button.message.chat.id;
    const userId = button.from.id;
    const messageId = button.message.message_id;

    if (!global.owner.includes(userId.toString())) {
      await global.answerCallbackQuery(button.id, {
        text: global.permissionMessages.owner,
        show_alert: true
      });
      return true;
    }

    userState.set(userId, 'awaiting_chat_id');

    await global.editMessageText(
      '📝 *Enter Chat ID*\n\nPlease send the User, Bot, Group, or Channel ID you want to scan.\n\n_You can get the ID using the "Get ID" menu._', {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '◀️ Back to Admin Menu',
              callback_data: 'menu_admin'
            }]
          ]
        }
      }
    );

    return true;
  },

  processMessage: async function(message) {
    const userId = message.from.id;
    const text = message.text;

    if (userState.get(userId) === 'awaiting_chat_id') {
      const targetChatId = text.trim();
      userState.delete(userId);

      if (!/^-?\d+$/.test(targetChatId)) {
        await global.sendMessage(message.chat.id, '⚠️ Invalid Chat ID. Please provide a valid numerical ID.', {
            reply_to_message_id: message.message_id
        });
        return true;
      }

      await global.sendMessage(message.chat.id, `✅ Received. Starting scan for Chat ID: \`${targetChatId}\`... This may take a while.`, {
        parse_mode: 'Markdown'
      });

      // Call the downloader/scanner function from lib/download.js
      // This is asynchronous and should not block the main thread.
      downloader.startScan(targetChatId).catch(error => {
        console.error(`Error during scan for chat ID ${targetChatId}:`, error);
        global.sendMessage(message.chat.id, `❌ An error occurred during the scan for Chat ID: \`${targetChatId}\`. Please check the logs.`, { parse_mode: 'Markdown' });
      });

      return true;
    }

    return false;
  }
};
