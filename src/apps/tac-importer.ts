import { SETTINGS } from "../settings/module-settings";
import { Logger } from "../classes/logging";
import { AdventureData } from "../types/tac-types";
import { convertTacSceneToFoundryScene } from "../converters/scene-converter";
import { convertTacNotesToFoundryJournal } from "../converters/journal-converter";
import { convertTacTokenToFoundryActor } from "../converters/actor-converter";

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

    static async importAdventure(adventureId: string) {
        Logger.info('Importing with Tac Importer...');

        Logger.info(`Retrieving TAC Adventure Data`);
        const tacAdventureData = await loadAdventureData(adventureId);

        Logger.info('Importing Scenes...');
        const scenes = await this.importScenes(tacAdventureData);
        Logger.info(`Scene: \n${JSON.stringify(scenes[0], null, 2)}`);

        Logger.info('Importing Journals and Notes...');
        const journals = await this.importJournalsAndNotes(tacAdventureData, scenes);

        Logger.info('Importing Actors and Tokens...');
        const actors = await this.importActorsAndTokens(tacAdventureData, scenes);

        Logger.info(`Loaded: ${scenes.length} Scenes, ${journals.length} Journals, and ${actors.length} Actors.`);
    }

    static async importScenes(tacAdventureData: AdventureData): Promise<Scene[]> {
        const sceneFolder = await findOrCreateFolder(tacAdventureData.name, "Scene")
        const foundryScenes: StoredDocument<Scene>[] = [];
        for (const tacScene of tacAdventureData.scenes) {
            // @ts-ignore
            let foundryScene = game.scenes.find(s => s.name === tacScene.name && s.folder?.id === sceneFolder?.id);
            const foundrySceneData = convertTacSceneToFoundryScene(tacScene, sceneFolder)
            if (foundryScene) {
                Logger.info(`Scene "${tacScene.name}" already exists. Updating it...`);
                // @ts-ignore
                const existingTokenIds = foundryScene.tokens.map(token => token._id)
                await foundryScene.deleteEmbeddedDocuments('Token', existingTokenIds)
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

    static async importJournalsAndNotes(tacAdventureData: AdventureData, foundryScenes: Scene[]): Promise<JournalEntry[]> {
        // @ts-ignore
        let foundryJournal = game.journal.find(j => j.name === tacAdventureData.name);
        const foundryJournalData = convertTacNotesToFoundryJournal(tacAdventureData.notes, tacAdventureData.name);
        if (foundryJournal) {
            Logger.info(`Journal "${tacAdventureData.name}" already exists. Replacing it...`);
            await foundryJournal.delete();
            foundryJournal = await JournalEntry.create(foundryJournalData);
        } else {
            Logger.info(`Creating new journal "${tacAdventureData.name}"...`);
            foundryJournal = await JournalEntry.create(foundryJournalData);
        }
        return foundryJournal;
    }

    static async importActorsAndTokens(tacAdventureData: AdventureData, foundryScenes: Scene[]) {
        const foundryActors: Actor[] = [];
        const actorFolder = await findOrCreateFolder(tacAdventureData.name, "Actor")
        for (const scene of tacAdventureData.scenes) {
            const sceneFolder = await findOrCreateFolder(scene.name, "Actor", actorFolder);

            for (const encounter of scene.encounters) {
                const encounterFolder = await findOrCreateFolder(encounter.name, "Actor", sceneFolder);

                for (const tokenPlacementRef of encounter.tokenPlacementRefs) {
                    const tokenPlacement = scene.tokenPlacements.find(tp => tp.id === tokenPlacementRef);
                    if (!tokenPlacement) {
                        Logger.warning(`TokenPlacement with ID ${tokenPlacementRef} not found.`);
                        continue;
                    }
                    const tokenData = tacAdventureData.tokens.find(t => t.id === tokenPlacement.tokenRef);
                    if (!tokenData) {
                        Logger.warning(`Token with ref ${tokenPlacement.tokenRef} not found.`);
                        continue;
                    }
                    // @ts-ignore
                    let foundryActor = game.actors.find(a => a.name === (tokenPlacement.name || tokenData.name) && a.folder?.id === encounterFolder?.id);
                    const actorData = convertTacTokenToFoundryActor(tokenPlacement, tokenData, encounterFolder);

                    if (foundryActor) {
                        Logger.info(`Actor "${tokenPlacement.name || tokenData.name}" already exists. Updating it...`);

                        // Strip out existing features & actions (weapons)
                        const existingItems = foundryActor.items
                            .filter((item: any) => item.type === "feat" || item.type === "weapon")
                            .map((item: any) => item.id);
                        if (existingItems.length) {
                            await foundryActor.deleteEmbeddedDocuments('Item', existingItems);
                        }

                        await foundryActor.update(actorData);
                    } else {
                        Logger.info(`Creating new actor "${tokenPlacement.name || tokenData.name}"...`);
                        foundryActor = await Actor.create(actorData);
                    }
                    if (foundryActor) {
                        foundryActors.push(foundryActor);
                        // Add token all TAC actors will have one linked token
                        const foundryScene = foundryScenes.find(foundryScene => foundryScene.name === scene.name);
                        if(foundryScene) {
                            const tokenData = {
                                name: foundryActor.name,
                                x: tokenPlacement.x,
                                y: tokenPlacement.y,
                                texture: {
                                    src: foundryActor.img,
                                },
                                disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE,
                                actorLink: true,
                            }
                            await foundryScene.createEmbeddedDocuments("Token", [tokenData])
                        } else {Logger.warning(`Could not make the token: ${actorData.name} because scene: ${scene.name} couldn't be located.`);}

                    } else {
                        Logger.warning(`Unexpectedly, the Foundry Actor "${tokenPlacement.name || tokenData.name}" returned undefined.`);
                    }
                }
            }
        }
        return foundryActors;
    };

    activateListeners(html: JQuery) {
        super.activateListeners(html);

        // Manage the enabling and disabling of the import button based on adventure id provided
        html.find("#tac-export-adventure-id").on("keyup", () => {
            const result = html.find("#tac-export-adventure-id").val() as string || "";
            // TODO temp 1c0cf233-34b3-4c1f-a871-a75fd236733f
            if (validateUUIDv4(result)) {
                html.find("#import-adventure-start").prop("disabled", false);
            } else {
                html.find("#import-adventure-start").attr("disabled", "disabled");
            }
        })

        // Trigger the adventure import
        html.find("#import-adventure-start").on("click", async () => {
            const adventureId = html.find("#tac-export-adventure-id").val() as string || ""
            await TacImporter.importAdventure(adventureId);
            await this.close()
        })
    }
}

const validateUUIDv4 = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

const loadAdventureData = async (adventureId: string): Promise<AdventureData> => {
    return await fetch(`https://tac-api-backend-2d1b24bc575e.herokuapp.com/adventure/${adventureId}`)
        .then(async (r) => {
            if (!r.ok) {
                throw new Error(`Failed to fetch adventure data: ${r.statusText}`);
            }
            const data: AdventureData = await r.json();
            return data;
        })
        .catch((err) => {
            Logger.error(err);
            throw err;
        });
};

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
