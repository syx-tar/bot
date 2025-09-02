/**
 * Scan Menu Handler
 * Provides functionality to scan chats from bot and user client
 */

module.exports = {
  // Handle callback queries for scan menu
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
      
      // Handle different scan menu actions
      switch (data) {
        case 'menu_scan':
          return await showScanMenu(button);
        
        case 'scan_bot_chats':
          return await scanBotChats(button);
          
        case 'scan_user_chats':
          return await scanUserChats(button);
          
        default:
          return false;
      }
    } catch (error) {
      console.error('Error handling scan menu callback:', error.message);
      return false;
    }
  }
};

// Show scan menu
async function showScanMenu(button) {
  try {
    await global.answerCallbackQuery(button.id);
    
    await global.editMessageText(
      '🔍 *SCAN MENU* 🔍\n\n' +
      'Please select what you want to scan:',
      {
        chat_id: button.message.chat.id,
        message_id: button.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🤖 Scan Bot Chats', callback_data: 'scan_bot_chats' }
            ],
            [
              { text: '👤 Scan User Client Chats', callback_data: 'scan_user_chats' }
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
      console.log('Scan menu already displayed, ignoring edit error');
      return true;
    } else {
      // For other errors, log and return false
      console.error('Error displaying scan menu:', editError.message);
      return false;
    }
  }
}

// Scan bot chats
async function scanBotChats(button) {
  try {
    await global.answerCallbackQuery(button.id, { text: "Scanning bot chats..." });
    
    // Get chats available to the bot
    // Since there's no direct API to get all chats, we'll display information about the current chat
    // and instructions for the user
    
    // Get information about the current chat
    const currentChat = await global.getChat(button.message.chat.id);
    
    if (!currentChat.ok) {
      await global.editMessageText(
        '❌ *Error Scanning Bot Chats*\n\n' +
        'Could not retrieve chat information.',
        {
          chat_id: button.message.chat.id,
          message_id: button.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '◀️ Back to Scan Menu', callback_data: 'menu_scan' }]
            ]
          }
        }
      );
      return true;
    }
    
    // Format the chat information
    const chatInfo = currentChat.result;
    let chatType = 'Unknown';
    
    if (chatInfo.type === 'private') chatType = 'User';
    else if (chatInfo.type === 'group') chatType = 'Group';
    else if (chatInfo.type === 'supergroup') chatType = 'Supergroup';
    else if (chatInfo.type === 'channel') chatType = 'Channel';
    
    let chatName = chatInfo.title || chatInfo.username || chatInfo.first_name || 'Unknown';
    let chatId = chatInfo.id;
    
    // Create a copyable format
    const chatDisplay = `${chatType}: ${chatName} : \`${chatId}\``;
    
    await global.editMessageText(
      '🔍 *Bot Chat Information*\n\n' +
      'Telegram Bot API doesn\'t provide a direct way to list all chats.\n\n' +
      'Here is information about the current chat:\n\n' +
      chatDisplay + '\n\n' +
      'To get information about other chats, add the bot to those chats and use this command there.',
      {
        chat_id: button.message.chat.id,
        message_id: button.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '◀️ Back to Scan Menu', callback_data: 'menu_scan' }]
          ]
        }
      }
    );
    return true;
  } catch (error) {
    console.error('Error scanning bot chats:', error.message);
    
    await global.editMessageText(
      '❌ *Error Scanning Bot Chats*\n\n' +
      'An error occurred while scanning: ' + error.message,
      {
        chat_id: button.message.chat.id,
        message_id: button.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '◀️ Back to Scan Menu', callback_data: 'menu_scan' }]
          ]
        }
      }
    );
    return true;
  }
}

// Scan user client chats
async function scanUserChats(button) {
  try {
    await global.answerCallbackQuery(button.id, { text: "Scanning user client chats..." });
    
    if (!global.userClient) {
      await global.editMessageText(
        '❌ *Error Scanning User Chats*\n\n' +
        'User client is not initialized.',
        {
          chat_id: button.message.chat.id,
          message_id: button.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '◀️ Back to Scan Menu', callback_data: 'menu_scan' }]
            ]
          }
        }
      );
      return true;
    }
    
    // Get all dialogs from user client
    const dialogs = await global.userClient.getDialogs({
      limit: 30 // Reduce limit to avoid message too long errors
    });
    
    if (!dialogs || dialogs.length === 0) {
      await global.editMessageText(
        '❓ *No Chats Found*\n\n' +
        'No chats were found for the user client.',
        {
          chat_id: button.message.chat.id,
          message_id: button.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '◀️ Back to Scan Menu', callback_data: 'menu_scan' }]
            ]
          }
        }
      );
      return true;
    }
    
    // Categorize chats
    const users = [];
    const groups = [];
    const channels = [];
    const supergroups = [];
    
    for (const dialog of dialogs) {
      const entity = dialog.entity;
      let chatType = 'Unknown';
      let chatName = 'Unknown';
      let chatId = entity.id;
      let chatEmoji = '❓';
      let unreadCount = dialog.unreadCount || 0;
      
      // Escape markdown special characters in name
      const escapeMd = (text) => {
        if (!text) return '';
        return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
      };
      
      // Determine chat type, name and emoji
      if (entity.className === 'User') {
        chatType = 'User';
        chatEmoji = entity.bot ? '🤖' : '👤';
        
        // Get safe chat name
        let firstName = escapeMd(entity.firstName || '');
        let lastName = escapeMd(entity.lastName || '');
        let username = entity.username ? `@${escapeMd(entity.username)}` : '';
        
        if (firstName || lastName) {
          chatName = firstName + (lastName ? ' ' + lastName : '');
        } else if (username) {
          chatName = username;
        } else {
          chatName = 'Unknown User';
        }
        
        users.push({
          emoji: chatEmoji,
          name: chatName,
          id: chatId,
          username: username,
          unread: unreadCount
        });
      } else if (entity.className === 'Chat') {
        chatType = 'Group';
        chatEmoji = '👥';
        chatName = escapeMd(entity.title || 'Unknown Group');
        
        groups.push({
          emoji: chatEmoji,
          name: chatName,
          id: chatId,
          unread: unreadCount
        });
      } else if (entity.className === 'Channel') {
        if (entity.megagroup) {
          chatType = 'Supergroup';
          chatEmoji = '🌐';
          chatName = escapeMd(entity.title || 'Unknown Supergroup');
          
          supergroups.push({
            emoji: chatEmoji,
            name: chatName,
            id: chatId,
            unread: unreadCount,
            username: entity.username ? `@${escapeMd(entity.username)}` : ''
          });
        } else {
          chatType = 'Channel';
          chatEmoji = '📢';
          chatName = escapeMd(entity.title || 'Unknown Channel');
          
          channels.push({
            emoji: chatEmoji,
            name: chatName,
            id: chatId,
            unread: unreadCount,
            username: entity.username ? `@${escapeMd(entity.username)}` : ''
          });
        }
      }
    }
    
    // Create a more compact format for chat list to avoid length issues
    let chatListText = '🔍 *USER CLIENT CHATS* 🔍\n\n';
    
    // Add counts summary (simplified)
    chatListText += `Found ${dialogs.length} chats: 👤 ${users.length} | 👥 ${groups.length} | 📢 ${channels.length} | 🌐 ${supergroups.length}\n\n`;
    
    // Add users section if any (more compact)
    if (users.length > 0) {
      chatListText += '👤 *USERS*\n';
      
      for (const user of users) {
        // Simplify format to reduce length
        let userText = `${user.emoji} *${user.name}* \\- \`${user.id}\``;
        if (user.unread > 0) userText += ` (${user.unread})`;
        
        chatListText += `${userText}\n`;
      }
      chatListText += '\n';
    }
    
    // Add groups section if any
    if (groups.length > 0) {
      chatListText += '👥 *GROUPS*\n';
      
      for (const group of groups) {
        let groupText = `${group.emoji} *${group.name}* \\- \`${group.id}\``;
        if (group.unread > 0) groupText += ` (${group.unread})`;
        
        chatListText += `${groupText}\n`;
      }
      chatListText += '\n';
    }
    
    // Add channels section if any
    if (channels.length > 0) {
      chatListText += '📢 *CHANNELS*\n';
      
      for (const channel of channels) {
        let channelText = `${channel.emoji} *${channel.name}* \\- \`${channel.id}\``;
        if (channel.unread > 0) channelText += ` (${channel.unread})`;
        
        chatListText += `${channelText}\n`;
      }
      chatListText += '\n';
    }
    
    // Add supergroups section if any
    if (supergroups.length > 0) {
      chatListText += '🌐 *SUPERGROUPS*\n';
      
      for (const supergroup of supergroups) {
        let supergroupText = `${supergroup.emoji} *${supergroup.name}* \\- \`${supergroup.id}\``;
        if (supergroup.unread > 0) supergroupText += ` (${supergroup.unread})`;
        
        chatListText += `${supergroupText}\n`;
      }
      chatListText += '\n';
    }
    
    // Add a note if showing limited results
    if (dialogs.length === 30) {
      chatListText += '_Note: Showing first 30 chats only._\n';
    }
    
    // Check if message is too long (Telegram limit is 4096 characters)
    if (chatListText.length > 4000) {
      // Truncate and add message
      chatListText = chatListText.substring(0, 3900) + '\n\n_...message truncated due to length limits..._';
    }
    
    // Try sending with HTML formatting if Markdown fails
    try {
      await global.editMessageText(
        chatListText,
        {
          chat_id: button.message.chat.id,
          message_id: button.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '◀️ Back to Scan Menu', callback_data: 'menu_scan' }]
            ]
          }
        }
      );
    } catch (mdError) {
      console.log('Error with Markdown formatting, trying without parse mode:', mdError.message);
      
      // If Markdown fails, try without formatting
      await global.editMessageText(
        chatListText.replace(/[*_`[\]()~>#+=|{}.!-]/g, ''), // Remove all markdown characters
        {
          chat_id: button.message.chat.id,
          message_id: button.message.message_id,
          reply_markup: {
            inline_keyboard: [
              [{ text: '◀️ Back to Scan Menu', callback_data: 'menu_scan' }]
            ]
          }
        }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error scanning user chats:', error.message);
    
    await global.editMessageText(
      '❌ *Error Scanning User Chats*\n\n' +
      'An error occurred while scanning: ' + error.message,
      {
        chat_id: button.message.chat.id,
        message_id: button.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '◀️ Back to Scan Menu', callback_data: 'menu_scan' }]
          ]
        }
      }
    );
    return true;
  }
}
