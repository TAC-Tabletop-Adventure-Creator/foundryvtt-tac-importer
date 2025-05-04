import { Monster } from "../types/tac-data";
import { MonstersMapperResult, MonsterMapResult } from "../types/mapper-types";
import { Logger } from "../classes/logging";
import { downloadAndSaveImage } from "../utils/image";
import { convertDnd51eStatblock } from "../system-statblocks/dnd_5_1e-statblock";

export class MonsterMapper {
  /**
   * Maps TAC monsters to Foundry VTT actors, placing them in the specified folder
   * @param monsters Array of TAC monsters to process
   * @param folder Folder to place the actors in (guaranteed to exist)
   * @param systemId The system identifier for statblock conversion (e.g., "D&D5.1e")
   */
  async mapMonsters(monsters: Monster[], folder: any, systemId: string = ""): Promise<MonstersMapperResult> {
    const result: MonstersMapperResult = {
      results: [],
      success: true,
      errors: []
    };
    
    try {
      // Process each monster
      for (const monster of monsters) {
        const monsterResult: MonsterMapResult = {
          tacEntity: monster,
          foundryEntity: null,
          success: false,
          errors: []
        };
        
        try {
          // Add a delay to simulate processing time
          await new Promise(resolve => setTimeout(resolve, 500));
          
          Logger.info(`Converting monster: ${monster.name}`);
          
          // Check if an actor with this name already exists in this folder
          // @ts-ignore - Foundry VTT types
          const existingActor = game.actors.find(a => a.name === monster.name && a.folder?.id === folder.id && a.type === "npc");
          
          // Create the monster data using our converter logic
          try {
            // Start with basic actor data
            let actorData: any = {
              name: monster.name,
              type: "npc", // NPC type for monsters
              // @ts-ignore - Foundry VTT types
              folder: folder.id,
              system: {
                description: { value: monster.description }
              }
            };
            
            // Apply system-specific statblock data if available
            let statblockApplied = false;
            if (systemId) {
              switch (systemId) {
                case "D&D5.1e":
                  // Apply D&D 5.1e statblock conversion
                  const dnd5eData = convertDnd51eStatblock(monster);
                  
                  // Simply merge the entire dnd5eData with actorData
                  // Preserve name, type, and folder
                  actorData = {
                    ...dnd5eData,
                    name: monster.name,
                    type: "npc",
                    folder: folder.id
                  };
                  statblockApplied = true;
                  break;
                default:
                  Logger.warning(`System ${systemId} not recognized for statblock conversion`);
                  break;
              }
            }
            
            // Log if no system-specific conversion was applied
            if (!statblockApplied) {
              Logger.warning(`No system-specific statblock applied for ${monster.name}. Using generic monster data.`);
              monsterResult.errors.push(`Statblock not included because system '${systemId}' was not recognized.`);
            }
            
            // Download and save the monster image if available
            if (monster.image_url) {
              try {
                const imagePath = await downloadAndSaveImage(monster.image_url, 'monster');
                // @ts-ignore - Foundry VTT types
                actorData.img = imagePath;
                Logger.info(`Downloaded monster image for ${monster.name}`);
              } catch (imageError) {
                const message = imageError instanceof Error ? imageError.message : String(imageError);
                Logger.warning(`Failed to download image for monster ${monster.name}: ${message}`);
                // Continue without image
              }
            }
            
            let finalActor;
            if (existingActor) {
              // Update the existing actor
              Logger.info(`Updating existing monster: ${monster.name} (${existingActor.id})`);
              // items will duplicate so we need to delete them first
              Logger.info(`Deleting existing items for monster: ${monster.name}`);
              await existingActor.deleteEmbeddedDocuments("Item", existingActor.items.map((i: any) => i.id));
              // @ts-ignore - Foundry VTT types
              finalActor = await existingActor.update(actorData);
              
              // In Foundry, update returns the updated entity object
              if (!finalActor) {
                finalActor = existingActor;
              }
            } else {
              // Create a new actor
              Logger.info(`Creating new monster: ${monster.name}`);
              // @ts-ignore - Foundry VTT types
              finalActor = await Actor.create(actorData);
            }
            
            // Store the actor in the result
            monsterResult.foundryEntity = finalActor;
            monsterResult.success = true;
            Logger.info(`Successfully processed monster: ${monster.name}`);
          } catch (conversionError) {
            const message = conversionError instanceof Error ? conversionError.message : String(conversionError);
            throw new Error(`Error converting monster data: ${message}`);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          monsterResult.errors.push(`Failed to import monster "${monster.name}": ${message}`);
          monsterResult.success = false;
          
          // Set overall success to false if any monster fails
          result.success = false;
          Logger.error(`Monster creation error: ${message}`);
        }
        
        // Add this monster's result to the collection
        result.results.push(monsterResult);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`Monster import failed: ${message}`);
      result.success = false;
      Logger.error(`Monster import failed: ${message}`);
    }
    
    return result;
  }
} 