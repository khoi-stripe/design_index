import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

const COLORS = [
  { bg: "#635BFF", fg: "#FFFFFF" },
  { bg: "#0A2540", fg: "#FFFFFF" },
  { bg: "#00D4AA", fg: "#0A2540" },
  { bg: "#FF6B6B", fg: "#FFFFFF" },
  { bg: "#3A86FF", fg: "#FFFFFF" },
  { bg: "#E8E6FF", fg: "#635BFF" },
  { bg: "#F0F7FF", fg: "#3A86FF" },
  { bg: "#0D1117", fg: "#58A6FF" },
  { bg: "#FFF4E6", fg: "#D97706" },
  { bg: "#F0FDF4", fg: "#16A34A" },
];

const PATTERNS = [
  {
    title: "Connect Onboarding Flow",
    description: "Multi-step onboarding for Stripe Connect accounts with identity verification, business details, and bank account setup.",
    tags: ["onboarding", "multi-step", "connect"],
    author: "Sarah Chen",
    featured: true,
  },
  {
    title: "Pricing Table",
    description: "Three-tier pricing comparison table with feature breakdown, toggle for monthly/annual billing.",
    tags: ["pricing", "comparison", "billing"],
    author: "Alex Rivera",
    featured: true,
  },
  {
    title: "Payment Confirmation Modal",
    description: "Success modal shown after a payment is processed, with receipt summary and next actions.",
    tags: ["modal", "payment", "confirmation"],
    author: "Jordan Lee",
  },
  {
    title: "Dashboard Overview",
    description: "Main dashboard with revenue chart, recent transactions, and key metrics cards.",
    tags: ["dashboard", "analytics", "chart"],
    author: "Sarah Chen",
    featured: true,
  },
  {
    title: "Transaction Activity Feed",
    description: "Chronological list of payment events with status indicators, amounts, and expandable details.",
    tags: ["activity-feed", "transactions", "list"],
    author: "Mike Thompson",
  },
  {
    title: "Checkout Form",
    description: "Embedded checkout form with card input, address fields, and real-time validation.",
    tags: ["form", "checkout", "payment"],
    author: "Jordan Lee",
  },
  {
    title: "Empty State — No Transactions",
    description: "Friendly empty state for new accounts with no transaction history yet.",
    tags: ["empty-state", "illustration"],
    author: "Priya Patel",
  },
  {
    title: "API Key Settings",
    description: "Settings page for managing API keys with reveal/copy, rotation, and restriction controls.",
    tags: ["settings", "api", "security"],
    author: "Mike Thompson",
  },
  {
    title: "Sidebar Navigation",
    description: "Collapsible sidebar with icon+label navigation, nested sections, and active state.",
    tags: ["navigation", "sidebar", "layout"],
    author: "Alex Rivera",
  },
  {
    title: "Customer Detail Card",
    description: "Expandable customer card showing contact info, subscription status, and payment methods.",
    tags: ["card", "customer", "detail"],
    author: "Priya Patel",
  },
  {
    title: "Dispute Resolution Flow",
    description: "Step-by-step dispute response flow with evidence upload and status tracking.",
    tags: ["multi-step", "dispute", "upload"],
    author: "Sarah Chen",
  },
  {
    title: "Webhook Event Log",
    description: "Real-time webhook delivery log with payload inspection, retry actions, and filtering.",
    tags: ["activity-feed", "api", "log"],
    author: "Mike Thompson",
  },
  {
    title: "Invoice Builder",
    description: "Line-item invoice editor with tax calculation, memo field, and PDF preview.",
    tags: ["form", "invoice", "billing"],
    author: "Jordan Lee",
    featured: true,
  },
  {
    title: "Subscription Management",
    description: "Subscription detail page with plan switching, cancel/pause controls, and usage meter.",
    tags: ["billing", "subscription", "settings"],
    author: "Alex Rivera",
  },
  {
    title: "Data Table with Bulk Actions",
    description: "Sortable data table with multi-select, bulk export, and inline status editing.",
    tags: ["table", "data", "bulk-actions"],
    author: "Priya Patel",
  },
];

async function generatePlaceholder(
  text: string,
  color: { bg: string; fg: string },
  outputPath: string
) {
  const width = 800;
  const height = 600;
  const words = text.split(" ");
  const line1 = words.slice(0, Math.ceil(words.length / 2)).join(" ");
  const line2 = words.slice(Math.ceil(words.length / 2)).join(" ");

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${color.bg}"/>
      <rect x="40" y="40" width="720" height="520" rx="12" fill="${color.bg}" stroke="${color.fg}" stroke-opacity="0.15" stroke-width="1"/>
      <rect x="40" y="40" width="720" height="60" rx="12" fill="${color.fg}" fill-opacity="0.08"/>
      <circle cx="76" cy="70" r="6" fill="${color.fg}" fill-opacity="0.3"/>
      <circle cx="96" cy="70" r="6" fill="${color.fg}" fill-opacity="0.3"/>
      <circle cx="116" cy="70" r="6" fill="${color.fg}" fill-opacity="0.3"/>
      <rect x="80" y="140" width="280" height="16" rx="4" fill="${color.fg}" fill-opacity="0.15"/>
      <rect x="80" y="170" width="180" height="12" rx="3" fill="${color.fg}" fill-opacity="0.08"/>
      <rect x="80" y="210" width="640" height="100" rx="8" fill="${color.fg}" fill-opacity="0.05"/>
      <rect x="80" y="330" width="300" height="80" rx="8" fill="${color.fg}" fill-opacity="0.05"/>
      <rect x="400" y="330" width="320" height="80" rx="8" fill="${color.fg}" fill-opacity="0.05"/>
      <rect x="80" y="430" width="640" height="40" rx="8" fill="${color.fg}" fill-opacity="0.1"/>
      <text x="400" y="460" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="${color.fg}" fill-opacity="0.4">${line1}</text>
      ${line2 ? `<text x="400" y="480" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="${color.fg}" fill-opacity="0.4">${line2}</text>` : ""}
    </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(outputPath);
}

async function main() {
  console.log("Seeding database...");

  const uploadDir = path.join(__dirname, "..", "public", "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });

  await prisma.patternTag.deleteMany();
  await prisma.collectionPattern.deleteMany();
  await prisma.pattern.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.collection.deleteMany();

  const tagMap = new Map<string, string>();

  const allTagSlugs = [...new Set(PATTERNS.flatMap((p) => p.tags))];
  const tagCategories: Record<string, string> = {
    onboarding: "pattern",
    "multi-step": "pattern",
    modal: "pattern",
    "empty-state": "pattern",
    "activity-feed": "pattern",
    form: "pattern",
    table: "pattern",
    card: "pattern",
    navigation: "pattern",
    sidebar: "layout",
    layout: "layout",
    dashboard: "page",
    settings: "page",
    checkout: "page",
    pricing: "page",
    payment: "component",
    billing: "component",
    chart: "component",
    connect: "component",
    confirmation: "pattern",
    comparison: "pattern",
    analytics: "page",
    transactions: "component",
    list: "pattern",
    illustration: "component",
    api: "component",
    security: "component",
    customer: "component",
    detail: "pattern",
    dispute: "pattern",
    upload: "pattern",
    log: "pattern",
    invoice: "page",
    subscription: "component",
    data: "component",
    "bulk-actions": "pattern",
  };

  for (const slug of allTagSlugs) {
    const tag = await prisma.tag.create({
      data: {
        name: slug
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        slug,
        category: tagCategories[slug] || "general",
      },
    });
    tagMap.set(slug, tag.id);
  }

  for (let i = 0; i < PATTERNS.length; i++) {
    const p = PATTERNS[i];
    const color = COLORS[i % COLORS.length];
    const filename = `seed-${i}.png`;
    const filepath = path.join(uploadDir, filename);

    await generatePlaceholder(p.title, color, filepath);

    await prisma.pattern.create({
      data: {
        title: p.title,
        description: p.description,
        screenshotUrl: `/uploads/${filename}`,
        thumbnailUrl: `/uploads/${filename}`,
        authorName: p.author,
        figmaFileKey: "example123",
        figmaNodeId: `${100 + i}:${200 + i}`,
        figmaDeepLink: `https://figma.com/file/example123?node-id=${100 + i}:${200 + i}`,
        figmaPageName: "Designs",
        featured: p.featured || false,
        status: "published",
        tags: {
          create: p.tags.map((slug) => ({
            tagId: tagMap.get(slug)!,
          })),
        },
      },
    });

    console.log(`  Created: ${p.title}`);
  }

  console.log(`\nSeeded ${PATTERNS.length} patterns and ${allTagSlugs.length} tags.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
