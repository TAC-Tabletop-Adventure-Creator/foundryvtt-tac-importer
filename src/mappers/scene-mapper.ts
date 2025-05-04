import { Scene } from "../types/tac-data";
import { ScenesMapperResult, SceneMapResult } from "../types/mapper-types";
import { Logger } from "../classes/logging";
import { downloadAndSaveImage } from "../utils/image";

export class SceneMapper {
  /**
   * Maps TAC scenes to Foundry VTT scenes, placing them in the specified folder
   * @param scenes List of TAC scenes to process
   * @param folder Folder to place the scenes in (guaranteed to exist)
   */
  async mapScenes(scenes: Scene[], folder: any): Promise<ScenesMapperResult> {
    const result: ScenesMapperResult = {
      results: [],
      success: true,
      errors: []
    };
    
    try {
      // Process each scene
      for (const scene of scenes) {
        const sceneResult: SceneMapResult = {
          tacEntity: scene,
          foundryEntity: null,
          success: false,
          errors: []
        };
        
        try {
          // Add a delay to simulate processing time
          await new Promise(resolve => setTimeout(resolve, 500));
          
          Logger.info(`Converting scene: ${scene.name}`);
          
          // Check if a scene with this name already exists in this folder
          // @ts-ignore - Foundry VTT types
          const existingScene = game.scenes.find(s => s.name === scene.name && s.folder?.id === folder.id);
          
          // Create the scene data using our converter logic
          try {
            // Prepare the scene data
            const sceneData = {
              name: scene.name,
              // @ts-ignore - Foundry VTT types
              folder: folder.id,
              padding: 0.0,
              width: 1024, // Default width
              height: 1024, // Default height
              grid: { 
                size: 50, // Default grid size
                type: 1 // Grid type (1 = Square)
              },
              // Will be populated if image download succeeds
              background: {},
              initial: {
                x: 625, // Default pan position
                y: 515, // Default pan position
                scale: 0.95 // Default zoom level
              }
            };
            
            // Download and save the scene image if available
            if (scene.image_url) {
              try {
                const imagePath = await downloadAndSaveImage(scene.image_url, 'scene');
                // @ts-ignore - Foundry VTT types
                sceneData.background.src = imagePath;
                Logger.info(`Downloaded scene image for ${scene.name}`);
              } catch (imageError) {
                const message = imageError instanceof Error ? imageError.message : String(imageError);
                Logger.warning(`Failed to download image for scene ${scene.name}: ${message}`);
                // Continue without image
              }
            }
            
            let finalScene;
            if (existingScene) {
              // Clear existing tokens and notes
              // @ts-ignore - Foundry VTT types
              const existingTokenIds = existingScene.tokens?.map(token => token._id) || [];
              await existingScene.deleteEmbeddedDocuments('Token', existingTokenIds);
              
              // @ts-ignore - Foundry VTT types
              const existingNoteIds = existingScene.notes?.map(note => note._id) || [];
              await existingScene.deleteEmbeddedDocuments('Note', existingNoteIds);
              
              // Update the existing scene
              Logger.info(`Updating existing scene: ${scene.name} (${existingScene.id})`);
              // @ts-ignore - Foundry VTT types
              finalScene = await existingScene.update(sceneData);
              
              // In Foundry, update returns the updated entity object
              if (!finalScene) {
                finalScene = existingScene;
              }
            } else {
              // Create a new scene
              Logger.info(`Creating new scene: ${scene.name}`);
              // @ts-ignore - Foundry VTT types
              finalScene = await Scene.create(sceneData);
            }
            
            // Store the scene in the result
            sceneResult.foundryEntity = finalScene;
            sceneResult.success = true;
            Logger.info(`Successfully processed scene: ${scene.name}`);
          } catch (conversionError) {
            const message = conversionError instanceof Error ? conversionError.message : String(conversionError);
            throw new Error(`Error converting scene data: ${message}`);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          sceneResult.errors.push(`Failed to import scene "${scene.name}": ${message}`);
          sceneResult.success = false;
          
          // Set overall success to false if any scene fails
          result.success = false;
          Logger.error(`Scene creation error: ${message}`);
        }
        
        // Add this scene's result to the collection
        result.results.push(sceneResult);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`Scene import failed: ${message}`);
      result.success = false;
      Logger.error(`Scene import failed: ${message}`);
    }
    
    return result;
  }
} 