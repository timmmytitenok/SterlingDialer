# Contact Form Setup Guide

## ✅ What's Done

✓ Installed Resend package
✓ Created API endpoint at `/app/api/contact/route.ts`
✓ Updated contact form to send real emails
✓ All messages will go to: **SterlingDailer@gmail.com**

## 🔑 Get Your FREE Resend API Key

### Step 1: Sign Up for Resend (FREE)
1. Go to: **https://resend.com/signup**
2. Sign up with your email (it's FREE - 100 emails/day, 3,000/month)
3. Verify your email

### Step 2: Get Your API Key
1. Log in to Resend dashboard
2. Go to **API Keys** section
3. Click **Create API Key**
4. Name it: "Sterling AI Contact Form"
5. Copy the API key (starts with `re_...`)

### Step 3: Add API Key to Your Project

**If running locally:**
1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add this line:
   ```
   RESEND_API_KEY=re_your_api_key_here
   ```
3. Restart your dev server: `npm run dev`

**If deploying (Vercel/Netlify/etc):**
1. Go to your hosting dashboard
2. Add Environment Variable:
   - Name: `RESEND_API_KEY`
   - Value: `re_your_api_key_here`
3. Redeploy your app

## 🧪 Test It

1. Go to your Contact page: `http://localhost:3000/contact`
2. Fill out the form
3. Click "Send Message"
4. Check **SterlingDailer@gmail.com** for the email!

## 📧 How It Works

When someone submits the contact form:
1. Form data is sent to `/api/contact`
2. Resend sends an email to **SterlingDailer@gmail.com**
3. The reply-to is set to the user's email
4. You can reply directly from your Gmail!

## 🎨 Email Includes:
- Name
- Email
- Phone (if provided)
- Message

## 💡 Tips

- **Free tier:** 100 emails/day, 3,000/month (plenty for contact forms!)
- **Later:** You can add your own domain in Resend for branded emails
- **Currently uses:** `onboarding@resend.dev` (works but shows Resend branding)

## 🚀 That's It!

Your contact form now sends real emails to **SterlingDailer@gmail.com**!

Just add your Resend API key and you're good to go! 🎉

