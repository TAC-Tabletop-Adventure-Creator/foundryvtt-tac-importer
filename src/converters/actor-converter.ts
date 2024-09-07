import { ConstructorDataType } from "@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes";
import { TokenPlacementType, TokenType } from "../types/tac-types";

type ActorCreationData = ConstructorDataType<foundry.data.ActorData> | (ConstructorDataType<foundry.data.ActorData> & Record<string, unknown>);

export const convertTacTokenToFoundryActor = (
    tokenPlacement: TokenPlacementType,
    tokenData: TokenType,
    folder: Folder | undefined
): ActorCreationData => {
    // Stubbed for now, will use tokenPlacement and tokenData to generate actor data
    return {
        name: tokenPlacement.name || tokenData.name,
        folder: folder,
        type: 'npc',
        img: tokenData.imageUrl
    };
};