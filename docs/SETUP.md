# Setting Up Tailwind with Sail Tokens

This guide will help you integrate Sail design tokens into your Next.js project.

## Files Created

1. **tailwind.config.ts** - Tailwind configuration with Sail tokens
2. **globals.css** - CSS variables and utility classes
3. **SailComponents.tsx** - Example components using Sail styles

## Setup Steps

### 1. Create Next.js Project

```bash
npx create-next-app@latest pattern-library
# Choose:
# ✅ TypeScript
# ✅ Tailwind CSS
# ✅ App Router
# ❌ src/ directory (optional)
```

### 2. Install Dependencies

```bash
cd pattern-library
npm install clsx
```

### 3. Copy Configuration Files

Copy these files to your Next.js project:

```bash
# Copy Tailwind config
cp tailwind.config.ts pattern-library/

# Copy global styles
cp globals.css pattern-library/app/globals.css

# Copy example components
mkdir -p pattern-library/components/ui
cp SailComponents.tsx pattern-library/components/ui/
```

### 4. Update Your Layout

Edit `app/layout.tsx` to include the global styles:

```tsx
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="sail-scrollbar">{children}</body>
    </html>
  )
}
```

### 5. Test It Out

Create a test page (`app/page.tsx`):

```tsx
import { Button, Card, Input, Badge, PatternCard } from '@/components/ui/SailComponents';

export default function Home() {
  const samplePattern = {
    id: '1',
    title: 'Onboarding Modal',
    description: 'A modal component for user onboarding flows',
    thumbnailUrl: 'https://via.placeholder.com/400x300',
    tags: ['modal', 'onboarding', 'form'],
    author: 'Jane Doe',
    createdAt: new Date(),
  };

  return (
    <main className="min-h-screen p-sail-400 bg-background">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-sail-4xl font-bold text-foreground mb-sail-300">
          Pattern Library
        </h1>

        {/* Button examples */}
        <div className="flex gap-sail-200 mb-sail-400">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="tertiary">Tertiary Button</Button>
        </div>

        {/* Card example */}
        <Card className="mb-sail-400">
          <h2 className="text-sail-2xl font-semibold mb-sail-200">
            Example Card
          </h2>
          <p className="text-foreground-secondary">
            This card uses Sail design tokens for spacing, colors, and borders.
          </p>
        </Card>

        {/* Input example */}
        <div className="max-w-md mb-sail-400">
          <Input
            label="Pattern Name"
            placeholder="Enter pattern name..."
            helperText="Give your pattern a descriptive name"
          />
        </div>

        {/* Badge examples */}
        <div className="flex gap-sail-100 mb-sail-400">
          <Badge>Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
        </div>

        {/* Pattern card example */}
        <div className="max-w-md">
          <PatternCard pattern={samplePattern} />
        </div>
      </div>
    </main>
  );
}
```

## Using Sail Tokens

### In Tailwind Classes

```tsx
// Spacing
<div className="p-sail-200 m-sail-150">

// Colors
<div className="bg-background text-foreground border-border">

// Typography
<h1 className="text-sail-2xl font-semibold">

// Border radius
<div className="rounded-sail-md">

// Transitions
<button className="transition-sail-base">
```

### In Custom CSS

```css
.my-component {
  background-color: var(--sail-color-background);
  color: var(--sail-color-text);
  padding: theme('spacing.sail-200');
  border-radius: theme('borderRadius.sail-md');
}
```

### In Inline Styles (when needed)

```tsx
<div style={{
  backgroundColor: 'var(--sail-color-background)',
  padding: '16px',
}}>
```

## Dark Mode

Dark mode is enabled via the `dark` class. Toggle it:

```tsx
// Add to your layout or a theme toggle component
'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="sail-button-secondary"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
```

## Getting More Sail Tokens

Visit https://sail.stripe.me (requires Stripe network/VPN):

- **All tokens**: https://sail.stripe.me/tokens/all/
- **Colors**: https://sail.stripe.me/tokens/colors/
- **Spacing**: https://sail.stripe.me/tokens/spacing/
- **Typography**: https://sail.stripe.me/tokens/typography/
- **Components**: https://sail.stripe.me/components/

## Useful Utility Classes

Pre-built utility classes from `globals.css`:

```tsx
// Card with hover effect
<div className="sail-card">

// Input field
<input className="sail-input" />

// Button variants
<button className="sail-button-primary">
<button className="sail-button-secondary">

// Custom scrollbar
<div className="sail-scrollbar overflow-auto">
```

## Next Steps

1. Run `npm run dev` to start the dev server
2. Visit http://localhost:3000 to see your Sail-styled components
3. Customize the tokens in `tailwind.config.ts` as needed
4. Build out your pattern library UI using these components

## Resources

- Sail Docs: https://sail.stripe.me
- Tailwind CSS: https://tailwindcss.com/docs
- Next.js: https://nextjs.org/docs
