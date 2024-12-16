import { ConstructorDataType } from "@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes";
import { Logger } from "../classes/logging";
import { TacScene } from "../types/tac-types";

type SceneCreationData = ConstructorDataType<foundry.data.SceneData> | (ConstructorDataType<foundry.data.SceneData> & Record<string, unknown>);

export const convertSceneToFoundryScene = (tacScene: TacScene, sceneFolder: Folder | undefined): SceneCreationData => {
    const sceneData = {
        name: tacScene.name,
        folder: sceneFolder,
        padding: 0.0,
        width: 1024,
        height: 1024,
        grid: { size: 50 },
        background: {
            // TODO: Copy image to Foundry storage first
            src: tacScene.imageUrl,
        },
        initial: {
            x: 500,
            y: 500,
            scale: 1
        },
    }
    // TODO annoyingly this is the way we must set the gridSize and the typescript we are currently using is wrong somehow.
    // @ts-ignore
    return sceneData as SceneCreationData
}