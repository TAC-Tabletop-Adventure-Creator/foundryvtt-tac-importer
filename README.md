# FoundryVTT TAC Importer

The official TAC: Tabletop Adventure Creator module for importing your content into FoundryVTT. This module allows you to seamlessly transfer your adventures, including scenes, journals, and monsters, from TAC into your FoundryVTT game system.

Currently supports:
- Importing scenes with maps
- Journal entries and notes
- Monster stat blocks (D&D 5e)

## Installation

You can install this module in Foundry VTT using the following manifest URL:
```
https://github.com/TAC-Tabletop-Adventure-Creator/foundryvtt-tac-importer/releases/latest/download/module.json
```

## Usage

1. Install and enable the module in FoundryVTT
2. Look for the "Tabletop Adventure Importer" button in your Scenes, Actors, or Journal tabs
3. Paste your TAC adventure data and click "Import Adventure"

## Developers

### Local Setup

Install deps:
```shell
pnpm install
```

I would advise a symlink to your foundry vtt module directory. If you installed for macbook you can use:
```shell
ln -s $PWD/dist $HOME/Library/Application\ Support/FoundryVTT/Data/modules/foundryvtt-tac-importer
```

Then build your project so your dist directory is created with the resources:
```shell
pnpm run build
```

### Requirements

- Node.js >= 22.5.0
- pnpm

## License

This module is licensed under the [MIT License](LICENSE).
