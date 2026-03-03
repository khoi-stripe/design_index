# Pattern Library with Date Range Picker - Setup Guide

Complete implementation of the Pattern Library with inline filters and date range picker in dark mode.

## What's Included

✅ **PatternFilterBar** - Full-featured filter bar with:
- Search input
- Tag filtering with badges
- Sail component filtering
- Date range picker pinned right with presets (Last 7/30/90 days, This year)
- Active filter count and clear all
- Dark mode styling

✅ **PatternLibraryPage** - Complete page with:
- Header with "Add Pattern" button
- Filter bar (search, tags, components, date range)
- Responsive pattern grid
- Empty state
- Results count and sorting
- All in dark mode

## Installation

```bash
# Install dependencies
npm install react-day-picker date-fns clsx
```

## File Setup

1. **Copy component files to your Next.js project:**

```bash
# Copy to components/ui/
cp DateRangePicker.tsx your-project/components/ui/
cp PatternFilterBar.tsx your-project/components/ui/
cp PatternLibraryPage.tsx your-project/app/patterns/page.tsx

# Or for src directory:
cp PatternLibraryPage.tsx your-project/src/app/patterns/page.tsx
```

2. **Add date picker styles to globals.css:**

```css
/* Add contents of date-picker-styles.css to app/globals.css */
```

## Project Structure

```
your-project/
├── app/
│   ├── globals.css              # Include date picker styles
│   ├── layout.tsx               # Wrap in dark class
│   └── patterns/
│       └── page.tsx             # PatternLibraryPage
├── components/
│   └── ui/
│       ├── SailComponents.tsx   # Button, Card, Badge, etc.
│       ├── DateRangePicker.tsx  # Date picker component
│       └── PatternFilterBar.tsx # Filter bar with presets
└── tailwind.config.ts           # Sail tokens
```

## Enable Dark Mode

Update your `app/layout.tsx`:

```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="sail-scrollbar">{children}</body>
    </html>
  )
}
```

## Features

### Filter Bar Features

1. **Search** - Full-text search across title, description, tags
2. **Tag Filter** - Click badges to filter by tags (multi-select)
3. **Component Filter** - Filter by Sail components used
4. **Date Presets** - Quick buttons:
   - Last 7 days
   - Last 30 days
   - Last 90 days
   - This year
5. **Custom Date Range** - Click calendar picker for custom ranges
6. **Active Filter Count** - Shows number of active filters
7. **Clear All** - One-click to reset all filters

### Layout Features

- **Pinned Right** - Date range picker stays on the right
- **Inline Filters** - All filters in one compact bar
- **Responsive** - Adapts to different screen sizes
- **Dark Mode** - Full dark mode implementation
- **Empty State** - Friendly message when no results

## Usage Example

```tsx
// Basic usage in your page
import PatternLibraryPage from '@/components/ui/PatternLibraryPage';

export default function PatternsPage() {
  return <PatternLibraryPage />;
}
```

## Customization

### Modify Date Presets

Edit `PatternFilterBar.tsx`:

```tsx
const datePresets = [
  { label: 'Last 7 days', value: getDatePreset(7) },
  { label: 'Last 30 days', value: getDatePreset(30) },
  // Add your own presets:
  { label: 'Last 6 months', value: getDatePreset(180) },
];
```

### Change Available Filters

```tsx
<PatternFilterBar
  filters={filters}
  onFiltersChange={setFilters}
  availableTags={['modal', 'form', 'dashboard']} // Your tags
  availableSailComponents={['Button', 'Card']}   // Your components
/>
```

### Connect to Real Data

Replace `mockPatterns` in `PatternLibraryPage.tsx` with your API call:

```tsx
const [patterns, setPatterns] = useState([]);

useEffect(() => {
  fetch('/api/patterns')
    .then(res => res.json())
    .then(setPatterns);
}, []);

const filteredPatterns = useMemo(() => {
  return patterns.filter((pattern) => {
    // ... existing filter logic
  });
}, [patterns, filters]);
```

## API Integration

When you connect to PostgreSQL, your API should return patterns in this format:

```typescript
type Pattern = {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  tags: string[];
  sailComponents: string[];
  author: string;
  createdAt: Date;
};
```

## Filter Logic

The component filters patterns client-side, but for production you'd want server-side filtering:

```typescript
// Server-side API endpoint
GET /api/patterns?
  search=modal&
  tags=onboarding,form&
  components=Button&
  dateFrom=2026-02-01&
  dateTo=2026-03-01
```

## Next Steps

1. Start dev server: `npm run dev`
2. Visit http://localhost:3000/patterns
3. Try the filters and date presets
4. Replace mock data with your API
5. Add "Add Pattern" functionality

## Screenshots

The implementation includes:
- Dark mode throughout
- Sail design tokens for all spacing/colors
- Smooth transitions
- Accessible keyboard navigation
- Mobile responsive

## Troubleshooting

**Styles not working?**
- Make sure `date-picker-styles.css` is in `globals.css`
- Check `dark` class is on `<html>` element

**TypeScript errors?**
- Install types: `npm install --save-dev @types/react-day-picker`

**Date picker not showing?**
- Check z-index values in `tailwind.config.ts`
- Ensure `position: relative` on parent container

## Live Example

The complete implementation is in `PatternLibraryPage.tsx` with:
- 6 mock patterns
- All filters working
- Date range presets
- Empty state
- Sort dropdown

Try it out and customize to your needs!
