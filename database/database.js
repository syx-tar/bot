/**
 * Database Module
 * Simple JSON-based database for storing user interactions
 */

const fs = require('fs');
const path = require('path');

// Path to the database file
const DB_FILE = path.join(__dirname, 'database.json');

// Default database structure
const DEFAULT_DB = {
  users: {},
  stats: {
    totalUsers: 0,
    totalMessages: 0,
    commandsUsed: 0,
    lastUpdated: new Date().toISOString()
  }
};

/**
 * Initialize the database
 * @returns {Object} Database object
 */
function initDatabase() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf8');
      console.log('✅ Created new database file');
      return DEFAULT_DB;
    }
    
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const db = JSON.parse(data);
    console.log('✅ Database loaded successfully');
    return db;
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    return DEFAULT_DB;
  }
}

// Load or create database
let db = initDatabase();

// Save database to file
function saveDatabase() {
  try {
    // Update timestamp
    db.stats.lastUpdated = new Date().toISOString();
    
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('❌ Error saving database:', error.message);
    return false;
  }
}

/**
 * Get user data from database
 * @param {number|string} userId - Telegram user ID
 * @returns {Object} User data or null if not found
 */
function getUser(userId) {
  return db.users[userId] || null;
}

/**
 * Add or update user in database
 * @param {Object} userData - User data from Telegram
 * @returns {Object} Updated user object
 */
function updateUser(userData) {
  const userId = userData.id.toString();
  const isNewUser = !db.users[userId];
  const existingUser = db.users[userId] || {};
  
  // If this is a new user, increment count
  if (isNewUser) {
    db.stats.totalUsers++;
  }
  
  // Create or update user record
  db.users[userId] = {
    ...existingUser, // Keep ALL existing data including premium status
    id: userData.id,
    first_name: userData.first_name,
    last_name: userData.last_name,
    username: userData.username,
    language_code: userData.language_code,
    is_bot: userData.is_bot,
    last_interaction: new Date().toISOString(),
    interactions: (existingUser.interactions || 0) + 1
  };
  
  // Only set is_premium from userData if it's defined, otherwise keep existing value
  if (userData.is_premium !== undefined) {
    db.users[userId].is_premium = userData.is_premium;
  } else if (existingUser.is_premium === undefined) {
    // Set default value only if no existing value
    db.users[userId].is_premium = false;
  }
  
  saveDatabase();
  return db.users[userId];
}

/**
 * Record a message from a user
 * @param {Object} message - Telegram message object
 * @returns {boolean} Success status
 */
function recordMessage(message) {
  if (!message || !message.from) return false;
  
  try {
    // Update user information
    updateUser(message.from);
    
    // Increment message count
    db.stats.totalMessages++;
    
    // If message is a command, record it
    if (message.text && message.text.startsWith('/')) {
      db.stats.commandsUsed++;
    }
    
    saveDatabase();
    return true;
  } catch (error) {
    console.error('❌ Error recording message:', error.message);
    return false;
  }
}

/**
 * Get database statistics
 * @returns {Object} Database statistics
 */
function getStats() {
  return db.stats;
}

/**
 * Get all users
 * @returns {Object} All users in the database
 */
function getAllUsers() {
  return db.users;
}

/**
 * Count of users in database
 * @returns {number} Number of users
 */
function getUserCount() {
  return db.stats.totalUsers;
}

// Watch for changes in the database file
fs.watchFile(DB_FILE, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    console.log('🔄 Database file changed, reloading...');
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(data);
      console.log('✅ Database reloaded successfully');
    } catch (error) {
      console.error('❌ Error reloading database:', error.message);
    }
  }
});

// Create a database handler middleware for Telegram updates
function databaseMiddleware(update) {
  if (update.message) {
    recordMessage(update.message);
  } else if (update.callback_query && update.callback_query.from) {
    updateUser(update.callback_query.from);
  }
}

// Set global database functions
global.DB = {
  getUser,
  updateUser,
  getStats,
  getAllUsers,
  getUserCount,
  recordMessage,
  databaseMiddleware
};

// Export for direct require if needed
module.exports = {
  reloadDatabase: function() {
    delete require.cache[require.resolve('./database.js')];
    require('./database.js');
    console.log('✅ Database module reloaded');
  }
};
