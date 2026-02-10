# 🚀 Deploying to Render (Free Hosting)

This guide will help you deploy your Remote Dev Jobs bot to Render for free 24/7 hosting.

## Prerequisites

- GitHub account
- Render account (free)
- Your bot code in a GitHub repository

## Step-by-Step Deployment

### 1. Prepare Your Repository

Make sure your GitHub repository contains:
- `bot.js`
- `package.json`
- `.env.example` (NOT .env - never commit secrets!)
- `README.md`

### 2. Create Render Account

1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with GitHub

### 3. Create New Web Service

1. Click "New +" in the top right
2. Select "Web Service"
3. Connect your GitHub repository
4. Click "Connect" next to your bot repository

### 4. Configure Service

**Basic Settings:**
- **Name**: `remote-jobs-bot` (or your choice)
- **Region**: Choose closest to you
- **Branch**: `main` (or your default branch)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Type:**
- Select "Free" plan

### 5. Add Environment Variables

Click "Advanced" → "Add Environment Variable"

Add each of these (use your actual values):

```
TELEGRAM_BOT_TOKEN = 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHANNEL_ID = @yourchannelname
ADMIN_TELEGRAM_ID = 123456789
POSTS_PER_BATCH = 5
CRON_SCHEDULE = 0 */3 * * *
```

**Important**: Make sure there are NO quotes around the values!

### 6. Deploy

1. Click "Create Web Service"
2. Wait for deployment (2-3 minutes)
3. Check logs for success message:
   ```
   🤖 Remote Dev Jobs Bot Starting...
   ✅ Bot started successfully!
   ```

### 7. Verify It's Working

1. Go to your Telegram channel
2. Wait for the next scheduled post (max 3 hours)
3. Or message your bot with `/fetch` to test immediately

## 🔍 Monitoring Your Bot

### View Logs

1. Go to your Render dashboard
2. Click on your service
3. Click "Logs" tab
4. See real-time bot activity

### Common Log Messages

- `🔍 Starting job fetch cycle...` - Bot is fetching jobs
- `✅ Posted: [Job Title]` - Job posted successfully
- `No new jobs to post` - No new jobs found (normal)

## 🔧 Troubleshooting

### Bot shows as "Deploy failed"

**Check Build Logs:**
- Look for npm installation errors
- Verify `package.json` is correct

**Fix**: Push fixes to GitHub, Render auto-redeploys

### Bot deploys but doesn't post

**Check Environment Variables:**
- Go to "Environment" tab
- Verify all variables are set
- No quotes around values
- No trailing spaces

**Check Logs:**
- Look for error messages
- Verify bot has channel admin rights

### "Cannot find module" error

**Fix**: Add missing dependency to `package.json`:
```bash
npm install <module-name> --save
```
Commit and push changes.

## 📊 Free Tier Limits

Render free tier includes:
- ✅ 750 hours/month (enough for 24/7)
- ✅ 512 MB RAM
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ 100 GB bandwidth/month

### Preventing Sleep

The bot uses `node-cron` which keeps the process alive. Your bot won't sleep!

## 🔄 Updating Your Bot

### Method 1: Git Push (Recommended)

1. Make changes to your code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update bot features"
   git push
   ```
3. Render automatically redeploys!

### Method 2: Manual Deploy

1. Go to Render dashboard
2. Click your service
3. Click "Manual Deploy" → "Deploy latest commit"

## 📈 Scaling Up

Once you outgrow free tier:

**Starter Plan ($7/month)**:
- No sleep
- Better performance
- More RAM

**Upgrade Steps:**
1. Go to service settings
2. Click "Change Instance Type"
3. Select "Starter"

## 🔐 Security Best Practices

1. **Never commit `.env`** to GitHub
   - Already in `.gitignore`
   - Use Render's environment variables

2. **Rotate bot token if exposed**
   - Talk to @BotFather
   - Use `/token` to get new token
   - Update in Render environment

3. **Keep dependencies updated**
   ```bash
   npm update
   npm audit fix
   ```

## 💾 Persistent Storage

The bot stores job history in `posted_jobs.json`. On Render:

- ⚠️ File system is ephemeral (resets on redeploy)
- ✅ Bot handles this gracefully (rebuilds history)

**For production**: Consider upgrading to:
- Render Disk (paid add-on)
- External database (MongoDB, PostgreSQL)

## 📞 Getting Help

**Render Issues:**
- Check [Render Status](https://status.render.com)
- Visit [Render Docs](https://render.com/docs)
- Contact Render support

**Bot Issues:**
- Check logs for errors
- Review README troubleshooting
- Test locally first

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Web Service created
- [ ] All environment variables added
- [ ] Deployment successful
- [ ] Logs show "Bot started successfully"
- [ ] Bot added as admin to channel
- [ ] First jobs posted
- [ ] Admin commands working

## 🎉 You're Live!

Your bot is now running 24/7 for free!

**Next Steps:**
1. Monitor logs for first few hours
2. Test admin commands
3. Share your channel
4. Watch your audience grow!

---

**Need help?** Review the main README.md for detailed bot documentation.
