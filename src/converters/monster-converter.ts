import { ConstructorDataType } from "@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes";
import { Logger } from "../classes/logging";
import { undefined } from "zod";


type ActorCreationData =
    ConstructorDataType<foundry.data.ActorData>
    | (ConstructorDataType<foundry.data.ActorData> & Record<string, unknown>);

export const convertMonsterToFoundryActor = (monsterData: any, folder: Folder | undefined) => {
    // @ts-ignore
    const systemId = game.system.id;
    let actorData: ActorCreationData = {
        name: monsterData.name,
        folder: folder,
        type: "npc",
        img: monsterData.imageUrl
    };

    switch (systemId) {
        case "dnd5e":
            actorData = {
                ...actorData,
                ...getDnD5eActorData(monsterData)
            };
            break;
        default:
            Logger.warning(`System: ${systemId} is not yet supported`);
    }
    return actorData;
};

const getDnD5eActorData = (monsterData: any): Partial<ActorCreationData> => {
    const statBlock = monsterData.statBlocks["DnD-5.1e"];
    if (!statBlock) {
        Logger.warning(`No D&D 5e stat block found for token: ${monsterData.name}`);
        return {};
    }

    const featureItems = statBlock.features?.map((feature: any) => ({
        name: feature.name,
        type: "feat",
        system: {
            description: {
                value: feature.description
            },
            uses: { //TODO this cause a type error, but works...
                max: feature.usesPerDay
            }
        }
    })) || [];

    // Legendary actions will have a cost component
    const actionItems = statBlock.actions?.filter((action: any) => action.cost === null).map((action: any) => ({
        name: action.name,
        type: "weapon",
        system: {
            equipped: true,
            description: {
                value: action.description
            },
            properties: {
                fin: action.finese
            },
            save: {
                ability: action.savingThrow ? abilityAbbreviationMapping[action.savingThrow?.ability] : undefined,
                dc: action.savingThrow ? getSavingThrowDc(statBlock, action.savingThrow?.ability) : undefined,
                scaling: "flat"
            },
            ability: 'none', // remove ability modifier for damage
            damage: {
                parts: action.damage?.map((dmg: any) => {
                    const dmgString = dmg.numDice + 'd' + dmg.diceSize
                    return [
                        dmgString,
                        dmg.type
                    ]
                }),
            },
            proficient: true,
            activities: {
                dnd5eactivity000: {
                    type: "attack",
                    activation: {
                        type: action.actionType,
                        value: 1,
                    },
                    range: { //TODO long?
                        value: action.range.normal,
                        units: 'ft'
                    },
                    attack: {
                        ability: getAbilityAttackBonus(statBlock, action),
                        flat: false,
                        type: {
                            value: action.attackType === 'melee' ? 'mwak' :
                                action.attackType === 'range' ? 'rwak' : 'other',
                            classification: "weapon"
                        }
                    }
                }
            }
        }
    })) || [];

    const spellSlots = {
        spell1: { value: getSpellSlotValue(statBlock, 1), override: null },
        spell2: { value: getSpellSlotValue(statBlock, 2), override: null }, 
        spell3: { value: getSpellSlotValue(statBlock, 3), override: null },
        spell4: { value: getSpellSlotValue(statBlock, 4), override: null },
        spell5: { value: getSpellSlotValue(statBlock, 5), override: null },
        spell6: { value: getSpellSlotValue(statBlock, 6), override: null },
        spell7: { value: getSpellSlotValue(statBlock, 7), override: null },
        spell8: { value: getSpellSlotValue(statBlock, 8), override: null },
        spell9: { value: getSpellSlotValue(statBlock, 9), override: null }
    };
    Logger.info(`Working on : ${statBlock.name}`)
    Logger.info(`spells found: ${statBlock.spellcasting?.spells.map((spell: any) => spell.name).join(', ')}`)

    const spells = statBlock.spellcasting?.spells?.map((spell: any) => ({
        name: spell.name,
        type: "spell",
        system: {
            description: {
                value: spell.description || "",
            },
            activation: {
                type: spell.activation || "action",
                value: 1
            },
            duration: { // TODO something wrong here
                value: "", //spell.duration || "",
                units: "inst"
            },
            target: {// TODO enhance targeting logic
                affects: {
                    type: "creature", 
                    count: "1", 
                    choice: false
                },
                template: {
                    units: "",
                    contiguous: false
                }
            },
            range: {
                value: spell.range || "",
                units: "ft"
            },
            level: spell.level || 0,
            school: schoolAbbreviationMapping[spell.school?.toLowerCase()] || "evo", 
            materials: {
                value: spell.material || "",
                consumed: false,
                cost: 0,
                supply: 0
            },
            preparation: {
                mode: "prepared",
                prepared: true
            },
            properties: spell.components.map((component: any) => {
                switch(component) {
                    case "V": return "vocal";
                    case "S": return "somatic"; 
                    case "M": return "material";
                    default: return null;
                }
            }).filter(Boolean) || [],
            activities: {
                dnd5eactivity000: {
                    type: "save",
                    activation: {
                        type: spell.activation || "action",
                        value: null,
                        override: false
                    },
                    consumption: {
                        scaling: {
                            allowed: false,
                        },
                        spellSlot: true
                    },
                    duration: {
                        units: "inst", //TODO does this need to change????
                        concentration: spell.concentration,
                        override: false
                    },
                    effects: [],
                    range: {
                        override: false
                    },
                    target: {
                        prompt: true,
                        template: {
                            contiguous: false,
                            units: "ft"
                        },
                        affects: {
                            choice: false
                        },
                        override: false
                    },
                    uses: {
                        spent: 0,
                        max: "",
                        recovery: []
                    },
                    damage: {
                        onSave: "none",
                        parts: []
                    },
                    save: spell.savingThrow ? {
                        ability: abilityAbbreviationMapping[statBlock.spellcasting?.spellcastingAbility],
                        dc: {
                            calculation: "spellcasting",
                            formula: ""
                        }
                    } : {},
                    sort: 0
                }
            },
            identifier: spell.name.toLowerCase().replace(/\s+/g, '-')
        },
        sort: 0,
        //img: "icons/magic/light/beam-rays-orange.webp",
        effects: [],
        folder: null
    })) || []

    return {
        system: {
            traits: {
                size: sizeAbbreviationMapping[monsterData.size],
                dr: statBlock.damageResistances?.join(","),
                di: statBlock.damageImmunities?.join(","),
                dv: statBlock.damageVulnerabilities?.join(","),
                ci: statBlock.conditionImmunities?.join(","),
                languages: {
                    value: statBlock.languages || []
                }
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
                    walk: statBlock.movement.find((move: any) => move.type === "walk")?.speed,
                    fly: statBlock.movement.find((move: any) => move.type === "fly")?.speed,
                    swim: statBlock.movement.find((move: any) => move.type === "swim")?.speed,
                    climb: statBlock.movement.find((move: any) => move.type === "climb")?.speed,
                    burrow: statBlock.movement.find((move: any) => move.type === "burrow")?.speed,
                    hover: statBlock.canHover || false
                },
                senses: {
                    darkvision: statBlock.senses.darkvision,
                    blindsight: statBlock.senses.blindsight,
                    tremorsense: statBlock.senses.tremorsense,
                    truesight: statBlock.senses.truesight,
                    perception: statBlock.senses.passive,
                    special: statBlock.senses.telepathy ? "Telepathy" : ""
                },
                spellcasting: abilityAbbreviationMapping[statBlock.spellcasting?.spellcastingAbility],
            },
            abilities: {
                str: {
                    value: getAttributeValue(statBlock, "strength"),
                    save: getAttributeSaveValue(statBlock, "strength")
                },
                dex: {
                    value: getAttributeValue(statBlock, "dexterity"),
                    save: getAttributeSaveValue(statBlock, "dexterity")
                },
                con: {
                    value: getAttributeValue(statBlock, "constitution"),
                    save: getAttributeSaveValue(statBlock, "constitution")
                },
                int: {
                    value: getAttributeValue(statBlock, "intelligence"),
                    save: getAttributeSaveValue(statBlock, "intelligence")
                },
                wis: {
                    value: getAttributeValue(statBlock, "wisdom"),
                    save: getAttributeSaveValue(statBlock, "wisdom")
                },
                cha: {
                    value: getAttributeValue(statBlock, "charisma"),
                    save: getAttributeSaveValue(statBlock, "charisma")
                }
            },
            skills: {
                acr: {
                    value: getSkillProf(statBlock, "acrobatics"),
                    ability: "dex"
                },
                ani: {
                    value: getSkillProf(statBlock, "animal handling"),
                    ability: "wis"
                },
                arc: {
                    value: getSkillProf(statBlock, "arcana"),
                    ability: "int"
                },
                ath: {
                    value: getSkillProf(statBlock, "athletics"),
                    ability: "str"
                },
                dec: {
                    value: getSkillProf(statBlock, "deception"),
                    ability: "cha"
                },
                his: {
                    value: getSkillProf(statBlock, "history"),
                    ability: "int"
                },
                ins: {
                    value: getSkillProf(statBlock, "insight"),
                    ability: "wis"
                },
                itm: {
                    value: getSkillProf(statBlock, "intimidation"),
                    ability: "cha"
                },
                inv: {
                    value: getSkillProf(statBlock, "investigation"),
                    ability: "int"
                },
                med: {
                    value: getSkillProf(statBlock, "medicine"),
                    ability: "wis"
                },
                nat: {
                    value: getSkillProf(statBlock, "nature"),
                    ability: "int"
                },
                prc: {
                    value: getSkillProf(statBlock, "perception"),
                    ability: "wis"
                },
                prf: {
                    value: getSkillProf(statBlock, "performance"),
                    ability: "cha"
                },
                per: {
                    value: getSkillProf(statBlock, "persuasion"),
                    ability: "cha"
                },
                rel: {
                    value: getSkillProf(statBlock, "religion"),
                    ability: "int"
                },
                slt: {
                    value: getSkillProf(statBlock, "sleight of hand"),
                    ability: "dex"
                },
                ste: {
                    value: getSkillProf(statBlock, "stealth"),
                    ability: "dex"
                },
                sur: {
                    value: getSkillProf(statBlock, "survival"),
                    ability: "wis"
                }
            },
            details: {
                type: {
                    value: statBlock.type,
                    subType: statBlock.subType
                },
                cr: statBlock.challenge,
                spellLevel: statBlock.challenge >=1 ? statBlock.challenge : 1
            },
            spells: spellSlots,
        },
        items: [
            ...featureItems,
            ...actionItems,
            ...spells
        ]
    };
};

const abilityAbbreviationMapping: Record<string, string> = {
    strength: "str",
    dexterity: "dex",
    constitution: "con",
    intelligence: "int",
    wisdom: "wis",
    charisma: "cha"
};

const sizeAbbreviationMapping: Record<string, string> = {
    Tiny: "tiny",
    Small: "sm",
    Medium: "med",
    Large: "lg",
    Huge: "huge",
    Gargantuan: "grg"
};

const schoolAbbreviationMapping: Record<string, string> = {
    abjuration: "abj",
    conjuration: "con",
    divination: "div",
    enchantment: "enc",
    evocation: "evo",
    illusion: "ill",
    necromancy: "nec",
    transmutation: "trs"
};

const getProficiencyBonus = (challengeRating: number) => {
    return Math.floor((challengeRating - 1) / 4) + 2;
};

function getAttrModifier(attrValue: number) {
    return Math.floor((attrValue - 10) / 2);
}

function getAttributeValue(statBlock: any, name: string) {
    return statBlock.attributes.find((attr: any) => attr.name === name)?.value || 10;
}

function getAttributeSaveProf(statBlock: any, name: string) {
    return statBlock.attributes.find((attr: any) => attr.name === name)?.save || "None";
}

function getAttributeSaveValue(statBlock: any, name: string) {
    const attrMod = getAttrModifier(getAttributeValue(statBlock, name));
    const prof = getProficiencyBonus(statBlock.challenge);
    const saveProf = getAttributeSaveProf(statBlock, name);
    switch (saveProf) {
        case "Expertise":
            return attrMod + prof * 2;
        case "Proficient":
            return attrMod + prof;
        case "None":
        default:
            return attrMod;
    }
}

function getAttributeSkillProf(statBlock: any, name: string) {
    return (statBlock.skills || []).find((skill: any) => skill.name === name)?.skillProficiencyLevel || "None";
}

function getSkillProf(statBlock: any, skill: string): number {
    const skillProf = getAttributeSkillProf(statBlock, skill);
    switch (skillProf) {
        case "Expertise":
            return 2; // Expertise: Double proficiency
        case "Proficient":
            return 1; // prof: Single proficiency
        case "None":
        default:
            return 0; // None: No proficiency
    }
}

function getSavingThrowDc(statBlock: any, attribute: string) {
    const attrMod = getAttrModifier(getAttributeValue(statBlock, attribute));
    const prof = getProficiencyBonus(statBlock.challenge);
    return 8 + prof + attrMod;

}

function getAbilityAttackBonus(statBlock: any, action: any) {
    if (!action.finese) {
        if(action.attackType === 'melee') {
            return 'str'
        }
        if(action.attackType === 'range') {
            return 'dex'
        }
    } else {
        const str = getAttributeValue(statBlock, 'strength')
        const dex = getAttributeValue(statBlock, 'dexterity')
        if (str > dex) {
            return 'str'
        } else {
            return 'dex'
        }
    }
    return 'none'
}

const getSpellSlotValue = (statBlock: any, level: number) => {
    return statBlock.spellcasting?.spellSlots?.find(
        (slot: { level: number; slots: number }) => slot.level === level
    )?.slots || 0;
};