import { Placement } from "../types/tac-data";
import { PlacementsMapperResult, PlacementMapResult, ScenesMapperResult, MonstersMapperResult, NotesMapperResult } from "../types/mapper-types";
import { Logger } from "../classes/logging";

export class PlacementMapper {
  /**
   * Maps TAC placements to tokens and note pins on Foundry scenes
   * @param placements Array of TAC placements to process
   * @param scenesResult Result from the scene mapper containing scene mappings
   * @param monstersResult Result from the monster mapper containing monster mappings
   * @param notesResult Result from the note mapper containing note mappings
   */
  async mapPlacements(
    placements: Placement[], 
    scenesResult: ScenesMapperResult,
    monstersResult: MonstersMapperResult,
    notesResult: NotesMapperResult
  ): Promise<PlacementsMapperResult> {
    const result: PlacementsMapperResult = {
      results: [],
      success: true,
      errors: []
    };
    
    try {
      // Check if we have the necessary successful results
      if (!scenesResult.success || !monstersResult.success || !notesResult.success) {
        result.errors.push("Cannot process placements due to previous mapping failures");
        result.success = false;
        return result;
      }
      
      // Process each placement
      for (const placement of placements) {
        const placementResult: PlacementMapResult = {
          tacEntity: placement,
          foundryEntity: null,
          success: false,
          errors: []
        };
        
        try {
          Logger.info(`Processing placement: ${placement.type} at (${placement.position_x}, ${placement.position_y})`);
          
          // Process based on placement type
          if (placement.type === "monster") {
            await this.placeMonsterToken(placement, scenesResult, monstersResult, placementResult);
          } else if (placement.type === "note") {
            await this.placeNotePin(placement, scenesResult, notesResult, placementResult);
          } else {
            throw new Error(`Unknown placement type: ${placement.type}`);
          }
          
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          placementResult.errors.push(`Failed to place entity at (${placement.position_x}, ${placement.position_y}): ${message}`);
          placementResult.success = false;
          
          // Set overall success to false if any placement fails
          result.success = false;
          Logger.error(`Placement error: ${message}`);
        }
        
        // Add this placement's result to the collection
        result.results.push(placementResult);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`Placement import failed: ${message}`);
      result.success = false;
      Logger.error(`Placement import failed: ${message}`);
    }
    
    return result;
  }
  
  /**
   * Places a monster token on a scene
   */
  private async placeMonsterToken(
    placement: Placement, 
    scenesResult: ScenesMapperResult, 
    monstersResult: MonstersMapperResult, 
    result: PlacementMapResult
  ): Promise<void> {
    // Find the corresponding scene mapping
    const sceneMapping = scenesResult.results.find(r => 
      r.tacEntity.id === placement.scene_id
    );
    
    if (!sceneMapping || !sceneMapping.foundryEntity) {
      throw new Error(`Scene not found for placement`);
    }
    
    // Find the corresponding monster mapping
    const monsterId = placement.monster_id;
    if (!monsterId) {
      throw new Error("Monster placement missing monster_id");
    }
    
    const monsterMapping = monstersResult.results.find(r => 
      r.tacEntity.id === monsterId
    );
    
    if (!monsterMapping || !monsterMapping.foundryEntity) {
      throw new Error(`Monster not found for placement`);
    }
    
    const scene = sceneMapping.foundryEntity;
    const actor = monsterMapping.foundryEntity;
    
    // Create token data
    const tokenData = {
      name: actor.name,
      // @ts-ignore - Foundry VTT constants
      displayName: CONST.TOKEN_DISPLAY_MODES.HOVER,
      x: placement.position_x,
      y: placement.position_y,
      texture: {
        src: actor.img || actor.data?.img,
      },
      // @ts-ignore - Foundry VTT constants
      disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE,
      actorId: actor.id || actor._id,
      actorLink: true,
    };
    
    // Create the token on the scene
    // @ts-ignore - Foundry VTT methods
    const createdToken = await scene.createEmbeddedDocuments("Token", [tokenData]);
    result.foundryEntity = createdToken[0];
    result.success = true;
    Logger.info(`Created token for ${actor.name} on scene ${scene.name}`);
  }
  
  /**
   * Places a note pin on a scene
   */
  private async placeNotePin(
    placement: Placement, 
    scenesResult: ScenesMapperResult, 
    notesResult: NotesMapperResult, 
    result: PlacementMapResult
  ): Promise<void> {
    // Find the corresponding scene mapping
    const sceneMapping = scenesResult.results.find(r => 
      r.tacEntity.id === placement.scene_id
    );
    
    if (!sceneMapping || !sceneMapping.foundryEntity) {
      throw new Error(`Scene not found for placement`);
    }
    
    // Find the corresponding note mapping
    const noteId = placement.note_id;
    if (!noteId) {
      throw new Error("Note placement missing note_id");
    }
    
    const noteMapping = notesResult.results.find(r => 
      r.tacEntity.id === noteId
    );
    
    if (!noteMapping || !noteMapping.foundryEntity) {
      throw new Error(`Note not found for placement`);
    }
    
    const scene = sceneMapping.foundryEntity;
    const journalInfo = noteMapping.foundryEntity;
    
    // Most notes store the journal and page separately
    let entryId, pageId, noteName;
    
    if (journalInfo.journal && journalInfo.page) {
      entryId = journalInfo.journal.id || journalInfo.journal._id;
      pageId = journalInfo.page.id || journalInfo.page._id;
      noteName = journalInfo.page.name;
    } else if (journalInfo._id) {
      // Direct journal reference (older structure)
      entryId = journalInfo._id;
      // @ts-ignore - Foundry VTT structure
      const page = journalInfo.pages?.find(p => p.name === noteMapping.tacEntity.name);
      pageId = page?.id || page?._id;
      noteName = noteMapping.tacEntity.name;
    }
    
    if (!entryId) {
      throw new Error(`Could not determine journal entry ID for note`);
    }
    
    // Create note data
    const noteData = {
      entryId: entryId,
      pageId: pageId, // May be undefined for older Foundry versions
      x: placement.position_x,
      y: placement.position_y,
      text: noteName || "Note",
      // Default icon if needed
      // icon: "icons/svg/book.svg"
    };
    
    // Create the note on the scene
    // @ts-ignore - Foundry VTT methods
    const createdNote = await scene.createEmbeddedDocuments("Note", [noteData]);
    result.foundryEntity = createdNote[0];
    result.success = true;
    Logger.info(`Created note pin for ${noteName} on scene ${scene.name}`);
  }
} 