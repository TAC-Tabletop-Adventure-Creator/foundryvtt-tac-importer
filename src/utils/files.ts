// V13 FilePicker API
const getFilePicker = () => foundry.applications.apps.FilePicker.implementation;

const VALID_IMAGE_EXTENSIONS = ['apng', 'avif', 'bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'tiff', 'webp'];

export async function downloadImage(url: string, subfolder: string, name: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();

  // Try to get extension from URL, content-type, or default to webp
  const ext = getImageExtension(url, response.headers.get('content-type'));
  const filename = `${slugify(name)}.${ext}`;
  const file = new File([blob], filename, { type: blob.type || `image/${ext}` });

  const path = `worlds/${game.world.id}/tac-imports/${subfolder}`;
  await ensureDirectoryRecursive(path);
  const result = await getFilePicker().upload('data', path, file);
  return result.path;
}

export async function downloadAudio(url: string, name: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  const file = new File([blob], `${slugify(name)}.mp3`, { type: 'audio/mpeg' });

  const path = `worlds/${game.world.id}/tac-imports/audio`;
  await ensureDirectoryRecursive(path);
  const result = await getFilePicker().upload('data', path, file);
  return result.path;
}

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/avif': 'avif',
  'image/apng': 'apng',
};

function getImageExtension(url: string, contentType: string | null): string {
  // Try content-type header first (most reliable)
  if (contentType) {
    const mimeType = contentType.split(';')[0].trim().toLowerCase();
    if (MIME_TO_EXT[mimeType]) {
      return MIME_TO_EXT[mimeType];
    }
  }

  // Try URL extension
  const urlPath = url.split('?')[0];
  const urlExt = urlPath.split('.').pop()?.toLowerCase();
  if (urlExt && VALID_IMAGE_EXTENSIONS.includes(urlExt)) {
    return urlExt;
  }

  // Default to png
  return 'png';
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function ensureDirectoryRecursive(path: string): Promise<void> {
  const FP = getFilePicker();
  const parts = path.split('/');
  let currentPath = '';

  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    try {
      await FP.browse('data', currentPath);
    } catch {
      try {
        await FP.createDirectory('data', currentPath, { bucket: null });
      } catch {
        // Directory might already exist or parent issue, continue
      }
    }
  }
}
