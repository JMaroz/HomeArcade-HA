import { describe, it, expect } from 'vitest';
import { THEMES, applyTheme } from '../lib/themes';

describe('THEMES', () => {
  it('contains at least the original themes', () => {
    const required = ['default', 'synthwave', 'gameboy', 'oled', 'nord', 'dracula', 'cyberpunk'];
    for (const t of required) {
      expect(THEMES).toContain(t);
    }
  });

  it('contains all new themes added in v1.9.0', () => {
    const newThemes = ['snes', 'ps1', 'matrix', 'cherry-blossom', 'terminal', 'bloodmoon', 'deep-sea', 'golden-age'];
    for (const t of newThemes) {
      expect(THEMES).toContain(t);
    }
  });

  it('has no duplicate entries', () => {
    const unique = new Set(THEMES);
    expect(unique.size).toBe(THEMES.length);
  });

  it('always starts with "default"', () => {
    expect(THEMES[0]).toBe('default');
  });

  it('applyTheme removes data-theme for default', () => {
    document.documentElement.setAttribute('data-theme', 'dracula');
    applyTheme('default');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('applyTheme sets data-theme for non-default themes', () => {
    applyTheme('synthwave');
    expect(document.documentElement.getAttribute('data-theme')).toBe('synthwave');
    applyTheme('matrix');
    expect(document.documentElement.getAttribute('data-theme')).toBe('matrix');
  });
});
