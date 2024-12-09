import { DnDFiveOneEStatBlock } from "./monster-schema-5e";


export interface TacExport {
    adventure: Adventure;
    scenes: TacScene[];
    monsters: TacMonster[];
    notes: TacNote[];
}

export enum System {
    DnDFiveOneE = "DnD-5.1e",
  }

export interface Adventure {
    id: string;
    title: string;
    description: string;
    systems: System[];
}

export enum PlacementType {
    Monster = "monster",
    Note = "note",
  }
  
export interface Placement {
  id: string;
  referenceId: string;
  type: PlacementType;
  name: string;
  x: number;
  y: number;
}

export interface TacScene {
  id: string;
  name: string;
  description: string;
  placements: Placement[];
  imagePrompt: string;
  imageUrl: string | null;
}

export interface StatBlockMap {
  [System.DnDFiveOneE]: DnDFiveOneEStatBlock;
}
  
export interface TacMonster {
  id: string;
  name: string;
  description: string;
  imagePrompt: string;
  imageUrl: string | null;
  statBlocks: Partial<Record<System, StatBlockMap[System]>>;
}

export interface TacNote {
  id: string;
  name: string;
  description: string;
}