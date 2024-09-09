import { Logger } from "./classes/logging";
import { TacImporter } from "./apps/tac-importer";

Hooks.on("init", () => {
    Logger.info('Hello World!')
});

// By default, display notes so user can easily see the placements are imported
Hooks.on('setup', () => {
    // @ts-ignore
    game.settings.set('core', 'notesDisplayToggle', true)
});

Hooks.on("renderSidebarTab", async (app: any, html: any) => {
    if (app instanceof SceneDirectory || app instanceof ActorDirectory || app instanceof JournalDirectory) {
        let button = $("<button class='import-tac'><i class='fas fa-file-import'></i> Tabletop Adventure Importer</button>")
        button.on("click",() => {
            new TacImporter().render(true);
        });
        html.find(".directory-footer").append(button);
    }
})