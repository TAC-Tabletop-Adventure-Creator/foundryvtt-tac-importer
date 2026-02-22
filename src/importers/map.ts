import type { TacMapExport, ImportResult } from '../types';
import { fetchAsset } from '../utils/api';
import { downloadImage } from '../utils/files';
import { parseWalls, parseLights, parseDoors } from './uvtt';

const MODULE_ID = 'tac-importer';

export class MapImporter {
  async importById(id: string): Promise<ImportResult> {
    const data = await fetchAsset<TacMapExport>('/export/map', id, 'format=api');
    return this.importFromData(data);
  }

  async importFromData(data: TacMapExport): Promise<ImportResult> {
    const ppg = data.resolution.pixels_per_grid;
    const width = data.resolution.map_size.x * ppg;
    const height = data.resolution.map_size.y * ppg;

    // Download image
    const img = await downloadImage(data.image, 'maps', data.name || `map-${Date.now()}`);

    // Find existing by TAC ID
    const existing = game.scenes.find(
      s => s.getFlag(MODULE_ID, 'tacId') === data.id
    );

    let scene: Scene;
    if (existing) {
      // Update existing scene
      await existing.update({
        name: data.name || 'Imported Map',
        width,
        height,
        grid: { size: ppg },
        background: { src: img },
      });

      // Delete existing walls and lights (NOT tokens - those are handled by adventure importer)
      const wallIds = existing.walls.map(w => w.id);
      const lightIds = existing.lights.map(l => l.id);

      if (wallIds.length) await existing.deleteEmbeddedDocuments('Wall', wallIds);
      if (lightIds.length) await existing.deleteEmbeddedDocuments('AmbientLight', lightIds);

      scene = existing;
    } else {
      // Create new scene
      scene = await Scene.create({
        name: data.name || 'Imported Map',
        width,
        height,
        grid: { size: ppg },
        background: { src: img },
        padding: 0,
      });

      // Set TAC ID flag
      await scene.setFlag(MODULE_ID, 'tacId', data.id);
    }

    // Add walls + doors (fresh)
    const walls = [...parseWalls(data, ppg), ...parseDoors(data, ppg)];
    if (walls.length) {
      await scene.createEmbeddedDocuments('Wall', walls);
    }

    // Add lights (fresh)
    const lights = parseLights(data, ppg);
    if (lights.length) {
      await scene.createEmbeddedDocuments('AmbientLight', lights);
    }

    return { success: true, entity: scene };
  }
}
