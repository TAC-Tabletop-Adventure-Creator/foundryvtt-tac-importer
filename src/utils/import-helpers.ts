import { importTacData, getAllErrorMessages, getTotalErrorCount } from "../import-flow";
import { ImportFlowResult } from "../types/mapper-types";
import { TacExport } from "../types/tac-data";
import { Logger } from "../classes/logging";

/**
 * UI-friendly import handler that connects the import flow to the UI elements
 * 
 * @param tacData The TAC export data to import
 * @param uiElements UI elements to update during import
 * @returns The import result
 */
export async function runImportWithUI(
  tacData: TacExport,
  uiElements: {
    statusElement: HTMLElement | null;
    sceneSpinner?: HTMLElement | null;
    monsterSpinner?: HTMLElement | null;
    noteSpinner?: HTMLElement | null;
    placementSpinner?: HTMLElement | null;
    errorSection?: HTMLElement | null;
    errorMessage?: HTMLElement | null;
  }
): Promise<ImportFlowResult> {
  const { 
    statusElement, 
    sceneSpinner, 
    monsterSpinner, 
    noteSpinner, 
    placementSpinner,
    errorSection,
    errorMessage
  } = uiElements;
  
  // Helper function to show a spinner
  const showSpinner = (spinner: HTMLElement | null | undefined) => {
    if (spinner) spinner.style.display = "block";
  };
  
  // Helper function to hide a spinner
  const hideSpinner = (spinner: HTMLElement | null | undefined) => {
    if (spinner) spinner.style.display = "none";
  };
  
  // Hide all spinners initially
  hideSpinner(sceneSpinner);
  hideSpinner(monsterSpinner);
  hideSpinner(noteSpinner);
  hideSpinner(placementSpinner);
  
  try {
    // Run the import process with progress updates
    const result = await importTacData(
      tacData,
      (stage, message, completed = false) => {
        // Update status message
        if (statusElement) statusElement.textContent = message;
        
        // If this is a completion notification, hide the appropriate spinner
        if (completed) {
          if (stage === 'scenes') hideSpinner(sceneSpinner);
          else if (stage === 'monsters') hideSpinner(monsterSpinner);
          else if (stage === 'notes') hideSpinner(noteSpinner);
          else if (stage === 'placements') hideSpinner(placementSpinner);
          return;
        }
        
        // Otherwise, this is a start notification, show the appropriate spinner
        if (stage === 'scenes') showSpinner(sceneSpinner);
        else if (stage === 'monsters') showSpinner(monsterSpinner);
        else if (stage === 'notes') showSpinner(noteSpinner);
        else if (stage === 'placements') showSpinner(placementSpinner);
      }
    );
    
    // Ensure all spinners are hidden
    hideSpinner(sceneSpinner);
    hideSpinner(monsterSpinner);
    hideSpinner(noteSpinner);
    hideSpinner(placementSpinner);
    
    // Show final status
    if (statusElement) {
      const totalErrors = getTotalErrorCount(result);
      if (totalErrors > 0) {
        statusElement.textContent = `Import completed with ${totalErrors} errors.`;
      } else {
        statusElement.textContent = "Import completed successfully!";
      }
    }
    
    // Show error details if needed
    if (totalHasErrors(result) && errorSection && errorMessage) {
      errorSection.style.display = "block";
      const errorMessages = getAllErrorMessages(result);
      errorMessage.textContent = `Import completed with the following errors:\n\n${errorMessages.join('\n\n')}`;
    }
    
    return result;
  } catch (error) {
    // Hide all spinners
    hideSpinner(sceneSpinner);
    hideSpinner(monsterSpinner);
    hideSpinner(noteSpinner);
    hideSpinner(placementSpinner);
    
    // Handle critical error
    const message = error instanceof Error ? error.message : String(error);
    Logger.error(`Critical import error: ${message}`);
    
    if (statusElement) {
      statusElement.textContent = `Critical error: ${message}`;
    }
    
    if (errorSection && errorMessage) {
      errorSection.style.display = "block";
      errorMessage.textContent = `A critical error occurred during import:\n\n${message}\n\nImport process halted.`;
    }
    
    // Return a failed result
    return {
      success: false,
      scenes: { results: [], success: false, errors: [] },
      monsters: { results: [], success: false, errors: [] },
      notes: { results: [], success: false, errors: [] },
      placements: { results: [], success: false, errors: [] },
      errors: [`Critical import error: ${message}`]
    };
  }
}

/**
 * Check if the import result has any errors
 */
export function totalHasErrors(result: ImportFlowResult): boolean {
  return getTotalErrorCount(result) > 0;
}

/**
 * Generate a human-readable summary of the import results
 */
export function generateImportSummary(result: ImportFlowResult): string {
  const successfulScenes = result.scenes.results.filter(r => r.success).length;
  const successfulMonsters = result.monsters.results.filter(r => r.success).length;
  const successfulNotes = result.notes.results.filter(r => r.success).length;
  const successfulPlacements = result.placements.results.filter(r => r.success).length;
  
  const totalScenes = result.scenes.results.length;
  const totalMonsters = result.monsters.results.length;
  const totalNotes = result.notes.results.length;
  const totalPlacements = result.placements.results.length;
  
  return [
    `Import ${result.success ? 'successful' : 'completed with errors'}.`,
    `Scenes: ${successfulScenes}/${totalScenes} imported`,
    `Monsters: ${successfulMonsters}/${totalMonsters} imported`,
    `Notes: ${successfulNotes}/${totalNotes} imported`,
    `Placements: ${successfulPlacements}/${totalPlacements} processed`
  ].join('\n');
} 