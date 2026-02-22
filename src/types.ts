// Import result returned by all importers
export interface ImportResult {
  success: boolean;
  entity?: Actor | Scene | PlaylistSound;
  error?: string;
  path?: string;  // For audio imports, the local file path
}

// Monster placement on a scene
export interface MonsterPlacement {
  id: string;
  monsterRef: string;
  position: { x: number; y: number };
}

// Scene within an adventure
export interface TacSceneExport {
  id: string;
  order: number;
  name: string;
  mapRef?: string;
  notes: string;
  readAloud: string;
  monsterRefs: string[];
  monsterPlacements: MonsterPlacement[];
  audioRefs: string[];
}

// Adventure metadata
export interface TacAdventureData {
  id: string;
  slug: string;
  name: string;
  description: string;
  image?: string;
  system: string;
  systemContent: { levelMin: number; levelMax: number };
  intro: string;
  introReadAloud: string;
}

// Complete adventure export
export interface TacAdventureExport {
  tacExport: { version: string; exportedAt: string };
  adventure: TacAdventureData;
  scenes: TacSceneExport[];
  assets: {
    monsters: TacMonsterExport[];
    maps: TacMapExport[];
    audio: TacAudioExport[];
  };
}

// TAC ID → Foundry document tracking
export interface ImportMapping {
  monsters: Map<string, Actor>;
  maps: Map<string, Scene>;
  audio: Map<string, { sound: PlaylistSound; path: string }>;
  playlists: Map<string, Playlist>;
}

// Progress callback for UI updates
export interface ImportProgress {
  phase: 'monsters' | 'maps' | 'audio' | 'scenes' | 'tokens' | 'complete';
  current: number;
  total: number;
  message: string;
}

// Monster (Foundry-native format from API)
export interface TacMonsterExport {
  id: string;
  tacSystem: string;
  name: string;
  type: 'npc';
  img?: string;
  system: Record<string, unknown>;
  items: unknown[];
}

// Map (UVTT 0.3 format)
export interface TacMapExport {
  id: string;
  name: string;
  format: number;
  resolution: {
    map_origin: { x: number; y: number };
    map_size: { x: number; y: number };
    pixels_per_grid: number;
  };
  line_of_sight: Array<{ x: number; y: number; x2: number; y2: number }>;
  lights: Array<{
    position: { x: number; y: number };
    range: number;
    intensity: number;
    color: string;
    shadows: boolean;
  }>;
  portals: Array<{
    position: { x: number; y: number };
    bounds: Array<{ x: number; y: number }>;
    rotation: number;
    closed: boolean;
  }>;
  image: string;
}

// Audio metadata from API
export interface TacAudioExport {
  id: string;
  name: string;
  slug: string;
  description: string;
  audioUrl: string;
  imageUrl?: string;
  durationSeconds: number;
  bpm?: number;
  musicalKey?: string;
  tags: string[];
}

// Document collection interface for querying Foundry documents
interface DocumentCollection<T> {
  find(predicate: (doc: T) => boolean): T | undefined;
  filter(predicate: (doc: T) => boolean): T[];
  getName(name: string): T | undefined;
}

// Foundry VTT global types (minimal declarations for TypeScript)
declare global {
  const game: {
    world: { id: string };
    system: { id: string };
    actors: DocumentCollection<Actor>;
    scenes: DocumentCollection<Scene>;
    playlists: DocumentCollection<Playlist>;
    journal: DocumentCollection<JournalEntry>;
    folders: DocumentCollection<Folder>;
  };

  const ui: {
    notifications: {
      info(message: string): void;
      error(message: string): void;
      warn(message: string): void;
    };
    sidebar: {
      render(force?: boolean): void;
    };
    tacimporter?: unknown;
  };

  const CONST: {
    WALL_DOOR_TYPES: { DOOR: number };
    WALL_DOOR_STATES: { OPEN: number; CLOSED: number };
  };

  const CONFIG: {
    ui: {
      sidebar: {
        TABS: Record<string, { icon: string; tooltip: string }>;
      };
    };
  };

  const Hooks: {
    on(event: string, callback: (...args: unknown[]) => void): void;
    once(event: string, callback: (...args: unknown[]) => void): void;
  };

  class Actor {
    id: string;
    img: string;
    prototypeToken?: { texture?: { src: string }; width?: number; height?: number };
    items: { map<U>(fn: (item: { id: string }) => U): U[] };
    static create(data: Record<string, unknown>): Promise<Actor>;
    createEmbeddedDocuments(type: string, data: unknown[]): Promise<unknown[]>;
    deleteEmbeddedDocuments(type: string, ids: string[]): Promise<unknown[]>;
    update(data: Record<string, unknown>): Promise<Actor>;
    getFlag(scope: string, key: string): unknown;
    setFlag(scope: string, key: string, value: unknown): Promise<this>;
  }

  class Scene {
    id: string;
    walls: { map<U>(fn: (wall: { id: string }) => U): U[] };
    lights: { map<U>(fn: (light: { id: string }) => U): U[] };
    tokens: { map<U>(fn: (token: { id: string }) => U): U[] };
    static create(data: Record<string, unknown>): Promise<Scene>;
    createEmbeddedDocuments(type: string, data: unknown[]): Promise<unknown[]>;
    deleteEmbeddedDocuments(type: string, ids: string[]): Promise<unknown[]>;
    update(data: Record<string, unknown>): Promise<Scene>;
    getFlag(scope: string, key: string): unknown;
    setFlag(scope: string, key: string, value: unknown): Promise<this>;
  }

  class Playlist {
    id: string;
    sounds: {
      find(fn: (s: PlaylistSound) => boolean): PlaylistSound | undefined;
      map<U>(fn: (s: PlaylistSound) => U): U[];
    };
    static create(data: Record<string, unknown>): Promise<Playlist>;
    createEmbeddedDocuments(type: string, data: unknown[]): Promise<unknown[]>;
    updateEmbeddedDocuments(type: string, data: unknown[]): Promise<unknown[]>;
    deleteEmbeddedDocuments(type: string, ids: string[]): Promise<unknown[]>;
    update(data: Record<string, unknown>): Promise<Playlist>;
    getFlag(scope: string, key: string): unknown;
    setFlag(scope: string, key: string, value: unknown): Promise<this>;
  }

  interface PlaylistSound {
    id: string;
    name: string;
    path: string;
  }

  class JournalEntry {
    id: string;
    pages: { map<U>(fn: (page: { id: string }) => U): U[] };
    static create(data: Record<string, unknown>): Promise<JournalEntry>;
    createEmbeddedDocuments(type: string, data: unknown[]): Promise<unknown[]>;
    deleteEmbeddedDocuments(type: string, ids: string[]): Promise<unknown[]>;
    update(data: Record<string, unknown>): Promise<JournalEntry>;
    getFlag(scope: string, key: string): unknown;
    setFlag(scope: string, key: string, value: unknown): Promise<this>;
  }

  class Folder {
    id: string;
    static create(data: Record<string, unknown>): Promise<Folder>;
    update(data: Record<string, unknown>): Promise<Folder>;
    getFlag(scope: string, key: string): unknown;
    setFlag(scope: string, key: string, value: unknown): Promise<this>;
  }

  class FilePicker {
    static browse(source: string, path: string): Promise<unknown>;
    static createDirectory(source: string, path: string, options?: { bucket: null }): Promise<void>;
    static upload(source: string, path: string, file: File): Promise<{ path: string }>;
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace foundry {
    namespace applications {
      namespace handlebars {
        function loadTemplates(paths: string[]): Promise<void>;
        function renderTemplate(path: string, data: Record<string, unknown>): Promise<string>;
      }
      namespace sidebar {
        class AbstractSidebarTab {
          static defaultOptions: Record<string, unknown>;
          static tabName: string;
          static PARTS: Record<string, { template: string }>;
          _prepareContext(options: unknown): Promise<Record<string, unknown>>;
          _getHeaderControls(): unknown[];
        }
      }
      namespace apps {
        const FilePicker: {
          implementation: {
            browse(source: string, path: string): Promise<unknown>;
            createDirectory(source: string, path: string, options?: { bucket: null }): Promise<void>;
            upload(source: string, path: string, file: File): Promise<{ path: string }>;
          };
        };
      }
    }
    namespace utils {
      function mergeObject<T>(original: T, other: Partial<T>): T;
    }
  }
}

export {};
