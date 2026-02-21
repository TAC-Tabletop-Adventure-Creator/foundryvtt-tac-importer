import type { TacMapExport, ImportResult } from '../types';
import { fetchAsset } from '../utils/api';
import { downloadImage } from '../utils/files';
import { parseWalls, parseLights, parseDoors } from './uvtt';

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

    // Create scene
    const scene = await Scene.create({
      name: data.name || 'Imported Map',
      width,
      height,
      grid: { size: ppg },
      background: { src: img },
      padding: 0,
    });

    // Add walls + doors
    const walls = [...parseWalls(data, ppg), ...parseDoors(data, ppg)];
    if (walls.length) {
      await scene.createEmbeddedDocuments('Wall', walls);
    }

    // Add lights
    const lights = parseLights(data, ppg);
    if (lights.length) {
      await scene.createEmbeddedDocuments('AmbientLight', lights);
    }

    return { success: true, entity: scene };
  }
}
