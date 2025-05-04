import { Logger } from "./classes/logging";
import { SETTINGS } from "./settings/module-settings";
import { TacExport, getTacCounts, isTacExport } from "./types/tac-data";
import { runImportWithUI } from "./utils/import-helpers";

// Initialize the module and register the tab in CONFIG
// @ts-ignore - Foundry VTT globals
Hooks.on("init", () => {
    Logger.info('Initializing TAC Importer module');
    
    // Register module templates
    // @ts-ignore - Foundry VTT function
    foundry.applications.handlebars.loadTemplates([
        `modules/${SETTINGS.MODULE_ID}/handlebars/tac-importer-tab.hbs`
    ]);
    
    // Register our sidebar tab descriptor with Foundry
    // @ts-ignore - Foundry CONFIG
    CONFIG.ui.sidebar.TABS["tacimporter"] = {
        icon: "fa-solid fa-inbox-in",
        tooltip: "TAC Importer"
    };
    
    Logger.info('TAC Importer tab registered in CONFIG');
});

// By default, display notes so user can easily see the placements are imported
// @ts-ignore - Foundry VTT globals
Hooks.on('setup', () => {
    // @ts-ignore
    game.settings.set('core', 'notesDisplayToggle', true);
});

// Create and register our tab application during ready
// @ts-ignore - Foundry VTT globals
Hooks.once("ready", () => {
    try {
        // Simplified AbstractSidebarTab implementation for V13
        // @ts-ignore - Foundry AbstractSidebarTab extends the ApplicationV2 class
        class TacSidebarTab extends foundry.applications.sidebar.AbstractSidebarTab {
            // Core ApplicationV2 options
            static get defaultOptions() {
                // @ts-ignore - Foundry utils
                return foundry.utils.mergeObject(super.defaultOptions, {
                    id: "tacimporter",
                    title: "TAC Importer"
                });
            }
            
            // Required for sidebar tab identification
            static get tabName() {
                return "tacimporter";
            }
            
            // Define PARTS to identify renderable components
            // @ts-ignore - V13 patterns
            static PARTS = {
                content: { 
                    template: `modules/${SETTINGS.MODULE_ID}/handlebars/tac-importer-tab.hbs`
                }
            };
            
            // Required by ApplicationV2: Render the HTML content
            // @ts-ignore - V13 API override
            async _renderHTML(context, options) {
                // Use renderTemplate to generate our content
                // @ts-ignore - renderTemplate
                return await foundry.applications.handlebars.renderTemplate(
                    `modules/${SETTINGS.MODULE_ID}/handlebars/tac-importer-tab.hbs`, 
                    context
                );
            }
            
            // Required by ApplicationV2: Insert HTML into the DOM
            // @ts-ignore - V13 API override
            _replaceHTML(html, element, options) {
                // Insert the rendered HTML into the element
                element.innerHTML = "";
                
                if (typeof html === "string") {
                    element.innerHTML = html;
                } else {
                    element.innerHTML = String(html);
                }

                // Activate event listeners after HTML is inserted
                this._activateListeners(element);
            }
            
            // Add event listeners for the import button and token input
            // @ts-ignore - V13 API
            _activateListeners(html) {
                // Get DOM elements by ID
                const tokenInput = html.querySelector("#tac-token-input");
                const importButton = html.querySelector("#import-adventure-start");
                const statusElement = html.querySelector("#import-status");
                const importSummary = html.querySelector("#import-summary");
                const adventureTitle = html.querySelector("#adventure-title");
                const sceneCount = html.querySelector("#scene-count");
                const monsterCount = html.querySelector("#monster-count");
                const noteCount = html.querySelector("#note-count");
                const placementCount = html.querySelector("#placement-count");
                
                // Get spinners
                const sceneSpinner = html.querySelector("#scene-spinner");
                const monsterSpinner = html.querySelector("#monster-spinner");
                const noteSpinner = html.querySelector("#note-spinner");
                const placementSpinner = html.querySelector("#placement-spinner");
                
                // Error handling elements
                const errorSection = html.querySelector("#import-error");
                const errorMessage = html.querySelector("#error-message");
                const copyErrorBtn = html.querySelector("#copy-error");
                
                // Import state management
                interface FoundryData {
                    scenes: Array<{ name: string; [key: string]: any }>;
                    monsters: Array<{ name: string; [key: string]: any }>;
                    notes: Array<{ name: string; [key: string]: any }>;
                    placements: Array<{ type: string; [key: string]: any }>;
                }
                
                interface ImportState {
                    tacData: TacExport | null;
                    foundryData: FoundryData;
                    errors: string[];
                    dataFetched: boolean;
                    scenesProcessed: boolean;
                    monstersProcessed: boolean;
                    notesProcessed: boolean;
                    placementsProcessed: boolean;
                    reset(): void;
                }
                
                const importState: ImportState = {
                    // Original TAC data
                    tacData: null,
                    
                    // Mapped Foundry data (processed results)
                    foundryData: {
                        scenes: [],
                        monsters: [],
                        notes: [],
                        placements: []
                    },
                    
                    // Error tracking
                    errors: [],
                    
                    // Status flags
                    dataFetched: false,
                    scenesProcessed: false,
                    monstersProcessed: false,
                    notesProcessed: false,
                    placementsProcessed: false,
                    
                    // Reset the state
                    reset() {
                        this.tacData = null;
                        this.foundryData.scenes = [];
                        this.foundryData.monsters = [];
                        this.foundryData.notes = [];
                        this.foundryData.placements = [];
                        this.errors = [];
                        this.dataFetched = false;
                        this.scenesProcessed = false;
                        this.monstersProcessed = false;
                        this.notesProcessed = false;
                        this.placementsProcessed = false;
                    }
                };
                
                // Import process controller
                const importController = {
                    // Initialize the import UI
                    initializeImport() {
                        // Reset the state
                        importState.reset();
                        
                        // Reset UI
                        if (importSummary) importSummary.style.display = "none";
                        if (errorSection) errorSection.style.display = "none";
                        if (statusElement) statusElement.textContent = "";
                        
                        // Reset spinners
                        if (sceneSpinner) sceneSpinner.style.display = "none";
                        if (monsterSpinner) monsterSpinner.style.display = "none";
                        if (noteSpinner) noteSpinner.style.display = "none";
                        if (placementSpinner) placementSpinner.style.display = "none";
                        
                        // Reset counters
                        if (sceneCount) sceneCount.textContent = "-";
                        if (monsterCount) monsterCount.textContent = "-";
                        if (noteCount) noteCount.textContent = "-";
                        if (placementCount) placementCount.textContent = "-";
                    },
                    
                    // Update the UI with counts from the TAC data
                    updateCountsFromTacData() {
                        if (!importState.tacData) return;
                        
                        // Use the helper function to get counts
                        const counts = getTacCounts(importState.tacData);
                        
                        // Update the UI
                        if (sceneCount) sceneCount.textContent = counts.scenes.toString();
                        if (monsterCount) monsterCount.textContent = counts.monsters.toString();
                        if (noteCount) noteCount.textContent = counts.notes.toString();
                        if (placementCount) placementCount.textContent = counts.placements.toString();
                    },
                    
                    // Step 1: Fetch data
                    async fetchAdventureData(token: string) {
                        if (statusElement) statusElement.textContent = "Fetching adventure data...";
                        
                        try {
                            // Actual TAC API fetch implementation
                            if (!token || token.trim().length < 3) {
                                throw new Error("Invalid token. Please provide a valid TAC import token.");
                            }
                            
                            // Fetch data from TAC platform using token
                            const response = await fetch(`${SETTINGS.ADVENTURE_EXPORT_URL}?token=${token}`, {
                                method: 'GET',
                                headers: {
                                    'Accept': 'application/json'
                                }
                            });
                            
                            if (!response.ok) {
                                const errorText = await response.text();
                                throw new Error(`TAC API Error (${response.status}): ${errorText || response.statusText}`);
                            }
                            
                            const data = await response.json();
                            
                            // Validate the received data
                            if (!isTacExport(data)) {
                                throw new Error("Invalid data format received from TAC API");
                            }
                            
                            importState.tacData = data;
                            
                            if (statusElement) statusElement.textContent = "Adventure data received, parsing...";
                            
                            // Show import summary with title and counts immediately
                            if (importSummary) {
                                importSummary.style.display = "block";
                                if (adventureTitle && importState.tacData) {
                                    adventureTitle.textContent = importState.tacData.title;
                                }
                                
                                // Update counts before processing
                                this.updateCountsFromTacData();
                            }
                            
                            importState.dataFetched = true;
                            return true;
                        } 
                        catch (error) {
                            const errorMsg = error instanceof Error ? error.message : String(error);
                            Logger.error(`Failed to fetch adventure data: ${errorMsg}`);
                            this.handleError("Adventure data could not be fetched: " + errorMsg);
                            return false;
                        }
                    },
                    
                    // Handle critical errors that should stop the import process
                    handleError(message: string) {
                        const errorMsg = message || "Unknown error occurred";
                        Logger.error(`Critical import error: ${errorMsg}`);
                        
                        if (statusElement) {
                            statusElement.textContent = `Critical error: ${errorMsg}`;
                        }
                        
                        if (errorSection && errorMessage) {
                            errorSection.style.display = "block";
                            errorMessage.textContent = `A critical error occurred during import:\n\n${errorMsg}\n\nImport process halted.`;
                        }
                    },
                    
                    // The main import process that runs all steps in sequence
                    async runImport(token: string) {
                        this.initializeImport();
                        
                        try {
                            // Step 1: Fetch data
                            const dataFetched = await this.fetchAdventureData(token);
                            if (!dataFetched || !importState.tacData) {
                                this.handleError("Failed to fetch adventure data");
                                return;
                            }
                            
                            // Step 2: Use the new mapper framework to process the data
                            // Pass UI elements to the import helper
                            await runImportWithUI(
                                importState.tacData,
                                {
                                    statusElement,
                                    sceneSpinner,
                                    monsterSpinner,
                                    noteSpinner,
                                    placementSpinner,
                                    errorSection,
                                    errorMessage
                                }
                            );
                            
                        } catch (error) {
                            const errorMsg = error instanceof Error ? error.message : String(error);
                            this.handleError(`Import failed: ${errorMsg}`);
                        }
                    }
                };
                
                // Copy error to clipboard
                if (copyErrorBtn && errorMessage) {
                    copyErrorBtn.addEventListener("click", () => {
                        try {
                            // Create a textarea to hold the text for copying
                            const textarea = document.createElement('textarea');
                            textarea.value = errorMessage.textContent || "";
                            textarea.style.position = 'fixed';  // Prevent scrolling to bottom
                            document.body.appendChild(textarea);
                            textarea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textarea);
                            
                            // Provide visual feedback
                            const originalText = copyErrorBtn.innerHTML;
                            copyErrorBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                            setTimeout(() => {
                                copyErrorBtn.innerHTML = originalText;
                            }, 2000);
                        } catch (e) {
                            Logger.error(`Failed to copy error to clipboard: ${e instanceof Error ? e.message : String(e)}`);
                        }
                    });
                }

                // Enable/disable import button based on token input
                if (tokenInput && importButton) {
                    tokenInput.addEventListener("input", () => {
                        const token = tokenInput.value;
                        if (token && token.length > 1) {
                            importButton.removeAttribute("disabled");
                            importButton.style.opacity = "1";
                        } else {
                            importButton.setAttribute("disabled", "disabled");
                            importButton.style.opacity = "0.85";
                        }
                    });
                }

                // Handle import button click
                if (importButton && statusElement) {
                    importButton.addEventListener("click", async () => {
                        const token = tokenInput?.value || "";
                        await importController.runImport(token);
                        // Clear the token input after submission
                        if (tokenInput) tokenInput.value = "";
                    });
                }
                
                // DEVELOPMENT MODE: Simulate a complete import process with sample data
                // Uncomment this to see the full UI flow
                /*
                setTimeout(async () => {
                    if (tokenInput) tokenInput.value = "sample-token-123";
                    if (importButton) importButton.removeAttribute("disabled");
                    await importController.runImport("sample-token-123");
                }, 1000);
                */
            }
            
            // Required by AbstractSidebarTab for header controls
            // @ts-ignore - V13 API override
            _getHeaderControls() {
                return [];
            }
            
            // Provide data for the template
            // @ts-ignore - V13 API override
            async _prepareContext(options) {
                // Get base context from parent
                const context = await super._prepareContext(options);
                
                // Add our custom data
                // @ts-ignore - Foundry utils
                return foundry.utils.mergeObject(context, {
                    tacImporter: {
                        title: "TAC Importer",
                        description: "Import your adventures from Tabletop Adventure Creator"
                    }
                });
            }
        }

        // Register our tab in the Foundry UI
        // @ts-ignore - Foundry UI
        ui.tacimporter = new TacSidebarTab();
        
        // Log success
        Logger.info('TAC Importer tab created');
                
        // Render the sidebar to pick up our new tab
        // @ts-ignore - Foundry UI
        ui.sidebar.render(true);
    }
    catch (error) {
        Logger.error(`Error initializing sidebar tab: ${error instanceof Error ? error.message : String(error)}`);
    }
});

