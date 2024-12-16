import { Logger } from "../classes/logging";
import { ActorCreationData } from "../types/actor-creation-data";
import { getDnD5eActorData } from "./dnd5e-statblock-converter";
import { TacMonster } from "../types/tac-types";
import { downloadAndSaveImage } from "../utils/image";

export const convertMonsterToFoundryActor = async (monsterData: TacMonster, folder: Folder | undefined) => {
    // @ts-ignore
    const systemId = game.system.id;
    let actorData: ActorCreationData = {
        name: monsterData.name,
        folder: folder,
        type: "npc",
        img: await downloadAndSaveImage(monsterData.imageUrl, 'monster')
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
