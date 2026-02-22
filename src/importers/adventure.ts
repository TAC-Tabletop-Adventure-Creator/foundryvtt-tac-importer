import type {
  TacAdventureExport,
  TacSceneExport,
  ImportResult,
  ImportMapping,
  ImportProgress,
} from '../types';
import { fetchAsset } from '../utils/api';
import { checkSystem } from '../utils/system';
import { MonsterImporter } from './monster';
import { MapImporter } from './map';
import { AudioImporter } from './audio';
import { Logger } from '../classes/logging';

const MODULE_ID = 'tac-importer';
const PLAYLIST_MODE_SEQUENTIAL = 1;

export class AdventureImporter {
  private monsterImporter = new MonsterImporter();
  private mapImporter = new MapImporter();
  private audioImporter = new AudioImporter();

  async importById(
    id: string,
    onProgress?: (p: ImportProgress) => void
  ): Promise<ImportResult> {
    const data = await fetchAsset<TacAdventureExport>('/export/adventure', id);
    return this.importFromData(data, onProgress);
  }

  async importFromData(
    data: TacAdventureExport,
    onProgress?: (p: ImportProgress) => void
  ): Promise<ImportResult> {
    const { adventure, scenes, assets } = data;

    // System check
    const check = checkSystem(adventure.system);
    if (!check.ok) {
      return { success: false, error: check.error };
    }

    // Initialize mapping
    const mapping: ImportMapping = {
      monsters: new Map(),
      maps: new Map(),
      audio: new Map(),
      playlists: new Map(),
    };

    // Import monsters
    const monsterTotal = assets.monsters.length;
    for (let i = 0; i < monsterTotal; i++) {
      const monster = assets.monsters[i];
      onProgress?.({
        phase: 'monsters',
        current: i + 1,
        total: monsterTotal,
        message: `Importing monster ${i + 1}/${monsterTotal}: ${monster.name}`,
      });

      try {
        const result = await this.monsterImporter.importFromData(monster);
        if (result.success && result.entity) {
          mapping.monsters.set(monster.id, result.entity as Actor);
        } else {
          Logger.warning(`Monster ${monster.name}: ${result.error}`);
        }
      } catch (error) {
        Logger.warning(`Monster ${monster.name} failed: ${error}`);
      }
    }

    // Import maps
    const mapTotal = assets.maps.length;
    for (let i = 0; i < mapTotal; i++) {
      const map = assets.maps[i];
      onProgress?.({
        phase: 'maps',
        current: i + 1,
        total: mapTotal,
        message: `Importing map ${i + 1}/${mapTotal}: ${map.name}`,
      });

      try {
        const result = await this.mapImporter.importFromData(map);
        if (result.success && result.entity) {
          mapping.maps.set(map.id, result.entity as Scene);
        } else {
          Logger.warning(`Map ${map.name}: ${result.error}`);
        }
      } catch (error) {
        Logger.warning(`Map ${map.name} failed: ${error}`);
      }
    }

    // Import audio
    const audioTotal = assets.audio.length;
    for (let i = 0; i < audioTotal; i++) {
      const audio = assets.audio[i];
      onProgress?.({
        phase: 'audio',
        current: i + 1,
        total: audioTotal,
        message: `Importing audio ${i + 1}/${audioTotal}: ${audio.name}`,
      });

      try {
        const result = await this.audioImporter.importFromData(audio);
        if (result.success && result.entity && result.path) {
          mapping.audio.set(audio.id, {
            sound: result.entity as PlaylistSound,
            path: result.path,
          });
        } else {
          Logger.warning(`Audio ${audio.name}: ${result.error}`);
        }
      } catch (error) {
        Logger.warning(`Audio ${audio.name} failed: ${error}`);
      }
    }

    // Find or create adventure folder for journals
    const existingFolder = game.folders.find(
      f => f.getFlag(MODULE_ID, 'adventureId') === adventure.id
    );

    let folder: Folder;
    if (existingFolder) {
      await existingFolder.update({ name: adventure.name });
      folder = existingFolder;
    } else {
      folder = await Folder.create({
        name: adventure.name,
        type: 'JournalEntry',
      });
      await folder.setFlag(MODULE_ID, 'adventureId', adventure.id);
    }

    // Find or create adventure overview journal
    const overviewJournalId = `${adventure.id}-overview`;
    const existingOverview = game.journal.find(
      j => j.getFlag(MODULE_ID, 'tacId') === overviewJournalId
    );

    if (existingOverview) {
      // Update existing overview journal
      await existingOverview.update({ name: `${adventure.name} - Overview` });

      // Delete existing pages and recreate
      const pageIds = existingOverview.pages.map(p => p.id);
      if (pageIds.length) {
        await existingOverview.deleteEmbeddedDocuments('JournalEntryPage', pageIds);
      }
      await existingOverview.createEmbeddedDocuments('JournalEntryPage', [
        {
          name: 'Introduction',
          type: 'text',
          text: { content: adventure.intro },
        },
        {
          name: 'Read Aloud',
          type: 'text',
          text: { content: `<blockquote>${adventure.introReadAloud}</blockquote>` },
        },
      ]);
    } else {
      // Create new overview journal
      const overviewJournal = await JournalEntry.create({
        name: `${adventure.name} - Overview`,
        folder: folder.id,
        pages: [
          {
            name: 'Introduction',
            type: 'text',
            text: { content: adventure.intro },
          },
          {
            name: 'Read Aloud',
            type: 'text',
            text: { content: `<blockquote>${adventure.introReadAloud}</blockquote>` },
          },
        ],
      });
      await overviewJournal.setFlag(MODULE_ID, 'tacId', overviewJournalId);
    }

    // Process scenes (sorted by order)
    const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);
    const sceneTotal = sortedScenes.length;

    for (let i = 0; i < sceneTotal; i++) {
      const scene = sortedScenes[i];
      onProgress?.({
        phase: 'scenes',
        current: i + 1,
        total: sceneTotal,
        message: `Processing scene ${i + 1}/${sceneTotal}: ${scene.name}`,
      });

      // Find or create scene journal entry
      const existingSceneJournal = game.journal.find(
        j => j.getFlag(MODULE_ID, 'tacId') === scene.id
      );

      if (existingSceneJournal) {
        // Update existing scene journal
        await existingSceneJournal.update({
          name: `${adventure.name} - ${scene.name}`,
        });

        // Delete existing pages and recreate
        const pageIds = existingSceneJournal.pages.map(p => p.id);
        if (pageIds.length) {
          await existingSceneJournal.deleteEmbeddedDocuments('JournalEntryPage', pageIds);
        }
        await existingSceneJournal.createEmbeddedDocuments('JournalEntryPage', [
          {
            name: 'Read Aloud',
            type: 'text',
            text: { content: `<blockquote>${scene.readAloud}</blockquote>` },
          },
          {
            name: 'DM Notes',
            type: 'text',
            text: { content: scene.notes },
          },
        ]);
      } else {
        // Create new scene journal
        const sceneJournal = await JournalEntry.create({
          name: `${adventure.name} - ${scene.name}`,
          folder: folder.id,
          pages: [
            {
              name: 'Read Aloud',
              type: 'text',
              text: { content: `<blockquote>${scene.readAloud}</blockquote>` },
            },
            {
              name: 'DM Notes',
              type: 'text',
              text: { content: scene.notes },
            },
          ],
        });
        await sceneJournal.setFlag(MODULE_ID, 'tacId', scene.id);
      }

      // Find or create scene playlist from audioRefs
      let scenePlaylist: Playlist | undefined;
      if (scene.audioRefs.length > 0) {
        const audioEntries = scene.audioRefs
          .map((audioId) => mapping.audio.get(audioId))
          .filter((entry): entry is { sound: PlaylistSound; path: string } => entry !== undefined);

        if (audioEntries.length > 0) {
          // Find existing playlist by scene ID
          const existingPlaylist = game.playlists.find(
            p => p.getFlag(MODULE_ID, 'sceneId') === scene.id
          );

          if (existingPlaylist) {
            // Update existing playlist
            await existingPlaylist.update({
              name: `${adventure.name} - ${scene.name}`,
            });

            // Delete all sounds and recreate
            const soundIds = existingPlaylist.sounds.map(s => s.id);
            if (soundIds.length) {
              await existingPlaylist.deleteEmbeddedDocuments('PlaylistSound', soundIds);
            }
            await existingPlaylist.createEmbeddedDocuments('PlaylistSound',
              audioEntries.map((entry) => ({
                name: entry.sound.name,
                path: entry.path,
                volume: 0.5,
                repeat: true,
              }))
            );
            scenePlaylist = existingPlaylist;
          } else {
            // Create new playlist
            scenePlaylist = await Playlist.create({
              name: `${adventure.name} - ${scene.name}`,
              mode: PLAYLIST_MODE_SEQUENTIAL,
              sounds: audioEntries.map((entry) => ({
                name: entry.sound.name,
                path: entry.path,
                volume: 0.5,
                repeat: true,
              })),
            });
            await scenePlaylist.setFlag(MODULE_ID, 'sceneId', scene.id);
          }
          mapping.playlists.set(scene.id, scenePlaylist);
        }
      }

      // Get the Foundry scene from mapping (if mapRef exists)
      const foundryScene = scene.mapRef ? mapping.maps.get(scene.mapRef) : undefined;

      if (foundryScene) {
        // Place tokens using monsterPlacements
        onProgress?.({
          phase: 'tokens',
          current: i + 1,
          total: sceneTotal,
          message: `Placing tokens on scene: ${scene.name}`,
        });

        await this.placeTokens(foundryScene, scene, mapping);

        // Link playlist to scene (auto-play on activation)
        if (scenePlaylist) {
          await foundryScene.update({
            playlist: scenePlaylist.id,
            playlistSound: null, // Start from beginning
          });
        }
      }
    }

    onProgress?.({
      phase: 'complete',
      current: sceneTotal,
      total: sceneTotal,
      message: 'Adventure import complete!',
    });

    return { success: true };
  }

  private async placeTokens(
    foundryScene: Scene,
    scene: TacSceneExport,
    mapping: ImportMapping
  ): Promise<void> {
    // Delete ALL existing tokens on this scene before placing new ones
    const existingTokenIds = foundryScene.tokens.map(t => t.id);
    if (existingTokenIds.length > 0) {
      await foundryScene.deleteEmbeddedDocuments('Token', existingTokenIds);
    }

    const tokens: Record<string, unknown>[] = [];

    for (const placement of scene.monsterPlacements) {
      const actor = mapping.monsters.get(placement.monsterRef);
      if (!actor) {
        Logger.warning(
          `Token placement skipped: monster "${placement.monsterRef}" not found`
        );
        continue;
      }

      tokens.push({
        actorId: actor.id,
        actorLink: false,
        x: placement.position.x,
        y: placement.position.y,
        texture: {
          src: actor.prototypeToken?.texture?.src || actor.img,
        },
        width: actor.prototypeToken?.width || 1,
        height: actor.prototypeToken?.height || 1,
      });
    }

    if (tokens.length > 0) {
      await foundryScene.createEmbeddedDocuments('Token', tokens);
    }
  }
}
