# Level Up Code Review – Inconsistencies Found & Fixed

## Fixes Applied

### 1. Optional choice (minSelections: 0) – missing decision
**Issue:** For `bardSpellReplace` (remove step) with `minSelections: 0`, if the user never interacts with the dropdown, no decision exists. `applyLevelUpDecisions` would add `choice_missing` even though the choice is optional.

**Fix:** In `advancementEngine.ts`, when `!decision` and `choice.minSelections === 0`, return early without error instead of adding `choice_missing`.

### 2. Defensive optional chaining
**Issue:** If `fightingStyleLevels` or `weaponMastery` were undefined on a class definition, the code could throw.

**Fix:** Added `classDef.fightingStyleLevels?.includes(...)` and `(classDef.weaponMastery ?? [])` for safety.

---

## Other Observations

### Data flow consistency
- **Decisions format:** LevelUpWizard stores decisions as `Record<string, LevelUpDecision>` keyed by choiceId, then passes `Object.values(decisions)` to `applyLevelUpDecisions`, which expects `LevelUpDecision[]`. Each decision includes `choiceId`. ✓

### Choice ID patterns
- `subclass-${classId}-${level}`
- `featOrAsi-${classId}-${level}`
- `class-bard-replace-remove-${level}` / `class-bard-replace-add-${level}`
- `feature-${featureId}` (Bard expertise, Magical Secrets)
- `weaponMastery-${classId}-${level}-${index}-${slot}`

### Bard spell replace – option labels
- Replaceable spells use `nameKey: s.name` (raw spell name) instead of an i18n key. For EN this works; for FR, spell names would not translate. Possible improvement: resolve spell name via locale in the engine or ChoiceOption.

### Skill labels – locale
- `SKILL_DATA` in `constants.ts` has hardcoded French labels (e.g. `'Acrobaties (DEX)'`). `LevelUpDetailPanel` uses these for background skills, so labels may be wrong when locale is EN. The project may be French-primary.

### Tool choice type
- Bard tool choice uses `type: 'backgroundTool'` and `labelKey: 'choice.bardTools'`. The type name does not match the source (class, not background) but is consistent with how tool choices are processed.

### showWhenChoiceFilled vs dependsOn
- `dependsOn`: choice is shown only when another choice has a specific value.
- `showWhenChoiceFilled`: choice is shown when another choice has any non-empty selection.
- Both are respected in `nonWeaponMasteryChoices` filtering and in `applyLevelUpDecisions`.

### ASI / feat ID mapping
- featOrAsi uses option id `'asi'`; the actual feat in rules is `'ability-score-improvement'`.
- `LevelUpDetailPanel` maps `'asi'` → `'ability-score-improvement'` for lookup. ✓
