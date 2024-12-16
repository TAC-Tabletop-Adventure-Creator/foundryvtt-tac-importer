# Official FoundryVTT TAC Importer

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

### Releasing

To create a new release:

1. Update the version number in both `src/module.json` and `package.json`
2. Commit your changes
3. Create and push a new version tag:
```shell
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

This will trigger the GitHub Action workflow which will:
- Build the project
- Create a new GitHub release
- Upload the module files as release assets


You can access the module file using the release tag like this (ensure you have the correct version tag):
```
https://raw.githubusercontent.com/TAC-Tabletop-Adventure-Creator/foundryvtt-tac-importer/refs/tags/v1.0.0/src/module.json
```

### Requirements

- Node.js >= 22.5.0
- pnpm

## License

This module is licensed under the [MIT License](LICENSE).
