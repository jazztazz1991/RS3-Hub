/**
 * Guide Data Tests
 * Validates that every guide JSON file in client/src/data/guides/ follows Schema B:
 *   [ { title: string, content: string[] }, ... ]
 *
 * Rules checked per file:
 *   - Top-level value is a non-empty array
 *   - Every section has a non-empty string `title`
 *   - Every section has a non-empty `content` array of strings
 *   - No extra top-level keys beyond title + content
 *   - No MediaWiki parser cache garbage text
 *   - No empty string entries in content arrays
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GUIDES_DIR = join(__dirname, '../data/guides');

const MEDIAWIKI_GARBAGE = [
    'NewPP limit report',
    'Transclusion expansion time report',
    'Saved in parser cache',
    'Parsed by mediawiki',
    'CPU time usage',
    'Real time usage',
];

function isGarbage(text) {
    return MEDIAWIKI_GARBAGE.some(marker => text.includes(marker));
}

/** Walk the guides directory and collect all .json files */
function findGuideFiles(dir) {
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findGuideFiles(fullPath));
        } else if (entry.name.endsWith('.json')) {
            results.push(fullPath);
        }
    }
    return results;
}

const guideFiles = findGuideFiles(GUIDES_DIR);

describe('Guide JSON files — schema validation', () => {
    it('finds at least one guide JSON file', () => {
        expect(guideFiles.length).toBeGreaterThan(0);
    });

    for (const filePath of guideFiles) {
        const label = relative(GUIDES_DIR, filePath).replace(/\\/g, '/');

        it(label, () => {
            // Must parse as valid JSON
            let data;
            try {
                data = JSON.parse(readFileSync(filePath, 'utf8'));
            } catch (e) {
                throw new Error(`${label}: invalid JSON — ${e.message}`);
            }

            // Top-level must be a non-empty array
            expect(Array.isArray(data), `${label}: must be a JSON array`).toBe(true);
            expect(data.length, `${label}: array must not be empty`).toBeGreaterThan(0);

            for (let i = 0; i < data.length; i++) {
                const section = data[i];
                const ctx = `${label}[${i}]`;

                // Only title and content keys are allowed
                const extraKeys = Object.keys(section).filter(k => k !== 'title' && k !== 'content');
                expect(extraKeys, `${ctx}: unexpected keys ${extraKeys.join(', ')}`).toHaveLength(0);

                // title: non-empty string
                expect(typeof section.title, `${ctx}.title must be string`).toBe('string');
                expect(section.title.trim().length, `${ctx}.title must not be blank`).toBeGreaterThan(0);

                // content: non-empty array of strings
                expect(Array.isArray(section.content), `${ctx}.content must be array`).toBe(true);
                expect(section.content.length, `${ctx}.content must not be empty`).toBeGreaterThan(0);

                for (let j = 0; j < section.content.length; j++) {
                    const paragraph = section.content[j];
                    expect(typeof paragraph, `${ctx}.content[${j}] must be string`).toBe('string');
                    expect(paragraph.trim().length, `${ctx}.content[${j}] must not be blank`).toBeGreaterThan(0);
                    expect(
                        isGarbage(paragraph),
                        `${ctx}.content[${j}] contains MediaWiki cache garbage`
                    ).toBe(false);
                }
            }
        });
    }
});
