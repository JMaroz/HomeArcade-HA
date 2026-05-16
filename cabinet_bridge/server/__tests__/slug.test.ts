import { describe, it, expect } from 'vitest';

/**
 * Replicate the slug generation logic used when uploading ROMs.
 * If the project extracts this to a utility, import it directly instead.
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function uniqueSlug(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

describe('Slug generation', () => {
  it('converts title to lowercase hyphenated slug', () => {
    expect(generateSlug('Super Mario World')).toBe('super-mario-world');
    expect(generateSlug('Mega Man X')).toBe('mega-man-x');
  });

  it('strips special characters', () => {
    expect(generateSlug('Castlevania: Symphony of the Night')).toBe('castlevania-symphony-of-the-night');
    expect(generateSlug('R-Type (USA)')).toBe('r-type-usa');
  });

  it('handles leading/trailing hyphens', () => {
    expect(generateSlug('  Donkey Kong  ')).toBe('donkey-kong');
  });

  it('returns unique slug when base already exists', () => {
    const existing = new Set(['sonic-the-hedgehog', 'sonic-the-hedgehog-2']);
    expect(uniqueSlug('sonic-the-hedgehog', existing)).toBe('sonic-the-hedgehog-3');
  });

  it('returns base slug when no collision', () => {
    const existing = new Set<string>();
    expect(uniqueSlug('zelda', existing)).toBe('zelda');
  });
});
