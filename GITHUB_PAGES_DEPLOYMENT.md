# GitHub Pages Deployment Guide

## Configuration Complete ✅

The project has been configured for GitHub Pages deployment:

1. ✅ **Vite Config**: Added `base: '/dnd-sheets/'` to `vite.config.ts`
2. ✅ **Routing**: Switched from `BrowserRouter` to `HashRouter` in `src/main.tsx`

## Deployment Steps

### 1. Build the Project

```bash
npm run build
```

This creates a `dist` folder with the production-ready files.

### 2. Deploy to GitHub Pages

#### Option A: Using GitHub Actions (Recommended) ✅

1. The workflow file `.github/workflows/deploy.yml` has been created automatically.

2. **Enable GitHub Pages in repository settings:**
   - Go to your repository Settings → Pages
   - Under "Source", select "GitHub Actions" (not "Deploy from a branch")
   - Save the settings

3. Push to the `main` branch and the workflow will automatically:
   - Build your project
   - Deploy to GitHub Pages
   - Make it available at `https://[your-username].github.io/dnd-sheets/`

**Note:** The workflow uses the official GitHub Actions for Pages deployment (`actions/upload-pages-artifact` and `actions/deploy-pages`), which is the recommended approach.

#### Option B: Manual Deployment

1. Build the project: `npm run build`
2. Go to your repository Settings → Pages
3. Set source to `gh-pages` branch and `/ (root)` folder
4. Push the `dist` folder contents to the `gh-pages` branch:

```bash
# Install gh-pages if needed
npm install --save-dev gh-pages

# Add to package.json scripts:
# "deploy": "npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

### 3. Access Your App

Once deployed, your app will be available at:
```
https://[your-username].github.io/dnd-sheets/
```

## Important Notes

### HashRouter
- URLs will now use hash-based routing: `/#/character`, `/#/npc`
- This prevents 404 errors on refresh (GitHub Pages doesn't support SPA routing natively)
- Example: `https://your-username.github.io/dnd-sheets/#/character`

### Base Path
- All assets are served from `/dnd-sheets/` base path
- Make sure your repository name matches: `dnd-sheets`

### Testing Locally
To test the production build locally:

```bash
npm run build
npm run preview
```

This will serve the built files and you can verify everything works correctly.

## Troubleshooting

### 404 Errors
- Make sure you're using HashRouter (already configured)
- Check that the base path in `vite.config.ts` matches your repository name

### Assets Not Loading
- Verify the `base` property in `vite.config.ts` is set correctly
- Check browser console for 404 errors on assets

### Routing Issues
- HashRouter should handle all routing automatically
- URLs will look like: `/#/character` instead of `/character`

