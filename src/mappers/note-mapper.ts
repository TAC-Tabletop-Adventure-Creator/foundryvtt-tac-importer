import { Note } from "../types/tac-data";
import { NotesMapperResult, NoteMapResult } from "../types/mapper-types";
import { Logger } from "../classes/logging";
import { downloadAndSaveImage } from "../utils/image";

export class NoteMapper {
  /**
   * Maps TAC notes to Foundry VTT journal entries, using the adventure name for organization
   * @param notes Array of TAC notes to process
   * @param adventureName Name of the adventure for journal organization
   */
  async mapNotes(notes: Note[], adventureName: string): Promise<NotesMapperResult> {
    const result: NotesMapperResult = {
      results: [],
      success: true,
      errors: []
    };
    
    try {
      // First, find or create a root journal for the adventure
      let rootJournal: any = null;
      
      try {
        // Check if the root journal already exists
        // @ts-ignore - Foundry VTT types
        const existingJournal = game.journal.find(j => j.name === adventureName);
        
        if (existingJournal) {
          rootJournal = existingJournal;
          Logger.info(`Using existing adventure journal: ${adventureName} (${rootJournal.id})`);
        } else {
          // Create a new root journal
          // @ts-ignore - Foundry VTT types
          rootJournal = await JournalEntry.create({
            name: adventureName,
            // Root level journal doesn't need a folder
          });
          Logger.info(`Created new adventure journal: ${adventureName} (${rootJournal.id})`);
        }
      } catch (journalError) {
        const message = journalError instanceof Error ? journalError.message : String(journalError);
        Logger.error(`Failed to create root journal: ${message}`);
        throw new Error(`Could not create root journal: ${message}`);
      }
      
      // Process each note as a JournalEntry.Page within the root journal
      for (const note of notes) {
        const noteResult: NoteMapResult = {
          tacEntity: note,
          foundryEntity: null,
          success: false,
          errors: []
        };
        
        try {
          // Add a delay to simulate processing time
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const noteName = note.name;
          Logger.info(`Converting note: ${noteName}`);
          
          // Create the note data
          try {
            let imageHtml = '';
            
            // Download and process image if available
            if (note.image_url) {
              try {
                const imagePath = await downloadAndSaveImage(note.image_url, 'note');
                imageHtml = `<p><img src="${imagePath}" alt="${noteName}"></p>`;
                Logger.info(`Downloaded note image for ${noteName}`);
              } catch (imageError) {
                const message = imageError instanceof Error ? imageError.message : String(imageError);
                Logger.warning(`Failed to download image for note ${noteName}: ${message}`);
                // Continue without image
              }
            }
            
            // Check if a page with this name already exists in the journal
            // @ts-ignore - Foundry VTT types
            const existingPages = rootJournal.pages.filter(p => p.name === noteName);
            
            if (existingPages.length > 0) {
              // Update the existing page
              const existingPage = existingPages[0];
              Logger.info(`Updating existing journal page: ${noteName} (${existingPage.id})`);
              
              // @ts-ignore - Foundry VTT types
              const updatedPages = await rootJournal.updateEmbeddedDocuments("JournalEntryPage", [{
                _id: existingPage.id,
                name: noteName,
                type: "text",
                text: {
                  content: imageHtml + `<p>${note.description || ""}</p>`,
                  format: 1 // 1 is HTML format
                }
              }]);
              
              // Store the updated page in the result
              noteResult.foundryEntity = {
                journal: rootJournal,
                page: updatedPages[0] || existingPage
              };
            } else {
              // Create a new page
              Logger.info(`Creating new journal page: ${noteName}`);
              
              // @ts-ignore - Foundry VTT types
              const newPages = await rootJournal.createEmbeddedDocuments("JournalEntryPage", [{
                name: noteName,
                type: "text",
                text: {
                  content: imageHtml + `<p>${note.description || ""}</p>`,
                  format: 1 // 1 is HTML format
                }
              }]);
              
              // Store the created page in the result
              noteResult.foundryEntity = {
                journal: rootJournal,
                page: newPages[0]
              };
            }
            
            noteResult.success = true;
            Logger.info(`Successfully processed note page: ${noteName}`);
          } catch (conversionError) {
            const message = conversionError instanceof Error ? conversionError.message : String(conversionError);
            throw new Error(`Error converting note data: ${message}`);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          noteResult.errors.push(`Failed to import note "${note.name}": ${message}`);
          noteResult.success = false;
          
          // Set overall success to false if any note fails
          result.success = false;
          Logger.error(`Note creation error: ${message}`);
        }
        
        // Add this note's result to the collection
        result.results.push(noteResult);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`Note import failed: ${message}`);
      result.success = false;
      Logger.error(`Note import failed: ${message}`);
    }
    
    return result;
  }
} 