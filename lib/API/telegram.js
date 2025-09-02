/**
 * Telegram API Module
 * Core API methods for interacting with Telegram
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

/**
 * Send a request to the Telegram Bot API
 * @param {string} method - API method name
 * @param {Object} data - Request parameters
 * @param {Object} fileOptions - File upload options (optional)
 * @returns {Promise<Object>} - API response
 */
async function apiRequest(method, data = {}, fileOptions = null) {
  try {
    const url = `${global.localBotApiUrl}/bot${global.BotToken}/${method}`;
    
    // Handle file uploads with FormData
    if (fileOptions) {
      const form = new FormData();
      
      // Add all other data to form
      Object.entries(data).forEach(([key, value]) => {
        // Skip the file field as it will be handled separately
        if (key !== fileOptions.field) {
          form.append(key, value);
        }
      });
      
      // Add file to form
      if (fs.existsSync(fileOptions.file)) {
        form.append(
          fileOptions.field, 
          fs.createReadStream(fileOptions.file),
          { filename: path.basename(fileOptions.file) }
        );
      } else {
        throw new Error(`File not found: ${fileOptions.file}`);
      }
      
      // Send form with proper headers
      const response = await axios.post(url, form, {
        headers: form.getHeaders()
      });
      return response.data;
    } else {
      // Regular JSON request
      const response = await axios.post(url, data);
      return response.data;
    }
  } catch (error) {
    console.error(`❌ Error in Telegram API request (${method}):`, error.message);
    throw error;
  }
}

/**
 * Send a message to a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} text - Text of the message to be sent
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function sendMessage(chatId, text, options = {}) {
  return await apiRequest('sendMessage', {
    chat_id: chatId,
    text: text,
    ...options
  });
}

/**
 * Send a photo to a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} photo - Photo to send (file_id or URL)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function sendPhoto(chatId, photo, options = {}) {
  return await apiRequest('sendPhoto', {
    chat_id: chatId,
    photo: photo,
    ...options
  });
}

/**
 * Send a document to a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} document - Document to send (file_id, URL, or local file path)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function sendDocument(chatId, document, options = {}) {
  // Check if document is a local file path
  if (typeof document === 'string' && 
      (document.startsWith('/') || document.startsWith('./') || document.startsWith('../') || /^[a-zA-Z]:\\/.test(document))) {
    try {
      // Check if file exists before sending
      if (!fs.existsSync(document)) {
        throw new Error(`File not found: ${document}`);
      }
      
      return await apiRequest('sendDocument', {
        chat_id: chatId,
        ...options
      }, {
        field: 'document',
        file: document
      });
    } catch (error) {
      console.error('❌ Error sending document:', error.message);
      throw error;
    }
  } else {
    // Handle file_id or URL
    return await apiRequest('sendDocument', {
      chat_id: chatId,
      document: document,
      ...options
    });
  }
}

/**
 * Send a video to a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} video - Video to send (file_id or URL)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function sendVideo(chatId, video, options = {}) {
  return await apiRequest('sendVideo', {
    chat_id: chatId,
    video: video,
    ...options
  });
}

/**
 * Send an audio file to a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} audio - Audio to send (file_id or URL)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function sendAudio(chatId, audio, options = {}) {
  return await apiRequest('sendAudio', {
    chat_id: chatId,
    audio: audio,
    ...options
  });
}

/**
 * Delete a message
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number} messageId - Message identifier to delete
 * @returns {Promise<Object>} - API response
 */
async function deleteMessage(chatId, messageId) {
  return await apiRequest('deleteMessage', {
    chat_id: chatId,
    message_id: messageId
  });
}

/**
 * Forward a message
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number|string} fromChatId - Unique identifier for the chat where the original message was sent
 * @param {number} messageId - Message identifier in the chat specified in fromChatId
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function forwardMessage(chatId, fromChatId, messageId, options = {}) {
  return await apiRequest('forwardMessage', {
    chat_id: chatId,
    from_chat_id: fromChatId,
    message_id: messageId,
    ...options
  });
}

/**
 * Answer a callback query
 * @param {string} callbackQueryId - Unique identifier for the query to be answered
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function answerCallbackQuery(callbackQueryId, options = {}) {
  return await apiRequest('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    ...options
  });
}

/**
 * Edit text and game messages
 * @param {string} text - New text of the message
 * @param {Object} options - Additional options including chat_id and message_id
 * @returns {Promise<Object>} - API response
 */
async function editMessageText(text, options = {}) {
  return await apiRequest('editMessageText', {
    text: text,
    ...options
  });
}

/**
 * Get information about the bot
 * @returns {Promise<Object>} - Bot information
 */
async function getMe() {
  try {
    console.log('🔄 Getting bot information from local Bot API server...');
    const response = await apiRequest('getMe');
    
    if (response && response.ok) {
      console.log(`✅ Bot information retrieved successfully`);
      return response;
    } else {
      console.error('❌ Failed to get bot information:', response);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting bot information:', error.message);
    return null;
  }
}

/**
 * Get user profile photos
 * @param {number} userId - Unique identifier of the target user
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - User profile photos
 */
async function getUserProfilePhotos(userId, options = {}) {
  return await apiRequest('getUserProfilePhotos', {
    user_id: userId,
    ...options
  });
}

/**
 * Get information about a file
 * @param {string} fileId - File identifier to get info about
 * @returns {Promise<Object>} - File information
 */
async function getFile(fileId) {
  return await apiRequest('getFile', {
    file_id: fileId
  });
}

/**
 * Get chat information
 * @param {number|string} chatId - Unique identifier for the target chat
 * @returns {Promise<Object>} - Chat information
 */
async function getChat(chatId) {
  return await apiRequest('getChat', {
    chat_id: chatId
  });
}

/**
 * Log out from the cloud Bot API server
 * @returns {Promise<Object>} - API response
 */
async function logOut() {
  try {
    console.log('🔄 Logging out from cloud Bot API server...');
    // Use the cloud API URL instead of local API URL for logout
    const response = await axios.post(`https://api.telegram.org/bot${global.BotToken}/logOut`);
    
    if (response.data && response.data.ok) {
      console.log('✅ Successfully logged out from cloud Bot API server');
      return true;
    } else {
      console.warn('⚠️ Unexpected response during logout:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error logging out from cloud Bot API server:', error.message);
    
    // If we get a 401 error, it might mean we're already logged out or the token is invalid
    // If we get a 400 error with "Logged out", it means the bot is already logged out
    if (error.response) {
      if (error.response.status === 401) {
        console.log('ℹ️ Bot is already logged out or token is invalid, proceeding with local API');
        return true;
      } else if (error.response.status === 400 && 
                error.response.data && 
                error.response.data.description === 'Logged out') {
        console.log('ℹ️ Bot is already logged out from the cloud API, proceeding with local API');
        return true;
      }
    }
    
    // For other errors, allow the process to continue
    console.warn('⚠️ Failed to log out from cloud API, but continuing anyway');
    return true;
  }
}

/**
 * Close the bot instance
 * @returns {Promise<Object>} - API response
 */
async function close() {
  return await apiRequest('close');
}

/**
 * Set the webhook URL for receiving updates
 * @param {string} url - HTTPS URL to send updates to
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function setWebhook(url, options = {}) {
  try {
    console.log('🔄 Setting webhook on local Bot API server...');
    const response = await apiRequest('setWebhook', {
      url: global.webhookUrl,
      ...options
    });
    
    if (response && response.ok) {
      console.log(`✅ Webhook set: ${global.webhookUrl}`);
      return true;
    } else {
      console.error('❌ Failed to set webhook:', response);
      return false;
    }
  } catch (error) {
    console.error('❌ Error setting webhook:', error.message);
    // Allow continuing even if webhook setting fails
    return false;
  }
}

/**
 * Edit message caption
 * @param {Object} options - Options including chat_id, message_id, and caption
 * @returns {Promise<Object>} - API response
 */
async function editMessageCaption(options = {}) {
  return await apiRequest('editMessageCaption', options);
}

/**
 * Edit message reply markup
 * @param {Object} options - Options including chat_id, message_id, and reply_markup
 * @returns {Promise<Object>} - API response
 */
async function editMessageReplyMarkup(options = {}) {
  return await apiRequest('editMessageReplyMarkup', options);
}

/**
 * Send a sticker to a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} sticker - Sticker to send (file_id or URL)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function sendSticker(chatId, sticker, options = {}) {
  return await apiRequest('sendSticker', {
    chat_id: chatId,
    sticker: sticker,
    ...options
  });
}

/**
 * Pin a message in a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number} messageId - Message identifier to pin
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function pinChatMessage(chatId, messageId, options = {}) {
  return await apiRequest('pinChatMessage', {
    chat_id: chatId,
    message_id: messageId,
    ...options
  });
}

/**
 * Unpin a message in a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number} messageId - Message identifier to unpin
 * @returns {Promise<Object>} - API response
 */
async function unpinChatMessage(chatId, messageId) {
  return await apiRequest('unpinChatMessage', {
    chat_id: chatId,
    message_id: messageId
  });
}

/**
 * Unpin all messages in a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @returns {Promise<Object>} - API response
 */
async function unpinAllChatMessages(chatId) {
  return await apiRequest('unpinAllChatMessages', {
    chat_id: chatId
  });
}

/**
 * Forward multiple messages
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number|string} fromChatId - Unique identifier for the chat where the original messages were sent
 * @param {Array<number>} messageIds - Message identifiers in the chat specified in fromChatId
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function forwardMessages(chatId, fromChatId, messageIds, options = {}) {
  return await apiRequest('forwardMessages', {
    chat_id: chatId,
    from_chat_id: fromChatId,
    message_ids: messageIds,
    ...options
  });
}

/**
 * Copy a message
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number|string} fromChatId - Unique identifier for the chat where the original message was sent
 * @param {number} messageId - Message identifier in the chat specified in fromChatId
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function copyMessage(chatId, fromChatId, messageId, options = {}) {
  return await apiRequest('copyMessage', {
    chat_id: chatId,
    from_chat_id: fromChatId,
    message_id: messageId,
    ...options
  });
}

/**
 * Copy multiple messages
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number|string} fromChatId - Unique identifier for the chat where the original messages were sent
 * @param {Array<number>} messageIds - Message identifiers in the chat specified in fromChatId
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function copyMessages(chatId, fromChatId, messageIds, options = {}) {
  return await apiRequest('copyMessages', {
    chat_id: chatId,
    from_chat_id: fromChatId,
    message_ids: messageIds,
    ...options
  });
}

/**
 * Send an animation to a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} animation - Animation to send (file_id or URL)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function sendAnimation(chatId, animation, options = {}) {
  return await apiRequest('sendAnimation', {
    chat_id: chatId,
    animation: animation,
    ...options
  });
}

/**
 * Send a voice message to a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} voice - Voice message to send (file_id or URL)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function sendVoice(chatId, voice, options = {}) {
  return await apiRequest('sendVoice', {
    chat_id: chatId,
    voice: voice,
    ...options
  });
}

/**
 * Send a video note to a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} videoNote - Video note to send (file_id or URL)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function sendVideoNote(chatId, videoNote, options = {}) {
  return await apiRequest('sendVideoNote', {
    chat_id: chatId,
    video_note: videoNote,
    ...options
  });
}

/**
 * Send paid media to a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {Object} media - Paid media content to send
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function sendPaidMedia(chatId, media, options = {}) {
  return await apiRequest('sendPaidMedia', {
    chat_id: chatId,
    media: media,
    ...options
  });
}

/**
 * Send a group of photos, videos, documents or audios as an album
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {Array<Object>} media - Array of InputMedia objects describing the media to send
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function sendMediaGroup(chatId, media, options = {}) {
  return await apiRequest('sendMediaGroup', {
    chat_id: chatId,
    media: media,
    ...options
  });
}

/**
 * Send a location to a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number} latitude - Latitude of the location
 * @param {number} longitude - Longitude of the location
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function sendLocation(chatId, latitude, longitude, options = {}) {
  return await apiRequest('sendLocation', {
    chat_id: chatId,
    latitude: latitude,
    longitude: longitude,
    ...options
  });
}

/**
 * Send a venue to a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number} latitude - Latitude of the venue
 * @param {number} longitude - Longitude of the venue
 * @param {string} title - Name of the venue
 * @param {string} address - Address of the venue
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function sendVenue(chatId, latitude, longitude, title, address, options = {}) {
  return await apiRequest('sendVenue', {
    chat_id: chatId,
    latitude: latitude,
    longitude: longitude,
    title: title,
    address: address,
    ...options
  });
}

/**
 * Send a contact to a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} phoneNumber - Contact's phone number
 * @param {string} firstName - Contact's first name
 * @param {Object} options - Additional options including lastName
 * @returns {Promise<Object>} - API response
 */
async function sendContact(chatId, phoneNumber, firstName, options = {}) {
  return await apiRequest('sendContact', {
    chat_id: chatId,
    phone_number: phoneNumber,
    first_name: firstName,
    ...options
  });
}

/**
 * Send a poll to a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} question - Poll question, 1-300 characters
 * @param {Array<string>} options - List of answer options, 2-10 strings 1-100 characters each
 * @param {Object} pollOptions - Additional options for the poll
 * @returns {Promise<Object>} - API response
 */
async function sendPoll(chatId, question, options, pollOptions = {}) {
  return await apiRequest('sendPoll', {
    chat_id: chatId,
    question: question,
    options: options,
    ...pollOptions
  });
}

/**
 * Send a dice message to a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {Object} options - Additional options including emoji (🎲, 🎯, 🏀, ⚽, 🎰, 🎪)
 * @returns {Promise<Object>} - API response
 */
async function sendDice(chatId, options = {}) {
  return await apiRequest('sendDice', {
    chat_id: chatId,
    ...options
  });
}

/**
 * Tell the user that something is happening on the bot's side
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} action - Type of action to broadcast (typing, upload_photo, etc.)
 * @returns {Promise<Object>} - API response
 */
async function sendChatAction(chatId, action) {
  return await apiRequest('sendChatAction', {
    chat_id: chatId,
    action: action
  });
}

/**
 * Set reaction on a message
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number} messageId - Message identifier in the chat
 * @param {Array<Object>} reactions - Array of reaction objects
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function setMessageReaction(chatId, messageId, reactions, options = {}) {
  return await apiRequest('setMessageReaction', {
    chat_id: chatId,
    message_id: messageId,
    reaction: reactions,
    ...options
  });
}

/**
 * Set user's emoji status
 * @param {number} userId - Unique identifier of the target user
 * @param {string} emojiStatus - Custom emoji identifier
 * @returns {Promise<Object>} - API response
 */
async function setUserEmojiStatus(userId, emojiStatus) {
  return await apiRequest('setUserEmojiStatus', {
    user_id: userId,
    emoji_status_custom_emoji_id: emojiStatus
  });
}

/**
 * Ban a user in a group, supergroup or channel
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number} userId - Unique identifier of the target user
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function banChatMember(chatId, userId, options = {}) {
  return await apiRequest('banChatMember', {
    chat_id: chatId,
    user_id: userId,
    ...options
  });
}

/**
 * Unban a previously banned user in a supergroup or channel
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number} userId - Unique identifier of the target user
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function unbanChatMember(chatId, userId, options = {}) {
  return await apiRequest('unbanChatMember', {
    chat_id: chatId,
    user_id: userId,
    ...options
  });
}

/**
 * Restrict a user in a supergroup
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number} userId - Unique identifier of the target user
 * @param {Object} permissions - New user permissions
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function restrictChatMember(chatId, userId, permissions, options = {}) {
  return await apiRequest('restrictChatMember', {
    chat_id: chatId,
    user_id: userId,
    permissions: permissions,
    ...options
  });
}

/**
 * Promote or demote a user in a supergroup or a channel
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number} userId - Unique identifier of the target user
 * @param {Object} privileges - Admin privileges to set
 * @returns {Promise<Object>} - API response
 */
async function promoteChatMember(chatId, userId, privileges = {}) {
  return await apiRequest('promoteChatMember', {
    chat_id: chatId,
    user_id: userId,
    ...privileges
  });
}

/**
 * Set a custom title for an administrator in a supergroup
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number} userId - Unique identifier of the target user
 * @param {string} customTitle - New custom title, 0-16 characters
 * @returns {Promise<Object>} - API response
 */
async function setChatAdministratorCustomTitle(chatId, userId, customTitle) {
  return await apiRequest('setChatAdministratorCustomTitle', {
    chat_id: chatId,
    user_id: userId,
    custom_title: customTitle
  });
}

/**
 * Ban a channel chat in a supergroup or a channel
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number|string} senderChatId - Unique identifier of the sender chat
 * @returns {Promise<Object>} - API response
 */
async function banChatSenderChat(chatId, senderChatId) {
  return await apiRequest('banChatSenderChat', {
    chat_id: chatId,
    sender_chat_id: senderChatId
  });
}

/**
 * Unban a previously banned channel chat in a supergroup or a channel
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number|string} senderChatId - Unique identifier of the sender chat
 * @returns {Promise<Object>} - API response
 */
async function unbanChatSenderChat(chatId, senderChatId) {
  return await apiRequest('unbanChatSenderChat', {
    chat_id: chatId,
    sender_chat_id: senderChatId
  });
}

/**
 * Set default chat permissions for all members
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {Object} permissions - New default chat permissions
 * @returns {Promise<Object>} - API response
 */
async function setChatPermissions(chatId, permissions) {
  return await apiRequest('setChatPermissions', {
    chat_id: chatId,
    permissions: permissions
  });
}

/**
 * Generate a new primary invite link for a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @returns {Promise<Object>} - API response with the new invite link
 */
async function exportChatInviteLink(chatId) {
  return await apiRequest('exportChatInviteLink', {
    chat_id: chatId
  });
}

/**
 * Create an additional invite link for a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response with the new invite link
 */
async function createChatInviteLink(chatId, options = {}) {
  return await apiRequest('createChatInviteLink', {
    chat_id: chatId,
    ...options
  });
}

/**
 * Edit an invite link created by the bot
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} inviteLink - The invite link to edit
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function editChatInviteLink(chatId, inviteLink, options = {}) {
  return await apiRequest('editChatInviteLink', {
    chat_id: chatId,
    invite_link: inviteLink,
    ...options
  });
}

/**
 * Create an additional subscription invite link for a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response with the new invite link
 */
async function createChatSubscriptionInviteLink(chatId, options = {}) {
  return await apiRequest('createChatSubscriptionInviteLink', {
    chat_id: chatId,
    ...options
  });
}

/**
 * Edit a subscription invite link created by the bot
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} inviteLink - The invite link to edit
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function editChatSubscriptionInviteLink(chatId, inviteLink, options = {}) {
  return await apiRequest('editChatSubscriptionInviteLink', {
    chat_id: chatId,
    invite_link: inviteLink,
    ...options
  });
}

/**
 * Revoke an invite link created by the bot
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} inviteLink - The invite link to revoke
 * @returns {Promise<Object>} - API response
 */
async function revokeChatInviteLink(chatId, inviteLink) {
  return await apiRequest('revokeChatInviteLink', {
    chat_id: chatId,
    invite_link: inviteLink
  });
}

/**
 * Approve a chat join request
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number} userId - Unique identifier of the user to approve
 * @returns {Promise<Object>} - API response
 */
async function approveChatJoinRequest(chatId, userId) {
  return await apiRequest('approveChatJoinRequest', {
    chat_id: chatId,
    user_id: userId
  });
}

/**
 * Decline a chat join request
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number} userId - Unique identifier of the user to decline
 * @returns {Promise<Object>} - API response
 */
async function declineChatJoinRequest(chatId, userId) {
  return await apiRequest('declineChatJoinRequest', {
    chat_id: chatId,
    user_id: userId
  });
}

/**
 * Set a chat photo
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} photo - Photo to set (file path)
 * @returns {Promise<Object>} - API response
 */
async function setChatPhoto(chatId, photo) {
  return await apiRequest('setChatPhoto', {
    chat_id: chatId
  }, {
    field: 'photo',
    file: photo
  });
}

/**
 * Delete a chat photo
 * @param {number|string} chatId - Unique identifier for the target chat
 * @returns {Promise<Object>} - API response
 */
async function deleteChatPhoto(chatId) {
  return await apiRequest('deleteChatPhoto', {
    chat_id: chatId
  });
}

/**
 * Set chat title
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} title - New chat title, 1-255 characters
 * @returns {Promise<Object>} - API response
 */
async function setChatTitle(chatId, title) {
  return await apiRequest('setChatTitle', {
    chat_id: chatId,
    title: title
  });
}

/**
 * Set chat description
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} description - New chat description, 0-255 characters
 * @returns {Promise<Object>} - API response
 */
async function setChatDescription(chatId, description) {
  return await apiRequest('setChatDescription', {
    chat_id: chatId,
    description: description
  });
}

/**
 * Leave a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @returns {Promise<Object>} - API response
 */
async function leaveChat(chatId) {
  return await apiRequest('leaveChat', {
    chat_id: chatId
  });
}

/**
 * Get chat administrators
 * @param {number|string} chatId - Unique identifier for the target chat
 * @returns {Promise<Object>} - API response
 */
async function getChatAdministrators(chatId) {
  return await apiRequest('getChatAdministrators', {
    chat_id: chatId
  });
}

/**
 * Get the number of members in a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @returns {Promise<Object>} - API response
 */
async function getChatMemberCount(chatId) {
  return await apiRequest('getChatMemberCount', {
    chat_id: chatId
  });
}

/**
 * Get a member of a chat.
 * @param {number|string} chatId - Unique identifier for the target chat.
 * @param {number|string} userId - Unique identifier for the user to be retrieved.
 * @returns {Promise<Object>} - API response.
 */
async function getChatMember(chatId, userId) {
  return await apiRequest('getChatMember', {
    chat_id: chatId,
    user_id: userId
  });
}



/**
 * Set a new group sticker set
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} stickerSetName - Name of the sticker set
 * @returns {Promise<Object>} - API response
 */
async function setChatStickerSet(chatId, stickerSetName) {
  return await apiRequest('setChatStickerSet', {
    chat_id: chatId,
    sticker_set_name: stickerSetName
  });
}

/**
 * Delete a group sticker set
 * @param {number|string} chatId - Unique identifier for the target chat
 * @returns {Promise<Object>} - API response
 */
async function deleteChatStickerSet(chatId) {
  return await apiRequest('deleteChatStickerSet', {
    chat_id: chatId
  });
}

/**
 * Get custom emoji stickers available for forum topic icons
 * @returns {Promise<Object>} - API response with available stickers
 */
async function getForumTopicIconStickers() {
  return await apiRequest('getForumTopicIconStickers');
}

/**
 * Create a topic in a forum supergroup chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} name - Topic name, 1-128 characters
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response with forum topic info
 */
async function createForumTopic(chatId, name, options = {}) {
  return await apiRequest('createForumTopic', {
    chat_id: chatId,
    name: name,
    ...options
  });
}

/**
 * Edit a forum topic
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number} messageThreadId - Unique identifier of the forum topic
 * @param {Object} options - Additional options including name and icon_custom_emoji_id
 * @returns {Promise<Object>} - API response
 */
async function editForumTopic(chatId, messageThreadId, options = {}) {
  return await apiRequest('editForumTopic', {
    chat_id: chatId,
    message_thread_id: messageThreadId,
    ...options
  });
}

/**
 * Close an open forum topic
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number} messageThreadId - Unique identifier of the forum topic
 * @returns {Promise<Object>} - API response
 */
async function closeForumTopic(chatId, messageThreadId) {
  return await apiRequest('closeForumTopic', {
    chat_id: chatId,
    message_thread_id: messageThreadId
  });
}

/**
 * Reopen a closed forum topic
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number} messageThreadId - Unique identifier of the forum topic
 * @returns {Promise<Object>} - API response
 */
async function reopenForumTopic(chatId, messageThreadId) {
  return await apiRequest('reopenForumTopic', {
    chat_id: chatId,
    message_thread_id: messageThreadId
  });
}

/**
 * Delete a forum topic along with all its messages
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number} messageThreadId - Unique identifier of the forum topic
 * @returns {Promise<Object>} - API response
 */
async function deleteForumTopic(chatId, messageThreadId) {
  return await apiRequest('deleteForumTopic', {
    chat_id: chatId,
    message_thread_id: messageThreadId
  });
}

/**
 * Clear the list of pinned messages in a forum topic
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number} messageThreadId - Unique identifier of the forum topic
 * @returns {Promise<Object>} - API response
 */
async function unpinAllForumTopicMessages(chatId, messageThreadId) {
  return await apiRequest('unpinAllForumTopicMessages', {
    chat_id: chatId,
    message_thread_id: messageThreadId
  });
}

/**
 * Edit the name of the 'General' topic in a forum supergroup chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {string} name - New topic name, 1-128 characters
 * @returns {Promise<Object>} - API response
 */
async function editGeneralForumTopic(chatId, name) {
  return await apiRequest('editGeneralForumTopic', {
    chat_id: chatId,
    name: name
  });
}

/**
 * Close the 'General' topic in a forum supergroup chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @returns {Promise<Object>} - API response
 */
async function closeGeneralForumTopic(chatId) {
  return await apiRequest('closeGeneralForumTopic', {
    chat_id: chatId
  });
}

/**
 * Reopen the 'General' topic in a forum supergroup chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @returns {Promise<Object>} - API response
 */
async function reopenGeneralForumTopic(chatId) {
  return await apiRequest('reopenGeneralForumTopic', {
    chat_id: chatId
  });
}

/**
 * Hide the 'General' topic in a forum supergroup chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @returns {Promise<Object>} - API response
 */
async function hideGeneralForumTopic(chatId) {
  return await apiRequest('hideGeneralForumTopic', {
    chat_id: chatId
  });
}

/**
 * Unhide the 'General' topic in a forum supergroup chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @returns {Promise<Object>} - API response
 */
async function unhideGeneralForumTopic(chatId) {
  return await apiRequest('unhideGeneralForumTopic', {
    chat_id: chatId
  });
}

/**
 * Clear the list of pinned messages in the 'General' topic
 * @param {number|string} chatId - Unique identifier for the target chat
 * @returns {Promise<Object>} - API response
 */
async function unpinAllGeneralForumTopicMessages(chatId) {
  return await apiRequest('unpinAllGeneralForumTopicMessages', {
    chat_id: chatId
  });
}

/**
 * Get boosts added to a chat by a user
 * @param {number|string} chatId - Unique identifier for the target chat
 * @param {number} userId - Unique identifier of the target user
 * @returns {Promise<Object>} - API response with user's boosts for the chat
 */
async function getUserChatBoosts(chatId, userId) {
  return await apiRequest('getUserChatBoosts', {
    chat_id: chatId,
    user_id: userId
  });
}

/**
 * Get information about a business connection
 * @param {string} businessConnectionId - Unique identifier of the business connection
 * @returns {Promise<Object>} - API response with information about the connection
 */
async function getBusinessConnection(businessConnectionId) {
  return await apiRequest('getBusinessConnection', {
    business_connection_id: businessConnectionId
  });
}

/**
 * Change the list of the bot's commands
 * @param {Array<Object>} commands - List of BotCommand objects
 * @param {Object} options - Additional options including scope and language_code
 * @returns {Promise<Object>} - API response
 */
async function setMyCommands(commands, options = {}) {
  return await apiRequest('setMyCommands', {
    commands: commands,
    ...options
  });
}

/**
 * Delete the list of the bot's commands
 * @param {Object} options - Options including scope and language_code
 * @returns {Promise<Object>} - API response
 */
async function deleteMyCommands(options = {}) {
  return await apiRequest('deleteMyCommands', options);
}

/**
 * Get the current list of the bot's commands
 * @param {Object} options - Options including scope and language_code
 * @returns {Promise<Object>} - API response with list of commands
 */
async function getMyCommands(options = {}) {
  return await apiRequest('getMyCommands', options);
}

/**
 * Change the bot's name
 * @param {Object} options - Options including name and language_code
 * @returns {Promise<Object>} - API response
 */
async function setMyName(options = {}) {
  return await apiRequest('setMyName', options);
}

/**
 * Get the current bot's name
 * @param {Object} options - Options including language_code
 * @returns {Promise<Object>} - API response with the bot's name
 */
async function getMyName(options = {}) {
  return await apiRequest('getMyName', options);
}

/**
 * Change the bot's description
 * @param {Object} options - Options including description and language_code
 * @returns {Promise<Object>} - API response
 */
async function setMyDescription(options = {}) {
  return await apiRequest('setMyDescription', options);
}

/**
 * Get the current bot's description
 * @param {Object} options - Options including language_code
 * @returns {Promise<Object>} - API response with the bot's description
 */
async function getMyDescription(options = {}) {
  return await apiRequest('getMyDescription', options);
}

/**
 * Change the bot's short description
 * @param {Object} options - Options including short_description and language_code
 * @returns {Promise<Object>} - API response
 */
async function setMyShortDescription(options = {}) {
  return await apiRequest('setMyShortDescription', options);
}

/**
 * Get the current bot's short description
 * @param {Object} options - Options including language_code
 * @returns {Promise<Object>} - API response with the bot's short description
 */
async function getMyShortDescription(options = {}) {
  return await apiRequest('getMyShortDescription', options);
}

/**
 * Change the bot's menu button in a private chat
 * @param {Object} options - Options including chat_id and menu_button
 * @returns {Promise<Object>} - API response
 */
async function setChatMenuButton(options = {}) {
  return await apiRequest('setChatMenuButton', options);
}

/**
 * Get the current value of the bot's menu button
 * @param {Object} options - Options including chat_id
 * @returns {Promise<Object>} - API response with the menu button
 */
async function getChatMenuButton(options = {}) {
  return await apiRequest('getChatMenuButton', options);
}

/**
 * Change the default administrator rights for the bot
 * @param {Object} options - Options including rights and for_channels
 * @returns {Promise<Object>} - API response
 */
async function setMyDefaultAdministratorRights(options = {}) {
  return await apiRequest('setMyDefaultAdministratorRights', options);
}

/**
 * Get the current default administrator rights of the bot
 * @param {Object} options - Options including for_channels
 * @returns {Promise<Object>} - API response with default admin rights
 */
async function getMyDefaultAdministratorRights(options = {}) {
  return await apiRequest('getMyDefaultAdministratorRights', options);
}

/**
 * Send answers to inline query
 * @param {string} inlineQueryId - Unique identifier for the answered query
 * @param {Array<Object>} results - Array of InlineQueryResult objects
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function answerInlineQuery(inlineQueryId, results, options = {}) {
  return await apiRequest('answerInlineQuery', {
    inline_query_id: inlineQueryId,
    results: results,
    ...options
  });
}

/**
 * Send answers to web app query
 * @param {string} webAppQueryId - Unique identifier for the query
 * @param {Object} result - An InlineQueryResult object
 * @returns {Promise<Object>} - API response
 */
async function answerWebAppQuery(webAppQueryId, result) {
  return await apiRequest('answerWebAppQuery', {
    web_app_query_id: webAppQueryId,
    result: result
  });
}

/**
 * Save a prepared inline message
 * @param {Object} messageContent - Content of the message to be sent
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response with prepared message info
 */
async function savePreparedInlineMessage(messageContent, options = {}) {
  return await apiRequest('savePreparedInlineMessage', {
    message_content: messageContent,
    ...options
  });
}

/**
 * Get comprehensive information about a chat
 * @param {number|string} chatId - Unique identifier for the target chat
 * @returns {Promise<Object>} - Combined chat information
 */
async function getChatFullInfo(chatId) {
  try {
    // Get basic chat information
    const chatInfo = await getChat(chatId);
    
    if (!chatInfo || !chatInfo.result) {
      throw new Error('Failed to get chat information');
    }
    
    const result = { ...chatInfo.result };
    
    // For groups and supergroups, get additional information
    if (result.type === 'group' || result.type === 'supergroup') {
      try {
        // Get administrators
        const adminsInfo = await getChatAdministrators(chatId);
        if (adminsInfo && adminsInfo.result) {
          result.administrators = adminsInfo.result;
        }
        
        // Get member count
        const memberCountInfo = await getChatMemberCount(chatId);
        if (memberCountInfo && memberCountInfo.result) {
          result.member_count = memberCountInfo.result;
        }
      } catch (error) {
        console.warn(`⚠️ Could not fetch all additional chat info: ${error.message}`);
      }
    }
    
    return {
      ok: true,
      result: result
    };
  } catch (error) {
    console.error(`❌ Error in getChatFullInfo: ${error.message}`);
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Create a Chat object helper
 * This is a utility function to create a standardized Chat object
 * @param {Object} chatData - Raw chat data
 * @returns {Object} - Standardized Chat object
 */
function createChatObject(chatData) {
  if (!chatData) return null;
  
  // Create a base chat object with essential properties
  const chat = {
    id: chatData.id,
    type: chatData.type,
    title: chatData.title || null,
    username: chatData.username || null,
    first_name: chatData.first_name || null,
    last_name: chatData.last_name || null,
    is_forum: chatData.is_forum || false
  };
  
  // Add optional properties if they exist
  if (chatData.photo) chat.photo = chatData.photo;
  if (chatData.description) chat.description = chatData.description;
  if (chatData.invite_link) chat.invite_link = chatData.invite_link;
  if (chatData.pinned_message) chat.pinned_message = chatData.pinned_message;
  if (chatData.permissions) chat.permissions = chatData.permissions;
  
  return chat;
}

// The methods to be exported
const methods = {
  sendMessage,
  sendPhoto,
  sendDocument,
  sendVideo,
  sendAudio,
  deleteMessage,
  forwardMessage,
  answerCallbackQuery,
  editMessageText,
  getMe,
  getUserProfilePhotos,
  getFile,
  getChat,
  logOut,
  close,
  setWebhook,
  editMessageCaption,
  editMessageReplyMarkup,
  sendSticker,
  pinChatMessage,
  unpinChatMessage,
  unpinAllChatMessages,
  forwardMessages,
  copyMessage,
  copyMessages,
  sendAnimation,
  sendVoice,
  sendVideoNote,
  sendPaidMedia,
  sendMediaGroup,
  sendLocation,
  sendVenue,
  sendContact,
  sendPoll,
  sendDice,
  sendChatAction,
  setMessageReaction,
  setUserEmojiStatus,
  banChatMember,
  unbanChatMember,
  restrictChatMember,
  promoteChatMember,
  setChatAdministratorCustomTitle,
  banChatSenderChat,
  unbanChatSenderChat,
  setChatPermissions,
  exportChatInviteLink,
  createChatInviteLink,
  editChatInviteLink,
  createChatSubscriptionInviteLink,
  editChatSubscriptionInviteLink,
  revokeChatInviteLink,
  approveChatJoinRequest,
  declineChatJoinRequest,
  setChatPhoto,
  deleteChatPhoto,
  setChatTitle,
  setChatDescription,
  leaveChat,
  getChatAdministrators,
  getChatMemberCount,
  setChatStickerSet,
  deleteChatStickerSet,
  getForumTopicIconStickers,
  createForumTopic,
  editForumTopic,
  closeForumTopic,
  reopenForumTopic,
  deleteForumTopic,
  unpinAllForumTopicMessages,
  editGeneralForumTopic,
  closeGeneralForumTopic,
  reopenGeneralForumTopic,
  hideGeneralForumTopic,
  unhideGeneralForumTopic,
  unpinAllGeneralForumTopicMessages,
  getUserChatBoosts,
  getBusinessConnection,
  setMyCommands,
  deleteMyCommands,
  getMyCommands,
  setMyName,
  getMyName,
  setMyDescription,
  getMyDescription,
  setMyShortDescription,
  getMyShortDescription,
  setChatMenuButton,
  getChatMenuButton,
  setMyDefaultAdministratorRights,
  getMyDefaultAdministratorRights,
  answerInlineQuery,
  answerWebAppQuery,
  savePreparedInlineMessage,
  getChatFullInfo,
  createChatObject,
  apiRequest
};

/**
 * Load all methods into the global scope
 */
function loadToGlobal() {
  Object.entries(methods).forEach(([name, func]) => {
    global[name] = func;
  });
  console.log('✅ Loaded all Telegram API methods to global scope');
}

module.exports = {
  ...methods,
  loadToGlobal
}; 
