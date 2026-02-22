import type { TacAudioExport, ImportResult } from '../types';
import { fetchAsset } from '../utils/api';
import { downloadAudio } from '../utils/files';

const MODULE_ID = 'tac-importer';
const PLAYLIST_NAME = 'TAC Imports';
const PLAYLIST_MODE_DISABLED = -1;  // Individual track control (soundboard style)

export class AudioImporter {
  async importById(id: string): Promise<ImportResult> {
    const data = await fetchAsset<TacAudioExport>('/export/audio', id);
    return this.importFromData(data);
  }

  async importFromData(data: TacAudioExport): Promise<ImportResult> {
    // Download audio file to local storage
    const path = await downloadAudio(data.audioUrl, data.slug);

    // Find or create TAC playlist
    let playlist = game.playlists.getName(PLAYLIST_NAME);
    if (!playlist) {
      playlist = await Playlist.create({
        name: PLAYLIST_NAME,
        description: 'Audio imported from Tabletop Adventure Creator',
        mode: PLAYLIST_MODE_DISABLED,  // Individual track control (no auto-play)
        fade: 500,  // 500ms fade default
      });
      // Set flag on newly created playlist
      await playlist.setFlag(MODULE_ID, 'tacId', PLAYLIST_NAME);
    }

    // Check if sound already exists (by name)
    const existing = playlist.sounds.find(s => s.name === data.name);
    if (existing) {
      // Update existing sound
      await playlist.updateEmbeddedDocuments('PlaylistSound', [{
        _id: existing.id,
        path,
        description: data.description,
      }]);
      return { success: true, entity: existing, path };
    }

    // Create new sound
    const [sound] = await playlist.createEmbeddedDocuments('PlaylistSound', [{
      name: data.name,
      path,
      description: data.description,
      volume: 0.5,        // 50% default volume
      repeat: true,       // Loop by default for ambient/music
      fade: 1000,         // 1 second fade for smooth transitions
    }]) as PlaylistSound[];

    return { success: true, entity: sound, path };
  }
}
