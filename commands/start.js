/**
 * Start command - Main menu
 */

module.exports = {
  name: 'start',
  description: 'Start the bot and show main menu',
  
  async execute(message, args) {
    const chatId = message.chat.id;
    const userId = message.from.id;
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
    
    // Send welcome message with inline keyboard
    await global.sendMessage(
      chatId,
      `🔥 *Selamat datang di VYNIX\\!* 🔥\n\n` +
      `Haii [${user.first_name}](tg://user?id=${user.id})👋\n\n` +
      `Kami bangkit dari abu seperti *Phoenix\\.*\n` +
      `Dibanned? Kami balik lagi\\! 💪\n\n` +
      `**>🎬 *Konten Eksklusif*\n` +
      `>🤝 *Komunitas Solid Pengocok Handal*\n` +
      `>📢 *Update Terbaru & Tanpa Sensor*\n\n` +
      `👥 Total Member: *${stats.totalUsers}*`,
      { 
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: inlineKeyboard
        }
      }
    );
  }
}; 