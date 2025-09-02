/**
 * Utility functions for printing Telegram update information to the terminal
 */

const util = require('util');

/**
 * Print a formatted update object to the console
 * @param {Object} update - Telegram update object
 * @param {Object} options - Formatting options
 * @param {boolean} options.colors - Whether to use colors (default: true)
 * @param {number} options.depth - Maximum depth for nested objects (default: 4)
 * @param {boolean} options.showHidden - Whether to show non-enumerable properties (default: false)
 */
function printUpdate(update, options = {}) {
  const defaultOptions = {
    colors: true,
    depth: 4,
    showHidden: false
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  console.log('\n🔔 Received update:');
  console.log('⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯');
  
  // Format the update object with util.inspect for better readability
  const formattedUpdate = util.inspect(update, {
    showHidden: mergedOptions.showHidden,
    depth: mergedOptions.depth,
    colors: mergedOptions.colors,
    maxArrayLength: null,
    compact: false
  });
  
  console.log(formattedUpdate);
  console.log('⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n');
}

/**
 * Print a simplified version of the update with only key information
 * @param {Object} update - Telegram update object
 */
function printUpdateSummary(update) {
  console.log('\n📝 Update Summarys:');
  console.log('⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯');
  
  console.log(`📌 Update ID: ${update.update_id}`);
  
  // Determine update type and print relevant info
  if (update.message) {
    const { message } = update;
    console.log(`📤 Type: Message`);
    console.log(`🆔 Chat ID: ${message.chat.id}`);
    console.log(`👤 From: ${message.from?.first_name} ${message.from?.last_name || ''} ${message.from?.username ? '@' + message.from.username : ''}`);
    console.log(`⏰ Date: ${new Date(message.date * 1000).toISOString()}`);
    
    if (message.text) {
      console.log(`💬 Text: ${message.text}`);
    } else if (message.photo) {
      console.log(`📷 Photo: ${message.photo.length} sizes available`);
    } else if (message.document) {
      console.log(`📎 Document: ${message.document.file_name || 'unnamed'} (${message.document.mime_type})`);
    } else if (message.audio) {
      console.log(`🎵 Audio: ${message.audio.title || 'unnamed'} (${message.audio.duration}s)`);
    } else if (message.voice) {
      console.log(`🎤 Voice: ${message.voice.duration}s`);
    } else if (message.video) {
      console.log(`🎥 Video: ${message.video.duration}s`);
    } else if (message.sticker) {
      console.log(`💟 Sticker: ${message.sticker.emoji || ''}`);
    } else if (message.location) {
      console.log(`📍 Location: ${message.location.latitude}, ${message.location.longitude}`);
    } else if (message.contact) {
      console.log(`👤 Contact: ${message.contact.first_name} ${message.contact.phone_number}`);
    } else {
      console.log('📄 Other message type');
    }
  } else if (update.edited_message) {
    console.log(`📝 Type: Edited Message`);
    console.log(`🆔 Chat ID: ${update.edited_message.chat.id}`);
    console.log(`👤 From: ${update.edited_message.from?.first_name} ${update.edited_message.from?.last_name || ''}`);
  } else if (update.callback_query) {
    console.log(`🔄 Type: Callback Query`);
    console.log(`🆔 From User ID: ${update.callback_query.from.id}`);
    console.log(`📌 Data: ${update.callback_query.data}`);
  } else if (update.inline_query) {
    console.log(`🔍 Type: Inline Query`);
    console.log(`🆔 From User ID: ${update.inline_query.from.id}`);
    console.log(`📝 Query: ${update.inline_query.query}`);
  } else {
    console.log(`❓ Other update type`);
    // Just print the keys to give a hint of what's in the update
    console.log(`📑 Contains: ${Object.keys(update).filter(key => key !== 'update_id').join(', ')}`);
  }
  
  console.log('⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n');
}

/**
 * Print all available fields in the update object as a flat list
 * @param {Object} update - Telegram update object
 */
function printAllFields(update) {
  console.log('\n🔍 All Update Fields:');
  console.log('⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯');
  
  // Function to extract all fields recursively
  function extractFields(obj, prefix = '') {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const fieldName = prefix ? `${prefix}.${key}` : key;
      
      if (value === null) {
        console.log(`${fieldName}: null`);
      }
      else if (Array.isArray(value)) {
        console.log(`${fieldName}: [Array with ${value.length} items]`);
        value.forEach((item, index) => {
          extractFields(item, `${fieldName}[${index}]`);
        });
      }
      else if (typeof value === 'object') {
        console.log(`${fieldName}: [Object]`);
        extractFields(value, fieldName);
      }
      else {
        console.log(`${fieldName}: ${value}`);
      }
    });
  }
  
  extractFields(update);
  console.log('⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n');
}

module.exports = {
  printUpdate,
  printUpdateSummary,
  printAllFields
}; 