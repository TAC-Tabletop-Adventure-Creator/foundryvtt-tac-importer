// @ts-ignore
import { ConstructorDataType } from "@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes";

export type ActorCreationData =
    // @ts-ignore
    ConstructorDataType<foundry.data.ActorData>
    // @ts-ignore
    | (ConstructorDataType<foundry.data.ActorData> & Record<string, unknown>);