// Main file for Telegram Bot initialization

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const handler = require('./handler');
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { Api } = require('telegram/tl');
const fs = require('fs');
const path = require('path');
const input = require('input');

// Load configuration
require('./config');

// Initialize database
require('./database/database');

// Initialize express app
const app = express();
app.use(bodyParser.json());

// Function to save session string to config file
function saveSessionString(session) {
  try {
    const configPath = path.join(__dirname, 'config.js');
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Replace sessionString with the new value
    configContent = configContent.replace(
      /global\.sessionString = ['"].*?['"];/,
      `global.sessionString = '${session}';`
    );
    
    fs.writeFileSync(configPath, configContent);
    console.log('✅ Session string saved to config.js');
  } catch (error) {
    console.error('❌ Error saving session string:', error.message);
  }
}

// Initialize user client
async function initUserClient() {
  if (!global.API_ID || !global.API_HASH) {
    console.error('❌ API_ID and API_HASH must be set in config.js for user client');
    return null;
  }

  try {
    console.log('🔄 Initializing user client...');
    
    // Create string session from saved session string or create new one
    const stringSession = new StringSession(global.sessionString || '');
    
    // Initialize the client
    const client = new TelegramClient(
      stringSession,
      parseInt(global.API_ID),
      global.API_HASH,
      { connectionRetries: 5 }
    );
    
    // Start the client
    await client.start({
      phoneNumber: async () => await input.text('Please enter your phone number: '),
      password: async () => await input.text('Please enter your password: '),
      phoneCode: async () => await input.text('Please enter the code you received: '),
      onError: (err) => console.error('Error during authentication:', err),
    });
    
    console.log('✅ User client authenticated successfully');
    
    // Save the session string if it has changed
    const newSessionString = client.session.save();
    if (newSessionString !== global.sessionString) {
      global.sessionString = newSessionString;
      saveSessionString(newSessionString);
    }
    
    // Store client in global for access from other modules
    global.userClient = client;
    
    return client;
  } catch (error) {
    console.error('❌ Error initializing user client:', error.message);
    return null;
  }
}

// Set up webhook endpoint
app.post('/webhook2', (req, res) => {
  if (req.body) {
    // Handle incoming update
    handler.handleUpdate(req.body);
  }
  
  // Always return OK to Telegram
  res.sendStatus(200);
});

// Initialize bot
async function initializeBot() {
  // Import telegram API methods
  const telegramAPI = require('./lib/API/telegram');
  
  try {
    // Step 1: Log out from cloud Bot API if enabled
    if (global.enableCloudLogout) {
      const loggedOut = await telegramAPI.logOut();
      if (!loggedOut) {
        console.warn('⚠️ Failed to log out from cloud Bot API, but continuing anyway');
      }
    }
    
    // Step 2: Initialize user client
    await initUserClient();
    
    // Step 3: Set webhook on local Bot API server
    const webhookSet = await telegramAPI.setWebhook(global.webhookUrl);
    if (!webhookSet) {
      console.error('❌ Failed to set webhook, bot may not receive updates');
    }
    
    // Step 4: Get bot information
    const botInfo = await telegramAPI.getMe();
    if (!botInfo) {
      console.error('❌ Failed to get bot information, check your token and local Bot API server');
    } else {
      global.botInfo = botInfo.result;
      console.log(`✅ Bot connected: @${global.botInfo.username}`);
    }
    
    // Step 5: Load all Telegram API methods to global scope
    telegramAPI.loadToGlobal();
    
    // Step 6: Initialize handlers
    handler.initHandlers();
    
    // Make API functions globally available
    global.API = handler.API;
    
    // Start the server
    const port = global.port || 3001;
    app.listen(port, () => {
      console.log(`🚀 Webhook server listening on port ${port}`);
      console.log('✅ Bot initialization complete');
    });
  } catch (error) {
    console.error('❌ Error starting bot:', error);
    process.exit(1);
  }
}

// Export functions
module.exports = {
  initializeBot,
  initUserClient
}; 