// These types are mirroring the TAC Adventure structure please keep in sync

import { Monster5eType } from "./monster-schema-5e";

export type AdventureData = {
    adventureId: string;
    name: string;
    description: string;
    scenes: SceneType[],
    tokens: TokenType[],
    notes: NoteType[]
}

export type SceneType = {
    userId: string;
    adventureId: string;
    name: string;
    description: string;
    imageUrl: string;
    tokenPlacements: TokenPlacementType[];
    notePlacements: NotePlacementType[];
    encounters: EncounterType[];
    systemConfig: SystemConfigType;
};

export type TokenType = {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    statBlocks: StatBlocks;
};

export type NoteType = {
    id: string;
    name: string;
    description: string;
};

export type StatBlocks = {
    dnd5e?: Monster5eType;
};

export type TokenPlacementType = {
    id: string;
    name?: string;
    tokenRef: string;
    x: number;
    y: number;
    statBlocks: StatBlocks;
};

export type NotePlacementType = {
    id: string;
    noteRef: string;
    x: number;
    y: number;
};

export type EncounterType = {
    id: string;
    name: string;
    tokenPlacementRefs: string[];
};

export type SystemConfigType = {
    dnd5e?: SystemConfig5e;
};

export type SystemConfig5e = {
    playerCount: number;
    averageLevel: number;
};