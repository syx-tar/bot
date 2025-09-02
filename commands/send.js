// Send command for Telegram Bot

module.exports = {
  name: 'send',
  description: 'Send a message or media to a user by ID or username.',
  execute: async (message, args) => {
    const senderChatId = message.chat.id;
    const isReply = message.reply_to_message;

    // A recipient (ID/username) is required
    if (!args[0]) {
      await global.sendMessage(
        senderChatId,
        '❌ *Usage Error*\n\nUsage: `/send <recipient_id_or_username> <message>`\n\nTo send a file, reply to the file and use the command without a message:\n`/send <recipient_id_or_username>`',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const recipient = args[0];
    const messageText = args.slice(1).join(' ');
    
    // Check if the recipient is a number (ID) or a string (username)
    // Telegram IDs are typically numbers, while usernames start with '@'
    const isRecipientId = /^-?\d+$/.test(recipient);
    const targetChatId = isRecipientId ? parseInt(recipient, 10) : recipient;

    try {
      // --- Case 1: The command is a reply to a message containing media ---
      if (isReply) {
        const repliedMessage = message.reply_to_message;
        let fileId = null;
        let mediaType = null;
        let sendMethod = null;
        
        // Check for common media types
        if (repliedMessage.photo) {
          // Photos are an array of different resolutions, we take the last one (highest quality)
          fileId = repliedMessage.photo[repliedMessage.photo.length - 1].file_id;
          mediaType = 'photo';
          sendMethod = 'sendPhoto';
        } else if (repliedMessage.video) {
          fileId = repliedMessage.video.file_id;
          mediaType = 'video';
          sendMethod = 'sendVideo';
        } else if (repliedMessage.audio) {
          fileId = repliedMessage.audio.file_id;
          mediaType = 'audio';
          sendMethod = 'sendAudio';
        } else if (repliedMessage.document) {
          fileId = repliedMessage.document.file_id;
          mediaType = 'document';
          sendMethod = 'sendDocument';
        }

        if (fileId && sendMethod) {
          await global[sendMethod](targetChatId, fileId, {
            caption: messageText || '' // Use the optional text as a caption
          });
          console.log(`✅ ${mediaType} sent to user ${targetChatId}`);
          await global.sendMessage(senderChatId, `✅ Berhasil mengirim ${mediaType} ke ${targetChatId}`);
        } else {
          // If the replied message does not contain a supported file type
          await global.sendMessage(senderChatId, '❌ *Error*\n\nInvalid replied message. Please reply to a photo, video, audio, or document.', { parse_mode: 'Markdown' });
        }
      } 
      // --- Case 2: The command is for a simple text message ---
      else if (messageText) {
        await global.sendMessage(targetChatId, messageText);
        console.log(`✅ Text message sent to user ${targetChatId}`);
        await global.sendMessage(senderChatId, `✅ Berhasil mengirim pesan teks ke ${targetChatId}`);
      } 
      // --- Case 3: No media and no text message provided ---
      else {
        await global.sendMessage(senderChatId, '❌ *Usage Error*\n\nPlease provide a message or reply to a file.', { parse_mode: 'Markdown' });
      }

    } catch (error) {
      // Handle potential errors like invalid chat ID or API issues
      console.error(`❌ Error executing send command: ${error.message}`);
      await global.sendMessage(senderChatId, `❌ Gagal mengirim pesan: ${error.message}`);
    }
  }
};
