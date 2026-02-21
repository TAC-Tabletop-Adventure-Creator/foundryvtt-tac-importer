# FoundryVTT TAC Importer

Import your [Tabletop Adventure Creator](https://tabletop-adventure-creator.com) content directly into FoundryVTT.

## Features

- **Monsters** - Import creatures with full stat blocks (D&D 5e)
- **Maps** - Import battlemaps with walls, doors, and lights (UVTT format)
- **Audio** - Import ambient sounds and music tracks

## Installation

Install via manifest URL in FoundryVTT:
```
https://github.com/TAC-Tabletop-Adventure-Creator/foundryvtt-tac-importer/releases/latest/download/module.json
```

## Usage

1. Enable the module in FoundryVTT
2. Open the **TAC Importer** sidebar tab (dice icon)
3. Select an asset type (Monster, Map, or Audio)
4. Enter the asset ID from TAC
5. Click **Import**

### Finding Asset IDs

In TAC, open any monster, map, or audio asset. The ID is in the URL:
```
https://tabletop-adventure-creator.com/library/monsters/{id}/...
https://tabletop-adventure-creator.com/library/maps/{id}/...
https://tabletop-adventure-creator.com/library/audio/{id}/...
```

## Compatibility

- FoundryVTT v13+
- D&D 5e system (for monsters)

## Development

### Setup

```shell
pnpm install
```

Symlink to Foundry modules (macOS):
```shell
ln -s $PWD/dist/* "$HOME/Library/Application Support/FoundryVTT/Data/modules/foundryvtt-tac-importer/"
```

Build:
```shell
pnpm build
```

### Releasing

Create a version tag to trigger the release workflow:
```shell
VERSION=X.X.X && git tag -a v$VERSION -m "Release $VERSION" && git push origin v$VERSION
```

The GitHub Action will build, package, and publish to FoundryVTT.

## License

[MIT License](LICENSE)
