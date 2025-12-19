# Project Setup Guide

## Prerequisites

First, ensure you have Node.js (v18+) installed. If not:

**macOS (using Homebrew):**
```bash
brew install node
```

**Or download from:** https://nodejs.org/

## Step 1: Install All Dependencies

All configuration files have been created. Simply run:

```bash
# Navigate to project directory
cd /Users/vincenttran/Documents/Projects/Sheet_maker/dnd-sheets

# Install all dependencies
npm install
```

This will install:
- ✅ React 18.2+ with TypeScript types
- ✅ Vite 5.0+ with React plugin
- ✅ React Router DOM v6.20+
- ✅ Zod 3.22+ (for validation)
- ✅ html2canvas 1.4+ (for PNG export)
- ✅ Tailwind CSS 3.3+ with PostCSS
- ✅ clsx & tailwind-merge (for conditional styling)
- ✅ TypeScript 5.2+ (strict mode enabled)
- ✅ ESLint with React plugins

## Step 2: Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

The following structure has been created:

```
dnd-sheets/
├── src/
│   ├── pages/          # Page components (Home, Character, NPC)
│   ├── components/     # Reusable UI components (to be created)
│   ├── features/       # Feature-specific components (to be created)
│   ├── hooks/          # Custom hooks (to be created)
│   ├── types/          # TypeScript interfaces (to be created)
│   ├── utils/          # Utility functions (to be created)
│   ├── App.tsx         # Main app with routing
│   ├── main.tsx        # Entry point
│   └── index.css       # Tailwind directives
├── legacy/             # Original HTML files (preserved)
├── package.json        # Dependencies & scripts
├── tsconfig.json       # TypeScript config (strict mode)
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind configuration
└── postcss.config.js   # PostCSS configuration
```

## Configuration Highlights

- **TypeScript**: Strict mode enabled with all safety checks
- **Tailwind**: Configured with custom colors (ink, paper, border) and fonts (Cinzel, Crimson Pro)
- **Vite**: Path aliases configured (`@/*` → `./src/*`)
- **React Router**: BrowserRouter configured for client-side routing

## Next Steps

After running `npm install` and `npm run dev`, we'll proceed with:
1. ✅ Step 1: Project initialization (COMPLETE)
2. ⏭️ Step 2: Define TypeScript interfaces and Zod schemas
3. ⏭️ Step 3: Create reusable UI components
4. ⏭️ Step 4: Build the pages (Home, Character Sheet, NPC Sheet)

