/**
 * SubMenu plugin - Handles all menu callback queries
 */

const fs = require('fs');
const path = require('path');

// Store loaded menu handlers
const menuHandlers = new Map();
// Expose menuHandlers to global scope for direct access by other modules
global.menuHandlers = menuHandlers;

// Load menu handlers from subMenu directory
function loadMenuHandlers() {
  const menuDir = path.join(__dirname, '..', 'commands', 'subMenu');
  
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(menuDir)) {
      fs.mkdirSync(menuDir, { recursive: true });
    }

    const menuFiles = fs.readdirSync(menuDir).filter(file => file.endsWith('.js'));
    console.log(`🔄 Loading ${menuFiles.length} menu handlers...`);
    
    for (const file of menuFiles) {
      const filePath = path.join(menuDir, file);
      
      // Clear cache to ensure we get fresh modules
      delete require.cache[require.resolve(filePath)];
      
      const handler = require(filePath);
      const handlerName = file.split('.')[0]; // Remove .js extension
      
      if (handler.handleCallback) {
        menuHandlers.set(handlerName, handler);
        console.log(`✅ Loaded menu handler: ${handlerName}`);
      } else {
        console.warn(`⚠️ Menu handler ${handlerName} is missing handleCallback method`);
      }
    }
  } catch (error) {
    console.error('❌ Error loading menu handlers:', error.message);
  }
}

// Load handlers on startup
loadMenuHandlers();

// Watch the subMenu directory for changes
const subMenuDir = path.join(__dirname, '..', 'commands', 'subMenu');
if (fs.existsSync(subMenuDir)) {
  fs.watch(subMenuDir, (eventType, filename) => {
    if (filename && filename.endsWith('.js')) {
      console.log(`🔄 Menu handler file ${filename} changed, reloading handlers...`);
      loadMenuHandlers();
    }
  });
}

// Process callback queries
async function processCallback(query) {
  if (!query || !query.data) return false;
  
  try {
    // Extract menu prefix from callback_data
    const data = query.data;
    const prefixEnd = data.indexOf('_');
    
    if (prefixEnd === -1) return false;
    
    // Check if this is a main menu action
    if (data === 'menu_main') {
      return handleMainMenu(query);
    }
    
    // Extract menu type - if prefix is "menu_", take next part; otherwise take first part
    let menuType;
    if (data.startsWith('menu_')) {
      // Extract part after menu_
      menuType = data.substring(5);
      // If there are more underscores, just take first part
      if (menuType.includes('_')) {
        menuType = menuType.split('_')[0];
      }
    } else {
      // For non-menu prefixes (like ping_refresh), take first part before underscore
      menuType = data.split('_')[0];
    }

    
    
    
    
    // Special handling for menu_getId when called in non-private chat
    if (menuType === 'getId' && data === 'menu_getId' && query.message.chat.type !== 'private') {
      // Show alert that this feature is only available in private chats
      await global.answerCallbackQuery(query.id, {
        text: global.permissionMessages.private,
        show_alert: true
      });
      
      return true;
    }

    // Answer the callback query to stop the loading indicator
    try {
      await global.answerCallbackQuery(query.id);
    } catch (error) {
      console.error('Error answering callback query:', error.message);
    }
    
    // Find the appropriate handler
    if (menuHandlers.has(menuType)) {
      return await menuHandlers.get(menuType).handleCallback(query);
    } else {
      // Handle default case when no specific handler is found
      console.log(`No handler found for menu type: ${menuType}`);
      return false;
    }
  } catch (error) {
    console.error('Error processing menu callback:', error.message);
    return false;
  }
}

// Handle main menu
async function handleMainMenu(query) {
  try {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const userId = query.from.id;
    const user = global.DB.getUser(userId);
    const isOwner = global.owner.includes(userId.toString());
    const stats = global.DB.getStats();
    
    // Create inline keyboard
    const inlineKeyboard = [];
    
    // Add Ping button for all users
    inlineKeyboard.push([
      { text: '🖥️ Server Status', callback_data: 'menu_ping' }
    ]);
    
    // Add Get ID button for all users
    inlineKeyboard.push([
      { text: '🆔 Get ID', callback_data: 'menu_getId' }
    ]);
    
    // Add Admin button if user is owner
    if (isOwner) {
      inlineKeyboard.push([
        { text: '👑 Admin Panel', callback_data: 'menu_admin' }
      ]);
    }
    
    // Edit the message to show main menu
    await global.editMessageText(
      `🔥 *Selamat datang di VYNIX\\!* 🔥\n\n` +
      `Haii [${user.first_name}](tg://user?id=${user.id})👋\n\n` +
      `Kami bangkit dari abu seperti *Phoenix\\.*\n` +
      `Dibanned? Kami balik lagi\\! 💪\n\n` +
      `**>🎬 *Konten Eksklusif*\n` +
      `>🤝 *Komunitas Solid Pengocok Handal*\n` +
      `>📢 *Update Terbaru & Tanpa Sensor*\n\n` +
      `👥 Total Member: *${stats.totalUsers}*`,
      { 
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: inlineKeyboard
        }
      }
    );
    
    return true;
  } catch (error) {
    // If the error is "message is not modified", just ignore it
    if (error.description && error.description.includes('message is not modified')) {
      console.log('Main menu already displayed, ignoring edit error');
      return true;
    } else {
      console.error('Error displaying main menu:', error.message);
      return false;
    }
  }
}

module.exports = {
  // Process all callback queries
  processCallback: async (update) => {
    if (update.callback_query) {
      return await processCallback(update.callback_query);
    }
    return false;
  },
  
  // Reload menu handlers
  reloadHandlers: () => {
    loadMenuHandlers();
  }
}; 