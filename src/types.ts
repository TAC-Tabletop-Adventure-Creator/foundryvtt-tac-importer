// Import result returned by all importers
export interface ImportResult {
  success: boolean;
  entity?: Actor | Scene | PlaylistSound;
  error?: string;
}

// Monster (Foundry-native format from API)
export interface TacMonsterExport {
  tacSystem: string;
  name: string;
  type: 'npc';
  img?: string;
  system: Record<string, unknown>;
  items: unknown[];
}

// Map (UVTT 0.3 format)
export interface TacMapExport {
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

// Foundry VTT global types (minimal declarations for TypeScript)
declare global {
  const game: {
    world: { id: string };
    system: { id: string };
    playlists: {
      getName(name: string): Playlist | undefined;
    };
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
    static create(data: Record<string, unknown>): Promise<Actor>;
    createEmbeddedDocuments(type: string, data: unknown[]): Promise<unknown[]>;
  }

  class Scene {
    static create(data: Record<string, unknown>): Promise<Scene>;
    createEmbeddedDocuments(type: string, data: unknown[]): Promise<unknown[]>;
  }

  class Playlist {
    sounds: { find(fn: (s: PlaylistSound) => boolean): PlaylistSound | undefined };
    static create(data: Record<string, unknown>): Promise<Playlist>;
    createEmbeddedDocuments(type: string, data: unknown[]): Promise<unknown[]>;
    updateEmbeddedDocuments(type: string, data: unknown[]): Promise<unknown[]>;
  }

  interface PlaylistSound {
    id: string;
    name: string;
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
