import { z } from 'zod';

// Base enums
const abilityEnum = z.enum(['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'])

const sizeEnum = z.enum(['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'])

const typeEnum = z.enum([
  'Aberration',
  'Beast',
  'Celestial',
  'Construct',
  'Dragon',
  'Elemental',
  'Fey',
  'Fiend',
  'Giant',
  'Humanoid',
  'Monstrosity',
  'Ooze',
  'Plant',
  'Undead',
])

const subTypeEnum = z.enum([
  'demon',
  'devil',
  'shapechanger',
  'any race',
  'dwarf',
  'elf',
  'gnoll',
  'gnome',
  'goblinoid',
  'grimlock',
  'human',
  'kobold',
  'lizardfolk',
  'merfolk',
  'orc',
  'sahuagin',
  'titan',
  'none',
])

const movementTypeEnum = z.enum(['walk', 'climb', 'fly', 'swim', 'burrow'])

const skillEnum = z.enum([
  'acrobatics',
  'animalHandling',
  'arcana',
  'athletics',
  'deception',
  'history',
  'insight',
  'intimidation',
  'investigation',
  'medicine',
  'nature',
  'perception',
  'performance',
  'persuasion',
  'religion',
  'sleightOfHand',
  'stealth',
  'survival',
])

const proficiencyLevelEnum = z.enum(['None', 'Proficient', 'Expertise'])

const actionTypeEnum = z.enum(['action', 'bonus', 'reaction'])

const attackTypeEnum = z.enum(['melee', 'ranged'])

const schoolEnum = z.enum([
  'Abjuration',
  'Conjuration',
  'Divination',
  'Enchantment',
  'Evocation',
  'Illusion',
  'Necromancy',
  'Transmutation',
])

const castTimeTypeEnum = z.enum(['action', 'bonus', 'hour', 'hours', 'minute', 'minutes', 'reaction'])

const rangeTypeEnum = z.enum(['Self', 'Touch', 'Sight', 'Unlimited', 'feet', 'mile', 'miles'])

const componentEnum = z.enum(['M', 'S', 'V'])

const durationTypeEnum = z.enum(['Instantaneous', 'Special', 'UntilDispelled', 'days', 'hour', 'hours', 'minute', 'minutes', 'round'])

const areaTypeEnum = z.enum(['cone', 'cube', 'cylinder', 'line', 'sphere'])

const damageTypeEnum = z.enum([
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder',
])

const scalingTypeEnum = z.enum(['Cantrip', 'Level', 'None'])

// Reusable schemas
const diceSchema = z.object({
  number: z.number().nullish(),
  size: z.number().nullish(),
  flat: z.number().nullish(),
})

const areaOfEffectSchema = z.object({
  type: areaTypeEnum,
  size: z.number(),
})

const savingThrowSchema = z.object({
  ability: abilityEnum,
  dc: z.number(),
})

// Monster & Spell Schema
export type Dnd5_1eSpell = z.infer<typeof dnd5_1eSpellSchema>
export const dnd5_1eSpellSchema = z.object({
  name: z.string(),
  level: z.number(),
  school: schoolEnum,
  castTime: z.object({
    value: z.number(),
    type: castTimeTypeEnum,
  }),
  range: z.object({
    type: rangeTypeEnum,
    value: z.number().nullish(),
  }),
  components: z.array(componentEnum),
  material: z.string().nullish(),
  duration: z.object({
    type: durationTypeEnum,
    value: z.number().nullish(),
  }),
  concentration: z.boolean(),
  ritual: z.boolean(),
  description: z.string(),
  higherLevel: z.array(z.string()).nullish(),
  attackType: attackTypeEnum.nullish(),
  dc: abilityEnum.nullish(),
  areaOfEffect: z
    .object({
      type: areaTypeEnum,
      size: z.number(),
    })
    .nullish(),
  damageOrHeal: z
    .object({
      type: damageTypeEnum.nullish(),
      dice: diceSchema,
      scalingType: scalingTypeEnum,
      numScalingDice: z.number().nullish(),
      sizeScalingDice: z.number().nullish(),
      scalingFlatMod: z.number().nullish(),
      includeMod: z.boolean().describe('default to false'),
      isHeal: z.boolean().describe('default to false'),
    })
    .nullish(),
})

/**
 * Zod schema definition for a Dungeons & Dragons 5.1e monster stat block.
 */
export type Dnd5_1eStatBlock = z.infer<typeof dnd5_1eStatBlockSchema>
export const dnd5_1eStatBlockSchema = z.object({
  name: z.string().describe('Monster name'),
  size: sizeEnum.describe('Monster size category'),
  type: typeEnum.describe('Monster type'),
  subType: subTypeEnum.nullish().describe('Monster subtype, if any'),
  alignment: z.string().describe('Alignment of the monster'),
  armorClass: z.number().describe('Armor Class value'),
  hitPoints: z.number().describe('Total hit points'),
  hitPointFormula: z.string().describe('Hit point formula, e.g., "5d8 + 16"'),
  movement: z
    .array(
      z.object({
        type: movementTypeEnum.describe('Movement type'),
        speed: z.number().describe('Speed in feet'),
      })
    )
    .describe('Movement speeds and types'),
  canHover: z.boolean().nullish().describe('Indicates if the creature can hover; defaults to false'),
  attributes: z
    .array(
      z.object({
        name: abilityEnum.describe('Ability name'),
        value: z.number().describe('Ability score value'),
        saveProficiencyLevel: proficiencyLevelEnum.describe('Proficiency level for the save which will be none by default.'),
      })
    ).length(6)
    .describe('Six different ability scores and should always have all 6 defined.'),
  skills: z
    .array(
      z.object({
        name: skillEnum.describe('Skill name'),
        skillProficiencyLevel: proficiencyLevelEnum.describe('Proficiency level for the skill which will be none by default.'),
      })
    )
    .nullish()
    .describe('Skill proficiencies'),
  damageResistances: z
    .array(z.string())
    .nullish()
    .describe('Damage types the monster is resistant to, including special types like "nonmagical weapons", "silvered weapons"'),
  damageImmunities: z
    .array(z.string())
    .nullish()
    .describe('Damage types the monster is immune to, including special types like "nonmagical weapons", "silvered weapons"'),
  damageVulnerabilities: z
    .array(z.string())
    .nullish()
    .describe('Damage types the monster is vulnerable to, including special types like "nonmagical weapons", "silvered weapons"'),
  conditionImmunities: z.array(z.string()).nullish().describe('Conditions the monster is immune to, e.g., "blinded", "poisoned"'),
  senses: z
    .object({
      passive: z.number().describe('Passive Perception score'),
      darkvision: z.number().nullish().describe('Darkvision range in feet'),
      blindsight: z.number().nullish().describe('Blindsight range in feet'),
      tremorsense: z.number().nullish().describe('Tremorsense range in feet'),
      truesight: z.number().nullish().describe('Truesight range in feet'),
      telepathy: z.boolean().nullish().describe('Indicates if the monster has telepathy'),
    })
    .describe('Sensory abilities'),
  languages: z.array(z.string()).describe('Languages the monster knows, e.g., "Common", "Draconic"'),
  challenge: z
    .number()
    .describe(
      'Challenge rating; convert fractions to decimals (e.g., "1/4" becomes 0.25). List of valid challenge ratings: 0, 0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30'
    ),
  features: z
    .array(
      z.object({
        name: z.string().describe('Feature name'),
        description: z
          .string()
          .describe('Description of features that are not: spellcasting, innate spellcasting, actions, or legendary actions'),
        usesPerDay: z.number().nullish().describe('Usage per day'),
      })
    )
    .describe('Monster special features. Will not include spellcasting or Innate spellcasting there is a special field for these'),
  spellcasting: z
    .object({
      spellcastingAbility: abilityEnum.describe('Spellcasting ability'),
      spellSlots: z
        .array(
          z.object({
            level: z.number().describe('Spell level (ignore cantrips)'),
            slots: z.number().describe('Number of slots available'),
          })
        )
        .describe(
          `Available spell slots per level. Please ensure you list spells per level for each level up to monster's max spellcasting level.`
        ),
      spells: z.array(dnd5_1eSpellSchema).describe('List of all spells known by the monster'),
    })
    .nullish()
    .describe(
      'Spellcasting section of a monster. Only populate if the monster can use spells. Convert innate and psionic spellcasting to standard spellcasting.'
    ),
  legendaryActionsPerRound: z
    .number()
    .nullish()
    .describe('Legendary actions per round. Most extremely powerful creatures or boss like will have legendary actions'),
  actions: z
    .array(
      z.object({
        name: z
          .string()
          .describe('Action name should not have any content in parentheses here. That data has a place in other action fields.'),
        description: z
          .string()
          .describe('Action description which should be 100% flavor text. All functionality should be stored in fields below.'),
        cost: z.number().nullish().describe('Only present for legendary actions, indicates action cost'),
        actionType: actionTypeEnum.nullish().describe('Type of action (action, bonus action, reaction)'),
        attackType: attackTypeEnum.nullish().describe('Type of attack if action requires an attack roll (melee or ranged)'),
        areaOfEffect: areaOfEffectSchema.nullish().describe('Area of effect shape and size if action affects an area'),
        finese: z.boolean().describe('Finese property defaulting to false usually present if using a finese weapon for an attack'),
        recharge: z.string().nullish().describe('Recharge notation, e.g., "5-6"'),
        range: z
          .object({
            normal: z
              .number()
              .describe('range in feet. Default is 5ft for melee attacks, but reach can increase. Will also be range for aoe effects'),
            long: z.number().nullish().describe('Long range in feet not always present'),
          })
          .describe('Range for melee, range, and aoe attacks'),
        savingThrow: savingThrowSchema.nullish(),
        damage: z
          .array(
            z.object({
              numDice: z
                .number()
                .describe('Number of dice typically first number in a dice expression.  Ex: 2d6 + 4 the number of dice is 2'),
              diceSize: z
                .number()
                .describe('Size of dice typically the number after the `d` in a dice expression Ex: 2d6 +4 the size of dice is 4.'),
              type: z.string().describe('Damage type, e.g., "slashing", including special types'),
            })
          )
          .nullish()
          .describe('Damage details'),
        effects: z.array(z.string()).nullish().describe('Additional effects or conditions'),
      })
    )
    .describe(
      'List of actions AND legendary actions. If you provided a value to legendaryActionsPerRound you should create both actions and legendary actions here. Legendary actions can be distinguished by setting a cost value even if it is 0.'
    ),
}).describe('D&D 5.1e Monster Stat Block')
