/**
 * Converts center coordinates to top-left coordinates for Foundry VTT placement
 * @param centerX The x coordinate of the center point
 * @param centerY The y coordinate of the center point
 * @param size The size of the token/note in pixels (default 50 for standard token)
 * @returns Object containing top-left x,y coordinates
 */
export const centerToTopLeft = (centerX: number, centerY: number, size: number = 50) => {
    return {
        x: centerX - (size / 2),
        y: centerY - (size / 2)
    };
}; 