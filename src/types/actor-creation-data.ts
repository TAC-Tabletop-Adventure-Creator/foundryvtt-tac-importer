import { ConstructorDataType } from "@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes";

export type ActorCreationData =
    ConstructorDataType<foundry.data.ActorData>
    | (ConstructorDataType<foundry.data.ActorData> & Record<string, unknown>);