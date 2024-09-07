# FoundryVTT TAC Importer

todo....



## Developers

### Local Setup

Install deps
```shell
npm install
```

I would advise a symlink to your foundry vtt module directory. If you installed for macbook you can use:
```shell
ln -s $PWD/dist $HOME/Library/Application\ Support/FoundryVTT/Data/modules/foundryvtt-tac-importer
```

Then build your project so your dist directory is created with the resources:
```shell
npm run build
```