# Telegram Local Bot

A Node.js Telegram bot that connects to a local Bot API server instead of the cloud API.

## Features

- Connects to a local Telegram Bot API server
- Automatically logs out from cloud API
- Webhook support for receiving updates
- Auto-reloading config without server restart
- Command system with modular structure
- Process signal handling for graceful restarts

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/telegram-local-bot.git
cd telegram-local-bot
```

2. Install dependencies:
```bash
npm install
```

3. Configure the bot:
Edit `config.js` to set your bot token, local API URL, and webhook settings.

## Usage

### Start the bot:
```bash
npm start
```

### Development mode with auto-restart:
```bash
npm run dev
```

## Configuration

Edit `config.js` to change configuration parameters:

```javascript
// Bot configuration
global.BotToken = 'YOUR_BOT_TOKEN'; // Your bot token
global.localBotApiUrl = 'http://localhost:9999'; // Local Bot API server URL
global.webhookUrl = 'https://yourdomain.com/webhook'; // Webhook URL

// Server configuration
global.port = 3000; // Port for the webhook server
```

## Adding Commands

Create new command files in the `command` directory following this pattern:

```javascript
// command/mycommand.js
module.exports = {
  name: 'mycommand',
  description: 'Description of my command',
  execute: async (message, args) => {
    // Command logic here
    await global.sendMessage(message.chat.id, 'My command response');
  }
};
```

## License

MIT 