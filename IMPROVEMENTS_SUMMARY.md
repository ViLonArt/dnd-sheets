# Improvements Summary

## ✅ Task 1: Reset Sheet Feature
- Added `reset` function to both `useCharacterForm` and `useNpcForm` hooks (already existed)
- Added "Reset" button to both Character and NPC sheet toolbars
- Implemented confirmation dialog: "Are you sure? Unsaved changes will be lost."
- Reset button clears all user input and reverts to default values

## ✅ Task 2: Improved Attribute & Modifier UI
- **Changed data structure**: Abilities now stored as numbers (1-30) instead of formatted strings
- **Separated UI**: 
  - Number input field for base Score (e.g., 16)
  - Read-only display for Modifier (e.g., +3)
- **Auto-calculation**: Modifier automatically calculated using `Math.floor((score - 10) / 2)`
- **Applied to both sheets**: Character Sheet and NPC Sheet
- **Backward compatibility**: JSON import automatically migrates old string format to new number format

## ✅ Task 3: Spell DC Math Logic
- **Spell Save DC**: Now read-only and automatically calculated
- **Formula**: `DC = 8 + Proficiency Bonus + Spellcasting Ability Modifier`
- **Spell Attack Bonus**: Also automatically calculated
- **Real-time updates**: Recalculates instantly when:
  - Proficiency Bonus changes (based on level)
  - Spellcasting Ability Score changes (INT, WIS, or CHA)
  - Spellcasting Ability field changes
- **Smart parsing**: Handles various spellcasting ability input formats (INT, WIS, CHA, Intelligence, Wisdom, Charisma, etc.)

## ✅ Task 4: PDF Export (Replaces PNG)
- **New utility**: `exportToPdf()` function in `src/utils/pdf.ts`
- **High quality**: Uses html2canvas with 3x scale for crisp text
- **A4 format**: Automatically fits content to A4 page size while maintaining aspect ratio
- **Updated hooks**: `useExportToImage` now exports to PDF instead of PNG
- **Updated UI**: Button text changed from "Télécharger en PNG" to "Télécharger en PDF"
- **File names**: Exports as `.pdf` files (fiche-pj.pdf, fiche-pnj.pdf)

## Installation Note

To use PDF export, you need to install `jspdf`:

```bash
npm install jspdf
```

The package.json has been updated to include jspdf in dependencies.

## Breaking Changes

### Data Format Migration
- **Abilities format changed**: From `"16 (+3)"` (string) to `16` (number)
- **Automatic migration**: Old JSON files will be automatically converted on import
- **New exports**: Will use the new number format

### Spell DC Field
- **No longer editable**: Spell DC is now read-only and calculated automatically
- **Old data**: If you have old JSON files with manual spellDC values, they will be overwritten with calculated values

## Testing Checklist

- [ ] Reset button works and shows confirmation dialog
- [ ] Ability scores can be entered as numbers
- [ ] Modifiers display correctly and update automatically
- [ ] Spell DC calculates correctly based on proficiency bonus and ability modifier
- [ ] Spell Attack Bonus calculates correctly
- [ ] PDF export works (after installing jspdf)
- [ ] Old JSON files import correctly (abilities migrate from string to number)
- [ ] New JSON files export with number format abilities

