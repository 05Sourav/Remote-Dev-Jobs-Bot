# 🤖 Remote Dev Jobs Telegram Bot

An automated Telegram bot that posts remote developer jobs and internships to your channel. Fetches from **5 job sources** with smart filtering for entry-level and globally accessible roles.

## ✨ Features

- ✅ **5 Job Sources** - Remotive, Arbeitnow, RemoteOK, WeWorkRemotely, Unstop
- ✅ **Smart Filtering** - Prioritizes entry-level roles, filters out senior positions
- ✅ **Global Focus** - Excludes location-restricted and non-English jobs
- ✅ **Duplicate Prevention** - Never posts the same job twice
- ✅ **Priority Scoring** - Ranks jobs by relevance (internships, junior roles get priority)
- ✅ **Scheduled Posting** - Automated posting every 3 hours
- ✅ **Admin Commands** - Manual posting and bot management

## 📋 Prerequisites

- Node.js 18+
- Telegram account
- 5 minutes for setup

## 🚀 Quick Setup

### 1. Create Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) → `/newbot`
2. Save the bot token: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### 2. Create Telegram Channel

1. Create a new channel
2. Add your bot as administrator
3. Note channel username: `@yourchannelname`

### 3. Get Admin User ID

1. Message [@userinfobot](https://t.me/userinfobot) → `/start`
2. Save your user ID: `123456789`

### 4. Install & Configure

```bash
cd remote-dev-jobs-bot
npm install

# Create .env file
cp .env.example .env
```

Edit `.env`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHANNEL_ID=@yourchannelname
ADMIN_TELEGRAM_ID=your_user_id_here
POSTS_PER_BATCH=5
CRON_SCHEDULE=0 */3 * * *
```

### 5. Run

```bash
npm start
```

## 🎮 Admin Commands

- `/stats` - Bot statistics
- `/fetch` - Manually fetch jobs now
- `/clear` - Clear job history
- `/help` - Show commands

**Manual posting:**
```
/post
Job Title
Company Name
Full-time
https://apply-link.com
```

## 📊 How It Works

**Every 3 hours:**
1. Fetch from 5 job sources
2. Filter for developer/tech roles
3. Calculate priority scores (entry-level roles ranked higher)
4. Remove duplicates & location-restricted jobs
5. Post top 5 jobs to channel

### Job Sources

- **Remotive** - Remote job board API
- **Arbeitnow** - European remote jobs
- **RemoteOK** - Popular remote job aggregator
- **WeWorkRemotely** - Programming jobs RSS
- **Unstop** - Indian internships & jobs

## 🌐 Deployment

### Free Hosting (Render/Railway)

1. Push code to GitHub
2. Connect to [Render.com](https://render.com) or [Railway.app](https://railway.app)
3. Add environment variables
4. Deploy!

### Local/VPS with PM2

```bash
npm install -g pm2
pm2 start bot.js --name remote-jobs-bot
pm2 save
pm2 startup
```

## � Customization

**Change posting frequency** (`.env`):
```env
CRON_SCHEDULE=0 */2 * * *  # Every 2 hours
CRON_SCHEDULE=0 9,18 * * *  # Twice daily
```

**Adjust jobs per batch** (`.env`):
```env
POSTS_PER_BATCH=10
```

**Customize keywords** (`bot.js`):
- Edit `JOB_KEYWORDS` array for inclusion filters
- Edit `EXCLUDE_KEYWORDS` array for exclusion filters
- Edit `PRIORITY_KEYWORDS` for entry-level role prioritization

## 📁 Project Structure

```
remote-dev-jobs-bot/
├── bot.js                 # Main bot logic
├── package.json           # Dependencies
├── .env                   # Configuration (create from .env.example)
├── posted_jobs.json       # Auto-generated job history
├── documentation/         # Detailed guides
└── README.md
```

## 🐛 Troubleshooting

**Bot doesn't post:**
- Verify bot has admin rights in channel
- Check channel ID is correct
- Review logs for errors

**"Unauthorized" error:**
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Ensure bot is added to channel as admin

**Get numeric channel ID:**
1. Forward a message from your channel to [@userinfobot](https://t.me/userinfobot)
2. Use the channel ID (like `-1001234567890`) in `.env`

##  License

MIT License - Free to use and modify!

---

**Good luck with your remote jobs bot! 🚀**
