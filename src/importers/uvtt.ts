import type { TacMapExport } from '../types';

export function parseWalls(data: TacMapExport, ppg: number) {
  return data.line_of_sight.map(w => ({
    c: [w.x * ppg, w.y * ppg, w.x2 * ppg, w.y2 * ppg],
  }));
}

// Standard D&D grid: 5 feet per square
const FEET_PER_GRID = 5;

export function parseLights(data: TacMapExport, ppg: number) {
  return data.lights.map(l => ({
    x: l.position.x * ppg,
    y: l.position.y * ppg,
    config: {
      // Range from API is in grid units, Foundry expects feet
      bright: l.range * FEET_PER_GRID,
      dim: l.range * FEET_PER_GRID * 0.5,
      // Ensure color has # prefix
      color: normalizeColor(l.color),
      alpha: l.intensity,
    },
    walls: l.shadows,
  }));
}

function normalizeColor(color: string): string {
  if (!color) return '#ffffff';
  // If it's already a valid hex with #, return as-is
  if (color.startsWith('#')) return color;
  // If it's hex without #, add it
  if (/^[0-9a-fA-F]{6}$/.test(color)) return `#${color}`;
  if (/^[0-9a-fA-F]{3}$/.test(color)) return `#${color}`;
  // Default to white
  return '#ffffff';
}

export function parseDoors(data: TacMapExport, ppg: number) {
  return data.portals.map(p => {
    const [b0, b1] = p.bounds;
    // Bounds are in local coordinates - apply rotation to get world coordinates
    const rad = (p.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Rotate bound points around origin, then translate to position
    const x1 = p.position.x + (b0.x * cos - b0.y * sin);
    const y1 = p.position.y + (b0.x * sin + b0.y * cos);
    const x2 = p.position.x + (b1.x * cos - b1.y * sin);
    const y2 = p.position.y + (b1.x * sin + b1.y * cos);

    return {
      c: [x1 * ppg, y1 * ppg, x2 * ppg, y2 * ppg],
      door: CONST.WALL_DOOR_TYPES.DOOR,
      ds: p.closed ? CONST.WALL_DOOR_STATES.CLOSED : CONST.WALL_DOOR_STATES.OPEN,
    };
  });
}
