# FoundryVTT TAC Importer Project Structure

## 1. Core Architecture
   - TypeScript-based Foundry VTT Module
   - Webpack Build System (with pnpm)
   - Foundry VTT Hooks Integration
   - JSON Data Import/Conversion Pipeline
   - D&D 5e System Integration

## 2. Main Components

   ### Application Core (src/index.ts)
   - **Module Initialization** - Sets up module hooks and integrations with Foundry VTT
   - **UI Integration** - Adds import buttons to Foundry's sidebar for scenes, actors, and journals
   - **Core Hook System** - Leverages Foundry's hook system for initialization and rendering

   ### Import Interface (src/apps/tac-importer.ts)
   - **TacImporter Class** - Main application handling the import UI and process
   - **importAdventure Method** - Orchestrates the entire import process
   - **importScenes Method** - Handles scene creation with maps, walls, and lights
   - **importJournalsAndNotes Method** - Creates journals and places note pins on scenes
   - **importActorsAndTokens Method** - Creates monsters and places their tokens on scenes

   ### Data Conversion System (src/converters/)
   - **scene-converter.ts** - Transforms TAC scene data into Foundry scene documents
   - **journal-converter.ts** - Converts TAC notes into Foundry journal entries
   - **monster-converter.ts** - Handles monster conversion to Foundry actors
   - **dnd5e-statblock-converter.ts** - Complex D&D 5e statblock transformation with stats, abilities, and actions

   ### Type Definitions (src/types/)
   - **tac-types.ts** - Core TAC data structures including adventure, scenes, monsters, and notes
   - **monster-schema-5e.ts** - Comprehensive D&D 5e monster statblock schema
   - **actor-creation-data.ts** - Foundry actor creation data structure

   ### Utility Functions (src/utils/)
   - **coordinates.ts** - Handling coordinate transformations between systems
   - **image.ts** - Image processing and manipulation utilities

## 3. Data Models

   ### TAC Export Structure
   - **Adventure** - Container for title, description, and system compatibility
   - **Scenes** - Map data with walls, lights, and entity placements
   - **Monsters** - Creature data with system-specific statblocks
   - **Notes** - Text content for journal entries

   ### Scene Elements
   - **Walls** - Line segments defining barriers with properties (blocks vision/sound/movement)
   - **Doors** - Special wall segments with door properties (secret, locked)
   - **Lights** - Point lights with radius, color, and intensity
   - **Placements** - Positioned entities (monsters, notes) on scenes

   ### Monster Statblocks
   - **DnD 5.1e Schema** - Comprehensive monster stats following 5e SRD structure
   - **Multi-system Support** - Architecture for different game system statblocks

## 4. UI Components

   ### Import Interface
   - **tac-importer.hbs** - Handlebars template for the import dialog
   - **Form Elements** - Input field for adventure data and import button

## 5. Configuration

   ### Module Settings
   - **module-settings.ts** - Module identification and configuration constants

   ### Module Manifest
   - **module.json** - Foundry VTT module manifest with metadata and dependencies

## 6. Build System

   ### Webpack Configuration
   - **webpack.config.js** - Build pipeline for TypeScript compilation and asset bundling
   - **Package Management** - pnpm for dependency tracking

## 7. Current Features

   ### Scene Import
   - Map image import with proper dimensions
   - Wall and door placement with appropriate properties
   - Light source positioning with color and radius

   ### Entity Import
   - D&D 5e monster creation with complete statblocks
   - Journal entry creation with formatted text
   - Token placement on scenes with proper references

   ### Organization
   - Folder creation for imported content
   - Adventure-based organization structure

## 8. Planned Enhancements

   ### Improved Data Validation
   - Enhanced validation for imported JSON data
   - Error handling for malformed or incomplete data

   ### Additional Game System Support
   - Extend beyond D&D 5e to other game systems
   - System-agnostic import capabilities

   ### UI Improvements
   - Enhanced import interface with preview capabilities
   - Progress indicators for large imports

   ### Advanced Import Options
   - Selective import of specific elements
   - Update vs. replace options for existing content

## 9. Integration Points

   ### TAC Platform Integration
   - Direct API integration with TAC platform
   - OAuth-based authentication for seamless imports

   ### Foundry VTT Integration
   - Proper module hooks and compatibility with future Foundry versions
   - Integration with Foundry's compendium system 