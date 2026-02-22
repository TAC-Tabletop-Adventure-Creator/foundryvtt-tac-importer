import type { TacMonsterExport, ImportResult } from '../types';
import { fetchAsset } from '../utils/api';
import { downloadImage } from '../utils/files';
import { checkSystem } from '../utils/system';

const MODULE_ID = 'tac-importer';

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

    // Find existing by TAC ID
    const existing = game.actors.find(
      a => a.getFlag(MODULE_ID, 'tacId') === data.id
    );

    let actor: Actor;
    if (existing) {
      // Update existing actor
      await existing.update({
        name: data.name,
        img: img || data.img,
        system: data.system,
      });

      // Delete all existing items
      const itemIds = existing.items.map(i => i.id);
      if (itemIds.length > 0) {
        await existing.deleteEmbeddedDocuments('Item', itemIds);
      }

      actor = existing;
    } else {
      // Create new actor
      actor = await Actor.create({
        name: data.name,
        type: data.type,
        img: img || data.img,
        system: data.system,
      });

      // Set TAC ID flag
      await actor.setFlag(MODULE_ID, 'tacId', data.id);
    }

    // Add items (fresh)
    if (data.items?.length) {
      await actor.createEmbeddedDocuments('Item', data.items);
    }

    return { success: true, entity: actor };
  }
}
