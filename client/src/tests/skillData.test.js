/**
 * Skill Data Tests
 * Validates that all skill data files follow their expected schema.
 *
 * Standard item schema: { id: string, name: string, level: number (0-120), xp: number (>0), category: string }
 * Mode-based files: objects whose values are arrays of standard items.
 * Special files (prayer, artefacts) have their own schemas validated below.
 */

import { describe, it, expect } from 'vitest';

// ── Flat array exports ──────────────────────────────────────────────────────
import { AGILITY_METHODS } from '../data/skills/agilityData.js';
import { COOKING_ITEMS, COOKING_METHODS } from '../data/skills/cookingData.js';
import { CRAFTING_METHODS } from '../data/skills/craftingData.js';
import { FARMING_CROPS, POF_ANIMALS } from '../data/skills/farmingData.js';
import { FIREMAKING_ITEMS, FIREMAKING_BOOSTS } from '../data/skills/firemakingData.js';
import { FISHING_ITEMS, FISHING_BOOSTS } from '../data/skills/fishingData.js';
import { FLETCHING_ITEMS, FLETCHING_BOOSTS } from '../data/skills/fletchingData.js';
import { HERBLORE_ITEMS, HERBLORE_BOOSTS } from '../data/skills/herbloreData.js';
import { MAGIC_SPELLS } from '../data/skills/magicData.js';
import { MINING_ROCKS } from '../data/skills/miningData.js';
import { RC_ALTARS, RUNESPAN_NODES } from '../data/skills/runecraftingData.js';
import { SLAYER_MASTERS, SLAYER_MONSTERS } from '../data/skills/slayerData.js';
import { SMITHING_METHODS } from '../data/skills/smithingData.js';
import { THIEVING_METHODS } from '../data/skills/thievingData.js';
import { WOODCUTTING_ITEMS, WOODCUTTING_BOOSTS } from '../data/skills/woodcuttingData.js';

// ── Mode-based exports ──────────────────────────────────────────────────────
import constructionData from '../data/skills/constructionData.js';
import { divinationData } from '../data/skills/divinationData.js';
import { dungeoneeringData } from '../data/skills/dungeoneeringData.js';
import { hunterData } from '../data/skills/hunterData.js';
import { necromancyData } from '../data/skills/necromancyData.js';
import { summoningData } from '../data/skills/summoningData.js';

// ── Special exports ─────────────────────────────────────────────────────────
import { PRAYER_ITEMS, PRAYER_METHODS } from '../data/skills/prayerData.js';
import { artefacts } from '../data/skills/artefacts.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Validates that arr is a non-empty array where every item has:
 *   id: non-empty string (unique within the array)
 *   name: non-empty string
 *   level: number in 0-120
 *   xp: number > 0
 *   category: non-empty string (unless skipCategory is true)
 */
function validateStandardItems(arr, label, { skipCategory = false } = {}) {
    expect(Array.isArray(arr), `${label} should be an array`).toBe(true);
    expect(arr.length, `${label} should not be empty`).toBeGreaterThan(0);

    const seenIds = new Set();
    for (const item of arr) {
        const ctx = `${label} item "${item.name ?? item.id ?? JSON.stringify(item)}"`;

        expect(typeof item.id, `${ctx}: id must be string`).toBe('string');
        expect(item.id.length, `${ctx}: id must not be empty`).toBeGreaterThan(0);
        expect(seenIds.has(item.id), `${ctx}: duplicate id "${item.id}"`).toBe(false);
        seenIds.add(item.id);

        expect(typeof item.name, `${ctx}: name must be string`).toBe('string');
        expect(item.name.length, `${ctx}: name must not be empty`).toBeGreaterThan(0);

        expect(typeof item.level, `${ctx}: level must be number`).toBe('number');
        expect(item.level, `${ctx}: level must be >= 0`).toBeGreaterThanOrEqual(0);
        expect(item.level, `${ctx}: level must be <= 120`).toBeLessThanOrEqual(120);

        expect(typeof item.xp, `${ctx}: xp must be number`).toBe('number');
        expect(item.xp, `${ctx}: xp must be > 0`).toBeGreaterThan(0);

        if (!skipCategory) {
            expect(typeof item.category, `${ctx}: category must be string`).toBe('string');
            expect(item.category.length, `${ctx}: category must not be empty`).toBeGreaterThan(0);
        }
    }
}

/**
 * Validates a mode-based data object: each key must map to a valid standard item array.
 */
function validateModeBasedData(dataObj, label, expectedModes, opts = {}) {
    expect(typeof dataObj, `${label} should be an object`).toBe('object');
    expect(dataObj, `${label} should not be null`).not.toBeNull();

    for (const mode of expectedModes) {
        expect(dataObj[mode], `${label}.${mode} should exist`).toBeDefined();
        validateStandardItems(dataObj[mode], `${label}.${mode}`, opts);
    }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Flat array skill data files', () => {
    it('agilityData: AGILITY_METHODS', () => {
        validateStandardItems(AGILITY_METHODS, 'AGILITY_METHODS');
    });

    it('cookingData: COOKING_ITEMS', () => {
        validateStandardItems(COOKING_ITEMS, 'COOKING_ITEMS');
    });

    it('cookingData: COOKING_METHODS is a non-empty array with id and name', () => {
        expect(Array.isArray(COOKING_METHODS)).toBe(true);
        expect(COOKING_METHODS.length).toBeGreaterThan(0);
        for (const m of COOKING_METHODS) {
            expect(typeof m.id).toBe('string');
            expect(typeof m.name).toBe('string');
        }
    });

    it('craftingData: CRAFTING_METHODS', () => {
        validateStandardItems(CRAFTING_METHODS, 'CRAFTING_METHODS');
    });

    it('farmingData: FARMING_CROPS', () => {
        validateStandardItems(FARMING_CROPS, 'FARMING_CROPS');
    });

    it('farmingData: POF_ANIMALS', () => {
        validateStandardItems(POF_ANIMALS, 'POF_ANIMALS');
    });

    it('firemakingData: FIREMAKING_ITEMS', () => {
        validateStandardItems(FIREMAKING_ITEMS, 'FIREMAKING_ITEMS');
    });

    it('firemakingData: FIREMAKING_BOOSTS is a non-empty array', () => {
        expect(Array.isArray(FIREMAKING_BOOSTS)).toBe(true);
        expect(FIREMAKING_BOOSTS.length).toBeGreaterThan(0);
    });

    it('fishingData: FISHING_ITEMS', () => {
        validateStandardItems(FISHING_ITEMS, 'FISHING_ITEMS');
    });

    it('fishingData: FISHING_BOOSTS is a non-empty array', () => {
        expect(Array.isArray(FISHING_BOOSTS)).toBe(true);
        expect(FISHING_BOOSTS.length).toBeGreaterThan(0);
    });

    it('fletchingData: FLETCHING_ITEMS (amountMade must be a positive number if present)', () => {
        validateStandardItems(FLETCHING_ITEMS, 'FLETCHING_ITEMS');
        for (const item of FLETCHING_ITEMS) {
            if (item.amountMade !== undefined) {
                expect(typeof item.amountMade, `${item.id}.amountMade must be number`).toBe('number');
                expect(item.amountMade, `${item.id}.amountMade must be > 0`).toBeGreaterThan(0);
            }
        }
    });

    it('fletchingData: FLETCHING_BOOSTS is a non-empty array', () => {
        expect(Array.isArray(FLETCHING_BOOSTS)).toBe(true);
        expect(FLETCHING_BOOSTS.length).toBeGreaterThan(0);
    });

    it('herbloreData: HERBLORE_ITEMS', () => {
        validateStandardItems(HERBLORE_ITEMS, 'HERBLORE_ITEMS');
    });

    it('herbloreData: HERBLORE_BOOSTS is a non-empty array', () => {
        expect(Array.isArray(HERBLORE_BOOSTS)).toBe(true);
        expect(HERBLORE_BOOSTS.length).toBeGreaterThan(0);
    });

    it('magicData: MAGIC_SPELLS (has book field)', () => {
        validateStandardItems(MAGIC_SPELLS, 'MAGIC_SPELLS');
        for (const spell of MAGIC_SPELLS) {
            expect(typeof spell.book, `${spell.id}.book must be string`).toBe('string');
        }
    });

    it('miningData: MINING_ROCKS', () => {
        validateStandardItems(MINING_ROCKS, 'MINING_ROCKS');
    });

    it('runecraftingData: RC_ALTARS', () => {
        validateStandardItems(RC_ALTARS, 'RC_ALTARS');
    });

    it('runecraftingData: RUNESPAN_NODES', () => {
        validateStandardItems(RUNESPAN_NODES, 'RUNESPAN_NODES');
    });

    it('slayerData: SLAYER_MONSTERS', () => {
        validateStandardItems(SLAYER_MONSTERS, 'SLAYER_MONSTERS');
    });

    it('slayerData: SLAYER_MASTERS structure', () => {
        expect(Array.isArray(SLAYER_MASTERS)).toBe(true);
        expect(SLAYER_MASTERS.length).toBeGreaterThan(0);
        for (const master of SLAYER_MASTERS) {
            expect(typeof master.id, `${master.name}.id`).toBe('string');
            expect(typeof master.name, `${master.id}.name`).toBe('string');
            expect(typeof master.level, `${master.id}.level`).toBe('number');
            expect(Array.isArray(master.tasks), `${master.id}.tasks must be an array`).toBe(true);
            expect(master.tasks.length, `${master.id}.tasks must not be empty`).toBeGreaterThan(0);
            for (const task of master.tasks) {
                const ctx = `${master.id}.tasks["${task.id ?? task}"]`;
                expect(typeof task.id, `${ctx}: id must be string`).toBe('string');
                expect(task.id.length, `${ctx}: id must not be empty`).toBeGreaterThan(0);
                expect(typeof task.weight, `${ctx}: weight must be number`).toBe('number');
                expect(task.weight, `${ctx}: weight must be > 0`).toBeGreaterThan(0);
                expect(typeof task.min, `${ctx}: min must be number`).toBe('number');
                expect(task.min, `${ctx}: min must be > 0`).toBeGreaterThan(0);
                expect(typeof task.max, `${ctx}: max must be number`).toBe('number');
                expect(task.max, `${ctx}: max must be >= min`).toBeGreaterThanOrEqual(task.min);
            }
        }
    });

    it('smithingData: SMITHING_METHODS', () => {
        validateStandardItems(SMITHING_METHODS, 'SMITHING_METHODS');
    });

    it('thievingData: THIEVING_METHODS', () => {
        validateStandardItems(THIEVING_METHODS, 'THIEVING_METHODS');
    });

    it('woodcuttingData: WOODCUTTING_ITEMS', () => {
        validateStandardItems(WOODCUTTING_ITEMS, 'WOODCUTTING_ITEMS');
    });

    it('woodcuttingData: WOODCUTTING_BOOSTS is a non-empty array', () => {
        expect(Array.isArray(WOODCUTTING_BOOSTS)).toBe(true);
        expect(WOODCUTTING_BOOSTS.length).toBeGreaterThan(0);
    });
});

describe('Mode-based skill data files', () => {
    it('constructionData: modes standard + contracts', () => {
        validateModeBasedData(constructionData, 'constructionData', ['standard', 'contracts']);
    });

    it('divinationData: modes wisps + hall', () => {
        validateModeBasedData(divinationData, 'divinationData', ['wisps', 'hall']);
    });

    it('dungeoneeringData: mode floors', () => {
        validateModeBasedData(dungeoneeringData, 'dungeoneeringData', ['floors']);
    });

    it('hunterData: mode standard', () => {
        validateModeBasedData(hunterData, 'hunterData', ['standard']);
    });

    it('necromancyData: modes rituals + combat', () => {
        validateModeBasedData(necromancyData, 'necromancyData', ['rituals', 'combat']);
    });

    it('summoningData: modes standard + ancient (charm used instead of category)', () => {
        // Summoning uses charm field rather than category — skip category requirement
        validateModeBasedData(summoningData, 'summoningData', ['standard', 'ancient'], { skipCategory: true });
        // Verify charm field exists on standard items
        for (const item of summoningData.standard) {
            expect(typeof item.charm, `${item.id}.charm must be string`).toBe('string');
        }
    });
});

describe('Special skill data files', () => {
    it('prayerData: PRAYER_ITEMS (no level field, has xp and category)', () => {
        expect(Array.isArray(PRAYER_ITEMS)).toBe(true);
        expect(PRAYER_ITEMS.length).toBeGreaterThan(0);
        const seenIds = new Set();
        for (const item of PRAYER_ITEMS) {
            expect(typeof item.id, `${item.name}.id`).toBe('string');
            expect(seenIds.has(item.id), `duplicate id: ${item.id}`).toBe(false);
            seenIds.add(item.id);
            expect(typeof item.name, `${item.id}.name`).toBe('string');
            expect(typeof item.xp, `${item.id}.xp`).toBe('number');
            expect(item.xp, `${item.id}.xp > 0`).toBeGreaterThan(0);
            expect(typeof item.category, `${item.id}.category`).toBe('string');
        }
    });

    it('prayerData: PRAYER_METHODS (has multiplier > 0)', () => {
        expect(Array.isArray(PRAYER_METHODS)).toBe(true);
        expect(PRAYER_METHODS.length).toBeGreaterThan(0);
        for (const m of PRAYER_METHODS) {
            expect(typeof m.id).toBe('string');
            expect(typeof m.name).toBe('string');
            expect(typeof m.multiplier, `${m.id}.multiplier`).toBe('number');
            expect(m.multiplier, `${m.id}.multiplier > 0`).toBeGreaterThan(0);
        }
    });

    it('artefacts: has name, level, xp, materials (object), collections (array)', () => {
        expect(Array.isArray(artefacts)).toBe(true);
        expect(artefacts.length).toBeGreaterThan(0);
        for (const a of artefacts) {
            const ctx = `artefact "${a.name}"`;
            expect(typeof a.name, `${ctx}.name`).toBe('string');
            expect(a.name.length, `${ctx}.name not empty`).toBeGreaterThan(0);
            expect(typeof a.level, `${ctx}.level`).toBe('number');
            expect(a.level, `${ctx}.level >= 0`).toBeGreaterThanOrEqual(0);
            expect(typeof a.xp, `${ctx}.xp`).toBe('number');
            expect(a.xp, `${ctx}.xp > 0`).toBeGreaterThan(0);
            expect(typeof a.materials, `${ctx}.materials is object`).toBe('object');
            expect(a.materials, `${ctx}.materials not null`).not.toBeNull();
            expect(Array.isArray(a.collections), `${ctx}.collections is array`).toBe(true);
        }
    });
});
