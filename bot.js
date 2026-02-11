// Load environment variables from .env file
require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const axios = require('axios');
const Parser = require('rss-parser');
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const GREENHOUSE_COMPANIES = require('./greenhouseCompanies');
const LEVER_COMPANIES = require('./leverCompanies');

// Configuration
const config = {
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  channelId: process.env.TELEGRAM_CHANNEL_ID,
  adminId: process.env.ADMIN_TELEGRAM_ID,
  postsPerBatch: parseInt(process.env.POSTS_PER_BATCH || '5'),
  cronSchedule: process.env.CRON_SCHEDULE || '0 */3 * * *', // Every 3 hours by default
  port: parseInt(process.env.PORT || '3000'), // For Render health checks
};

// Strong technical keywords - REQUIRED for job acceptance
const TECHNICAL_KEYWORDS = [
  // Core roles (must have one of these)
  'developer', 'engineer', 'programmer', 'coder', 'software',

  // Specializations
  'frontend', 'backend', 'full stack', 'fullstack', 'full-stack',
  'mobile', 'android', 'ios', 'web developer', 'embedded', 'firmware',

  // SDE variations
  'sde', 'sde1', 'sde2', 'sde3', 'sde-1', 'sde-2', 'sde-3', 'sde 1', 'sde 2',

  // Specific engineering roles
  'devops', 'devsecops', 'sre', 'site reliability',
  'data engineer', 'ml engineer', 'machine learning engineer', 'ai engineer',
  'cloud engineer', 'platform engineer', 'systems engineer',
  'infrastructure engineer', 'security engineer',
  'blockchain developer', 'web3 developer',

  // QA/Testing (technical)
  'qa engineer', 'qa automation', 'test engineer', 'sdet',
  'automation engineer', 'test automation',

  // Explicit technical terms
  'software development', 'software engineering', 'application developer',
  'app developer', 'game developer',

  // Languages & Frameworks (Accepted as technical keywords)
  'react', 'angular', 'vue', 'node', 'nodejs', 'express',
  'python', 'django', 'flask', 'java', 'spring', 'kotlin',
  'javascript', 'typescript', 'c++', 'golang', 'rust', 'ruby', 'rails',
  'php', 'laravel', 'dotnet', '.net', 'c#', 'swift', 'flutter',

  // Technologies (Accepted as technical keywords)
  'api', 'rest', 'graphql', 'microservices', 'kubernetes', 'docker',
  'aws', 'azure', 'gcp', 'cloud', 'serverless',
  'database', 'sql', 'nosql', 'mongodb', 'postgresql', 'redis',
  'blockchain', 'smart contract', 'solidity', 'web3'
];

// Stricter keywords for Greenhouse to ensure high quality
const GREENHOUSE_KEYWORDS = [
  'software', 'engineer', 'developer', 'backend', 'frontend', 'full stack', 'fullstack',
  'platform', 'infrastructure', 'systems', 'mobile', 'android', 'ios', 'machine learning', 'ai engineer'
];

// Exclude non-technical roles
const EXCLUDE_KEYWORDS = [
  // Content & Marketing
  'writer', 'content writer', 'content creator', 'copywriter', 'editor',
  'marketing', 'seo', 'sem', 'social media', 'brand manager',
  'influencer', 'blogger', 'journalist',
  'marketing intern', 'marketing internship',
  'content creation', 'digital marketing', 'social media manager',

  // Sales & Business
  'sales', 'account executive', 'business development', 'sales representative',
  'account manager', 'relationship manager',
  'business development intern', 'sales intern',

  // Design (non-engineering)
  'graphic designer', 'ui/ux designer', 'ux designer', 'ui designer',
  'visual designer', 'illustrator', 'animator', 'video editor',
  'product designer',

  // Management (non-technical)
  'product manager', 'project manager', 'program manager', 'portfolio manager',
  'operations manager', 'general manager', 'office manager',
  'scrum master', 'agile coach', 'delivery manager',

  // Support & Admin
  'customer support', 'customer service', 'customer success',
  'technical support', 'help desk', 'support specialist',
  'data entry', 'administrative', 'receptionist', 'assistant',

  // HR & Recruiting
  'recruiter', 'talent acquisition', 'hr', 'human resources',
  'hr manager', 'people operations', 'talent partner',
  'hr intern', 'hr internship',

  // Finance & Legal
  'accountant', 'bookkeeper', 'financial analyst', 'finance',
  'controller', 'treasurer', 'auditor', 'audit', 'compliance',
  'legal', 'lawyer', 'attorney', 'paralegal',
  'investment analyst', 'investment', 'equity analyst', 'portfolio',
  'wealth management', 'asset management', 'trading', 'trader',

  // Analysis (non-technical)
  'business analyst', 'data analyst', 'market research',
  'strategy analyst', 'consultant', 'advisor', 'consulting',

  // Data annotation/labeling
  'rater', 'annotator', 'labeler', 'data labeling', 'data annotation',
  'moderator', 'reviewer', 'evaluator',

  // Campus & Events (NEW - high priority exclusions)
  'ambassador', 'campus ambassador', 'student ambassador', 'brand ambassador',
  'career fair', 'job fair', 'hiring event', 'recruitment event',
  'event', 'competition', 'hackathon organizer', 'campus representative',
  'fellowship', 'campus program', 'student program',

  // Other
  'community manager', 'event coordinator', 'trainer', 'instructor',
  'teacher', 'tutor', 'coach'
];

// Priority keywords for entry-level roles
const PRIORITY_KEYWORDS = [
  'internship',
  'intern',
  'junior',
  'trainee',
  'entry level',
  'entry-level',
  'graduate',
  'fresher',
  'new grad',
  'sde1',
  'sde-1',
  'sde 1',
  'associate',
  'early career',
  '0-1 years',
  '0-2 years',
  'campus'
];

// Location-restricted keywords to exclude
// Allowed locations (India-based)
const INDIA_LOCATIONS = [
  'india', 'bangalore', 'bengaluru', 'delhi', 'new delhi', 'noida',
  'gurgaon', 'gurugram', 'mumbai', 'pune', 'hyderabad', 'chennai',
  'kolkata', 'ahmedabad', 'chandigarh', 'indore', 'jaipur', 'kochi',
  'trivandrum', 'thiruvananthapuram', 'coimbatore'
];

// Location-restricted keywords to exclude (Still useful for scoring penalties)
const LOCATION_RESTRICTED_KEYWORDS = [
  // Germany-specific
  'germany', 'berlin', 'munich', 'frankfurt', 'hamburg', 'cologne',
  'deutschsprachig', 'deutsch', 'german language',

  // EU-specific
  'europe only', 'eu only', 'european union', 'eu citizens',
  'eu member states', 'schengen',

  // Other location restrictions
  'us only', 'usa only', 'uk only', 'must be located',
  'must be based', 'visa sponsorship required', 'work permit required',
  'must reside', 'local candidates only'
];

// Language-specific patterns and keywords (non-English job markers)
const LANGUAGE_PATTERNS = [
  // German patterns
  '(m/w/d)', '(w/m/d)', '(m/f/d)', '(gn)', '(m/w/x)',

  // French patterns and keywords
  'développeur', 'développeuse', 'ingénieur', 'ingénieure',
  'français requis', 'maîtrise du français', 'parlant français',

  // Spanish patterns and keywords
  'desarrollador', 'desarrolladora', 'ingeniero', 'ingeniera',
  'español requerido', 'dominio del español', 'hablante de español',

  // Portuguese patterns and keywords
  'desenvolvedor', 'desenvolvedora', 'engenheiro', 'engenheira',
  'português obrigatório', 'fluente em português',

  // Italian patterns and keywords
  'sviluppatore', 'sviluppatrice', 'ingegnere',
  'italiano richiesto', 'madrelingua italiana',

  // Dutch patterns and keywords
  'ontwikkelaar', 'nederlandstalig', 'nederlands vereist',

  // Polish patterns and keywords
  'programista', 'inżynier', 'język polski wymagany',

  // General non-English indicators
  'native speaker required', 'mother tongue', 'madrelingua',
  'langue maternelle', 'lengua materna'
];

// Global remote indicators for priority boost
const GLOBAL_REMOTE_KEYWORDS = [
  'worldwide', 'anywhere', 'global', 'remote-first',
  'location independent', 'work from anywhere', 'any timezone',
  'international', 'globally distributed'
];


// Top Tier Companies (+10 Bonus)
const TOP_TIER_COMPANIES = [
  'stripe', 'airbnb', 'coinbase', 'figma', 'datadog', 'dropbox',
  'plaid', 'lyft', 'asana', 'grammarly', 'brex', 'scaleai',
  'webflow', 'cred'
];

// Mid Tier Companies (+5 Bonus)
const GOOD_COMPANIES = [
  'carta', 'gusto', 'calendly', 'coursera', 'hackerrank',
  'zoox', 'shieldai', 'rackspace', 'ciandt', 'houzz'
];

// Initialize bot (polling disabled for production - cron-based bot doesn't need it)
const bot = new TelegramBot(config.botToken, { polling: false });

// Storage for posted jobs (to prevent duplicates)
const STORAGE_FILE = path.join(__dirname, 'posted_jobs.json');
let postedJobs = new Set();

// Load posted jobs from file
async function loadPostedJobs() {
  try {
    const data = await fs.readFile(STORAGE_FILE, 'utf8');
    postedJobs = new Set(JSON.parse(data));
    console.log(`Loaded ${postedJobs.size} posted job IDs`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No previous job history found, starting fresh');
      postedJobs = new Set();
    } else {
      console.error('Error loading posted jobs:', error);
    }
  }
}

// Save posted jobs to file
async function savePostedJobs() {
  try {
    await fs.writeFile(STORAGE_FILE, JSON.stringify([...postedJobs]), 'utf8');
    console.log(`Saved ${postedJobs.size} posted job IDs`);
  } catch (error) {
    console.error('Error saving posted jobs:', error);
  }
}

// Fetch jobs from Remotive API
async function fetchRemotiveJobs() {
  try {
    // Use category filtering at API level for software development jobs only
    const response = await axios.get('https://remotive.com/api/remote-jobs', {
      params: {
        limit: 50,
        category: 'software-dev' // API-level filtering for software development
      },
      timeout: 10000
    });

    return response.data.jobs.map(job => ({
      id: `remotive_${job.id}`,
      title: job.title,
      company: job.company_name,
      location: 'Remote',
      type: job.job_type || 'Full-time',
      salary: job.salary || null,
      url: job.url,
      description: job.description,
      publishedAt: job.publication_date,
      source: 'Remotive'
    }));
  } catch (error) {
    console.error('Error fetching Remotive jobs:', error.message);
    return [];
  }
}



// Fetch jobs from We Work Remotely RSS
async function fetchWeWorkRemotelyJobs() {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL('https://weworkremotely.com/categories/remote-programming-jobs.rss');

    return feed.items.map(item => {
      // Extract company from title (format: "Company: Job Title")
      const titleParts = item.title.split(':');
      const company = titleParts.length > 1 ? titleParts[0].trim() : 'Unknown';
      const title = titleParts.length > 1 ? titleParts.slice(1).join(':').trim() : item.title;

      return {
        id: `weworkremotely_${item.guid}`,
        title,
        company,
        location: 'Remote',
        type: 'Full-time',
        salary: null,
        url: item.link,
        description: item.contentSnippet || item.content || '',
        publishedAt: item.pubDate,
        source: 'WeWorkRemotely'
      };
    });
  } catch (error) {
    console.error('Error fetching WeWorkRemotely jobs:', error.message);
    return [];
  }
}

// Fetch jobs from Unstop API
async function fetchUnstopJobs() {
  try {
    console.log('🔍 Fetching jobs and internships from Unstop...');

    // Fetch both jobs and internships in parallel
    const [jobsResponse, internshipsResponse] = await Promise.all([
      // Fetch jobs
      axios.get('https://unstop.com/api/public/opportunity/search-result', {
        params: {
          opportunity: 'jobs',
          page: 1,
          per_page: 50,
          sortBy: '',
          orderBy: '',
          filter_condition: ''
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://unstop.com/jobs'
        },
        timeout: 10000
      }),
      // Fetch internships
      axios.get('https://unstop.com/api/public/opportunity/search-result', {
        params: {
          opportunity: 'internships',
          page: 1,
          per_page: 50,
          sortBy: '',
          orderBy: '',
          filter_condition: ''
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://unstop.com/internships'
        },
        timeout: 10000
      })
    ]);

    const jobs = jobsResponse.data?.data?.data || [];
    const internships = internshipsResponse.data?.data?.data || [];
    const allOpportunities = [...jobs, ...internships];

    console.log(`✅ Fetched ${jobs.length} jobs and ${internships.length} internships from Unstop (${allOpportunities.length} total)`);

    // Allowed technical domains for Unstop (REMOVED: API doesn't return domain field reliably)
    // We will rely on the main filterJobs() function which uses rigorous keyword matching on title/description.

    // Removed duplicate log

    // Transform to standard format
    return allOpportunities.map(job => {
      // Extract location from locations array
      const locations = job.locations || [];
      const locationStr = locations.map(loc => loc.city).filter(Boolean).join(', ') || 'Remote';

      // Determine job type
      let jobType = 'Full-time';
      if (job.type === 'internships' || job.subtype === 'internship') {
        jobType = 'Internship';
      } else if (job.jobDetail?.timing) {
        const timing = job.jobDetail.timing;
        if (timing === 'full_time') jobType = 'Full-time';
        else if (timing === 'part_time') jobType = 'Part-time';
        else if (timing === 'contract') jobType = 'Contract';
      }

      // Extract salary if available
      let salary = null;
      if (job.jobDetail?.show_salary && job.jobDetail?.min_salary) {
        const min = job.jobDetail.min_salary;
        const max = job.jobDetail.max_salary;
        const currency = job.jobDetail.currency === 'fa-rupee' ? '₹' : '$';
        const payIn = job.jobDetail.pay_in || 'monthly';

        if (max && max !== min) {
          salary = `${currency}${min}-${max}/${payIn}`;
        } else {
          salary = `${currency}${min}/${payIn}`;
        }
      }

      // Strip HTML from description
      const description = job.details ? job.details.replace(/<[^>]*>/g, '').substring(0, 500) : job.title;

      return {
        id: `unstop_${job.id}`,
        title: job.title,
        company: job.organisation?.name || 'Unknown Company',
        location: locationStr,
        type: jobType,
        salary: salary,
        url: `https://unstop.com/${job.public_url}`,
        description: description,
        publishedAt: job.updated_at || new Date().toISOString(),
        source: 'Unstop'
      };
    });
  } catch (error) {
    console.error('Error fetching Unstop jobs:', error.message);
    return [];
  }
}

// Fetch jobs from Greenhouse boards
async function fetchGreenhouseJobs() {
  console.log('🌱 Fetching Greenhouse jobs...');
  const allJobs = [];

  for (const company of GREENHOUSE_COMPANIES) {
    try {
      const response = await axios.get(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs`);
      const jobs = response.data.jobs || [];
      const totalRaw = jobs.length;

      // 1. Sort by updated_at (Newest first)
      jobs.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

      // 2. Filter by Date (Max 30 days old)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentJobs = jobs.filter(job => new Date(job.updated_at) >= thirtyDaysAgo);
      const recentCount = recentJobs.length;

      // 3. Limit per company (Max 60 jobs)
      const limitedJobs = recentJobs.slice(0, 60);

      // Filter and map jobs
      const relevantJobs = limitedJobs.filter(job => {
        const title = job.title.toLowerCase();
        // Check for STRICT technical keywords
        return GREENHOUSE_KEYWORDS.some(keyword => title.includes(keyword));
      }).map(job => ({
        id: `gh_${company}_${job.id}`,
        title: job.title,
        company: company.charAt(0).toUpperCase() + company.slice(1), // Capitalize
        location: job.location?.name || 'Remote',
        type: 'Full-time', // Greenhouse API doesn't always provide type list efficiently here
        salary: null, // Public API often excludes salary
        url: job.absolute_url,
        description: `${job.title} | Location: ${job.location?.name || 'Remote'} | Source: ${company}`, // Enriched description
        publishedAt: job.updated_at || new Date().toISOString(),
        source: 'Greenhouse'
      }));

      console.log(`  - [Greenhouse] ${company}: fetched ${totalRaw} -> recent ${recentCount} -> relevant ${relevantJobs.length}`);
      allJobs.push(...relevantJobs);
    } catch (error) {
      // Log error but continue to next company
      console.error(`  - [Greenhouse] Error fetching ${company}:`, error.message);
    }
  }

  return allJobs;
}

// Fetch jobs from Lever boards
async function fetchLeverJobs() {
  console.log('🚀 Fetching Lever jobs...');
  const allJobs = [];

  for (const company of LEVER_COMPANIES) {
    try {
      const response = await axios.get(`https://api.lever.co/v0/postings/${company}?mode=json`);
      const jobs = response.data || [];
      const totalRaw = jobs.length;

      // 1. Sort by createdAt (Newest first)
      jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // 2. Filter by Date (Max 30 days old)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentJobs = jobs.filter(job => new Date(job.createdAt) >= thirtyDaysAgo);
      const recentCount = recentJobs.length;

      // 3. Limit per company (Max 60 jobs)
      const limitedJobs = recentJobs.slice(0, 60);

      // Filter and map jobs
      const relevantJobs = limitedJobs.filter(job => {
        const title = job.text.toLowerCase();
        // Check for STRICT technical keywords (reuse Greenhouse list)
        return GREENHOUSE_KEYWORDS.some(keyword => title.includes(keyword));
      }).map(job => ({
        id: `lever_${company}_${job.id}`,
        title: job.text.replace(/^\[Job-[^\]]+\]\s*/i, '').trim(),
        company: company.charAt(0).toUpperCase() + company.slice(1), // Capitalize
        location: job.categories?.location || job.country || 'Remote',
        type: job.categories?.commitment || 'Full-time',
        salary: null, // Lever API rarely exposes salary in public list
        url: job.hostedUrl,
        description: `${job.text} | Location: ${job.categories?.location || 'Remote'} | Source: ${company}`,
        publishedAt: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
        source: 'Lever'
      }));

      console.log(`  - [Lever] ${company}: fetched ${totalRaw} -> recent ${recentCount} -> relevant ${relevantJobs.length}`);
      allJobs.push(...relevantJobs);
    } catch (error) {
      console.error(`  - [Lever] Error fetching ${company}:`, error.message);
    }
  }

  return allJobs;
}

// Calculate job priority score
function calculateJobPriority(job) {
  const titleLower = job.title.toLowerCase();
  const descLower = (job.description || '').toLowerCase();
  const combinedText = `${titleLower} ${descLower}`;
  let score = 50; // Base score

  // Check for priority keywords (entry-level indicators) - SMALL BOOST (Reduced to 15)
  const hasPriorityKeyword = PRIORITY_KEYWORDS.some(keyword => combinedText.includes(keyword));
  // Strict internship check (avoid 'junior engineer' being marked as intern)
  const isInternship = titleLower.includes('intern') || titleLower.includes('internship');

  if (isInternship) {
    score += 15;
  }

  // Bonus for Full-Time roles (Non-Internship)
  if (!isInternship) {
    score += 10;
  }

  // Check for global remote keywords - ADDITIONAL BOOST
  const hasGlobalRemote = GLOBAL_REMOTE_KEYWORDS.some(keyword => combinedText.includes(keyword));
  if (hasGlobalRemote || job.location.toLowerCase().includes('remote')) {
    score += 10;
  }

  // Penalize senior/lead positions heavily
  const seniorityPenaltyKeywords = [
    'senior', 'sr.', 'lead', 'principal', 'staff', 'architect',
    'director', 'head of', 'vp', 'vice president', 'chief',
    'expert', '5+ years', '5 years', '6+ years', '7+ years', '8+ years',
    'experienced', 'seasoned'
  ];

  for (const keyword of seniorityPenaltyKeywords) {
    if (combinedText.includes(keyword)) {
      score -= 40;
      break; // Apply penalty once
    }
  }

  // Penalize location-restricted jobs
  const hasLocationRestriction = LOCATION_RESTRICTED_KEYWORDS.some(keyword =>
    combinedText.includes(keyword)
  );
  if (hasLocationRestriction) {
    score -= 30;
  }

  // Penalize non-English job postings
  const hasLanguageRestriction = LANGUAGE_PATTERNS.some(pattern =>
    combinedText.includes(pattern.toLowerCase())
  );
  if (hasLanguageRestriction) {
    score -= 35;
  }

  // Bonus for popular tech stacks
  const techStackBonus = [
    'react', 'node', 'python', 'javascript', 'typescript',
    'aws', 'docker', 'kubernetes',
    // Backend & Frameworks
    'java', 'spring', 'spring boot', 'golang', 'fastapi', 'express', 'nestjs', 'dotnet', 'c#',
    // Frontend
    'nextjs', 'next.js', 'angular', 'vue',
    // Databases
    'postgresql', 'mysql', 'redis',
    // Architecture & APIs
    'graphql', 'microservices', 'rest api',
    // Mobile
    'flutter', 'kotlin', 'swift', 'react native'
  ];

  const techMatches = techStackBonus.filter(tech => combinedText.includes(tech)).length;
  score += Math.min(techMatches * 7, 25); // Cap bonus at 25 points

  // Company Tiers Bonus
  const companyLower = job.company.toLowerCase();

  if (TOP_TIER_COMPANIES.some(c => companyLower.includes(c))) {
    score += 10; // Top Tier Bonus
  } else if (GOOD_COMPANIES.some(c => companyLower.includes(c))) {
    score += 5;  // Mid Tier Bonus
  }

  return Math.max(0, score); // Ensure score doesn't go negative
}

// Filter jobs based on keywords
function filterJobs(jobs) {
  return jobs.filter(job => {
    const titleLower = job.title.toLowerCase();
    const descLower = (job.description || '').toLowerCase();
    const companyLower = (job.company || '').toLowerCase();
    const combinedText = `${titleLower} ${descLower} ${companyLower}`;

    // Skip if already posted (check both ID and composite key)
    const compositeKey = `${job.id}|${job.url}`;
    if (postedJobs.has(job.id) || postedJobs.has(compositeKey)) {
      return false;
    }

    // Check for exclude keywords first (check Title + Description + Company)
    const hasExcludeKeyword = EXCLUDE_KEYWORDS.some(keyword =>
      combinedText.includes(keyword.toLowerCase())
    );
    if (hasExcludeKeyword) {
      return false;
    }

    // Must match at least one STRONG technical keyword in the TITLE
    // We restrict this to TITLE ONLY to avoid false positives where a "Content Intern" 
    // description mentions "working with software team".
    const hasTechnicalKeyword = TECHNICAL_KEYWORDS.some(keyword =>
      titleLower.includes(keyword.toLowerCase())
    );

    // STRICT LOCATION FILTER: Must be Remote OR in India
    const locationLower = job.location.toLowerCase();
    const isRemote = locationLower.includes('remote') || locationLower.includes('anywhere');
    const isIndia = INDIA_LOCATIONS.some(loc => locationLower.includes(loc));

    if (!isRemote && !isIndia) {
      // console.log(`Skipping non-India/non-Remote job: ${job.title} at ${job.company} (${job.location})`);
      return false;
    }

    return hasTechnicalKeyword;
  });
}

// Format job message for Telegram
function formatJobMessage(job, priority = 0) {
  const emoji = getJobEmoji(job);
  const hotBadge = priority >= 50 ? '🔥 HOT ' : '';
  const salaryText = job.salary ? job.salary.trim() : 'Not disclosed';

  // Generate hashtags
  const hashtags = generateHashtags(job);

  return `${hotBadge}${emoji} <b>${job.title}</b>

🏢 <b>Company:</b> ${job.company}
📍 <b>Location:</b> ${job.location}
💼 <b>Type:</b> ${job.type}
💰 <b>Salary:</b> ${salaryText}

🔗 <a href="${job.url}">Apply Here</a>

<i>Via ${job.source}</i>

📢 Share this with a friend who’s job hunting

${hashtags}`;
}

// Generate hashtags based on job details
function generateHashtags(job) {
  const tags = ['#RemoteJobs', '#DeveloperJobs'];
  const searchText = `${job.title} ${job.description || ''} `.toLowerCase();

  // Job level tags
  if (searchText.includes('intern')) {
    tags.push('#Internships', '#EntryLevel');
  } else if (searchText.includes('junior') || searchText.includes('trainee') || searchText.includes('entry')) {
    tags.push('#JuniorDev', '#CareerStart');
  } else if (searchText.includes('senior') || searchText.includes('lead')) {
    tags.push('#SeniorDev', '#Experienced');
  }

  // Technology tags
  const techTags = {
    'python': '#Python',
    'javascript': '#JavaScript',
    'typescript': '#TypeScript',
    'react': '#React',
    'node': '#NodeJS',
    'java': '#Java',
    'golang': '#Golang',
    'rust': '#Rust',
    'devops': '#DevOps',
    'frontend': '#Frontend',
    'backend': '#Backend',
    'fullstack': '#FullStack',
    'full stack': '#FullStack',
    'mobile': '#Mobile',
    'android': '#Android',
    'ios': '#iOS'
  };

  for (const [keyword, tag] of Object.entries(techTags)) {
    if (searchText.includes(keyword) && !tags.includes(tag)) {
      tags.push(tag);
      if (tags.length >= 8) break; // Limit to 8 tags total
    }
  }

  return tags.join(' ');
}

// Get appropriate emoji based on job type/title
function getJobEmoji(job) {
  const title = job.title.toLowerCase();

  if (title.includes('intern')) return '🎓';
  if (title.includes('junior') || title.includes('trainee')) return '🌱';
  if (title.includes('senior')) return '🚀';
  if (title.includes('frontend')) return '🎨';
  if (title.includes('backend')) return '⚙️';
  if (title.includes('full stack') || title.includes('fullstack')) return '🔄';
  if (title.includes('mobile')) return '📱';
  if (title.includes('devops')) return '🔧';
  return '💻';
}

// Post job to Telegram channel
async function postJobToChannel(job, priority = 0) {
  try {
    const message = formatJobMessage(job, priority);
    await bot.sendMessage(config.channelId, message, {
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });

    // Mark as posted (both ID and composite key)
    const compositeKey = `${job.id}| ${job.url} `;
    postedJobs.add(job.id);
    postedJobs.add(compositeKey);
    await savePostedJobs();

    console.log(`✅ Posted: ${job.title} at ${job.company} (Priority: ${priority})`);
    return true;
  } catch (error) {
    console.error(`❌ Error posting job ${job.id}: `, error.message);
    return false;
  }
}

// Main job fetching and posting function
async function fetchAndPostJobs() {
  console.log('\n🔍 Starting job fetch cycle...');

  try {
    // Fetch from all sources
    const [remotiveJobs, weworkremotelyJobs, unstopJobs, greenhouseJobs, leverJobs] = await Promise.all([
      fetchRemotiveJobs(),
      fetchWeWorkRemotelyJobs(),
      fetchUnstopJobs(),
      fetchGreenhouseJobs(),
      fetchLeverJobs()
    ]);

    // Combine and filter
    const allJobs = [...remotiveJobs, ...weworkremotelyJobs, ...unstopJobs, ...greenhouseJobs, ...leverJobs];
    const newJobs = filterJobs(allJobs);

    console.log(`📊 Found ${allJobs.length} total jobs, ${newJobs.length} new relevant jobs`);

    if (newJobs.length === 0) {
      console.log('No new jobs to post');
      return;
    }

    // Calculate priority for each job
    const jobsWithPriority = newJobs.map(job => ({
      ...job,
      priority: calculateJobPriority(job)
    }));

    // Filter out jobs with very low priority (typically senior roles)
    const MIN_PRIORITY_THRESHOLD = 10;
    const qualifiedJobs = jobsWithPriority.filter(job => job.priority >= MIN_PRIORITY_THRESHOLD);

    console.log(`🎯 ${qualifiedJobs.length} jobs meet priority threshold(>= ${MIN_PRIORITY_THRESHOLD})`);

    if (qualifiedJobs.length === 0) {
      console.log('No jobs meet the minimum priority threshold');
      return;
    }

    // Sort by priority (highest first), then by date (newest first)
    qualifiedJobs.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });

    // Balanced Selection Logic
    // We want a mix of Full-Time and Internships (e.g., 60% FT, 40% Intern)
    const internships = qualifiedJobs.filter(job =>
      job.title.toLowerCase().includes('intern') ||
      job.title.toLowerCase().includes('trainee')
    );
    const fullTimeJobs = qualifiedJobs.filter(job =>
      !job.title.toLowerCase().includes('intern') &&
      !job.title.toLowerCase().includes('trainee')
    );

    const targetTotal = config.postsPerBatch; // e.g., 5
    const targetFT = Math.ceil(targetTotal * 0.6); // Target 3 FT
    const targetIntern = targetTotal - targetFT;   // Target 2 Interns

    let selectedFT = fullTimeJobs.slice(0, targetFT);
    let selectedIntern = internships.slice(0, targetIntern);

    // If we don't have enough FT, fill with Interns
    if (selectedFT.length < targetFT) {
      const needed = targetFT - selectedFT.length;
      const extraInterns = internships.slice(targetIntern, targetIntern + needed);
      selectedIntern = [...selectedIntern, ...extraInterns];
    }

    // If we don't have enough Interns, fill with FT
    if (selectedIntern.length < targetIntern) {
      const needed = targetIntern - selectedIntern.length;
      const extraFT = fullTimeJobs.slice(targetFT, targetFT + needed);
      selectedFT = [...selectedFT, ...extraFT];
    }

    // Combine and re-sort by priority
    let jobsToPost = [...selectedFT, ...selectedIntern];

    // Safety check: ensure we respect the limit
    jobsToPost = jobsToPost.slice(0, config.postsPerBatch);

    // Sort final selection by priority
    jobsToPost.sort((a, b) => b.priority - a.priority);

    console.log(`📤 Posting ${jobsToPost.length} jobs(${selectedFT.length} FT, ${selectedIntern.length} Interns)...`);

    for (const job of jobsToPost) {
      await postJobToChannel(job, job.priority);
      // Add delay between posts to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('✅ Job posting cycle completed');
  } catch (error) {
    console.error('❌ Error in job fetch cycle:', error);
  }
}

// Admin command: Manual job posting
bot.onText(/\/post (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();

  // Check if user is admin
  if (userId !== config.adminId) {
    await bot.sendMessage(chatId, '❌ Unauthorized. Admin only.');
    return;
  }

  try {
    const jobData = match[1];
    const lines = jobData.split('\n').filter(l => l.trim());

    if (lines.length < 3) {
      await bot.sendMessage(chatId, '❌ Invalid format. Use:\n/post\nJob Title\nCompany Name\nJob Type\nApply URL');
      return;
    }

    const [title, company, type, url] = lines;

    const job = {
      id: `manual_${Date.now()} `,
      title,
      company,
      location: 'Remote',
      type,
      url,
      description: '',
      source: 'Manual'
    };

    await postJobToChannel(job);
    await bot.sendMessage(chatId, '✅ Job posted successfully!');
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Error: ${error.message} `);
  }
});

// Admin command: Get stats
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();

  if (userId !== config.adminId) {
    await bot.sendMessage(chatId, '❌ Unauthorized. Admin only.');
    return;
  }

  const stats = `📊 <b>Bot Statistics</b>

💼 Total jobs posted: ${postedJobs.size}
⏰ Next scheduled run: ${getNextCronTime()}
📅 Posts per batch: ${config.postsPerBatch}

✅ Bot is running`;

  await bot.sendMessage(chatId, stats, { parse_mode: 'HTML' });
});

// Admin command: Force job fetch
bot.onText(/\/fetch/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();

  if (userId !== config.adminId) {
    await bot.sendMessage(chatId, '❌ Unauthorized. Admin only.');
    return;
  }

  await bot.sendMessage(chatId, '🔍 Fetching jobs...');
  await fetchAndPostJobs();
  await bot.sendMessage(chatId, '✅ Fetch completed!');
});

// Admin command: Clear job history (use carefully!)
bot.onText(/\/clear/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();

  if (userId !== config.adminId) {
    await bot.sendMessage(chatId, '❌ Unauthorized. Admin only.');
    return;
  }

  postedJobs.clear();
  await savePostedJobs();
  await bot.sendMessage(chatId, '✅ Job history cleared!');
});

// Help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();

  if (userId !== config.adminId) {
    return;
  }

  const help = `🤖 <b>Admin Commands</b>

    / stats - View bot statistics
      / fetch - Manually fetch and post jobs
        / post - Manual job posting
  Format:
  /post
  Job Title
  Company Name
  Full - time
  https://apply-link.com

/clear - Clear job history (use carefully!)
    / help - Show this help

      < i > Bot automatically posts jobs every 3 hours</i > `;

  await bot.sendMessage(chatId, help, { parse_mode: 'HTML' });
});

// Get next cron execution time (simplified)
function getNextCronTime() {
  const now = new Date();
  const hours = Math.ceil(now.getHours() / 3) * 3;
  const next = new Date(now);
  next.setHours(hours, 0, 0, 0);
  if (next <= now) {
    next.setHours(next.getHours() + 3);
  }
  return next.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Initialize bot
async function init() {
  console.log('🤖 Remote Dev Jobs Bot Starting...');

  // Load previous job history
  await loadPostedJobs();

  // Schedule automatic job posting
  cron.schedule(config.cronSchedule, async () => {
    console.log('\n⏰ Scheduled job fetch triggered');
    await fetchAndPostJobs();
  });

  console.log(`✅ Bot started successfully!`);
  console.log(`📢 Channel ID: ${config.channelId} `);
  console.log(`👤 Admin ID: ${config.adminId} `);
  console.log(`⏰ Schedule: ${config.cronSchedule} (every 3 hours)`);
  console.log(`📊 Posts per batch: ${config.postsPerBatch} `);

  // Run initial fetch on startup
  try {
    console.log('🚀 Running initial job fetch...');
    await fetchAndPostJobs();
  } catch (error) {
    console.error('❌ Error during initial fetch:', error);
  }
}

// Health check server for Render
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is running');
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Manual trigger endpoint for job fetching
app.get('/trigger-fetch', async (req, res) => {
  try {
    console.log('🔄 Manual fetch triggered via HTTP endpoint');
    res.json({
      status: 'started',
      message: 'Job fetch cycle started. Check logs for progress.'
    });

    // Run fetch in background
    fetchAndPostJobs().catch(err => {
      console.error('Error in manual fetch:', err);
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Start bot
init().catch(console.error);

// Start health check server IMMEDIATELY to satisfy port binding requirements
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`🌐 Health check server running on port ${config.port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down bot...');
  server.close();
  await savePostedJobs();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down bot...');
  server.close();
  await savePostedJobs();
  process.exit(0);
});