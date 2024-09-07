// This is pulled from Tac-Backend please keep in sync

import {number, z} from 'zod';

const sizeTypes = z.enum([
    'Tiny', 'Small', 'Medium',
    'Large', 'Huge', 'Gargantuan'
])

const monsterTypes = z.enum([
    'Aberration', 'Beast', 'Celestial',
    'Construct', 'Dragon', 'Elemental',
    'Fey', 'Fiend', 'Giant', 'Humanoid',
    'Monstrosity', 'Ooze', 'Plant', 'Undead'
])

const monsterSubTypes = z.enum([
    'demon', 'devil', 'shapechanger',
    'any race', 'dwarf', 'elf',
    'gnoll', 'gnome', 'goblinoid',
    'grimlock', 'human', 'human, shapechanger',
    'kobold', 'lizardfolk', 'merfolk',
    'orc', 'sahuagin', 'titan',
    'none'
])

const abilitiesType = z.enum([
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma"
])

const suggestedDamageTypes = [
    'acid', 'bludgeoning', 'cold',
    'fire', 'force', 'lightning',
    'necrotic', 'piercing', 'poison', 'psychic',
    'radiant', 'slashing', 'thunder', 'healing'
]

const suggestedDamageResistancesOrImmunityTypes = [
    'acid', 'bludgeoning', 'cold',
    'fire', 'force', 'lightning',
    'necrotic', 'piercing', 'poison', 'psychic',
    'radiant', 'slashing', 'thunder',
    'slashing from nonmagical attacks',
    'piercing from nonmagical attacks',
    'bludgeoning from nonmagical attacks',
    'damage from spells',
    'non magical bludgeoning, piercing, and slashing'
]

const suggestedConditionTypes = [
    'blinded', 'charmed', 'deafened',
    'exhaustion', 'frightened', 'grappled',
    'incapacitated', 'invisible', 'paralyzed',
    'petrified', 'poisoned', 'prone',
    'restrained', 'stunned', 'unconscious'
]

const suggestedLanguages = [
    'Abyssal', 'Celestial', 'Common',
    'Deep Speech', 'Draconic', 'Druidic',
    'Dwarvish', 'Elvish', 'Giant',
    'Gnomish', 'Goblin', 'Halfling', 'Infernal',
    'Orc', 'Primordial', 'Sylvan', 'Undercommon',
    'Auran', 'Aquan', 'Ignan', 'Terran',
    'Sphinx', 'telepathy', 'any language', 'all',
]

const featureType = z.object({
    name: z.string(),
    description: z.string(),
}).describe('Generally, listed below challenge but before cantrips, spells, and actions.')

const actionType = z.object({
    name: z.string(),
    description: z.string(),
    range: z.number().nullish(),
    damage: z.array(z.object({
        value: z.string().describe('Typically in a format like: 1d6 + 4'),
        type: z.array(z.string()).describe(`Typically one of: ${suggestedDamageTypes.join(', ')}`),
    })).nullish(),
    save: z.object({
        ability: abilitiesType,
        dc: number()
    }).nullish(),
    recharge: z.number().nullish(),
    cost: z.number().nullish().describe('Will only be present on legendary actions')
}).describe('Must have at least one of range, damage, save, or cost')

const legendaryActionType = z.object({
    actionsPerTurn: z.number().min(1),
    actions: z.array(actionType)
})

const innateSpellcastingType = z.object({
    spellcastingAbility: abilitiesType,
    spellSaveDC: z.number(),
    spellAttack: z.number(),
    spells: z.array(z.object({
        name: z.string(),
        timesPerDay: z.enum(['At will', '1/day', '2/day', '3/day', '4/day', '5/day'])
    })).describe('List of innate spells with usage limits')
})

const spellcastingType = z.object({
    spellcastingAbility: abilitiesType,
    spellSaveDC: z.number(),
    spellAttack: z.number(),
    spells: z.object({
        cantrips: z.array(z.string()).nullish(),
        level1: z.array(z.string()).nullish(),
        level1Slots: z.number().nullish(),
        level2: z.array(z.string()).nullish(),
        level2Slots: z.number().nullish(),
        level3: z.array(z.string()).nullish(),
        level3Slots: z.number().nullish(),
        level4: z.array(z.string()).nullish(),
        level4Slots: z.number().nullish(),
        level5: z.array(z.string()).nullish(),
        level5Slots: z.number().nullish(),
        level6: z.array(z.string()).nullish(),
        level6Slots: z.number().nullish(),
        level7: z.array(z.string()).nullish(),
        level7Slots: z.number().nullish(),
        level8: z.array(z.string()).nullish(),
        level8Slots: z.number().nullish(),
        level9: z.array(z.string()).nullish(),
        level9Slots: z.number().nullish(),
    }).describe('Spell slots by level with available spells.')
})

export type Monster5eType = z.infer<typeof monsterSchema5e>
export const monsterSchema5e = z.object({
    name: z.string(),
    size: sizeTypes,
    type: monsterTypes,
    subType: monsterSubTypes,
    armorClass: z.number().min(1),
    hitPoints: z.number(),
    hitPointFormula: z.string().describe('typically in a format like 5d8 + 16'),
    movement: z.object({
        walk: z.number().min(0).nullish()
            .describe('Any speed with no description is a walk speed.'),
        climb: z.number().min(0).nullish(),
        fly: z.number().min(0).nullish(),
        swim: z.number().min(0).nullish(),
        burrow: z.number().min(0).nullish(),
        hover: z.boolean().nullish()
    }),
    attributes: z.object({
        strength: z.number().min(1).max(30),
        dexterity: z.number().min(1).max(30),
        constitution: z.number().min(1).max(30),
        intelligence: z.number().min(1).max(30),
        wisdom: z.number().min(1).max(30),
        charisma: z.number().min(1).max(30),
    }),
    savingThrows: z.record(abilitiesType, z.number()).nullish(),
    skills: z.object({
        acrobatics: z.number().min(1).max(30).nullish(),
        animalHandling: z.number().min(1).max(30).nullish(),
        arcana: z.number().min(1).max(30).nullish(),
        athletics: z.number().min(1).max(30).nullish(),
        deception: z.number().min(1).max(30).nullish(),
        history: z.number().min(1).max(30).nullish(),
        insight: z.number().min(1).max(30).nullish(),
        intimidation: z.number().min(1).max(30).nullish(),
        investigation: z.number().min(1).max(30).nullish(),
        medicine: z.number().min(1).max(30).nullish(),
        nature: z.number().min(1).max(30).nullish(),
        perception: z.number().min(1).max(30).nullish(),
        performance: z.number().min(1).max(30).nullish(),
        persuasion: z.number().min(1).max(30).nullish(),
        religion: z.number().min(1).max(30).nullish(),
        sleightOfHand: z.number().min(1).max(30).nullish(),
        stealth: z.number().min(1).max(30).nullish(),
        survival: z.number().min(1).max(30).nullish(),
    }).nullish(),
    damageResistances: z.array(z.string())
        .describe(`Typically, one of: ${suggestedDamageResistancesOrImmunityTypes.join(', ')}`)
        .nullish(),
    damageImmunities: z.array(z.string())
        .describe(`Typically, one of: ${suggestedDamageResistancesOrImmunityTypes.join(', ')}`)
        .nullish(),
    damageVulnerabilities: z.array(z.string())
        .describe(`Typically, one of: ${suggestedDamageTypes.join(', ')}`)
        .nullish(),
    conditionImmunities: z.array(z.string())
        .describe(`Typically, one of: ${suggestedConditionTypes.join(', ')}`)
        .nullish(),
    senses: z.object({
        passivePerception: z.number().min(0).nullish(),
        darkvision: z.number().min(0).nullish(),
        blindsight: z.number().min(0).nullish(),
        tremorsense: z.number().min(0).nullish(),
        truesight: z.number().min(0).nullish(),
        telepathy: z.boolean().nullish()
    }),
    languages: z.array(z.string()).describe(`Generally, language is one of: ${suggestedLanguages.join(', ')}`),
    challenge: z.number()
        .describe('may be expressed in fraction format like 1/4 just convert to decimal'),
    xp: z.number() //Zod doesn't support enum of number. Maybe consider parsing them as strings
        .describe('Should be one of: 10, 25, 50, 100, 200, 450, 700, 1100, 1800, 2300, 2900, 3900, 11500, 13000, 15000, 18000, 20000, 22000, 25000, 33000, 41000, 50000, 62000, 75000'),
    features: z.array(featureType),
    spellcasting: spellcastingType.nullish()
        .describe('If a monster can use magic it probably has this'),
    innateSpellcasting: innateSpellcastingType.nullish()
        .describe('This is uncommonly seen and usually spellcasting should be used'),
    actions: z.array(actionType),
    legendaryActions: legendaryActionType.nullish()
})