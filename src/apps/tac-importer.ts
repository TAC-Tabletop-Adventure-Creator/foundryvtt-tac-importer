import { SETTINGS } from "../settings/module-settings";
import { Logger } from "../classes/logging";
import { convertSceneToFoundryScene } from "../converters/scene-converter";
import { convertTacNotesToFoundryJournal } from "../converters/journal-converter";
import { convertMonsterToFoundryActor } from "../converters/monster-converter";

export class TacImporter extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'tac-importer-menu'
        options.template = `modules/${SETTINGS.MODULE_ID}/handlebars/tac-importer.hbs`;
        options.classes.push("tac-importer");
        options.resizable = false;
        options.height = "auto";
        options.width = 400;
        options.minimizable = true;
        options.title = "Tabletop Adventure Importer"
        return options;
    }

    static async importAdventure(adventureData: string) {
        Logger.info('Importing with Tac Importer...');
        let tacAdventure = JSON.parse(adventureData);

        Logger.info('Importing Scenes...');
        const scenes = await this.importScenes(tacAdventure);

        Logger.info('Importing Journals and Notes...');
        const journals = await this.importJournalsAndNotes(tacAdventure);

        Logger.info('Importing Actors and Tokens...');
        const actors = await this.importActorsAndTokens(tacAdventure);

        Logger.info(`Loaded: ${scenes.length} Scenes, ${journals.length} Journals, and ${actors.length} Actors.`);
    }

    static async importScenes(tacAdventure: any): Promise<Scene[]> {
        const sceneFolder = await findOrCreateFolder(tacAdventure.adventure.title, "Scene")
        const foundryScenes: StoredDocument<Scene>[] = [];
        for (const tacScene of tacAdventure.scenes) {
            // @ts-ignore
            let foundryScene = game.scenes.find(s => s.name === tacScene.name && s.folder?.id === sceneFolder?.id);
            const foundrySceneData = convertSceneToFoundryScene(tacScene, sceneFolder)
            if (foundryScene) {
                Logger.info(`Scene "${tacScene.name}" already exists. Updating it...`);
                /*// @ts-ignore
                const existingTokenIds = foundryScene.tokens.map(token => token._id)
                await foundryScene.deleteEmbeddedDocuments('Token', existingTokenIds)
                // @ts-ignore
                const existingNoteIds = foundryScene.notes.map(note => note._id)
                await foundryScene.deleteEmbeddedDocuments('Note', existingNoteIds)*/
                await foundryScene.update(foundrySceneData);
            } else {
                Logger.info(`Creating new scene "${tacScene.name}"...`);
                foundryScene = await Scene.create(foundrySceneData);
            }
            if (foundryScene) {
                foundryScenes.push(foundryScene);
            } else {
                Logger.warning('Unexpectedly the Foundry Scene returned undefined');
            }
        }
        return foundryScenes;
    }

    static async importJournalsAndNotes(tacAdventure: any): Promise<JournalEntry[]> {
        const foundryJournals: StoredDocument<JournalEntry>[] = [];
        // @ts-ignore
        let foundryJournal = game.journal.find(j => j.name === tacAdventure.adventure.title);
        const foundryJournalData = convertTacNotesToFoundryJournal(tacAdventure);
        if (foundryJournal) {
            await foundryJournal.delete();
            foundryJournal = await JournalEntry.create(foundryJournalData);
        } else {
            Logger.info(`Creating new journal "${tacAdventure.adventure.title}"...`);
            foundryJournal = await JournalEntry.create(foundryJournalData);
        }
        if(foundryJournal) {
            foundryJournals.push(foundryJournal)
        }
        // Add notes to scenes.
        /*for(const scene of tacAdventureData.scenes) {
            for (const notePlacement of scene.notePlacements) {
                const foundryScene = foundryScenes.find(foundryScene => foundryScene.name === scene.name);
                const note = tacAdventureData.notes.find(n => n.id === notePlacement.noteRef);
                // @ts-ignore
                const journalPage = foundryJournal.pages.find((page) => page.name === note?.name);
                if(foundryScene) {
                    await foundryScene.createEmbeddedDocuments("Note", [{
                        entryId: foundryJournal._id,
                        pageId: journalPage._id,
                        x: notePlacement.x,
                        y: notePlacement.y,
                        text: journalPage.name,
                    }])
                } else {Logger.warning(`Could not make the token: ${note?.name} because scene: ${scene.name} couldn't be located.`);}
            }
        }*/
        return foundryJournals;
    }

    static async importActorsAndTokens(tacAdventure: any) {
        const foundryActors: Actor[] = [];
        const actorFolder = await findOrCreateFolder(tacAdventure.adventure.title, "Actor")
        for (const monster of tacAdventure.monsters) {
            const tacActor = convertMonsterToFoundryActor(monster, actorFolder)
            // @ts-ignore
            let foundryActor = game.actors.find(s => s.name === tacActor.name && s.folder?.id === actorFolder?.id);
            if (foundryActor) {
                // When updating "items" (tac features & actions) are separate docs and need to be deleted.
                await foundryActor.deleteEmbeddedDocuments("Item", foundryActor.items.map((i: any) => i.id));
                foundryActor.update(tacActor);
            } else {
                Logger.info(`Creating new actor "${monster.name}"...`);
                foundryActor = await Actor.create(tacActor);
            }
            if (foundryActor) {
                foundryActors.push(foundryActor);
            }
        }
        return foundryActors;
    };

    activateListeners(html: JQuery) {
        super.activateListeners(html);

        // Manage the enabling and disabling of the import button based on adventure id provided
        html.find("#tac-export-adventure").on("keyup", () => {
            const result = html.find("#tac-export-adventure").val() as string;
            if (result && result.length > 1) {
                html.find("#import-adventure-start").prop("disabled", false);
            } else {
                html.find("#import-adventure-start").attr("disabled", "disabled");
            }
        })

        // Trigger the adventure import
        html.find("#import-adventure-start").on("click", async () => {
            const adventureData = html.find("#tac-export-adventure").val() as string || ""
            await TacImporter.importAdventure(adventureData);
            await this.close()
        })
    }
}

const findOrCreateFolder = async (folderName: string, folderType: foundry.CONST.FOLDER_DOCUMENT_TYPES, folderParent: Folder | undefined = undefined): Promise<Folder | undefined> => {
    // @ts-ignore
    const folder = game.folders.find(f => f.name === folderName && f.type === folderType);
    if (!folder) {
        return await Folder.create({
            name: folderName,
            type: folderType,
            folder: folderParent,
        })
    } else {
        return folder
    }
}
