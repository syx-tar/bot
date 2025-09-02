/**
 * AntiLink Plugin
 * Automatically deletes messages that contain links, except for those sent by group administrators.
 */

/**
 * Checks if a user is an administrator in the chat.
 * This is a placeholder and requires a function to retrieve chat member status.
 * @param {number} chatId - The ID of the chat.
 * @param {number} userId - The ID of the user.
 * @returns {boolean} - True if the user is an admin, false otherwise.
 */
async function isAdmin(chatId, userId) {
  try {
    // Assuming you have a global function to get chat member status from your bot framework
    const chatMember = await global.getChatMember(chatId, userId);
    
    // Check if the user's status is 'administrator' or 'creator'
    return chatMember && (chatMember.status === 'administrator' || chatMember.status === 'creator');
  } catch (error) {
    console.error(`❌ Error checking admin status for user ${userId} in chat ${chatId}: ${error.message}`);
    return false;
  }
}

/**
 * Process incoming message updates and delete if they contain a link, unless the sender is an admin.
 * @param {Object} update - Telegram update object
 * @returns {boolean} - True if message was processed, false otherwise
 */
async function processMessage(update) {
  try {
    // Check if update contains a message and if it has text or a caption
    if (!update.message || (!update.message.text && !update.message.caption)) {
      return false;
    }

    const message = update.message;
    const chatId = message.chat.id;
    const userId = message.from.id;
    const messageText = message.text || message.caption;

    // First, check if the user who sent the message is an admin
    const userIsAdmin = await isAdmin(chatId, userId);
    if (userIsAdmin) {
      // If the sender is an admin, do not process this message further
      return false;
    }

    // A simple regex to detect URLs (http, https, or www)
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

    // If the sender is not an admin, check if the message text contains a URL
    if (urlRegex.test(messageText)) {
      const messageId = message.message_id;

      // Small delay to ensure the bot can process the deletion
      setTimeout(async () => {
        try {
          // Delete the message containing the link
          await global.deleteMessage(chatId, messageId);
          console.log(`✅ Non-admin message containing link deleted in chat ${chatId}`);
        } catch (error) {
          console.error(`❌ Error deleting message with link: ${error.message}`);
        }
      }, 500); // 0.5 second delay

      // Return true because we have handled this message
      return true;
    }

    // No link found, let other handlers process it
    return false;
  } catch (error) {
    console.error(`❌ Error in AntiLink plugin: ${error.message}`);
    return false;
  }
}

module.exports = {
  processMessage
};

