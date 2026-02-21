const SYSTEM_MAP: Record<string, string> = {
  'dnd5e': 'dnd5e',
  'D&D5.1e': 'dnd5e',
};

export function checkSystem(tacSystem: string): { ok: boolean; error?: string } {
  const expected = SYSTEM_MAP[tacSystem];
  if (!expected) return { ok: true };

  if (expected !== game.system.id) {
    return {
      ok: false,
      error: `This asset requires ${tacSystem}, but you're running ${game.system.id}`
    };
  }
  return { ok: true };
}
