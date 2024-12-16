import { ConstructorDataType } from "@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes";
import { Logger } from "../classes/logging";
import { TacScene } from "../types/tac-types";
import { downloadAndSaveImage } from "../utils/image";

type SceneCreationData = ConstructorDataType<foundry.data.SceneData> | (ConstructorDataType<foundry.data.SceneData> & Record<string, unknown>);

export const convertSceneToFoundryScene = async (tacScene: TacScene, sceneFolder: Folder | undefined): Promise<SceneCreationData> => {
    const sceneData = {
        name: tacScene.name,
        folder: sceneFolder,
        padding: 0.0,
        width: 1536,
        height: 1536,
        grid: { 
            size: 50,
            type: 1 // Grid type (1 = Square, 2 = Hex)
        },
        background: {
            src: await downloadAndSaveImage(tacScene.imageUrl, 'scene'),
        },
        initial: {
            x: 900,
            y: 750,
            scale: .7
        },
    }
    // TODO annoyingly this is the way we must set the gridSize and the typescript we are currently using is wrong somehow.
    // @ts-ignore
    return sceneData as SceneCreationData
}