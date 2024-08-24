const log = (...args) => {
    console.log('TAC Importer | ', ...args)
}


Hooks.on("init", () => {
    log('hello world!')
})

Hooks.on("renderSidebarTab", async (app, html) => {
    if (app instanceof SceneDirectory) {
        let button = $("<button class='import-tac'><i class='fas fa-file-import'></i> Tabletop Adventure Importer</button>")

        button.click(function () {
            new TACImporter().render(true);
        });

        html.find(".directory-footer").append(button);
    }
})

class TACImporter extends FormApplication {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "tac-importer";
        options.template = "modules/foundryvtt-tac-importer/importer.html"
        options.classes.push("tac-importer");
        options.resizable = false;
        options.height = "auto";
        options.width = 400;
        options.minimizable = true;
        options.title = "Tabletop Adventure Importer"
        return options;
    }

    async _updateObject(event, formData) {
        const tacAdventureId = formData["tac-export-adventure-id"]
        log('new submission: ', tacAdventureId)

        const jsonResponse = await fetch(
            'https://dog.ceo/api/breeds/image/random',
            { mode: 'no-cors' })
            .then(r => {
                log('raw reply: ', JSON.stringify(r))
                return r.json()
            })
            .catch((err) => console.error(err))
        log('json data: ', JSON.stringify(jsonResponse))

        const newScene = await Scene.create({
            name: 'My Test Scene Name',
            background: {
                src: 'https://i.pinimg.com/736x/0c/10/95/0c1095da4b83261f17f87ff8efbf24e6.jpg' //736 x 552
            }
        })
        log('newScene obj', JSON.stringify(newScene))
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('.tac-export-adventure-id').keyup(ev => {
            const currentAdventureId = ev.target.value;
            log('detected change in adventure id: ', currentAdventureId)
            const preview = html.find('.tac-adventure-preview')
            const valid = html.find('.valid-adventure-id-info')
            const submitButton = html.find('.import-tac')
            if(currentAdventureId === 'secret') {
                preview[0].style.display=''
                valid[0].style.display='none'
            } else {
                preview[0].style.display='none'
                valid[0].style.display=''
            }
        })
    }
}