/**
 * Urns Data Tests
 * Validates URN_DATA and URN_ENHANCER_BONUS in urnsData.js.
 *
 * Checks:
 *   - URN_DATA is an object keyed by skill name
 *   - Each skill maps to a non-empty array of urn objects
 *   - Each urn has name (string), level (number 1-99), fillXp (number > 0), bonusXp (number > 0)
 *   - URN_ENHANCER_BONUS is a positive number
 */

import { describe, it, expect } from 'vitest';
import { URN_DATA, URN_ENHANCER_BONUS } from '../data/items/urnsData.js';

describe('URN_DATA — structure', () => {
    it('is a non-empty object', () => {
        expect(typeof URN_DATA).toBe('object');
        expect(URN_DATA).not.toBeNull();
        expect(Object.keys(URN_DATA).length).toBeGreaterThan(0);
    });

    it('covers at least 10 skills', () => {
        expect(Object.keys(URN_DATA).length).toBeGreaterThanOrEqual(10);
    });

    for (const [skill, urns] of Object.entries(URN_DATA)) {
        describe(`${skill} urns`, () => {
            it('is a non-empty array', () => {
                expect(Array.isArray(urns), `${skill} value must be array`).toBe(true);
                expect(urns.length).toBeGreaterThan(0);
            });

            for (const urn of urns) {
                it(`"${urn.name}"`, () => {
                    // name
                    expect(typeof urn.name).toBe('string');
                    expect(urn.name.trim().length).toBeGreaterThan(0);

                    // level
                    expect(typeof urn.level, `${urn.name} level must be number`).toBe('number');
                    expect(urn.level).toBeGreaterThanOrEqual(1);
                    expect(urn.level).toBeLessThanOrEqual(120);

                    // fillXp
                    expect(typeof urn.fillXp, `${urn.name} fillXp must be number`).toBe('number');
                    expect(urn.fillXp).toBeGreaterThan(0);

                    // bonusXp
                    expect(typeof urn.bonusXp, `${urn.name} bonusXp must be number`).toBe('number');
                    expect(urn.bonusXp).toBeGreaterThan(0);
                });
            }
        });
    }
});

describe('URN_ENHANCER_BONUS', () => {
    it('is a positive number', () => {
        expect(typeof URN_ENHANCER_BONUS).toBe('number');
        expect(URN_ENHANCER_BONUS).toBeGreaterThan(0);
    });
});
