# Flour Deux Lis — Pricing Calculator

## Deploy in 5 Steps

### Step 1: Create a GitHub Repository
1. Go to https://github.com/new
2. Name it `fdl-pricing`
3. Leave it as "Public" (free)
4. Click "Create repository"
5. Don't add any files — leave it empty

### Step 2: Upload the Code
1. Download the ZIP file (link from Claude)
2. On your new GitHub repo page, click "uploading an existing file"
3. Drag ALL the files from the unzipped folder into the upload area
4. Click "Commit changes"

### Step 3: Deploy to Vercel
1. Go to https://vercel.com/new
2. Click "Import" next to your `fdl-pricing` repo
3. Leave all settings as default
4. Click "Deploy"
5. It will fail — that's expected! We need the database first.

### Step 4: Add the Database
1. In your Vercel project dashboard, click the "Storage" tab
2. Click "Connect Store" → "Create New"
3. Choose "Neon Postgres" 
4. Click "Continue" and accept the free plan
5. Name it anything (like "fdl-pricing-db")
6. Click "Create"
7. It will automatically add the DATABASE_URL to your project

### Step 5: Redeploy
1. Go to the "Deployments" tab
2. Click the 3 dots on the most recent deployment
3. Click "Redeploy"
4. Wait for it to finish — your app is now live!

Your URL will be something like: `fdl-pricing.vercel.app`

## That's It!
Your data saves to a real database. Clear your browser, use your phone, use Jaycee's computer — your data is always there.
