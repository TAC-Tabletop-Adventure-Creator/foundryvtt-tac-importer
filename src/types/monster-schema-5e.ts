import {z} from 'zod';

// Base enums
const abilityEnum = z.enum([
    'Strength',
    'Dexterity',
    'Constitution',
    'Intelligence',
    'Wisdom',
    'Charisma',
]);

const sizeEnum = z.enum(['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']);

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
]);

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
]);

const movementTypeEnum = z.enum(['walk', 'climb', 'fly', 'swim', 'burrow']);

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
]);

const proficiencyLevelEnum = z.enum(['None', 'Proficient', 'Expertise']);

const actionTypeEnum = z.enum(['action', 'bonus', 'reaction']);

const attackTypeEnum = z.enum(['melee', 'ranged']);

const schoolEnum = z.enum([
    "Abjuration",
    "Conjuration", 
    "Divination",
    "Enchantment",
    "Evocation",
    "Illusion",
    "Necromancy",
    "Transmutation",
]);

const castTimeTypeEnum = z.enum([
    "action",
    "bonus",
    "hour",
    "hours", 
    "minute",
    "minutes",
    "reaction",
]);

const rangeTypeEnum = z.enum([
    "Self",
    "Touch",
    "Sight",
    "Unlimited",
    "feet",
    "mile",
    "miles",
]);

const componentEnum = z.enum([
    "M",
    "S",
    "V",
]);

const durationTypeEnum = z.enum([
    "Instantaneous",
    "Special",
    "UntilDispelled",
    "days",
    "hour",
    "hours",
    "minute",
    "minutes",
    "round",
]);

const areaTypeEnum = z.enum([
    "cone",
    "cube",
    "cylinder", 
    "line",
    "sphere",
]);

const damageTypeEnum = z.enum([
    "acid",
    "bludgeoning",
    "cold",
    "fire",
    "force",
    "lightning",
    "necrotic",
    "piercing",
    "poison",
    "psychic",
    "radiant",
    "slashing",
    "thunder",
]);

const scalingTypeEnum = z.enum([
    "Cantrip",
    "Level",
    "None",
]);

// Reusable schemas
const diceSchema = z.object({
    number: z.number().nullish(),
    size: z.number().nullish(),
    flat: z.number().nullish(),
});

const areaOfEffectSchema = z.object({
    type: areaTypeEnum,
    size: z.number(),
});

const savingThrowSchema = z.object({
    ability: abilityEnum,
    dc: z.number(),
});

// Monster & Spell Schema
export type Spell = z.infer<typeof spellSchema>;
export const spellSchema = z.object({
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
    areaOfEffect: z.object({
        type: areaTypeEnum,
        size: z.number(),
    }).nullish(),
    damageOrHeal: z.object({
        type: damageTypeEnum.nullish(),
        dice: diceSchema,
        scalingType: scalingTypeEnum,
        numScalingDice: z.number().nullish(),
        sizeScalingDice: z.number().nullish(),
        scalingFlatMod: z.number().nullish(),
        includeMod: z.boolean(),
        isHeal: z.boolean(),
    }).nullish(),
});

export type DnDFiveOneEStatBlock = z.infer<typeof monsterSchema5e>;
export const monsterSchema5e = z.object({
    name: z.string(),
    size: sizeEnum,
    type: typeEnum,
    subType: subTypeEnum.nullish(),
    alignment: z.string(),
    armorClass: z.number(),
    hitPoints: z.number(),
    hitPointFormula: z.string(),
    movement: z
        .array(
            z.object({
                type: movementTypeEnum,
                speed: z.number(),
            })
        ),
    canHover: z
        .boolean()
        .nullish(),
    attributes: z
        .array(
            z.object({
                name: abilityEnum,
                value: z.number(),
                saveProficiencyLevel: proficiencyLevelEnum,
            })
        ),
    skills: z
        .array(
            z.object({
                name: skillEnum,
                skillProficiencyLevel: proficiencyLevelEnum,
            })
        )
        .nullish(),
    damageResistances: z
        .array(z.string())
        .nullish(),
    damageImmunities: z
        .array(z.string())
        .nullish(),
    damageVulnerabilities: z
        .array(z.string())
        .nullish(),
    conditionImmunities: z
        .array(z.string())
        .nullish(),
    senses: z
        .object({
            passive: z.number(),
            darkvision: z.number().nullish(),
            blindsight: z.number().nullish(),
            tremorsense: z.number().nullish(),
            truesight: z.number().nullish(),
            telepathy: z.boolean().nullish(),
        }),
    languages: z
        .array(z.string()),
    challenge: z
        .number(),
    features: z
        .array(
            z.object({
                name: z.string(),
                description: z.string(),
                usesPerDay: z.number().nullish(),
            })
        ),
    spellcasting: z
        .object({
            spellcastingAbility: abilityEnum,
            spellSlots: z
                .array(z.object({
                    level: z.number(),
                    slots: z.number(),
                })),
            spells: z
                .array(spellSchema),
        })
        .nullish(),
    legendaryActionsPerRound: z.number().nullish(),
    actions: z
        .array(
            z.object({
                name: z.string(),
                description: z.string(),
                cost: z
                    .number()
                    .nullish(),
                actionType: actionTypeEnum.nullish(),
                attackType: attackTypeEnum.nullish(),
                areaOfEffect: areaOfEffectSchema.nullish(),
                finese: z.boolean(),
                recharge: z.string().nullish(),
                range: z
                    .object({
                        normal: z.number(),
                        long: z.number().nullish(),
                    }),
                savingThrow: savingThrowSchema.nullish(),
                damage: z
                    .array(
                        z.object({
                            numDice: z.number(),
                            diceSize: z.number(),
                            type: z.string(),
                        })
                    )
                    .nullish(),
                effects: z.array(z.string()).nullish(),
            })
        ),
});
