/**
 * DeleteCommands Plugin
 * Automatically deletes messages that start with a forward slash (/)
 */

/**
 * Process incoming message updates and delete if they start with '/'
 * @param {Object} update - Telegram update object
 * @returns {boolean} - True if message was processed, false otherwise
 */
async function processMessage(update) {
  try {
    // Check if update contains a message and if it has text
    if (!update.message || !update.message.text) {
      return false;
    }

    const message = update.message;
    
    // Check if message starts with a '/' (command)
    if (message.text.startsWith('/')) {
      // Get chat ID and message ID for deletion
      const chatId = message.chat.id;
      const messageId = message.message_id;
      
      // Small delay to ensure command is processed before being deleted
      setTimeout(async () => {
        try {
          // Delete the command message
          await global.deleteMessage(chatId, messageId);
        } catch (error) {
          console.error(`❌ Error deleting command message: ${error.message}`);
        }
      }, 1000); // 1 second delay
      
      // Return false to allow other handlers to process the command
      return false;
    }
    
    // Not a command message, let other handlers process it
    return false;
  } catch (error) {
    console.error(`❌ Error in DeleteCommands plugin: ${error.message}`);
    return false;
  }
}

module.exports = {
  processMessage
}; 