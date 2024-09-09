import { ConstructorDataType } from "@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes";
import { TokenPlacementType, TokenType } from "../types/tac-types";
import { Logger } from "../classes/logging";

type ActorCreationData = ConstructorDataType<foundry.data.ActorData> | (ConstructorDataType<foundry.data.ActorData> & Record<string, unknown>);

export const convertTacTokenToFoundryActor = (
    tokenPlacement: TokenPlacementType,
    tokenData: TokenType,
    folder: Folder | undefined
): ActorCreationData => {
    // @ts-ignore
    const systemId = game.system.id;
    let actorData: ActorCreationData = {
        name: tokenPlacement.name || tokenData.name,
        folder: folder || undefined,
        type: 'npc',
        img: tokenData.imageUrl
    };

    switch (systemId) {
        case 'dnd5e':
            actorData = {
                ...actorData,
                ...getDnd5eActorData(tokenPlacement, tokenData)
            };
            break;
        default:
            Logger.warning(`System: ${systemId} is not yet supported`);
    }
    return actorData;
};

const getDnd5eActorData = (tokenPlacement: TokenPlacementType, tokenData: TokenType): Partial<ActorCreationData> => {
    const statBlock = tokenPlacement.statBlocks.dnd5e;
    if (!statBlock) {
        Logger.warning(`No D&D 5e stat block found for token: ${tokenPlacement.name}`);
        return {};
    }

    const featureItems = statBlock.features?.map(feature => ({
        name: feature.name,
        type: "feat",
        system: {
            description: {
                value: feature.description
            }
        }
    })) || [];

    // TODO we don't really handle spell melee or range attacks atm.
    const actionItems = statBlock.actions?.map(action => {
        return {
            name: action.name,
            type: "weapon",
            system: {
                description: {
                    value: action.description
                },
                activation: {
                    type: "action",
                    cost: action.cost || 1
                },
                range: {
                    value: action.range?.min || action.reach || 5,
                    long: action.range?.max || undefined,
                    units: "ft"
                },
                damage: {
                    parts: action.damage?.map(dmg => [
                        dmg.value,
                        dmg.type.join(', ')
                    ])
                },
                save: {
                  ability: action.savingThrow?.ability,
                  dc: action.savingThrow?.dc,
                  scaling: action.savingThrow ? 'flat' : undefined
                },
                attack: {
                    bonus: action.bonusToHit,
                    flat: true // prevent proficiency bonus from apply to hit roll
                },
                ability: "none", // This is none to prevent ability mod on the to hit and damage rolls
                actionType: action.attackType?.toLowerCase().includes("melee weapon attack") ? "mwak" :
                    action.attackType?.toLowerCase().includes("ranged weapon attack") ? "rwak" :
                        action.savingThrow ? "save" :
                            "other",
                proficient: true
            }
        };
    }) || [];

    // TODO spells aren't implemented this is wrong.
    const spellData = {
        "spell0": statBlock.spellcasting?.spells.cantrips
            ? { spells: statBlock.spellcasting?.spells.cantrips?.join(', ') }
            : undefined,
        "spell1": statBlock.spellcasting?.spells.level1Slots
            ? {
                value: statBlock.spellcasting.spells.level1Slots,
                max: statBlock.spellcasting.spells.level1Slots,
                spells: statBlock.spellcasting?.spells.level1?.join(', ')
            }
            : undefined,
        "spell2": statBlock.spellcasting?.spells.level2Slots
            ? {
                value: statBlock.spellcasting.spells.level2Slots,
                max: statBlock.spellcasting.spells.level2Slots,
                spells: statBlock.spellcasting?.spells.level2?.join(', ')
            }
            : undefined,
        "spell3": statBlock.spellcasting?.spells.level3Slots
            ? {
                value: statBlock.spellcasting.spells.level3Slots,
                max: statBlock.spellcasting.spells.level3Slots,
                spells: statBlock.spellcasting?.spells.level3?.join(', ')
            }
            : undefined,
        "spell4": statBlock.spellcasting?.spells.level4Slots
            ? {
                value: statBlock.spellcasting.spells.level4Slots,
                max: statBlock.spellcasting.spells.level4Slots,
                spells: statBlock.spellcasting?.spells.level4?.join(', ')
            }
            : undefined,
        "spell5": statBlock.spellcasting?.spells.level5Slots
            ? {
                value: statBlock.spellcasting.spells.level5Slots,
                max: statBlock.spellcasting.spells.level5Slots,
                spells: statBlock.spellcasting?.spells.level5?.join(', ')
            }
            : undefined,
        "spell6": statBlock.spellcasting?.spells.level6Slots
            ? {
                value: statBlock.spellcasting.spells.level6Slots,
                max: statBlock.spellcasting.spells.level6Slots,
                spells: statBlock.spellcasting?.spells.level6?.join(', ')
            }
            : undefined,
        "spell7": statBlock.spellcasting?.spells.level7Slots
            ? {
                value: statBlock.spellcasting.spells.level7Slots,
                max: statBlock.spellcasting.spells.level7Slots,
                spells: statBlock.spellcasting?.spells.level7?.join(', ')
            }
            : undefined,
        "spell8": statBlock.spellcasting?.spells.level8Slots
            ? {
                value: statBlock.spellcasting.spells.level8Slots,
                max: statBlock.spellcasting.spells.level8Slots,
                spells: statBlock.spellcasting?.spells.level8?.join(', ')
            }
            : undefined,
        "spell9": statBlock.spellcasting?.spells.level9Slots
            ? {
                value: statBlock.spellcasting.spells.level9Slots,
                max: statBlock.spellcasting.spells.level9Slots,
                spells: statBlock.spellcasting?.spells.level9?.join(', ')
            }
            : undefined,
    }

    /*
    5e npc model: https://github.com/foundryvtt/dnd5e/blob/master/module/data/actor/npc.mjs
    built on creature template: https://github.com/foundryvtt/dnd5e/blob/4.0.x/module/data/actor/templates/creature.mjs#L34
    built on common model: https://github.com/foundryvtt/dnd5e/blob/4.0.x/module/data/actor/templates/common.mjs#L26

    TODO saves are not yet confirmed to work need better test data
    TODO damage resistances, vulnerabilities, and immunities as well as condition immunities not yet tested
     */
    return {
        system: {
            traits: {
                size: sizeAbbreviationMapping[statBlock.size],
                dr: statBlock.damageResistances?.join(','),
                di: statBlock.damageImmunities?.join(','),
                dv: statBlock.damageVulnerabilities?.join(','),
                ci: statBlock.conditionImmunities?.join(','),
                languages: {
                    value: statBlock.languages || []
                },
            },
            attributes: {
                hp: {
                    value: statBlock.hitPoints,
                    max: statBlock.hitPoints,
                    formula: statBlock.hitPointFormula
                },
                ac: {
                    value: statBlock.armorClass
                },
                movement: {
                    walk: statBlock.movement.walk,
                    fly: statBlock.movement.fly,
                    swim: statBlock.movement.swim,
                    climb: statBlock.movement.climb,
                    burrow: statBlock.movement.burrow,
                    hover: statBlock.movement.hover || false
                },
                senses: {
                    darkvision: statBlock.senses.darkvision,
                    blindsight: statBlock.senses.blindsight,
                    tremorsense: statBlock.senses.tremorsense,
                    truesight: statBlock.senses.truesight,
                    perception: statBlock.senses.passivePerception,
                    special: statBlock.senses.telepathy ? 'Telepathy' : undefined,
                },
                spellcasting: abilityToAbbrev(statBlock.spellcasting?.spellcastingAbility),
                spelldc: statBlock.spellcasting?.spellSaveDC,
                spellattack: statBlock.spellcasting?.spellAttack,
            },
            abilities: {
                str: {
                    value: statBlock.attributes.strength,
                    save: statBlock.savingThrows?.strength
                },
                dex: {
                    value: statBlock.attributes.dexterity,
                    save: statBlock.savingThrows?.dexterity
                },
                con: {
                    value: statBlock.attributes.constitution,
                    save: statBlock.savingThrows?.constitution
                },
                int: {
                    value: statBlock.attributes.intelligence,
                    save: statBlock.savingThrows?.intelligence
                },
                wis: {
                    value: statBlock.attributes.wisdom,
                    save: statBlock.savingThrows?.wisdom
                },
                cha: {
                    value: statBlock.attributes.charisma,
                    save: statBlock.savingThrows?.charisma
                }
            },
            skills: {
                acr: {
                    value: statBlock.skills?.acrobatics || 0,
                    mod: calculateSkillModifier(statBlock.attributes.dexterity, statBlock.skills?.acrobatics || undefined).baseModifier,
                    bonus: calculateSkillModifier(statBlock.attributes.dexterity, statBlock.skills?.acrobatics || undefined).bonus
                },
                ani: {
                    value: statBlock.skills?.animalHandling || 0,
                    mod: calculateSkillModifier(statBlock.attributes.wisdom, statBlock.skills?.animalHandling || undefined).baseModifier,
                    bonus: calculateSkillModifier(statBlock.attributes.wisdom, statBlock.skills?.animalHandling || undefined).bonus
                },
                arc: {
                    value: statBlock.skills?.arcana || 0,
                    mod: calculateSkillModifier(statBlock.attributes.intelligence, statBlock.skills?.arcana || undefined).baseModifier,
                    bonus: calculateSkillModifier(statBlock.attributes.intelligence, statBlock.skills?.arcana || undefined).bonus
                },
                ath: {
                    value: statBlock.skills?.athletics || 0,
                    mod: calculateSkillModifier(statBlock.attributes.strength, statBlock.skills?.athletics || undefined).baseModifier,
                    bonus: calculateSkillModifier(statBlock.attributes.strength, statBlock.skills?.athletics || undefined).bonus
                },
                dec: {
                    value: statBlock.skills?.deception || 0,
                    mod: calculateSkillModifier(statBlock.attributes.charisma, statBlock.skills?.deception || undefined).baseModifier,
                    bonus: calculateSkillModifier(statBlock.attributes.charisma, statBlock.skills?.deception || undefined).bonus
                },
                his: {
                    value: statBlock.skills?.history || 0,
                    mod: calculateSkillModifier(statBlock.attributes.intelligence, statBlock.skills?.history || undefined).baseModifier,
                    bonus: calculateSkillModifier(statBlock.attributes.intelligence, statBlock.skills?.history || undefined).bonus
                },
                ins: {
                    value: statBlock.skills?.insight || 0,
                    mod: calculateSkillModifier(statBlock.attributes.wisdom, statBlock.skills?.insight || undefined).baseModifier,
                    bonus: calculateSkillModifier(statBlock.attributes.wisdom, statBlock.skills?.insight || undefined).bonus
                },
                itm: {
                    value: statBlock.skills?.intimidation || 0,
                    mod: calculateSkillModifier(statBlock.attributes.charisma, statBlock.skills?.intimidation || undefined).baseModifier,
                    bonus: calculateSkillModifier(statBlock.attributes.charisma, statBlock.skills?.intimidation || undefined).bonus
                },
                inv: {
                    value: statBlock.skills?.investigation || 0,
                    mod: calculateSkillModifier(statBlock.attributes.intelligence, statBlock.skills?.investigation || undefined).baseModifier,
                    bonus: calculateSkillModifier(statBlock.attributes.intelligence, statBlock.skills?.investigation || undefined).bonus
                },
                med: {
                    value: statBlock.skills?.medicine || 0,
                    mod: calculateSkillModifier(statBlock.attributes.wisdom, statBlock.skills?.medicine || undefined).baseModifier,
                    bonus: calculateSkillModifier(statBlock.attributes.wisdom, statBlock.skills?.medicine || undefined).bonus
                },
                nat: {
                    value: statBlock.skills?.nature || 0,
                    mod: calculateSkillModifier(statBlock.attributes.intelligence, statBlock.skills?.nature || undefined).baseModifier,
                    bonus: calculateSkillModifier(statBlock.attributes.intelligence, statBlock.skills?.nature || undefined).bonus
                },
                prc: {
                    value: statBlock.skills?.perception || 0,
                    mod: calculateSkillModifier(statBlock.attributes.wisdom, statBlock.skills?.perception || undefined).baseModifier,
                    bonus: calculateSkillModifier(statBlock.attributes.wisdom, statBlock.skills?.perception || undefined).bonus
                },
                prf: {
                    value: statBlock.skills?.performance || 0,
                    mod: calculateSkillModifier(statBlock.attributes.charisma, statBlock.skills?.performance || undefined).baseModifier,
                    bonus: calculateSkillModifier(statBlock.attributes.charisma, statBlock.skills?.performance || undefined).bonus
                },
                per: {
                    value: statBlock.skills?.persuasion || 0,
                    mod: calculateSkillModifier(statBlock.attributes.charisma, statBlock.skills?.persuasion || undefined).baseModifier,
                    bonus: calculateSkillModifier(statBlock.attributes.charisma, statBlock.skills?.persuasion || undefined).bonus
                },
                rel: {
                    value: statBlock.skills?.religion || 0,
                    mod: calculateSkillModifier(statBlock.attributes.intelligence, statBlock.skills?.religion || undefined).baseModifier,
                    bonus: calculateSkillModifier(statBlock.attributes.intelligence, statBlock.skills?.religion || undefined).bonus
                },
                slt: {
                    value: statBlock.skills?.sleightOfHand || 0,
                    mod: calculateSkillModifier(statBlock.attributes.dexterity, statBlock.skills?.sleightOfHand || undefined).baseModifier,
                    bonus: calculateSkillModifier(statBlock.attributes.dexterity, statBlock.skills?.sleightOfHand || undefined).bonus
                },
                ste: {
                    value: statBlock.skills?.stealth || 0,
                    mod: calculateSkillModifier(statBlock.attributes.dexterity, statBlock.skills?.stealth || undefined).baseModifier,
                    bonus: calculateSkillModifier(statBlock.attributes.dexterity, statBlock.skills?.stealth || undefined).bonus
                },
                sur: {
                    value: statBlock.skills?.survival || 0,
                    mod: calculateSkillModifier(statBlock.attributes.wisdom, statBlock.skills?.survival || undefined).baseModifier,
                    bonus: calculateSkillModifier(statBlock.attributes.wisdom, statBlock.skills?.survival || undefined).bonus
                }
            },
            details: {
                type: {
                    value: statBlock.type,
                    subType: statBlock.subType,
                },
                cr: statBlock.challenge,
                xp: { value: statBlock.xp },
            },
            spells: spellData
        },
        items: [
            ...featureItems,
            ...actionItems
        ],
    };
};

const calculateSkillModifier = (stat: number, skillOverride: number | undefined): { baseModifier: number, bonus: number } => {
    const baseModifier = Math.floor((stat - 10) / 2);
    if (skillOverride === undefined) {
        return { baseModifier, bonus: 0 };
    }
    const bonus = skillOverride - baseModifier;
    return { baseModifier, bonus };
};

const sizeAbbreviationMapping = {
    Tiny: 'tiny',
    Small: 'sm',
    Medium: 'med',
    Large: 'lg',
    Huge: 'huge',
    Gargantuan: 'grg'
}

const abilityToAbbrev = (ability?: string): string | undefined => {
    const mapping: Record<string, string> = {
        "strength": "str",
        "dexterity": "dex",
        "constitution": "con",
        "intelligence": "int",
        "wisdom": "wis",
        "charisma": "cha"
    };

    return ability ? mapping[ability.toLowerCase()] : undefined;
};