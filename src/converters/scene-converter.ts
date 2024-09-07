import { ConstructorDataType } from "@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes";
import { SceneType } from "../types/tac-types";

type SceneCreationData = ConstructorDataType<foundry.data.SceneData> | (ConstructorDataType<foundry.data.SceneData> & Record<string, unknown>);

export const convertTacSceneToFoundryScene = (tacScene: SceneType, sceneFolder: Folder | undefined): SceneCreationData => {
    return {
        name: tacScene.name,
        folder: sceneFolder,
        background: {
            // TODO: Copy image to Foundry storage first
            src: tacScene.imageUrl
        },
        initial: {
            x: 3000,
            y: 2300,
            scale: 0.2844000461382298
        }
    }
}