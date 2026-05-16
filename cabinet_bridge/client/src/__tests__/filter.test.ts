import { describe, it, expect } from 'vitest';
import { parseFilter, parseCollectionFilter, DEFAULT_FILTER } from '../lib/filter';

describe('parseFilter', () => {
  it('returns DEFAULT_FILTER for unknown strings', () => {
    expect(parseFilter('nonsense')).toEqual(DEFAULT_FILTER);
    expect(parseFilter('')).toEqual(DEFAULT_FILTER);
  });

  it('parses system filters', () => {
    const f = parseFilter('system:snes');
    expect(f).toMatchObject({ type: 'system', value: 'snes' });
  });

  it('parses play status filters', () => {
    const f = parseFilter('status:completed');
    expect(f).toMatchObject({ type: 'status', value: 'completed' });
  });

  it('parses favorites filter', () => {
    const f = parseFilter('favorites');
    expect(f).toMatchObject({ type: 'favorites' });
  });
});

describe('parseCollectionFilter', () => {
  it('returns a collection filter with the given id', () => {
    const f = parseCollectionFilter('42');
    expect(f).toMatchObject({ type: 'collection', value: '42' });
  });
});
