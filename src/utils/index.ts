/**
 * Utility functions export
 */

export {
  exportCharacterToJson,
  exportNpcToJson,
  importCharacterFromJson,
  importNpcFromJson,
} from './json'

export {
  saveCharacterToStorage,
  loadCharacterFromStorage,
} from './storage'

export { exportToPdf } from './pdf'
export { exportToPng, prepareDomForExport } from './imageExport'

export {
  RULESET_2024,
  calculateProficiencyBonus,
  calculateMulticlassSpellSlots,
  createLevelUpDraft,
  applyLevelUpDecisions,
  levelUp,
} from './advancementEngine'

export { getDictionary, t } from './i18n'

export {
  POINT_BUY_TOTAL_POINTS,
  POINT_BUY_MIN_SCORE,
  POINT_BUY_MAX_SCORE,
  POINT_BUY_COST_TABLE,
  validatePointBuy as validatePointBuyRules,
  type PointBuyValidationResult,
} from './pointBuyRules'

export {
  getPointCost,
  getTotalPointCost,
  validatePointBuy,
  POINT_BUY_COSTS,
} from './pointBuy'

export {
  applyAdvancementToCharacter,
  buildAdvancementCharacter,
  getAdvancementMode,
  resolveBackgroundId,
  resolveClassId,
  resolveFeatId,
  resolveSpeciesId,
  resolveSubclassId,
} from './advancementMapper'

