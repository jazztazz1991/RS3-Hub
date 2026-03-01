/**
 * Quest Data Tests
 * Validates the integrity of QUEST_DATA in questData.js.
 *
 * Checks per quest:
 *   - All required fields are present
 *   - isMembers is a boolean
 *   - questPoints is a non-negative integer
 *   - length and difficulty are non-empty strings
 *   - skillReqs use valid RS3 skill names and valid levels
 *   - questReqs all resolve to real quest titles in the same dataset
 *   - guide is a non-empty array of strings
 */

import { describe, it, expect } from 'vitest';
import { QUEST_DATA } from '../data/quests/questData.js';

const VALID_SKILLS = new Set([
    'Attack', 'Strength', 'Defence', 'Constitution', 'Ranged', 'Prayer', 'Magic',
    'Cooking', 'Woodcutting', 'Fletching', 'Fishing', 'Firemaking', 'Crafting',
    'Smithing', 'Mining', 'Herblore', 'Agility', 'Thieving', 'Slayer', 'Farming',
    'Runecrafting', 'Hunter', 'Construction', 'Summoning', 'Dungeoneering',
    'Divination', 'Invention', 'Archaeology', 'Necromancy',
]);

const REQUIRED_FIELDS = ['title', 'isMembers', 'length', 'difficulty', 'questPoints',
    'skillReqs', 'questReqs', 'requirements', 'guide'];

describe('QUEST_DATA — top-level', () => {
    it('is a non-empty array', () => {
        expect(Array.isArray(QUEST_DATA)).toBe(true);
        expect(QUEST_DATA.length).toBeGreaterThan(0);
    });

    it('contains at least 270 quests', () => {
        expect(QUEST_DATA.length).toBeGreaterThanOrEqual(270);
    });

    it('quest titles are all unique', () => {
        const titles = QUEST_DATA.map(q => q.title);
        const unique = new Set(titles);
        const duplicates = titles.filter((t, i) => titles.indexOf(t) !== i);
        expect(duplicates, `Duplicate titles: ${duplicates.join(', ')}`).toHaveLength(0);
    });

    it('every quest is either F2P or Members', () => {
        const f2p = QUEST_DATA.filter(q => q.isMembers === false).length;
        const members = QUEST_DATA.filter(q => q.isMembers === true).length;
        expect(f2p).toBeGreaterThanOrEqual(40);
        expect(members).toBeGreaterThan(200);
        expect(f2p + members).toBe(QUEST_DATA.length);
    });
});

describe('QUEST_DATA — per-quest field validation', () => {
    for (const quest of QUEST_DATA) {
        it(`"${quest.title}"`, () => {
            // Required fields present
            for (const field of REQUIRED_FIELDS) {
                expect(quest[field], `"${quest.title}" missing field: ${field}`).toBeDefined();
            }

            // title: non-empty string
            expect(typeof quest.title).toBe('string');
            expect(quest.title.trim().length).toBeGreaterThan(0);

            // isMembers: strict boolean
            expect(typeof quest.isMembers, `"${quest.title}".isMembers must be boolean`).toBe('boolean');

            // questPoints: non-negative integer
            expect(typeof quest.questPoints, `"${quest.title}".questPoints must be number`).toBe('number');
            expect(Number.isInteger(quest.questPoints), `"${quest.title}".questPoints must be integer`).toBe(true);
            expect(quest.questPoints, `"${quest.title}".questPoints must be >= 0`).toBeGreaterThanOrEqual(0);

            // length: non-empty string
            expect(typeof quest.length, `"${quest.title}".length must be string`).toBe('string');
            expect(quest.length.trim().length, `"${quest.title}".length must not be blank`).toBeGreaterThan(0);

            // difficulty: non-empty string
            expect(typeof quest.difficulty, `"${quest.title}".difficulty must be string`).toBe('string');
            expect(quest.difficulty.trim().length, `"${quest.title}".difficulty must not be blank`).toBeGreaterThan(0);

            // skillReqs: array of { skill, level }
            expect(Array.isArray(quest.skillReqs), `"${quest.title}".skillReqs must be array`).toBe(true);
            for (const req of quest.skillReqs) {
                expect(VALID_SKILLS.has(req.skill),
                    `"${quest.title}".skillReqs — unknown skill: "${req.skill}"`
                ).toBe(true);
                expect(typeof req.level, `"${quest.title}".skillReqs.${req.skill}.level must be number`).toBe('number');
                expect(req.level, `skill req level >= 1`).toBeGreaterThanOrEqual(1);
                expect(req.level, `skill req level <= 120`).toBeLessThanOrEqual(120);
            }

            // questReqs: array of strings
            expect(Array.isArray(quest.questReqs), `"${quest.title}".questReqs must be array`).toBe(true);
            for (const req of quest.questReqs) {
                expect(typeof req, `"${quest.title}".questReqs entry must be string`).toBe('string');
            }

            // requirements: must be an array (always empty currently)
            expect(Array.isArray(quest.requirements), `"${quest.title}".requirements must be array`).toBe(true);

            // guide: non-empty array of strings or image objects { type: 'image', src, alt? }
            expect(Array.isArray(quest.guide), `"${quest.title}".guide must be array`).toBe(true);
            expect(quest.guide.length, `"${quest.title}".guide must not be empty`).toBeGreaterThan(0);
            for (const step of quest.guide) {
                const isString = typeof step === 'string';
                const isObject = typeof step === 'object' && step !== null;
                const isImage = isObject && step.type === 'image' && typeof step.src === 'string';
                const isRichText = isObject && typeof step.text === 'string';
                expect(
                    isString || isImage || isRichText,
                    `"${quest.title}".guide step must be string, image object, or text object, got: ${JSON.stringify(step).slice(0, 80)}`
                ).toBe(true);
            }

            // series: must be a non-empty string if present
            if (quest.series !== undefined) {
                expect(typeof quest.series, `"${quest.title}".series must be string`).toBe('string');
                expect(quest.series.trim().length, `"${quest.title}".series must not be blank`).toBeGreaterThan(0);
            }
        });
    }
});

describe('QUEST_DATA — referential integrity', () => {
    const questTitles = new Set(QUEST_DATA.map(q => q.title));

    it('all questReqs resolve to real quest titles', () => {
        const broken = [];
        for (const quest of QUEST_DATA) {
            for (const req of quest.questReqs) {
                if (!questTitles.has(req)) {
                    broken.push(`"${quest.title}" requires unknown quest: "${req}"`);
                }
            }
        }
        expect(broken, broken.join('\n')).toHaveLength(0);
    });
});
