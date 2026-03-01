/**
 * Augmentable Items Tests
 * Validates augmentableItems.json schema.
 *
 * Each entry: { name, id, category, slot, tier, wikiLink }
 */

import { describe, it, expect } from 'vitest';
import items from '../data/skills/augmentableItems.json';

const VALID_CATEGORIES = new Set(['Tool', 'Weapon', 'Armour']);
const VALID_SLOTS = new Set(['Main Hand', 'Off Hand', '2H', 'Body', 'Legs']);

describe('augmentableItems.json — top-level', () => {
    it('is a non-empty array', () => {
        expect(Array.isArray(items)).toBe(true);
        expect(items.length).toBeGreaterThan(0);
    });

    it('IDs are unique', () => {
        const ids = items.map(i => i.id);
        const dupes = ids.filter((id, idx) => ids.indexOf(id) !== idx);
        expect(dupes, `Duplicate IDs: ${dupes.join(', ')}`).toHaveLength(0);
    });
});

describe('augmentableItems.json — per-item validation', () => {
    for (const item of items) {
        it(`"${item.name}"`, () => {
            // name
            expect(typeof item.name).toBe('string');
            expect(item.name.trim().length).toBeGreaterThan(0);

            // id
            expect(typeof item.id).toBe('string');
            expect(item.id.trim().length).toBeGreaterThan(0);

            // category
            expect(
                VALID_CATEGORIES.has(item.category),
                `"${item.name}" has unknown category: "${item.category}"`
            ).toBe(true);

            // slot
            expect(
                VALID_SLOTS.has(item.slot),
                `"${item.name}" has unknown slot: "${item.slot}"`
            ).toBe(true);

            // tier
            expect(typeof item.tier, `"${item.name}" tier must be number`).toBe('number');
            expect(item.tier).toBeGreaterThan(0);

            // wikiLink
            expect(typeof item.wikiLink).toBe('string');
            expect(item.wikiLink).toMatch(/^https?:\/\//);
        });
    }
});
