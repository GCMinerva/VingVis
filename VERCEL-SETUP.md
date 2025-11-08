# Vercel Deployment Setup

## Required Environment Variables

To deploy this application to Vercel, you need to add the following environment variables to your Vercel project:

### Step 1: Go to Vercel Project Settings

1. Open your project in Vercel dashboard
2. Go to **Settings** → **Environment Variables**

### Step 2: Add Environment Variables

Add the following variables:

**Variable 1:**
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://csvmfltnjzdtfgdcmhjq.supabase.co`
- **Environment**: Production, Preview, Development (select all)

**Variable 2:**
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzdm1mbHRuanpkdGZnZGNtaGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1OTg4MjQsImV4cCI6MjA3ODE3NDgyNH0.aTmRZUSYp7GPsts_sL3V65dDtPh7Fq66FM5NxfdIwXk`
- **Environment**: Production, Preview, Development (select all)

**Variable 3: (REQUIRED for signup to work)**
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: Get this from your Supabase dashboard → Settings → API → service_role key (secret)
- **Environment**: Production, Preview, Development (select all)
- **⚠️ IMPORTANT**: This is a secret key. Keep it secure and never commit it to your repository!

### Step 3: Redeploy

After adding the environment variables:
1. Go to **Deployments**
2. Click the three dots on the latest deployment
3. Select **Redeploy**
4. Check "Use existing build cache" (optional)
5. Click **Redeploy**

## Database Setup

Don't forget to run the database schema in Supabase:

1. Open your Supabase project at https://supabase.com/dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `supabase-schema.sql`
4. Click **Run**

This will create the necessary tables, policies, and triggers for the application.

## Testing the Deployment

Once deployed and environment variables are set:

1. Visit your Vercel deployment URL
2. Click "Sign Up" to create an account
3. Create a new project
4. Test the visual editor
5. Export code to verify everything works

## Important Notes

- The `NEXT_PUBLIC_*` environment variables are safe to expose (they are public keys)
- The `SUPABASE_SERVICE_ROLE_KEY` is a **secret** - never expose it client-side
- The service role key is required for user signup (bypasses RLS policies)
- The anon key has Row Level Security (RLS) policies that protect your data
- Make sure you've enabled Authentication in your Supabase project
- Enable Email auth provider in Supabase Authentication settings

## Getting Your Service Role Key

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Find the **service_role** key under "Project API keys"
5. Copy this key and add it as `SUPABASE_SERVICE_ROLE_KEY` in Vercel
6. **Keep this key secret!** It has admin privileges
