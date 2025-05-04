import { Scene, Monster, Note, Placement } from "./tac-data";

// Generic single-entity mapping result
export interface EntityMapResult<TacType, FoundryType> {
  tacEntity: TacType;
  foundryEntity: FoundryType | null;
  success: boolean;
  errors: string[];
}

// Collection of entity mapping results
export interface MapperResult<TacType, FoundryType> {
  results: EntityMapResult<TacType, FoundryType>[];
  success: boolean; // Overall success
  errors: string[]; // General errors not tied to specific entities
}

// Specialized types for each entity
export type SceneMapResult = EntityMapResult<Scene, any>; // Replace 'any' with proper Foundry Scene type
export type MonsterMapResult = EntityMapResult<Monster, any>; // Replace with proper Foundry Actor type
export type NoteMapResult = EntityMapResult<Note, any>; // Replace with proper Foundry JournalEntry type
export type PlacementMapResult = EntityMapResult<Placement, any>; // Replace with proper Foundry Token/Note type

// Collection result types
export type ScenesMapperResult = MapperResult<Scene, any>;
export type MonstersMapperResult = MapperResult<Monster, any>;
export type NotesMapperResult = MapperResult<Note, any>;
export type PlacementsMapperResult = MapperResult<Placement, any>;

// Import flow result containing all mapper results
export interface ImportFlowResult {
  success: boolean;
  scenes: ScenesMapperResult;
  monsters: MonstersMapperResult;
  notes: NotesMapperResult;
  placements: PlacementsMapperResult;
  errors: string[]; // General errors not tied to specific mapper results
} 