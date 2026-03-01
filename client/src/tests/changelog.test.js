/**
 * Changelog Data Tests
 * Validates the integrity of CHANGELOG and SITE_LAST_UPDATED in changelog.js.
 *
 * Checks:
 *   - Entries are a non-empty array
 *   - Each entry has date (YYYY-MM-DD), category (from allowed set), and description (non-empty)
 *   - Entries are sorted newest-first
 *   - SITE_LAST_UPDATED matches the first entry's date
 */

import { describe, it, expect } from 'vitest';
import { CHANGELOG, SITE_LAST_UPDATED } from '../data/common/changelog.js';

const VALID_CATEGORIES = new Set([
    'Feature', 'Guides', 'Calculators', 'Quests', 'Daily Tasks', 'UI', 'Bug Fix', 'Content',
]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

describe('CHANGELOG — top-level', () => {
    it('is a non-empty array', () => {
        expect(Array.isArray(CHANGELOG)).toBe(true);
        expect(CHANGELOG.length).toBeGreaterThan(0);
    });

    it('SITE_LAST_UPDATED matches the first entry date', () => {
        expect(SITE_LAST_UPDATED).toBe(CHANGELOG[0].date);
    });

    it('entries are sorted newest-first (no future entry after an older one)', () => {
        for (let i = 1; i < CHANGELOG.length; i++) {
            expect(
                CHANGELOG[i - 1].date >= CHANGELOG[i].date,
                `Entry ${i} (${CHANGELOG[i].date}) is newer than entry ${i - 1} (${CHANGELOG[i - 1].date})`
            ).toBe(true);
        }
    });
});

describe('CHANGELOG — per-entry validation', () => {
    for (let i = 0; i < CHANGELOG.length; i++) {
        const entry = CHANGELOG[i];
        it(`entry ${i}: "${entry.description?.slice(0, 60)}…"`, () => {
            // date: valid YYYY-MM-DD format
            expect(typeof entry.date).toBe('string');
            expect(entry.date, `entry ${i} date must be YYYY-MM-DD`).toMatch(DATE_RE);
            // date must parse to a real date
            expect(isNaN(new Date(entry.date).getTime()), `entry ${i} date is invalid`).toBe(false);

            // category: must be from the allowed set
            expect(
                VALID_CATEGORIES.has(entry.category),
                `entry ${i} has unknown category: "${entry.category}"`
            ).toBe(true);

            // description: non-empty string
            expect(typeof entry.description).toBe('string');
            expect(entry.description.trim().length, `entry ${i} description must not be blank`).toBeGreaterThan(0);
        });
    }
});
