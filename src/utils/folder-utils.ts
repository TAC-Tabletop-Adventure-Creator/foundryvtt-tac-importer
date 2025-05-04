import { Logger } from "../classes/logging";

/**
 * Ensures a folder exists with the given name and type, creating it if needed
 * 
 * @param name The name of the folder
 * @param type The folder type (Scene, Actor, JournalEntry, etc.)
 * @returns The folder object, guaranteed to exist
 */
export async function ensureFolder(name: string, type: string): Promise<any> {
  Logger.info(`Ensuring folder exists: ${name} (type: ${type})`);
  
  try {
    // First check if the folder already exists
    // @ts-ignore - Foundry VTT types
    const existingFolders = game.folders.filter(f => f.type === type && f.name === name);
    
    if (existingFolders.length > 0) {
      Logger.info(`Using existing folder: ${name} (${existingFolders[0].id})`);
      return existingFolders[0];
    }
    
    // Folder doesn't exist, so create it
    // @ts-ignore - Foundry VTT types
    const newFolder = await Folder.create({
      name,
      type,
      // @ts-ignore - Foundry VTT types
      parent: null,
      // @ts-ignore - Foundry VTT types
      sort: 0
    });
    
    Logger.info(`Created new folder: ${name} (${newFolder.id})`);
    return newFolder;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    Logger.error(`Error creating/accessing folder ${name}: ${message}`);
    
    // As a last resort, create a fallback folder
    try {
      const fallbackName = `${name} (Import)`;
      Logger.warning(`Attempting to create fallback folder: ${fallbackName}`);
      
      // @ts-ignore - Foundry VTT types
      const fallbackFolder = await Folder.create({
        name: fallbackName,
        type,
        // @ts-ignore - Foundry VTT types
        parent: null,
        // @ts-ignore - Foundry VTT types
        sort: 0
      });
      
      Logger.info(`Created fallback folder: ${fallbackName} (${fallbackFolder.id})`);
      return fallbackFolder;
    } catch (fallbackError) {
      // If even the fallback fails, throw an error - this is critical
      const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      throw new Error(`Failed to create any folder: ${fallbackMessage}`);
    }
  }
} 