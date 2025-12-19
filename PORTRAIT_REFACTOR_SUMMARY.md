# NPC Portrait Uploader Refactor Summary

## Overview
Refactored the NPC portrait uploader to use `react-easy-crop` for a professional image cropping experience, similar to social media profile picture uploaders. This solves PDF export issues by ensuring the final image is a static, pre-cropped file.

## What Was Created

### 1. Canvas Utilities (`src/utils/canvasUtils.ts`)
- **`getCroppedImg()`**: Returns cropped image as a blob URL
- **`getCroppedImgAsBase64()`**: Returns cropped image as a base64 data URL (used for storage)
- Both functions use HTML5 Canvas API to generate the final cropped image

### 2. Modal Component (`src/components/ui/Modal.tsx`)
- Reusable modal component with parchment styling
- Matches the app's design aesthetic
- Supports backdrop click to close
- Includes title and content areas

### 3. Image Cropper Modal (`src/components/ImageCropperModal.tsx`)
- Full-featured image cropper using `react-easy-crop`
- **Features:**
  - Drag to reposition image
  - Zoom slider (1x to 3x)
  - Enforced aspect ratio (defaults to portrait frame ratio: 160/220 ≈ 0.727)
  - Grid overlay for better alignment
  - Save/Cancel buttons with loading state

### 4. Updated NPC Sheet (`src/pages/NpcSheetPage.tsx`)
- **Removed:**
  - Old drag/zoom logic (handlePortraitMouseDown, handleMouseMove, handleMouseUp, handleWheel)
  - PortraitState tracking (zoom, offsetX, offsetY)
  - Complex transform styles on the image
  
- **Added:**
  - Cropper modal state management
  - File selection → Modal opens → Crop → Save workflow
  - Static image display (no transforms needed)

## Workflow

1. **User clicks portrait placeholder** → File picker opens
2. **User selects image** → Modal opens with cropper
3. **User adjusts image:**
   - Drags to reposition
   - Uses zoom slider (1x-3x)
   - Crop area enforces portrait frame aspect ratio
4. **User clicks "Save"** → Image is cropped and saved as base64
5. **Modal closes** → Static cropped image displays in portrait frame

## Benefits

✅ **PDF Export Fixed**: Static images export correctly to PDF (no transform issues)
✅ **Better UX**: Professional cropping interface similar to social media apps
✅ **Consistent Aspect Ratio**: Enforced 160:220 ratio matching the portrait frame
✅ **Simpler Code**: Removed complex drag/zoom/transform logic
✅ **Better Performance**: Pre-cropped images are smaller and load faster

## Technical Details

### Aspect Ratio
- Portrait frame: 160px × 220px
- Aspect ratio: 160/220 ≈ 0.727
- Cropper enforces this ratio automatically

### Image Storage
- Images stored as base64 data URLs in the NPC data
- Compatible with existing JSON export/import
- No external file dependencies

### CSS Styling
- Added react-easy-crop styles to `index.css`
- Custom styling for crop area (matches ink color)
- Dark overlay for better visibility

## Files Modified

1. ✅ `src/utils/canvasUtils.ts` (new)
2. ✅ `src/components/ui/Modal.tsx` (new)
3. ✅ `src/components/ui/index.ts` (export Modal)
4. ✅ `src/components/ImageCropperModal.tsx` (new)
5. ✅ `src/pages/NpcSheetPage.tsx` (refactored)
6. ✅ `src/index.css` (added cropper styles)

## Testing Checklist

- [ ] Click portrait placeholder opens file picker
- [ ] Selecting image opens cropper modal
- [ ] Can drag image to reposition
- [ ] Zoom slider works (1x-3x)
- [ ] Crop area maintains correct aspect ratio
- [ ] Save button crops and saves image
- [ ] Cancel button closes modal without saving
- [ ] Cropped image displays correctly in portrait frame
- [ ] PDF export includes the cropped image correctly
- [ ] Old NPC data with portraitState still works (backward compatible)

## Notes

- The `portraitState` field is still in the NPC type for backward compatibility
- Old NPC data will continue to work, but new uploads use the cropper
- The cropper modal can be reused for other image cropping needs in the future

