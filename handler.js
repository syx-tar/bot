// Handlers for Telegram Bot

const fs = require('fs');
const path = require('path');

// Permission mode messages
global.permissionMessages = {
  owner: `⚠️ • Owner Mode: Fitur ini cuma buat yg punya :v`,
  group: `⚠️ • Group Mode: Fitur ini cuma buat di gc :v`,
  private: `⚠️ • Private Chat Mode: Fitur ini cuma buat di chat pribadi :v`,
  admin: `⚠️ • Admin Mode: Fitur ini cuma buat admin`,
  restrict: `⚠️ • Restricted Mode: fitur ini lagi dimatikan`,
  premium: `⚠️ • Premium mode: Fitur ini cuma buat premium :v`,
};

// Initialize API modules and plugins
let API = {};
let plugins = [];

// Load API modules
const loadAPI = () => {
  const apiPath = path.join(__dirname, 'lib', 'API');
  
  try {
    if (!fs.existsSync(apiPath)) {
      fs.mkdirSync(apiPath, { recursive: true });
    }

    const apiFiles = fs.readdirSync(apiPath).filter(file => file.endsWith('.js'));
    console.log(`🔄 Loading ${apiFiles.length} API modules...`);
    
    for (const file of apiFiles) {
      const filePath = path.join(apiPath, file);
      
      // Clear cache to ensure we get fresh modules
      delete require.cache[require.resolve(filePath)];
      
      const module = require(filePath);
      const moduleName = file.split('.')[0]; // Remove .js extension
      
      API[moduleName] = module;
      console.log(`✅ Loaded API module: ${moduleName}`);
    }
  } catch (error) {
    console.error('❌ Error loading API modules:', error.message);
  }
};

// Initialize handlers
const initHandlers = () => {
  // Load API modules
  loadAPI();
  
  // Watch config.js for changes
  watchConfigFile();
  
  // Watch print.js for changes
  watchPrintFile();
  
  // Watch command and plugin folders for changes
  watchFolders();
  
  // Load command handlers
  loadCommands();
  
  // Load plugins
  loadPlugins();
};

// Watch config file for changes
const watchConfigFile = () => {
  const configPath = path.join(__dirname, 'config.js');
  fs.watchFile(configPath, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      console.log('🔄 Configuration file changed, reloading...');
      try {
        const config = require('./config');
        config.reloadConfig();
      } catch (error) {
        console.error('❌ Error reloading config:', error.message);
      }
    }
  });
  
  // Watch database.js file for changes
  const databasePath = path.join(__dirname, 'database', 'database.js');
  if (fs.existsSync(databasePath)) {
    fs.watchFile(databasePath, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        console.log('🔄 Database module changed, reloading...');
        try {
          const database = require('./database/database');
          database.reloadDatabase();
        } catch (error) {
          console.error('❌ Error reloading database module:', error.message);
        }
      }
    });
  }
};

// Watch print.js file for changes
const watchPrintFile = () => {
  const printPath = path.join(__dirname, 'lib', 'print.js');
  if (fs.existsSync(printPath)) {
    fs.watchFile(printPath, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        console.log('🔄 Print module changed, reloading...');
        try {
          delete require.cache[require.resolve(printPath)];
          console.log('✅ Print module reloaded successfully');
        } catch (error) {
          console.error('❌ Error reloading print module:', error.message);
        }
      }
    });
  }
};

// Watch commands and plugins folders for changes
const watchFolders = () => {
  // Watch commands folder
  const commandsPath = path.join(__dirname, 'commands');
  if (fs.existsSync(commandsPath)) {
    fs.watch(commandsPath, (eventType, filename) => {
      if (filename && filename.endsWith('.js')) {
        console.log(`🔄 Command file ${filename} changed, reloading commands...`);
        loadCommands();
      }
    });
  }
  
  // Watch plugins folder
  const pluginsPath = path.join(__dirname, 'plugins');
  if (fs.existsSync(pluginsPath)) {
    fs.watch(pluginsPath, (eventType, filename) => {
      if (filename && filename.endsWith('.js')) {
        console.log(`🔄 Plugin file ${filename} changed, reloading plugins...`);
        loadPlugins();
      }
    });
  }
  
  // Watch lib/API folder
  const apiPath = path.join(__dirname, 'lib', 'API');
  if (fs.existsSync(apiPath)) {
    fs.watch(apiPath, (eventType, filename) => {
      if (filename && filename.endsWith('.js')) {
        console.log(`🔄 API module ${filename} changed, reloading API...`);
        loadAPI();
      }
    });
  }
};

// Load commands from commands directory
const loadCommands = () => {
  global.commands = new Map();
  const commandsPath = path.join(__dirname, 'commands');
  
  try {
    if (!fs.existsSync(commandsPath)) {
      fs.mkdirSync(commandsPath);
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    console.log(`🔄 Loading ${commandFiles.length} commands...`);
    
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      
      // Clear cache to ensure we get fresh commands
      delete require.cache[require.resolve(filePath)];
      
      const command = require(filePath);
      const commandName = file.split('.')[0]; // Remove .js extension
      
      if (command.execute) {
        global.commands.set(commandName, command);
        console.log(`✅ Loaded command: ${commandName}`);
      } else {
        console.warn(`⚠️ Command ${commandName} is missing execute method`);
      }
    }
  } catch (error) {
    console.error('❌ Error loading commands:', error.message);
  }
};

// Load plugins from plugins directory
const loadPlugins = () => {
  plugins = [];
  const pluginsPath = path.join(__dirname, 'plugins');
  
  try {
    if (!fs.existsSync(pluginsPath)) {
      fs.mkdirSync(pluginsPath);
    }

    const pluginFiles = fs.readdirSync(pluginsPath).filter(file => file.endsWith('.js'));
    console.log(`🔄 Loading ${pluginFiles.length} plugins...`);
    
    for (const file of pluginFiles) {
      const filePath = path.join(pluginsPath, file);
      
      // Clear cache to ensure we get fresh plugins
      delete require.cache[require.resolve(filePath)];
      
      const plugin = require(filePath);
      const pluginName = file.split('.')[0]; // Remove .js extension
      
      plugins.push({
        name: pluginName,
        module: plugin
      });
      
      console.log(`✅ Loaded plugin: ${pluginName}`);
    }
  } catch (error) {
    console.error('❌ Error loading plugins:', error.message);
  }
};

// Process update through all plugins
const processPlugins = async (update) => {
  for (const plugin of plugins) {
    try {
      // Check for any processing method in the plugin
      const processingMethods = [
        'process',         // Generic processor
        'processUpdate',   // Update processor
        'processMessage',  // Message processor
        'processForward',  // Forward processor
        'processCommand',  // Command processor
        'processCallback', // Callback query processor
        'processInline'    // Inline query processor
      ];
      
      for (const method of processingMethods) {
        if (typeof plugin.module[method] === 'function') {
          const result = await plugin.module[method](update);
          // If a plugin processed the update successfully, stop processing
          if (result === true) {
            return;
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error processing plugin ${plugin.name}:`, error.message);
    }
  }
};

// Function to handle incoming update from Telegram
const handleUpdate = async (updateData) => {
  try {
    // Create Update object from raw data using the API module
    const update = API.update ? API.update.createUpdate(updateData) : updateData;
    
    // Record user interaction in database
    global.DB.databaseMiddleware(update);
    
    // Print update information to terminal if debug is enabled
    if (global.debug) {
      const printModule = require('./lib/print');
      printModule.printUpdateSummary(update);
      
      // Print all fields if verbose debug is enabled
      if (global.verboseDebug) {
        printModule.printAllFields(update);
      }
    }
    
    // Process update through plugins
    await processPlugins(update);
    
    // Handle callback_query
    if (update.callback_query) {
      // Skip callback handling if it was already processed by a plugin
      return;
    }
    
    // Handle commands (messages starting with /)
    if (update.message && update.message.text && update.message.text.startsWith('/')) {
      const text = update.message.text;
      let commandWithArgs = text.slice(1); // Remove the leading slash
      let commandName = '';
      let args = [];
      
      // Check if command contains bot username (like /start@vynix0bot)
      if (commandWithArgs.includes('@')) {
        const parts = commandWithArgs.split('@', 2);
        commandName = parts[0].toLowerCase();
        
        // Only use this command if the mentioned bot username matches our bot
        const mentionedBotUsername = parts[1].split(' ')[0]; // Extract username before any arguments
        const ourBotUsername = global.botInfo?.username;
        
        if (ourBotUsername && mentionedBotUsername.toLowerCase() !== ourBotUsername.toLowerCase()) {
          // This command is for another bot, ignore it
          return;
        }
        
        // Get arguments after the @username part
        if (commandWithArgs.includes(' ')) {
          args = commandWithArgs.substring(commandWithArgs.indexOf(' ') + 1).split(' ');
        }
      } else {
        // Regular command without bot username
        args = commandWithArgs.split(' ');
        commandName = args.shift().toLowerCase();
      }
      
      const message = update.message;
      
      if (global.commands.has(commandName)) {
        const command = global.commands.get(commandName);
        
        // Check permissions before executing command
        let canExecute = true;
        
        // Get user data
        const userId = message.from.id;
        const chatId = message.chat.id;
        const chatType = message.chat.type;
        const user = global.DB.getUser(userId);
        const isOwner = global.owner.includes(userId.toString());
        const isAdmin = message.chat.type !== 'private' && (
          message.from.status === 'creator' || 
          message.from.status === 'administrator' || 
          (global.adminIds && global.adminIds.includes(userId))
        );
        const isPremium = user && user.is_premium === true;
        
        // Check mode restrictions
        if (command.owner && !isOwner) {
          await global.sendMessage(chatId, global.permissionMessages.owner, { parse_mode: 'Markdown' });
          canExecute = false;
        } else if (command.group && chatType === 'private') {
          await global.sendMessage(chatId, global.permissionMessages.group, { parse_mode: 'Markdown' });
          canExecute = false;
        } else if (command.private && chatType !== 'private') {
          await global.sendMessage(chatId, global.permissionMessages.private, { parse_mode: 'Markdown' });
          canExecute = false;
        } else if (command.admin && !isAdmin) {
          await global.sendMessage(chatId, global.permissionMessages.admin, { parse_mode: 'Markdown' });
          canExecute = false;
        } else if (command.restrict) {
          await global.sendMessage(chatId, global.permissionMessages.restrict, { parse_mode: 'Markdown' });
          canExecute = false;
        } else if (command.premium && !isPremium) {
          await global.sendMessage(chatId, global.permissionMessages.premium, { parse_mode: 'Markdown' });
          canExecute = false;
        }
        
        // Execute command if all checks pass
        if (canExecute) {
          await command.execute(message, args);
        }
      } else {
        console.log(`⚠️ Unknown command: ${commandName}`);
        
        // Send unknown command message if in a group and mentions our bot
        if (message.chat.type !== 'private' && text.includes('@')) {
          await global.sendMessage(
            message.chat.id,
            `⚠️ Unknown command: ${commandName}`,
            { reply_to_message_id: message.message_id }
          );
        }
      }
    } else {
      // Handle other update types
      const updateType = update.getUpdateType ? update.getUpdateType() : 
        (update.message ? 'message' : 
          update.callback_query ? 'callback_query' : 'unknown');
      
      if (updateType !== 'unknown') {
        console.log(`📨 Received ${updateType} update`);
        
        // Additional handling for specific update types could be added here
        
      } else {
        console.warn('⚠️ Unknown update type received');
      }
    }
  } catch (error) {
    console.error('❌ Error handling update:', error.message);
  }
};

// Export handlers
module.exports = {
  initHandlers,
  handleUpdate,
  reloadCommands: loadCommands,
  reloadPlugins: loadPlugins,
  reloadAPI: loadAPI,
  API
}; 