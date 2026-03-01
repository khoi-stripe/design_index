# Deployment Guide (Simple Version)

This is your pattern library for designers to capture and share UI patterns from Figma. Right now it runs on your laptop. Let's get it running on Stripe's servers so other people can use it.

## Current State
- Web app runs at `localhost:3000`
- Uses a tiny SQLite database file
- Images saved to your hard drive
- Figma plugin only works with your local setup
- No login required (anyone can access)

## What We're Building
- Web app at a real URL like `index.qa.stripe.com`
- Real database that won't disappear
- Images stored in the cloud
- Only Stripe employees can access (via Stripe SSO)
- Figma plugin works from anywhere

---

## Phase 1: Get It Running on Stripe Servers (QA)

### Step 1: Request the Infrastructure (Days 1-3)

You need to ask Stripe teams for access to their servers and services. Do these in this order:

**A. Request a Database (FIRST - this takes the longest)**
- Where: Slack channel `#reldb` or go/ask/reldb
- Say: "I need an Aurora PostgreSQL database for a QA/development project"
- They'll ask:
  - What's it for? "Pattern library for designers to catalog UI components"
  - How big? "Less than 1GB to start"
  - Environment? "QA/Development"
- You'll get: A connection URL that looks like `postgresql://username:password@some-server.amazonaws.com:5432/database_name`
- Save this somewhere safe (1Password)

**B. Request File Storage**
- Where: Slack channel `#infrastructure`
- Say: "I need an S3 bucket for storing uploaded images"
- Details:
  - Name: `stripe-design-index-patterns` (or whatever they suggest)
  - Location: `us-east-1`
  - Need: Write access credentials
- You'll get: Bucket name, Access Key ID, Secret Access Key
- Save these somewhere safe

**C. Request a QA Server**
- Where: Slack channel `#infrastructure` or `#henson`
- Say: "I need to deploy a Next.js app to QA for internal testing"
- Details:
  - What it is: "Internal pattern library web app"
  - Runtime: "Node.js, Next.js 16"
  - Preferred URL: "index.qa.stripe.com" (they might give you something different)
- They'll help set up the deployment pipeline

**D. Request Login Access (AFTER you have the QA URL)**
- Where: go/sso-client-registration or contact identity team
- Say: "I need a Stripe SSO OAuth client for internal employee authentication"
- Details:
  - Callback URL: `https://[your-qa-url]/api/auth/callback/stripe-sso`
  - Scopes: `openid email profile`
- You'll get: Client ID and Client Secret
- Save these somewhere safe

### Step 2: Update Your Code (Day 4)

Once you have the infrastructure, update your code:

**A. Switch to PostgreSQL**

1. Open `web/prisma/schema.prisma`
2. Change line 6 from `provider = "sqlite"` to `provider = "postgresql"`
3. Run:
```bash
cd web
npm install pg
```

**B. Add S3 Image Upload**

1. Install packages:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

2. Create new file `web/src/lib/s3.ts`:
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToS3(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const key = `uploads/${Date.now()}-${filename}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}
```

3. Update `web/src/app/api/upload/route.ts` to use `uploadToS3()` instead of saving files locally

**C. Add Stripe SSO Login**

1. Install NextAuth:
```bash
npm install next-auth
```

2. Create new file `web/src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from 'next-auth';

const handler = NextAuth({
  providers: [
    {
      id: 'stripe-sso',
      name: 'Stripe SSO',
      type: 'oauth',
      wellKnown: 'https://sso.stripe.com/.well-known/openid-configuration',
      clientId: process.env.STRIPE_SSO_CLIENT_ID!,
      clientSecret: process.env.STRIPE_SSO_CLIENT_SECRET!,
      authorization: { params: { scope: 'openid email profile' } },
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
        };
      },
    },
  ],
  callbacks: {
    async session({ session, token }) {
      // Only allow @stripe.com emails
      if (!token.email?.endsWith('@stripe.com')) {
        throw new Error('Must be a Stripe employee');
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
```

3. Create new file `web/src/middleware.ts`:
```typescript
export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/', '/patterns/:path*', '/api/:path*'],
};
```

**D. Update Environment Variables**

Create/update `web/.env`:
```bash
# Database (from Step 1A)
DATABASE_URL=postgresql://username:password@server:5432/dbname

# S3 Storage (from Step 1B)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=stripe-design-index-patterns

# Authentication (from Step 1D)
NEXTAUTH_URL=https://index.qa.stripe.com
NEXTAUTH_SECRET=[run: openssl rand -base64 32]
STRIPE_SSO_CLIENT_ID=...
STRIPE_SSO_CLIENT_SECRET=...

# Figma
FIGMA_API_TOKEN=...
```

**E. Update Figma Plugin**

1. Open `figma-plugin/src/ui/shared/constants.ts`
2. Change the API URL:
```typescript
export const API_BASE = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3000'
  : 'https://index.qa.stripe.com';  // Your QA URL
```

3. Open `figma-plugin/manifest.json`
4. Update `networkAccess`:
```json
{
  "networkAccess": {
    "allowedDomains": [
      "https://index.qa.stripe.com",
      "https://stripe-design-index-patterns.s3.amazonaws.com"
    ]
  }
}
```

5. Rebuild:
```bash
cd figma-plugin
npm run build
```

### Step 3: Deploy (Day 5)

**A. Set Up Database**
```bash
cd web
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

**B. Deploy to QA**

Work with the infrastructure team to:
1. Push your code to the right branch (they'll tell you which)
2. Set all environment variables in the QA environment
3. Deploy the app

**C. Test Everything**

1. Visit your QA URL: `https://index.qa.stripe.com`
2. Should redirect to Stripe SSO login
3. Log in with your @stripe.com account
4. Open Figma plugin
5. Select a frame and submit a pattern
6. Check if it appears in the web app

---

## Phase 2: Go to Production (Later)

After QA testing is successful and you're ready for real users:

### What Changes

**Easier approach: Just keep using QA**
- QA environment might be good enough for an internal tool
- Can handle reasonable traffic
- Simpler than full production

**Full production approach (if needed):**
- Upgrade database to production tier
- Add monitoring and alerts
- Get a production URL like `patterns.stripe.com`
- Add more servers for redundancy
- Set up automated backups

### Steps

1. Talk to infrastructure team about production requirements
2. They'll help you register the service properly
3. Set up production environment variables
4. Deploy to production
5. Monitor usage and errors

---

## Quick Reference: What Goes Where

```
┌─────────────────┐
│  Figma Plugin   │  Captures screenshots, sends to API
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Next.js App    │  Web interface at index.qa.stripe.com
│  (QA Server)    │  • Requires Stripe SSO login
└─────┬─────┬─────┘  • Serves web pages
      │     │        • API endpoints
      │     │
      ▼     ▼
┌──────────┐  ┌────────────┐
│PostgreSQL│  │  S3 Bucket │
│ Database │  │   Images   │
└──────────┘  └────────────┘
```

---

## Troubleshooting

**"Database connection failed"**
- Check DATABASE_URL is correct
- Verify you're on Stripe VPN
- Confirm database team gave you access

**"SSO login doesn't work"**
- Check NEXTAUTH_URL matches your actual URL
- Verify SSO client ID and secret are correct
- Make sure callback URL was registered correctly

**"Images not uploading"**
- Check AWS credentials are correct
- Verify S3 bucket name is right
- Confirm bucket permissions allow writes

**"Figma plugin can't connect"**
- Check API_BASE URL in constants.ts
- Verify networkAccess domains in manifest.json
- Rebuild plugin after changes

---

## Timeline

- **Days 1-3**: Request infrastructure (waiting on teams)
- **Day 4**: Update code
- **Day 5**: Deploy and test
- **Days 6-7**: Fix bugs, gather feedback

---

## Need Help?

- Database issues: `#reldb` Slack
- Deployment issues: `#infrastructure` Slack
- SSO issues: Identity team or `#security` Slack
- General questions: Your manager or tech lead
