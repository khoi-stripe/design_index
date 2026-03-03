# Security Considerations

## System Architecture & Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                         Stripe Network                          │
│                                                                 │
│  ┌──────────────┐                    ┌──────────────────────┐  │
│  │   Figma      │                    │   Discovery Website  │  │
│  │   Plugin     │                    │   (Next.js)          │  │
│  │              │                    │                      │  │
│  │ • Runs in    │                    │ • Stripe SSO (OIDC) │  │
│  │   Figma      │                    │ • Session cookies   │  │
│  │   workspace  │                    │                      │  │
│  └──────┬───────┘                    └──────────┬───────────┘  │
│         │                                       │              │
│         │ X-Figma-User-Email                   │ JWT Token    │
│         │ X-Figma-User-Id                      │              │
│         │                                       │              │
│         └───────────┬───────────────────────────┘              │
│                     ▼                                          │
│            ┌─────────────────┐                                 │
│            │   Backend API   │                                 │
│            │                 │                                 │
│            │ • Auth          │                                 │
│            │   validation    │                                 │
│            │ • Rate limiting │                                 │
│            │ • Access logs   │                                 │
│            └────────┬────────┘                                 │
│                     │                                          │
│         ┌───────────┴───────────┐                              │
│         ▼                       ▼                              │
│  ┌──────────────┐        ┌──────────────┐                     │
│  │  PostgreSQL  │        │  S3/R2       │                     │
│  │  (Aurora)    │        │  (Images)    │                     │
│  │              │        │              │                     │
│  │ • Encrypted  │        │ • Private    │                     │
│  │   at rest    │        │   bucket     │                     │
│  └──────────────┘        └──────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Trust Boundaries:
1. Figma workspace → Backend (header-based auth)
2. Website → Backend (SSO + session tokens)
3. Backend → Data stores (IAM roles)
```

## Data Classification

### Green (Public Stripe)
- UI pattern screenshots (non-sensitive design assets)
- Tag names and categories
- Component names from Sail design system

### Yellow (Stripe Confidential)
- Figma file keys and node IDs (internal file structure)
- Employee names and email addresses
- Pattern descriptions and metadata
- Usage analytics

### No Red or Orange Data
- No customer data
- No PII beyond employee emails
- No financial or payment information
- No production secrets or credentials

## Authentication & Authorization

### Website Authentication (Standard OIDC)

**Approach:** Stripe SSO via NextAuth.js

**Flow:**
1. User visits `patterns.stripe.com`
2. Redirects to Stripe SSO (OIDC provider)
3. After auth, receives JWT token
4. Token stored in httpOnly cookie
5. All API requests include token

**Implementation:**
```typescript
// pages/api/auth/[...nextauth].ts
export default NextAuth({
  providers: [
    {
      id: 'stripe-sso',
      name: 'Stripe SSO',
      type: 'oauth',
      wellKnown: 'https://sso.stripe.com/.well-known/openid-configuration',
      authorization: { params: { scope: 'openid email profile' } },
      // ... OIDC config
    }
  ],
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 }, // 24 hours
  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      options: { httpOnly: true, sameSite: 'lax', secure: true }
    }
  }
});
```

**Risk Level:** Low - Standard OIDC flow with established Stripe SSO

---

### Plugin Authentication (Hybrid Approach)

**Approach:** Leverage Figma user identity with backend validation

**Rationale:**
- Figma plugins cannot perform OAuth redirects (sandboxed iframe)
- Plugin is private to Stripe's Figma workspace
- Backend validates all requests against employee directory

**Flow:**
1. Plugin captures `figma.currentUser` (id, email, name)
2. Sends user identity in request headers to backend
3. Backend validates:
   - Email ends with `@stripe.com`
   - User exists in Stripe employee directory
   - Rate limits by user ID
4. Backend associates pattern with authenticated user

**Implementation:**
```typescript
// Plugin: src/api.ts
async function createPattern(data: PatternData) {
  const user = figma.currentUser;

  const response = await fetch('https://patterns.stripe.com/api/patterns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Figma-User-Id': user?.id || '',
      'X-Figma-User-Email': user?.email || '',
      'X-Figma-User-Name': user?.name || '',
      'X-Figma-File-Key': figma.fileKey
    },
    body: JSON.stringify(data)
  });

  return response.json();
}

// Backend: middleware/auth.ts
export async function validatePluginAuth(req: Request) {
  const email = req.headers.get('x-figma-user-email');
  const userId = req.headers.get('x-figma-user-id');
  const fileKey = req.headers.get('x-figma-file-key');

  // 1. Check email domain
  if (!email?.endsWith('@stripe.com')) {
    throw new UnauthorizedError('Invalid email domain');
  }

  // 2. Verify against Stripe employee directory
  const employee = await stripeDirectory.lookupByEmail(email);
  if (!employee || !employee.isActive) {
    throw new UnauthorizedError('User not found or inactive');
  }

  // 3. Rate limit by user ID (100 requests/hour)
  await rateLimit.check(`plugin:${userId}`, { limit: 100, window: 3600 });

  // 4. Log request for audit trail
  await auditLog.write({
    user: email,
    action: 'plugin_request',
    figmaFileKey: fileKey,
    timestamp: new Date()
  });

  return { userId, email, name: employee.name };
}
```

**Risk Level:** Low-Medium
- **Mitigated by:** Network restrictions (API only accessible from Stripe network/VPN), email validation, employee directory verification, rate limiting, audit logs

---

## Identified Security Risks & Mitigations

### 1. **Spoofed Plugin Headers**

**Risk:** Malicious actor could spoof `X-Figma-User-*` headers to impersonate another user

**Likelihood:** Low (requires access to Stripe network + knowledge of system)

**Impact:** Medium (could create patterns as another user)

**Mitigations:**
- ✅ API only accessible from Stripe network (not public internet)
- ✅ Email domain validation (`@stripe.com` only)
- ✅ Cross-reference with employee directory
- ✅ Audit logging of all pattern creation/updates
- ✅ Rate limiting per user ID
- ⚠️ **Future enhancement:** Could add plugin API keys (user generates key in website, pastes into plugin for additional validation layer)

**Accepted Risk:** For v1, network-level security + email validation is sufficient for internal tool. Can add API keys in v2 if needed.

---

### 2. **Unauthorized Access to Patterns**

**Risk:** Employee accesses patterns from projects/files they shouldn't see

**Likelihood:** Medium (patterns are tagged from various Figma files)

**Impact:** Low (patterns are internal design assets, not customer data)

**Mitigations:**
- ✅ All users must be Stripe employees (SSO gated)
- ✅ Patterns are Stripe Confidential (Yellow data)
- ⚠️ **Not implementing:** Figma file-level permissions (would require complex Figma API integration)

**Accepted Risk:** Patterns are considered internally shareable. Any Stripe employee can view any pattern. If specific file-level restrictions needed, can add in future iteration.

---

### 3. **XSS via User-Submitted Content**

**Risk:** Malicious user injects scripts via pattern descriptions, tags, or metadata

**Likelihood:** Low (requires malicious Stripe employee)

**Impact:** Medium (could compromise other users' sessions)

**Mitigations:**
- ✅ All user input sanitized on backend before storage
- ✅ React/Next.js escapes output by default
- ✅ Content Security Policy headers
- ✅ Input validation (max lengths, allowed characters for tags)

**Implementation:**
```typescript
// Backend: validation
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

const PatternSchema = z.object({
  title: z.string().max(200).regex(/^[a-zA-Z0-9\s\-_]+$/),
  description: z.string().max(2000),
  tags: z.array(z.string().max(50)).max(20)
});

function sanitizeInput(pattern: PatternInput) {
  return {
    ...pattern,
    description: DOMPurify.sanitize(pattern.description, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p'],
      ALLOWED_ATTR: ['href']
    })
  };
}

// Website: CSP headers
const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' https://patterns-images.stripe.com data:; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
};
```

---

### 4. **SQL Injection**

**Risk:** Malicious input could manipulate database queries

**Likelihood:** Very Low (using ORM with parameterized queries)

**Impact:** High (data breach, data loss)

**Mitigations:**
- ✅ Using Prisma ORM (parameterized queries by default)
- ✅ No raw SQL queries
- ✅ Input validation with Zod schemas
- ✅ Principle of least privilege (database user has only necessary permissions)

**Example:**
```typescript
// Safe: Prisma parameterizes automatically
await prisma.pattern.findMany({
  where: {
    tags: { some: { name: userInput } } // Parameterized
  }
});

// Never do this:
// await prisma.$queryRaw(`SELECT * FROM patterns WHERE tag = '${userInput}'`)
```

---

### 5. **Unauthorized Image Access**

**Risk:** Direct access to S3/R2 bucket URLs could leak patterns externally

**Likelihood:** Low (requires guessing/leaking signed URLs)

**Impact:** Low (patterns are non-sensitive design assets)

**Mitigations:**
- ✅ S3/R2 bucket is private (not public)
- ✅ Images served via CloudFront with signed URLs or through backend proxy
- ✅ Short-lived signed URLs (1-hour expiry)
- ✅ Stripe network access only for bucket

**Implementation:**
```typescript
// Backend: Generate signed URL
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

async function getPatternImageUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: 'stripe-patterns-prod',
    Key: key
  });

  return await getSignedUrl(s3Client, command, {
    expiresIn: 3600 // 1 hour
  });
}
```

---

### 6. **Rate Limiting & DoS**

**Risk:** Malicious user floods API with requests

**Likelihood:** Low (internal tool, authenticated users)

**Impact:** Medium (service degradation)

**Mitigations:**
- ✅ Rate limiting per user (100 req/hour for plugin, 1000 req/hour for website)
- ✅ Request size limits (10MB max for screenshot uploads)
- ✅ Pagination on list endpoints
- ✅ Database query timeouts
- ✅ Cloudflare DDoS protection (if using CF)

---

### 7. **Data Retention & Privacy**

**Risk:** Storing unnecessary employee data or patterns from deleted Figma files

**Likelihood:** Medium (designs evolve, files get archived)

**Impact:** Low (data bloat, potentially stale patterns)

**Mitigations:**
- ✅ Only store necessary employee data (email, name, ID)
- ✅ No PII beyond employee email
- ✅ Patterns soft-deleted (marked inactive, not hard deleted)
- ⚠️ **Future enhancement:** Periodic cleanup job to flag patterns from archived Figma files

**Accepted Risk:** Pattern library is meant to be historical record. Stale patterns are acceptable for v1.

---

## Data Flow & Encryption

### In Transit
- ✅ **TLS 1.2+** for all communications
- ✅ HTTPS enforced (no HTTP)
- ✅ Certificate pinning for Figma plugin → backend

### At Rest
- ✅ **PostgreSQL:** Aurora encryption enabled (AWS KMS)
- ✅ **S3/R2:** Server-side encryption (AES-256)
- ✅ **Backups:** Encrypted snapshots

### Secrets Management
- ✅ Database credentials stored in AWS Secrets Manager
- ✅ S3 credentials via IAM roles (no hardcoded keys)
- ✅ OIDC client secrets in environment variables (encrypted in gocode)

---

## Audit Logging

All sensitive operations logged with:
- User identity (email)
- Action type (create, update, delete)
- Resource ID (pattern ID)
- Timestamp
- Source (plugin vs website)
- Figma file key (if from plugin)

**Retention:** 90 days in CloudWatch Logs

**Example:**
```json
{
  "timestamp": "2026-02-28T10:30:00Z",
  "user": "khoi@stripe.com",
  "action": "pattern.create",
  "patternId": "uuid-123",
  "source": "plugin",
  "figmaFileKey": "abc123xyz",
  "ip": "10.0.1.5"
}
```

---

## Areas Where We Need Guidance

1. **Plugin Auth Trade-offs:** Is header-based auth with email validation sufficient for v1, or should we require plugin API keys from day one?

2. **Employee Directory Integration:** What's the recommended way to verify `@stripe.com` emails against the employee directory? Is there an internal API we should use?

3. **Network Access Controls:** Should the API be restricted to specific Stripe network segments, or is general Stripe network/VPN access sufficient?

4. **Data Classification Confirmation:** Are UI pattern screenshots correctly classified as Yellow (Stripe Confidential), or should they be Green (Public Stripe)?

5. **Compliance:** Are there any data retention policies we should be aware of for employee-generated content?

---

## Security Testing Plan

- ✅ Input validation tests (XSS, SQL injection attempts)
- ✅ Auth bypass tests (invalid emails, missing headers)
- ✅ Rate limiting verification
- ✅ Permission boundary tests
- ✅ Dependency scanning (Snyk/Dependabot)
- ✅ OWASP Top 10 review before launch

---

## Incident Response

**Security contact:** [Your team's security DRI]

**Escalation path:**
1. #security-partnerships Slack channel
2. Page on-call security engineer
3. Follow [go/security-incident](http://go/security-incident)

**Monitoring:**
- CloudWatch alerts on auth failures (>10/min)
- Rate limit violations
- Unusual access patterns
- Database query errors

---

## Summary

This security design prioritizes **pragmatic security for an internal tool** while maintaining Stripe's security standards. The hybrid auth approach balances usability (no OAuth friction in plugin) with security (employee validation, network restrictions, audit logging).

The main security controls are:
1. **Authentication:** Stripe SSO for website, Figma identity + email validation for plugin
2. **Authorization:** Employee-only access via `@stripe.com` domain validation
3. **Data Protection:** Encryption in transit (TLS) and at rest (KMS)
4. **Audit:** Comprehensive logging of all pattern operations
5. **Defense in Depth:** Rate limiting, input validation, network restrictions

**Risk posture:** Low-Medium risk internal tool with appropriate security controls for handling Stripe Confidential data.
