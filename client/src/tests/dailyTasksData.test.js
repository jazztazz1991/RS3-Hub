/**
 * Daily Tasks Data Tests
 * Validates DAILY_TASKS, WEEKLY_TASKS, and MONTHLY_TASKS in dailyTasksData.js.
 *
 * Each entry: { id, name, category, description, checklist? }
 */

import { describe, it, expect } from 'vitest';
import { DAILY_TASKS, WEEKLY_TASKS, MONTHLY_TASKS } from '../data/common/dailyTasksData.js';

const VALID_CATEGORIES = new Set(['Daily', 'Weekly', 'Monthly']);

function validateTasks(tasks, expectedCategory) {
    it('is a non-empty array', () => {
        expect(Array.isArray(tasks)).toBe(true);
        expect(tasks.length).toBeGreaterThan(0);
    });

    it('IDs are unique', () => {
        const ids = tasks.map(t => t.id);
        const dupes = ids.filter((id, idx) => ids.indexOf(id) !== idx);
        expect(dupes, `Duplicate IDs: ${dupes.join(', ')}`).toHaveLength(0);
    });

    for (const task of tasks) {
        it(`"${task.name}"`, () => {
            // id
            expect(typeof task.id).toBe('string');
            expect(task.id.trim().length).toBeGreaterThan(0);

            // name
            expect(typeof task.name).toBe('string');
            expect(task.name.trim().length).toBeGreaterThan(0);

            // category
            expect(task.category, `"${task.name}" category must be "${expectedCategory}"`).toBe(expectedCategory);
            expect(VALID_CATEGORIES.has(task.category)).toBe(true);

            // description
            expect(typeof task.description).toBe('string');
            expect(task.description.trim().length).toBeGreaterThan(0);

            // checklist (optional)
            if (task.checklist !== undefined) {
                expect(Array.isArray(task.checklist), `"${task.name}" checklist must be array`).toBe(true);
                expect(task.checklist.length).toBeGreaterThan(0);
                for (const item of task.checklist) {
                    expect(typeof item, `"${task.name}" checklist item must be string`).toBe('string');
                }
            }
        });
    }
}

describe('DAILY_TASKS', () => validateTasks(DAILY_TASKS, 'Daily'));
describe('WEEKLY_TASKS', () => validateTasks(WEEKLY_TASKS, 'Weekly'));
describe('MONTHLY_TASKS', () => validateTasks(MONTHLY_TASKS, 'Monthly'));
