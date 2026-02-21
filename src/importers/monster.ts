import type { TacMonsterExport, ImportResult } from '../types';
import { fetchAsset } from '../utils/api';
import { downloadImage } from '../utils/files';
import { checkSystem } from '../utils/system';

export class MonsterImporter {
  async importById(id: string): Promise<ImportResult> {
    const data = await fetchAsset<TacMonsterExport>('/export/monster', id);
    return this.importFromData(data);
  }

  async importFromData(data: TacMonsterExport): Promise<ImportResult> {
    // System check
    const check = checkSystem(data.tacSystem);
    if (!check.ok) return { success: false, error: check.error };

    // Download image
    const img = data.img
      ? await downloadImage(data.img, 'monsters', data.name)
      : undefined;

    // Create actor
    const actor = await Actor.create({
      name: data.name,
      type: data.type,
      img: img || data.img,
      system: data.system,
    });

    // Add items
    if (data.items?.length) {
      await actor.createEmbeddedDocuments('Item', data.items);
    }

    return { success: true, entity: actor };
  }
}
