# 🤖 Remote Dev Jobs Telegram Bot

An automated Telegram bot that posts remote developer jobs and internships to your channel. Fetches from **7 job sources** (including direct ATS integration) with smart filtering for entry-level and globally accessible roles.

## ✨ Features

- ✅ **7 Job Sources** - Remotive, WeWorkRemotely, Unstop, Greenhouse, Lever, SmartRecruiters, Workday
- ✅ **Strict Filtering** - Automatically rejects senior/manager roles and roles requiring > 5 years experience
- ✅ **Location Focus** - Only posts jobs located in **India** or **True Global Remote** (Worldwide/Anywhere)
- ✅ **Smart Scoring** - Prioritizes internships and junior roles
- ✅ **Duplicate Prevention** - Tracks posted jobs to avoid spam
- ✅ **Scheduled Posting** - Automated posting every 3 hours (customizable)

## 📋 Prerequisites

- Node.js 18+
- Telegram account
- 5 minutes for setup

## 🚀 Quick Setup

### 1. Create Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) → `/newbot`
2. Save the bot token.

### 2. Create Telegram Channel

1. Create a new channel
2. Add your bot as administrator
3. Note channel username: `@yourchannelname`

### 3. Get Admin User ID

1. Message [@userinfobot](https://t.me/userinfobot) → `/start`
2. Save your user ID.

### 4. Install & Configure

```bash
git clone https://github.com/yourusername/remote-dev-jobs-bot.git
cd remote-dev-jobs-bot
npm install
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

- `/stats` - Bot statistics and next run time
- `/fetch` - Manually trigger a job fetch cycle
- `/clear` - Clear job history (use with caution)
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

1. **Fetch**: Scrapes jobs from APIs (Remotive, Unstop) and direct ATS boards (Greenhouse, Lever, SmartRecruiters, Workday).
2. **Filter**:
   - **Reject**: Senior, Staff, Principal, Manager, Director, VP roles.
   - **Reject**: Experience > 5 years.
   - **Reject**: Locations not matching "India" or "Remote" (with global keywords).
   - **Reject**: Non-technical roles (Sales, Marketing, HR, etc.).
3. **Score**: Adds points for Internships, popular tech stacks, and top-tier companies.
4. **Post**: Sends the top high-quality jobs to your Telegram channel.

## 📁 Project Structure

```
remote-dev-jobs-bot/
├── bot.js                       # Main bot logic & schedulers
├── greenhouseCompanies.js       # List of Greenhouse boards
├── leverCompanies.js            # List of Lever boards
├── smartRecruitersCompanies.js  # List of SmartRecruiters boards
├── workdayCompanies.js          # List of Workday boards
├── posted_jobs.json             # History of posted jobs
├── package.json                 # Dependencies
└── .env                         # Configuration
```

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

## 📄 License

MIT License
