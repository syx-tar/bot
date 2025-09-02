/**
 * Telegram Update Object
 * Represents an incoming update from Telegram
 * Reference: https://core.telegram.org/bots/api#update
 */

class Update {
  constructor(updateData) {
    // Update identifier
    this.update_id = updateData.update_id;

    // Optional fields - at most one of these can be present in any update
    if (updateData.message) {
      this.message = updateData.message;
    }
    
    if (updateData.edited_message) {
      this.edited_message = updateData.edited_message;
    }
    
    if (updateData.channel_post) {
      this.channel_post = updateData.channel_post;
    }
    
    if (updateData.edited_channel_post) {
      this.edited_channel_post = updateData.edited_channel_post;
    }
    
    if (updateData.inline_query) {
      this.inline_query = updateData.inline_query;
    }
    
    if (updateData.chosen_inline_result) {
      this.chosen_inline_result = updateData.chosen_inline_result;
    }
    
    if (updateData.callback_query) {
      this.callback_query = updateData.callback_query;
    }
    
    if (updateData.shipping_query) {
      this.shipping_query = updateData.shipping_query;
    }
    
    if (updateData.pre_checkout_query) {
      this.pre_checkout_query = updateData.pre_checkout_query;
    }
    
    if (updateData.poll) {
      this.poll = updateData.poll;
    }
    
    if (updateData.poll_answer) {
      this.poll_answer = updateData.poll_answer;
    }
    
    if (updateData.my_chat_member) {
      this.my_chat_member = updateData.my_chat_member;
    }
    
    if (updateData.chat_member) {
      this.chat_member = updateData.chat_member;
    }
    
    if (updateData.chat_join_request) {
      this.chat_join_request = updateData.chat_join_request;
    }
  }

  /**
   * Determine the type of update
   * @returns {string} Type of update (message, edited_message, etc.)
   */
  getUpdateType() {
    if (this.message) return 'message';
    if (this.edited_message) return 'edited_message';
    if (this.channel_post) return 'channel_post';
    if (this.edited_channel_post) return 'edited_channel_post';
    if (this.inline_query) return 'inline_query';
    if (this.chosen_inline_result) return 'chosen_inline_result';
    if (this.callback_query) return 'callback_query';
    if (this.shipping_query) return 'shipping_query';
    if (this.pre_checkout_query) return 'pre_checkout_query';
    if (this.poll) return 'poll';
    if (this.poll_answer) return 'poll_answer';
    if (this.my_chat_member) return 'my_chat_member';
    if (this.chat_member) return 'chat_member';
    if (this.chat_join_request) return 'chat_join_request';
    return 'unknown';
  }

  /**
   * Get the content of the update based on its type
   * @returns {Object|null} The content object or null if not found
   */
  getContent() {
    const updateType = this.getUpdateType();
    return updateType !== 'unknown' ? this[updateType] : null;
  }

  /**
   * Get the chat ID from the update if applicable
   * @returns {number|string|null} Chat ID or null if not found
   */
  getChatId() {
    const content = this.getContent();
    if (!content) return null;

    // For most update types, chat is inside the content
    if (content.chat) return content.chat.id;
    
    // For callback queries, chat is in message
    if (content.message?.chat) return content.message.chat.id;
    
    // For inline queries, user ID is used
    if (content.from) return content.from.id;
    
    return null;
  }
}

/**
 * Create an Update instance from raw update data
 * @param {Object} updateData Raw update data from Telegram
 * @returns {Update} Update instance
 */
function createUpdate(updateData) {
  return new Update(updateData);
}

module.exports = {
  Update,
  createUpdate
}; 