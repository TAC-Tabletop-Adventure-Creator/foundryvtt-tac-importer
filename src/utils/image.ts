export const downloadAndSaveImage = async (url: string | null, type: 'monster' | 'scene' | 'note') => {
    if (!url) throw new Error("Missing URL.");

    const match = url.match(/\/([\w-]+)\.(\w+)$/);
    if (!match) throw new Error("Invalid URL format.");
    
    const [_, uuid, extension] = match;

    // Define the folder path
    // @ts-ignore
    const basePath = `worlds/${game.world.id}/TAC`;
    const folderPath = `${basePath}/${type}`;

    // Recursive directory creation
    await ensureDirectoryExists(folderPath);

    // Fetch the image
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const blob = await response.blob();
    const file = new File([blob], `${uuid}.${extension}`, { type: blob.type });

    // Upload the image to Foundry's storage
    // @ts-ignore
    const result = await foundry.applications.apps.FilePicker.upload("data", folderPath, file);

    // Check for a valid result and return the path if available
    if (result && typeof result === "object" && "path" in result) {
        return result.path;
    }

    throw new Error("Failed to save the image. Upload result did not include a path.");
};

// Utility function to recursively create directories
const ensureDirectoryExists = async (path: string) => {
    const parts = path.split('/');
    let currentPath = '';
    for (const part of parts) {
        currentPath += part + '/';
        try {
            // @ts-ignore
            await foundry.applications.apps.FilePicker.createDirectory("data", currentPath);
        } catch (error: any) {
            if (!error.message.includes("EEXIST")) {
                console.error(`Error creating directory: ${currentPath}`, error);
                throw new Error(`Failed to create directory: ${currentPath}`);
            }
        }
    }
};