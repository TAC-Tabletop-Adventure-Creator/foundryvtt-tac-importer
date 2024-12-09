import { Logger } from "../classes/logging";
import { ActorCreationData } from "../types/actor-creation-data";
import { getDnD5eActorData } from "./dnd5e-statblock-converter";

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
