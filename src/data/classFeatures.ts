export type FeatureDefinition = {
  id: string
  name: string // French name
  description?: string
  type: 'counter' | 'toggle' | 'static'
  reset?: 'short' | 'long'
  maxScaling?: {
    type: 'fixed' | 'level_table' | 'stat_mod' | 'proficiency'
    value?: number // For fixed
    stat?: string // For stat_mod (e.g., 'wisdom')
    table?: Record<number, number> // For level_table: { 1: 2, 3: 3 }
  }
  requiredLevel: number
  subclass?: string // If null, applies to base class
}

export const CLASS_FEATURES: Record<string, FeatureDefinition[]> = {
  Barbare: [
    {
      id: 'barbarian_rage',
      name: 'Rage',
      type: 'counter',
      reset: 'long',
      maxScaling: {
        type: 'level_table',
        table: {
          1: 2,
          3: 3,
          6: 4,
          12: 5,
          17: 6,
        },
      },
      requiredLevel: 1,
    },
    {
      id: 'barbarian_reckless_attack',
      name: 'Attaque Téméraire',
      type: 'toggle',
      requiredLevel: 2,
    },
    {
      id: 'barbarian_primal_knowledge',
      name: 'Fureur Intimidante',
      type: 'static',
      requiredLevel: 3,
    },
  ],
  Barde: [
    {
      id: 'bardic_inspiration',
      name: 'Inspiration Bardique',
      type: 'counter',
      reset: 'long',
      maxScaling: {
        type: 'stat_mod',
        stat: 'cha',
      },
      requiredLevel: 1,
    },
    {
      id: 'bard_countercharm',
      name: 'Contre-charme',
      type: 'static',
      requiredLevel: 6,
    },
  ],
  Clerc: [
    {
      id: 'cleric_channel_divinity',
      name: 'Conduit Divin',
      type: 'counter',
      reset: 'short',
      maxScaling: {
        type: 'level_table',
        table: {
          2: 2,
          6: 3,
          18: 4,
        },
      },
      requiredLevel: 2,
    },
    {
      id: 'cleric_divine_intervention',
      name: 'Intervention Divine',
      type: 'counter',
      reset: 'long',
      maxScaling: {
        type: 'fixed',
        value: 1,
      },
      requiredLevel: 10,
    },
  ],
  Druide: [
    {
      id: 'druid_wild_shape',
      name: 'Forme Sauvage',
      type: 'counter',
      reset: 'short',
      maxScaling: {
        type: 'level_table',
        table: {
          2: 2,
          6: 3,
          10: 4,
          14: 5,
          18: 6,
        },
      },
      requiredLevel: 2,
    },
    {
      id: 'druid_archdruid',
      name: 'Archidruide',
      type: 'static',
      requiredLevel: 20,
    },
  ],
  Guerrier: [
    {
      id: 'fighter_second_wind',
      name: 'Second Souffle',
      type: 'counter',
      reset: 'short',
      maxScaling: {
        type: 'level_table',
        table: {
          1: 2,
          4: 3,
          10: 4,
        },
      },
      requiredLevel: 1,
    },
    {
      id: 'fighter_action_surge',
      name: "Sursaut d'Activité",
      type: 'counter',
      reset: 'short',
      maxScaling: {
        type: 'level_table',
        table: {
          2: 1,
          17: 2,
        },
      },
      requiredLevel: 2,
    },
    {
      id: 'fighter_indomitable',
      name: 'Indomptable',
      type: 'counter',
      reset: 'long',
      maxScaling: {
        type: 'fixed',
        value: 1,
      },
      requiredLevel: 9,
    },
    {
      id: 'fighter_superiority_dice',
      name: 'Dés de Supériorité',
      type: 'counter',
      reset: 'short',
      maxScaling: {
        type: 'level_table',
        table: {
          3: 4,
          7: 5,
          10: 6,
          15: 7,
          18: 8,
        },
      },
      requiredLevel: 3,
      subclass: 'Maître de Guerre',
    },
  ],
  Moine: [
    {
      id: 'monk_uncanny_metabolism',
      name: 'Métabolisme Étrange',
      type: 'counter',
      reset: 'long',
      maxScaling: {
        type: 'fixed',
        value: 1,
      },
      requiredLevel: 2,
    },
    {
      id: 'monk_deflect_missiles',
      name: 'Déviation de Projectiles',
      type: 'static',
      requiredLevel: 3,
    },
  ],
  Paladin: [
    {
      id: 'paladin_lay_on_hands',
      name: 'Imposition des Mains',
      type: 'counter',
      reset: 'long',
      maxScaling: {
        type: 'level_table',
        table: {
          1: 5,
          2: 10,
          3: 15,
          4: 20,
          5: 25,
          6: 30,
          7: 35,
          8: 40,
          9: 45,
          10: 50,
          11: 55,
          12: 60,
          13: 65,
          14: 70,
          15: 75,
          16: 80,
          17: 85,
          18: 90,
          19: 95,
          20: 100,
        },
      },
      requiredLevel: 1,
    },
    {
      id: 'paladin_divine_smite',
      name: 'Châtiment Divin',
      type: 'toggle',
      requiredLevel: 2,
    },
  ],
  Rôdeur: [
    {
      id: 'ranger_favored_enemy',
      name: 'Ennemi Juré',
      type: 'counter',
      reset: 'long',
      maxScaling: {
        type: 'stat_mod',
        stat: 'wis',
      },
      requiredLevel: 1,
    },
    {
      id: 'ranger_deft_explorer',
      name: 'Sens Sauvage',
      type: 'static',
      requiredLevel: 2,
    },
  ],
  Roublard: [
    {
      id: 'rogue_sneak_attack',
      name: 'Attaque Sournoise',
      type: 'static',
      maxScaling: {
        type: 'level_table',
        table: {
          1: 1,
          3: 2,
          5: 3,
          7: 4,
          9: 5,
          11: 6,
          13: 7,
          15: 8,
          17: 9,
          19: 10,
        },
      },
      requiredLevel: 1,
    },
    {
      id: 'rogue_cunning_action',
      name: 'Ruse',
      type: 'static',
      requiredLevel: 2,
    },
  ],
  Ensorceleur: [
    {
      id: 'sorcerer_font_of_magic',
      name: 'Fontaine de Magie',
      type: 'static',
      requiredLevel: 2,
    },
    {
      id: 'sorcerer_metamagic',
      name: 'Métamagie',
      type: 'toggle',
      requiredLevel: 3,
    },
  ],
  Occultiste: [
    {
      id: 'warlock_mystic_arcanum',
      name: 'Arcanum Mystique',
      type: 'counter',
      reset: 'long',
      maxScaling: {
        type: 'level_table',
        table: {
          11: 1,
          13: 2,
          15: 3,
          17: 4,
        },
      },
      requiredLevel: 11,
    },
    {
      id: 'warlock_pact_boon',
      name: 'Faveur de Pacte',
      type: 'static',
      requiredLevel: 3,
    },
  ],
  Magicien: [
    {
      id: 'wizard_arcane_recovery',
      name: 'Récupération Arcanique',
      type: 'counter',
      reset: 'long',
      maxScaling: {
        type: 'fixed',
        value: 1,
      },
      requiredLevel: 1,
    },
    {
      id: 'wizard_spell_mastery',
      name: 'Maîtrise des Sorts',
      type: 'static',
      requiredLevel: 18,
    },
  ],
}
