import { ConstructorDataType } from "@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes";
import { SceneType } from "../types/tac-types";

type SceneCreationData = ConstructorDataType<foundry.data.SceneData> | (ConstructorDataType<foundry.data.SceneData> & Record<string, unknown>);

export const convertTacSceneToFoundryScene = (tacScene: SceneType, sceneFolder: Folder | undefined): SceneCreationData => {
    const sceneData = {
        name: tacScene.name,
        folder: sceneFolder,
        padding: 0.0,
        width: 3584,
        height: 2048,
        grid: { size: 50 },
        background: {
            // TODO: Copy image to Foundry storage first
            src: tacScene.imageUrl,
        },
        initial: {
            x: 1900,
            y: 1000,
            scale: .3
        },
    }
    // TODO annoyingly this is the way we must set the gridSize and the typescript we are currently using is wrong somehow.
    // @ts-ignore
    return sceneData as SceneCreationData
}