import { TacExport } from "./types/tac-data";
import { ImportFlowResult } from "./types/mapper-types";
import { SceneMapper } from "./mappers/scene-mapper";
import { MonsterMapper } from "./mappers/monster-mapper";
import { NoteMapper } from "./mappers/note-mapper";
import { PlacementMapper } from "./mappers/placement-mapper";
import { Logger } from "./classes/logging";
import { ensureFolder } from "./utils/folder-utils";

/**
 * Import progress callback type
 * @param stage Current import stage
 * @param message Status message
 * @param completed Whether this stage has completed
 */
export type ImportProgressCallback = (stage: string, message: string, completed?: boolean) => void;

/**
 * Main import flow function that orchestrates the entire import process
 * 
 * @param tacData The TAC export data to import
 * @param progressCallback Optional callback for progress updates
 * @returns Import result with all entity mapping results
 */
export async function importTacData(
  tacData: TacExport, 
  progressCallback?: ImportProgressCallback
): Promise<ImportFlowResult> {
  const result: ImportFlowResult = {
    success: true,
    scenes: { results: [], success: false, errors: [] },
    monsters: { results: [], success: false, errors: [] },
    notes: { results: [], success: false, errors: [] },
    placements: { results: [], success: false, errors: [] },
    errors: []
  };
  
  try {
    // Create mappers
    const sceneMapper = new SceneMapper();
    const monsterMapper = new MonsterMapper();
    const noteMapper = new NoteMapper();
    const placementMapper = new PlacementMapper();
    
    // First, create folders for organization based on adventure name
    progressCallback?.('preparation', 'Ensuring necessary folders exist...');
    
    const adventureName = tacData.title || "TAC Adventure";
    const systemId = tacData.system || ""; // Get the system ID from the TAC data
    
    Logger.info(`Adventure system: ${systemId}`);
    
    // Ensure folders exist for scenes and monsters (guaranteed to exist after these calls)
    const scenesFolder = await ensureFolder(adventureName, "Scene");
    const monstersFolder = await ensureFolder(adventureName, "Actor");
    
    // Note: Journals don't need folders as they'll be directly named with the adventure name
    // Note: Placements are part of scenes in Foundry and don't need folders
    
    progressCallback?.('preparation', 'Folders prepared successfully', true);
    
    // Process scenes
    progressCallback?.('scenes', 'Processing scenes...');
    Logger.info("Starting scene import");
    result.scenes = await sceneMapper.mapScenes(tacData.scenes, scenesFolder);
    progressCallback?.('scenes', 'Scenes processed', true);
    
    // Process monsters
    progressCallback?.('monsters', 'Processing monsters...');
    Logger.info("Starting monster import");
    result.monsters = await monsterMapper.mapMonsters(tacData.monsters, monstersFolder, systemId);
    progressCallback?.('monsters', 'Monsters processed', true);
    
    // Process notes
    progressCallback?.('notes', 'Processing notes...');
    Logger.info("Starting note import");
    result.notes = await noteMapper.mapNotes(tacData.notes, adventureName);
    progressCallback?.('notes', 'Notes processed', true);
    
    // Process placements if we have the required references
    if (result.scenes.success && result.monsters.success && result.notes.success) {
      progressCallback?.('placements', 'Processing placements...');
      Logger.info("Starting placement import");
      
      // Pass the complete mapper results directly to placement mapper
      result.placements = await placementMapper.mapPlacements(
        tacData.placements,
        result.scenes,
        result.monsters,
        result.notes
      );
      
      progressCallback?.('placements', 'Placements processed', true);
    } else {
      result.errors.push('Skipped placement processing due to previous errors');
      Logger.warning("Skipping placement processing due to previous errors");
    }
    
    // Set overall success
    result.success = 
      result.scenes.success && 
      result.monsters.success && 
      result.notes.success && 
      result.placements.success;
    
    // Collect all errors from entity mappers
    const allMapperErrors = [
      ...result.scenes.errors,
      ...result.monsters.errors,
      ...result.notes.errors,
      ...result.placements.errors
    ];
    
    if (allMapperErrors.length > 0) {
      result.errors.push(...allMapperErrors);
    }
    
    // Log completion
    Logger.info(`Import process completed with success=${result.success}, errors=${result.errors.length}`);
      
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    Logger.error(`Import process failed with unexpected error: ${message}`);
    result.errors.push(`Critical import error: ${message}`);
    result.success = false;
    return result;
  }
}

/**
 * Utility function to calculate total errors across all entity types
 */
export function getTotalErrorCount(result: ImportFlowResult): number {
  const entityErrors = 
    result.scenes.results.filter(r => !r.success).length +
    result.monsters.results.filter(r => !r.success).length +
    result.notes.results.filter(r => !r.success).length +
    result.placements.results.filter(r => !r.success).length;
    
  return result.errors.length + entityErrors;
}

/**
 * Utility function to get all error messages from the import result
 */
export function getAllErrorMessages(result: ImportFlowResult): string[] {
  const messages: string[] = [...result.errors];
  
  // Scene errors
  result.scenes.results
    .filter(r => !r.success && r.errors.length > 0)
    .forEach(r => messages.push(...r.errors));
    
  // Monster errors
  result.monsters.results
    .filter(r => !r.success && r.errors.length > 0)
    .forEach(r => messages.push(...r.errors));
    
  // Note errors
  result.notes.results
    .filter(r => !r.success && r.errors.length > 0)
    .forEach(r => messages.push(...r.errors));
    
  // Placement errors
  result.placements.results
    .filter(r => !r.success && r.errors.length > 0)
    .forEach(r => messages.push(...r.errors));
    
  return messages;
} 