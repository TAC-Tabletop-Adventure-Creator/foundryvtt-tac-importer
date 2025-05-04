// Core entity types for TAC API export data

export interface Adventure {
  id: string;
  title: string;
  description: string;
  system: string; // e.g., "D&D5.1e"
  image_url: string | null;
  scenes: Scene[];
  monsters: Monster[];
  notes: Note[];
  placements: Placement[];
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  adventure_id: string;
  image_url: string | null;
}

export interface Monster {
  id: string;
  name: string;
  description: string;
  adventure_id: string;
  image_url: string | null;
  statblock: Record<string, any>; // Generic statblock structure
}

export interface Note {
  id: string;
  name: string;
  description: string;
  adventure_id: string;
  image_url: string | null;
}

export interface Placement {
  id: string;
  adventure_id: string;
  scene_id: string;
  type: "monster" | "note";
  monster_id: string | null;  // Present when type is "monster"
  note_id: string | null;     // Present when type is "note"
  position_x: number;
  position_y: number;
}

// Export a type for the complete TAC export data
export type TacExport = Adventure;

// Helper types for processing
export interface TacCounts {
  scenes: number;
  monsters: number;
  notes: number;
  placements: number;
}

// Function to extract counts from TAC export data
export function getTacCounts(data: TacExport): TacCounts {
  return {
    scenes: data.scenes.length,
    monsters: data.monsters.length,
    notes: data.notes.length,
    placements: data.placements.length
  };
}

// Function to validate if an object conforms to the TacExport structure
export function isTacExport(data: any): data is TacExport {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.title === 'string' &&
    Array.isArray(data.scenes) &&
    Array.isArray(data.monsters) &&
    Array.isArray(data.notes) &&
    Array.isArray(data.placements)
  );
} 