/**
 * Get ID Plugin
 * Mendapatkan ID dari user, bot, group, atau channel yang dikirim ke bot
 */

// Process normal messages (not command)
async function processMessage(update) {
  if (!update.message) return false;
  
  const message = update.message;
  const chatId = message.chat.id;
  const fromId = message.from.id;
  const chatType = message.chat.type;
  
  try {
    // Periksa apakah chat adalah private
    // Jika bukan private chat, abaikan pesan terkait getId
    if (chatType !== 'private') {
      // Jika ada pesan dengan teks 'Close Selection', ini mungkin berasal dari fitur getId
      // Jadi kita perlu menangani ini meskipun bukan di private chat
      if (message.text === '❌ Close Selection') {
        try {
          // Hapus keyboard
          await global.sendMessage(
            chatId,
            '✅ Selection keyboard closed.',
            {
              reply_markup: {
                remove_keyboard: true
              }
            }
          );
          return true;
        } catch (error) {
          console.error('Error handling close selection in non-private chat:', error.message);
          return false;
        }
      }
      
      // Untuk semua pesan lain di non-private chat, abaikan
      return false;
    }
    
    // Periksa jenis pesan dan ekstrak informasi ID
    
    // Cek untuk user_shared (hasil dari request_user)
    if (message.user_shared) {
      return await handleUserShared(message);
    }
    
    // Cek untuk chat_shared (hasil dari request_chat)
    if (message.chat_shared) {
      return await handleChatShared(message);
    }
    
    // Kita tidak lagi memproses forward message
    // Forward message hanya dapat diproses dengan fitur Select Entity
    
    // Cek untuk kontak
    if (message.contact) {
      return await handleContact(message);
    }
    
    // Jika user mengirim 'Close Selection', kembalikan keyboard
    if (message.text === '❌ Close Selection') {
      try {
        // Hapus pesan "Close Selection" dari user
        await global.deleteMessage(chatId, message.message_id);
        
        // Cari pesan yang berisi keyboard selection
        // Asumsikan pesan sebelumnya adalah pesan dengan selection keyboard
        const selectionMessageId = message.message_id - 1;
        await global.deleteMessage(chatId, selectionMessageId);
        
        // Tampilkan kembali menu getId
        const menuMessage = 
          '🆔 *GET ID INFORMATION* 🆔\n\n' +
          'Dapatkan ID dari berbagai entitas Telegram dengan mudah.\n\n' +
          '*Contoh ID:*\n' +
          '👤 User: `123456789`\n' +
          '🤖 Bot: `123456789`\n' +
          '👥 Group: `-123456789`\n' +
          '📢 Channel: `-1001234567890`\n\n' +
          '❓ Gunakan tombol "Select Entity" untuk memilih user, bot, group, atau channel dan mendapatkan ID-nya.';
        
        // Kirim menu
        await global.sendMessage(
          chatId,
          menuMessage,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔍 Select Entity', callback_data: 'getId_select' }],
                [{ text: '◀️ Back to Main Menu', callback_data: 'menu_main' }]
              ]
            }
          }
        );
        
        return true;
      } catch (error) {
        console.error('Error handling close selection:', error.message);
        
        // Jika terjadi error, coba tampilkan menu getId tanpa menghapus pesan sebelumnya
        try {
          // Hapus keyboard
          await global.sendMessage(
            chatId,
            '✅ Selection keyboard closed.',
            {
              reply_markup: {
                remove_keyboard: true
              }
            }
          );
          
          // Tampilkan kembali menu getId
          const menuMessage = 
            '🆔 *GET ID INFORMATION* 🆔\n\n' +
            'Dapatkan ID dari berbagai entitas Telegram dengan mudah.\n\n' +
            '*Contoh ID:*\n' +
            '👤 User: `123456789`\n' +
            '🤖 Bot: `123456789`\n' +
            '👥 Group: `-123456789`\n' +
            '📢 Channel: `-1001234567890`\n\n' +
            '❓ Gunakan tombol "Select Entity" untuk memilih user, bot, group, atau channel dan mendapatkan ID-nya.';
          
          // Kirim menu
          await global.sendMessage(
            chatId,
            menuMessage,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🔍 Select Entity', callback_data: 'getId_select' }],
                  [{ text: '◀️ Back to Main Menu', callback_data: 'menu_main' }]
                ]
              }
            }
          );
          
          return true;
        } catch (secondError) {
          console.error('Error during fallback:', secondError.message);
          return false;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error processing get ID:', error.message);
    return false;
  }
}

/**
 * Handle forwarded messages - DINONAKTIFKAN
 * Fungsi ini tidak lagi digunakan karena kita hanya menggunakan Select Entity
 * @param {Object} message - Message object
 */
// Function disabled - We now only use Select Entity feature
/*
async function handleForward(message) {
  const chatId = message.chat.id;
  let infoText = '';
  
  // Forwarded from user/bot
  if (message.forward_from) {
    const user = message.forward_from;
    infoText = 
      `📑 *FORWARDED USER INFORMATION*\n\n` +
      `👤 *User ID:* \`${user.id}\`\n` +
      `🔖 *First Name:* ${user.first_name || 'N/A'}\n` +
      `🔖 *Last Name:* ${user.last_name || 'N/A'}\n` +
      `🔖 *Username:* ${user.username ? '@' + user.username : 'N/A'}\n` +
      `🤖 *Is Bot:* ${user.is_bot ? 'Yes' : 'No'}\n\n` +
      `💡 *Tip:* Forward pesan dari pengguna atau bot lain untuk mendapatkan ID mereka.`;
  } 
  // Forwarded from channel/group
  else if (message.forward_from_chat) {
    const chat = message.forward_from_chat;
    infoText = 
      `📑 *FORWARDED CHAT INFORMATION*\n\n` +
      `🆔 *Chat ID:* \`${chat.id}\`\n` +
      `📢 *Title:* ${chat.title || 'N/A'}\n` +
      `🔖 *Type:* ${chat.type || 'N/A'}\n` +
      `🔖 *Username:* ${chat.username ? '@' + chat.username : 'N/A'}\n\n` +
      `💡 *Tip:* Forward pesan dari grup atau channel untuk mendapatkan ID mereka.`;
  }
  // Forwarded from user who doesn't allow forward (private)
  else if (message.forward_sender_name) {
    infoText = 
      `⚠️ *PRIVATE FORWARD*\n\n` +
      `Pengguna ini tidak mengizinkan forward.\n` +
      `ID tidak dapat diperoleh.\n\n` +
      `💡 *Tip:* Hanya dapat melihat ID pengguna yang mengizinkan forward.`;
  }
  
  if (infoText) {
    await global.sendMessage(
      chatId,
      infoText,
      { parse_mode: 'Markdown' }
    );
    return true;
  }
  
  return false;
}
*/

/**
 * Handle user_shared message (hasil dari request_user)
 * @param {Object} message - Message object
 */
async function handleUserShared(message) {
  try {
    const chatId = message.chat.id;
    const userId = message.user_shared.user_id;
    const requestId = message.user_shared.request_id;
    
    // Hapus pesan getId_select jika ada
    // Pesan selection keyboard adalah pesan sebelumnya
    const selectionMessageId = message.message_id - 1;
    try {
      await global.deleteMessage(chatId, selectionMessageId);
    } catch (deleteError) {
      console.log('Could not delete selection message:', deleteError.message);
    }
    
    let userType = "User";
    if (requestId === 2) {
      userType = "Bot";
    }
    
    const infoText = 
      `📑 *${userType.toUpperCase()} INFORMATION*\n\n` +
      `👤 *${userType} ID:* \`${userId}\`\n\n` +
      `💡 *Tip:* You can use this ID to interact with the ${userType.toLowerCase()} via API or bot commands.`;
    
    await global.sendMessage(
      chatId,
      infoText,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔍 Get Another ID', callback_data: 'menu_getId' }],
            [{ text: '◀️ Back to Main Menu', callback_data: 'menu_main' }]
          ],
          remove_keyboard: true
        }
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error handling user shared:', error.message);
    return false;
  }
}

/**
 * Handle chat_shared message (hasil dari request_chat)
 * @param {Object} message - Message object
 */
async function handleChatShared(message) {
  try {
    const chatId = message.chat.id;
    const sharedChatId = message.chat_shared.chat_id;
    const requestId = message.chat_shared.request_id;
    
    // Hapus pesan getId_select jika ada
    // Pesan selection keyboard adalah pesan sebelumnya
    const selectionMessageId = message.message_id - 1;
    try {
      await global.deleteMessage(chatId, selectionMessageId);
    } catch (deleteError) {
      console.log('Could not delete selection message:', deleteError.message);
    }
    
    let chatType = "Group";
    if (requestId === 4) {
      chatType = "Channel";
    }
    
    const infoText = 
      `📑 *${chatType.toUpperCase()} INFORMATION*\n\n` +
      `🆔 *${chatType} ID:* \`${sharedChatId}\`\n\n` +
      `💡 *Tip:* You can use this ID to interact with the ${chatType.toLowerCase()} via API or bot commands.`;
    
    await global.sendMessage(
      chatId,
      infoText,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔍 Get Another ID', callback_data: 'menu_getId' }],
            [{ text: '◀️ Back to Main Menu', callback_data: 'menu_main' }]
          ],
          remove_keyboard: true
        }
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error handling chat shared:', error.message);
    return false;
  }
}

/**
 * Handle contact messages
 * @param {Object} message - Message object
 */
async function handleContact(message) {
  const chatId = message.chat.id;
  const contact = message.contact;
  
  const infoText = 
    `📑 *CONTACT INFORMATION*\n\n` +
    `👤 *User ID:* ${contact.user_id ? `\`${contact.user_id}\`` : 'N/A'}\n` +
    `📞 *Phone:* \`${contact.phone_number}\`\n` +
    `🔖 *First Name:* ${contact.first_name || 'N/A'}\n` +
    `🔖 *Last Name:* ${contact.last_name || 'N/A'}\n` +
    `🔖 *vCard:* ${contact.vcard ? 'Available' : 'N/A'}\n\n` +
    `💡 *Tip:* Bagikan kontak untuk mendapatkan User ID mereka.`;
  
  await global.sendMessage(
    chatId,
    infoText,
    { parse_mode: 'Markdown' }
  );
  
  return true;
}

/**
 * Handle group messages
 * @param {Object} message - Message object
 */
async function handleGroup(message) {
  const chatId = message.chat.id;
  const chat = message.chat;
  
  // Only respond to direct messages in the group, not all messages
  if (message.text && (message.text.includes('id') || message.text.includes('ID'))) {
    const infoText = 
      `📑 *GROUP INFORMATION*\n\n` +
      `👥 *Group ID:* \`${chat.id}\`\n` +
      `📢 *Title:* ${chat.title || 'N/A'}\n` +
      `🔖 *Type:* ${chat.type || 'N/A'}\n` +
      `🔖 *Username:* ${chat.username ? '@' + chat.username : 'N/A'}\n\n` +
      `👤 *Your ID:* \`${message.from.id}\`\n` +
      `🔖 *Your Name:* ${message.from.first_name} ${message.from.last_name || ''}\n` +
      `🔖 *Username:* ${message.from.username ? '@' + message.from.username : 'N/A'}\n\n` +
      `💡 *Tip:* Tambahkan bot ke grup untuk mendapatkan Group ID.`;
    
    await global.sendMessage(
      chatId,
      infoText,
      { parse_mode: 'Markdown' }
    );
    
    return true;
  }
  
  return false;
}

/**
 * Handle channel messages
 * @param {Object} message - Message object
 */
async function handleChannel(message) {
  const chatId = message.chat.id;
  const chat = message.chat;
  
  const infoText = 
    `📑 *CHANNEL INFORMATION*\n\n` +
    `📢 *Channel ID:* \`${chat.id}\`\n` +
    `📢 *Title:* ${chat.title || 'N/A'}\n` +
    `🔖 *Type:* ${chat.type || 'N/A'}\n` +
    `🔖 *Username:* ${chat.username ? '@' + chat.username : 'N/A'}\n\n` +
    `💡 *Tip:* Tambahkan bot sebagai admin channel untuk mendapatkan Channel ID.`;
  
  await global.sendMessage(
    chatId,
    infoText,
    { parse_mode: 'Markdown' }
  );
  
  return true;
}

module.exports = {
  processMessage
};