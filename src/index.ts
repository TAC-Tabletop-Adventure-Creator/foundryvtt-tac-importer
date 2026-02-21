import { Logger } from './classes/logging';
import { MonsterImporter } from './importers/monster';
import { MapImporter } from './importers/map';
import { AudioImporter } from './importers/audio';
import { MODULE_ID } from './settings';

const importers = {
  monster: new MonsterImporter(),
  map: new MapImporter(),
  audio: new AudioImporter(),
};

type AssetType = 'monster' | 'map' | 'audio';

async function handleImport(type: AssetType, id: string): Promise<void> {
  try {
    const result = await importers[type].importById(id);
    if (result.success) {
      ui.notifications.info(`Imported ${type} successfully`);
    } else {
      ui.notifications.error(result.error || 'Import failed');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    ui.notifications.error(message);
    Logger.error(message);
  }
}

// Initialize the module and register the tab in CONFIG
Hooks.on('init', () => {
  Logger.info('Initializing TAC Importer module v2.0');

  // Register module templates
  foundry.applications.handlebars.loadTemplates([
    `modules/${MODULE_ID}/handlebars/tac-importer-tab.hbs`
  ]);

  // Register our sidebar tab descriptor with Foundry
  CONFIG.ui.sidebar.TABS['tacimporter'] = {
    icon: 'fa-solid fa-inbox-in',
    tooltip: 'TAC Importer'
  };

  Logger.info('TAC Importer tab registered in CONFIG');
});

// Create and register our tab application during ready
Hooks.once('ready', () => {
  try {
    // Simplified AbstractSidebarTab implementation for V13
    class TacSidebarTab extends foundry.applications.sidebar.AbstractSidebarTab {
      static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
          id: 'tacimporter',
          title: 'TAC Importer'
        });
      }

      static get tabName() {
        return 'tacimporter';
      }

      static PARTS = {
        content: {
          template: `modules/${MODULE_ID}/handlebars/tac-importer-tab.hbs`
        }
      };

      async _renderHTML(context: Record<string, unknown>): Promise<string> {
        return await foundry.applications.handlebars.renderTemplate(
          `modules/${MODULE_ID}/handlebars/tac-importer-tab.hbs`,
          context
        );
      }

      _replaceHTML(html: string | unknown, element: HTMLElement): void {
        element.innerHTML = '';

        if (typeof html === 'string') {
          element.innerHTML = html;
        } else {
          element.innerHTML = String(html);
        }

        this._activateListeners(element);
      }

      _activateListeners(html: HTMLElement): void {
        const typeSelect = html.querySelector('#tac-asset-type') as HTMLSelectElement | null;
        const idInput = html.querySelector('#tac-asset-id') as HTMLInputElement | null;
        const importButton = html.querySelector('#tac-import-btn') as HTMLButtonElement | null;
        const statusElement = html.querySelector('#import-status') as HTMLElement | null;

        // Enable/disable import button based on input
        const updateButtonState = () => {
          if (importButton && idInput) {
            const hasId = idInput.value.trim().length > 0;
            importButton.disabled = !hasId;
            importButton.style.opacity = hasId ? '1' : '0.5';
          }
        };

        if (idInput) {
          idInput.addEventListener('input', updateButtonState);
        }

        // Handle import button click
        if (importButton) {
          importButton.addEventListener('click', async () => {
            const type = (typeSelect?.value || 'monster') as AssetType;
            const id = idInput?.value?.trim() || '';

            if (!id) {
              ui.notifications.warn('Please enter an asset ID');
              return;
            }

            // Update UI
            if (statusElement) statusElement.textContent = `Importing ${type}...`;
            if (importButton) importButton.disabled = true;

            try {
              await handleImport(type, id);
              if (statusElement) statusElement.textContent = 'Import complete!';
              if (idInput) idInput.value = '';
            } catch {
              if (statusElement) statusElement.textContent = 'Import failed';
            } finally {
              updateButtonState();
            }
          });
        }
      }

      _getHeaderControls(): unknown[] {
        return [];
      }

      async _prepareContext(options: unknown): Promise<Record<string, unknown>> {
        const context = await super._prepareContext(options);
        return foundry.utils.mergeObject(context, {
          tacImporter: {
            title: 'TAC Importer',
            description: 'Import assets from Tabletop Adventure Creator'
          }
        });
      }
    }

    // Register our tab in the Foundry UI
    (ui as Record<string, unknown>).tacimporter = new TacSidebarTab();

    Logger.info('TAC Importer tab created');

    // Render the sidebar to pick up our new tab
    ui.sidebar.render(true);
  } catch (error) {
    Logger.error(error instanceof Error ? error : String(error));
  }
});

// Add directory buttons for quick access
Hooks.on('renderActorDirectory', (...args: unknown[]) => {
  const html = args[1] as HTMLElement[] | { [index: number]: HTMLElement };
  addDirectoryButton(html, 'actor', 'monster');
});

Hooks.on('renderSceneDirectory', (...args: unknown[]) => {
  const html = args[1] as HTMLElement[] | { [index: number]: HTMLElement };
  addDirectoryButton(html, 'scene', 'map');
});

Hooks.on('renderPlaylistDirectory', (...args: unknown[]) => {
  const html = args[1] as HTMLElement[] | { [index: number]: HTMLElement };
  addDirectoryButton(html, 'playlist', 'audio');
});

function addDirectoryButton(
  html: HTMLElement[] | { [index: number]: HTMLElement },
  _directory: string,
  assetType: AssetType
): void {
  const element = Array.isArray(html) ? html[0] : html[0];
  const header = element?.querySelector?.('.directory-header .action-buttons');
  if (!header) return;

  const button = document.createElement('button');
  button.className = 'tac-import-btn';
  button.innerHTML = '<i class="fas fa-download"></i> Import from TAC';
  button.title = `Import ${assetType} from TAC`;
  button.style.cssText = 'margin-left: 5px; padding: 3px 8px; font-size: 0.85em;';

  button.addEventListener('click', () => {
    const id = prompt(`Enter TAC ${assetType} ID:`);
    if (id?.trim()) {
      handleImport(assetType, id.trim());
    }
  });

  header.appendChild(button);
}
