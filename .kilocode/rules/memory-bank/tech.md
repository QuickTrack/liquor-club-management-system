# Technical Context: Next.js Starter Template

## Technology Stack

| Technology   | Version | Purpose                         |
| ------------ | ------- | ------------------------------- |
| Next.js      | 16.x    | React framework with App Router |
| React        | 19.x    | UI library                      |
| TypeScript   | 5.9.x   | Type-safe JavaScript            |
| Tailwind CSS | 4.x     | Utility-first CSS               |
| Bun          | Latest  | Package manager & runtime       |

## Development Environment

### Prerequisites

- Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- Node.js 20+ (for compatibility)

### Commands

```bash
bun install        # Install dependencies
bun dev            # Start dev server (http://localhost:3000)
bun build          # Production build
bun start          # Start production server
bun lint           # Run ESLint
bun typecheck      # Run TypeScript type checking
```

## Project Configuration

### Next.js Config (`next.config.ts`)

- App Router enabled
- Default settings for flexibility

### TypeScript Config (`tsconfig.json`)

- Strict mode enabled
- Path alias: `@/*` → `src/*`
- Target: ESNext

### Tailwind CSS 4 (`postcss.config.mjs`)

- Uses `@tailwindcss/postcss` plugin
- CSS-first configuration (v4 style)

### ESLint (`eslint.config.mjs`)

- Uses `eslint-config-next`
- Flat config format

## Key Dependencies

### Production Dependencies

```json
{
  "next": "^16.1.3", // Framework
  "react": "^19.2.3", // UI library
  "react-dom": "^19.2.3", // React DOM
  "emoji-picker-react": "^4.19.1" // Emoji picker for category icons
}
```

### Dev Dependencies

```json
{
  "typescript": "^5.9.3",
  "@types/node": "^24.10.2",
  "@types/react": "^19.2.7",
  "@types/react-dom": "^19.2.3",
  "@tailwindcss/postcss": "^4.1.17",
  "tailwindcss": "^4.1.17",
  "eslint": "^9.39.1",
  "eslint-config-next": "^16.0.0"
}
```

## File Structure

```
/
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies and scripts
├── bun.lock                # Bun lockfile
├── next.config.ts          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
├── postcss.config.mjs      # PostCSS (Tailwind) config
├── eslint.config.mjs       # ESLint configuration
├── public/                 # Static assets
│   └── .gitkeep
└── src/                    # Source code
    └── app/                # Next.js App Router
        ├── layout.tsx      # Root layout
        ├── page.tsx        # Home page
        ├── globals.css     # Global styles
        ├── favicon.ico     # Site icon
        └── api/            # API Routes
            ├── units/route.ts          # Unit definitions (GET, POST)
            │   └── [id]/route.ts       # Unit CRUD (GET, PATCH, DELETE)
            ├── suppliers/route.ts      # Supplier list & create (GET, POST)
            │   └── [id]/route.ts       # Supplier CRUD (GET, PATCH, DELETE)
            ├── categories/route.ts     # Category CRUD
            ├── products/route.ts       # Product CRUD
            ├── orders/route.ts         # Order management
            ├── transactions/route.ts   # Financial transactions
            └── staff/route.ts          # Staff management
```

## Database Models

| Model | File | Purpose |
|-------|------|---------|
| `User` | `src/lib/db/models.ts` | Authentication & access control |
| `Category` | `src/lib/db/models.ts` | Product categories |
| `Product` | `src/lib/db/models.ts` | Inventory items |
| `ProductUOM` | `src/lib/db/models.ts` | Product unit conversions |
| `UnitDefinition` | `src/lib/db/models/UnitDefinition.ts` | Reusable unit names (bottle, case, etc.) |
| `Supplier` | `src/lib/db/models.ts` | Vendor/supplier records |
| `Customer` | `src/lib/db/models.ts` | Customer accounts |
| `Order` | `src/lib/db/models.ts` | Sales orders |
| `Transaction` | `src/lib/db/models.ts` | Financial transactions |
| `Staff` | `src/lib/db/models.ts` | Employee records |
| `ShiftOpening` | `src/lib/db/models.ts` | Shift start audit |
| `ShiftReconciliation` | `src/lib/db/models.ts` | Shift end audit |
| `MPESATransaction` | `src/lib/db/models.ts` | M-Pesa payment logs |
| `FailedTransaction` | `src/lib/db/models.ts` | Retry queue for failed ops |

### Starting Point

- Minimal structure - expand as needed
- No database by default (use recipe to add)
- No authentication by default (add when needed)

### Browser Support

- Modern browsers (ES2020+)
- No IE11 support

## Performance Considerations

### Image Optimization

- Use Next.js `Image` component for optimization
- Place images in `public/` directory

### Bundle Size

- Tree-shaking enabled by default
- Tailwind CSS purges unused styles

### Core Web Vitals

- Server Components reduce client JavaScript
- Streaming and Suspense for better UX

## Deployment

### Build Output

- Server-rendered pages by default
- Can be configured for static export

### Environment Variables

- None required for base template
- Add as needed for features
- Use `.env.local` for local development
