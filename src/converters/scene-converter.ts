import { ConstructorDataType } from "@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes";
import { SceneType } from "../types/tac-types";

type SceneCreationData = ConstructorDataType<foundry.data.SceneData> | (ConstructorDataType<foundry.data.SceneData> & Record<string, unknown>);

export const convertTacSceneToFoundryScene = (tacScene: SceneType, sceneFolder: Folder | undefined): SceneCreationData => {
    return {
        name: tacScene.name,
        folder: sceneFolder,
        padding: 0,
        width: 3584,
        height: 2048,
        background: {
            // TODO: Copy image to Foundry storage first
            src: tacScene.imageUrl,
        },
        initial: {
            x: 2250,
            y: 1000,
            scale: .3
        },
    }
}