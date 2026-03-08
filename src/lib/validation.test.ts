import { describe, it, expect } from 'vitest'
import {
    isNumber, isString, isBoolean, isArray, isObject,
    isValidMacroTargets, isValidActivityLevel, isValidDailyLog,
    isValidWorkoutLog, isValidArchetype, isValidMood,
    validateImportData,
} from './validation'

// ================================================================
// Type Guards
// ================================================================
describe('type guards', () => {
    describe('isNumber', () => {
        it('should accept valid numbers', () => {
            expect(isNumber(0)).toBe(true)
            expect(isNumber(42)).toBe(true)
            expect(isNumber(-1.5)).toBe(true)
        })

        it('should reject NaN', () => {
            expect(isNumber(NaN)).toBe(false)
        })

        it('should reject Infinity', () => {
            expect(isNumber(Infinity)).toBe(false)
            expect(isNumber(-Infinity)).toBe(false)
        })

        it('should reject non-numbers', () => {
            expect(isNumber('42')).toBe(false)
            expect(isNumber(null)).toBe(false)
            expect(isNumber(undefined)).toBe(false)
        })
    })

    describe('isString', () => {
        it('should accept strings', () => {
            expect(isString('')).toBe(true)
            expect(isString('hello')).toBe(true)
        })

        it('should reject non-strings', () => {
            expect(isString(42)).toBe(false)
            expect(isString(null)).toBe(false)
        })
    })

    describe('isBoolean', () => {
        it('should accept booleans', () => {
            expect(isBoolean(true)).toBe(true)
            expect(isBoolean(false)).toBe(true)
        })

        it('should reject truthy/falsy non-booleans', () => {
            expect(isBoolean(0)).toBe(false)
            expect(isBoolean(1)).toBe(false)
            expect(isBoolean('')).toBe(false)
        })
    })

    describe('isArray', () => {
        it('should accept arrays', () => {
            expect(isArray([])).toBe(true)
            expect(isArray([1, 2])).toBe(true)
        })

        it('should reject non-arrays', () => {
            expect(isArray({})).toBe(false)
            expect(isArray('[]')).toBe(false)
        })
    })

    describe('isObject', () => {
        it('should accept plain objects', () => {
            expect(isObject({})).toBe(true)
            expect(isObject({ a: 1 })).toBe(true)
        })

        it('should reject null', () => {
            expect(isObject(null)).toBe(false)
        })

        it('should reject arrays', () => {
            expect(isObject([])).toBe(false)
        })

        it('should reject primitives', () => {
            expect(isObject('string')).toBe(false)
            expect(isObject(42)).toBe(false)
        })
    })
})

// ================================================================
// Macro Validation
// ================================================================
describe('isValidMacroTargets', () => {
    it('should accept valid macro targets', () => {
        expect(isValidMacroTargets({ protein: 180, calories: 2400, carbs: 240, fats: 70 })).toBe(true)
    })

    it('should accept boundary values (0, max)', () => {
        expect(isValidMacroTargets({ protein: 0, calories: 0, carbs: 0, fats: 0 })).toBe(true)
        expect(isValidMacroTargets({ protein: 1000, calories: 10000, carbs: 2000, fats: 1000 })).toBe(true)
    })

    it('should reject values exceeding max', () => {
        expect(isValidMacroTargets({ protein: 1001, calories: 2400, carbs: 240, fats: 70 })).toBe(false)
        expect(isValidMacroTargets({ protein: 180, calories: 10001, carbs: 240, fats: 70 })).toBe(false)
    })

    it('should reject negative values', () => {
        expect(isValidMacroTargets({ protein: -1, calories: 2400, carbs: 240, fats: 70 })).toBe(false)
    })

    it('should reject non-object', () => {
        expect(isValidMacroTargets('not an object')).toBe(false)
        expect(isValidMacroTargets(null)).toBe(false)
    })

    it('should reject missing fields', () => {
        expect(isValidMacroTargets({ protein: 180, calories: 2400 })).toBe(false)
    })
})

describe('isValidActivityLevel', () => {
    it('should accept all valid activity levels', () => {
        expect(isValidActivityLevel('sedentary')).toBe(true)
        expect(isValidActivityLevel('light')).toBe(true)
        expect(isValidActivityLevel('moderate')).toBe(true)
        expect(isValidActivityLevel('active')).toBe(true)
    })

    it('should reject invalid values', () => {
        expect(isValidActivityLevel('extreme')).toBe(false)
        expect(isValidActivityLevel('')).toBe(false)
        expect(isValidActivityLevel(null)).toBe(false)
    })
})

// ================================================================
// Daily Log Validation
// ================================================================
describe('isValidDailyLog', () => {
    it('should accept a valid daily log', () => {
        expect(isValidDailyLog({
            date: '2026-01-01', protein: 180, calories: 2400, carbs: 240, fats: 70, meals: [],
        })).toBe(true)
    })

    it('should reject missing fields', () => {
        expect(isValidDailyLog({ date: '2026-01-01', protein: 180 })).toBe(false)
    })

    it('should reject non-object', () => {
        expect(isValidDailyLog('not an object')).toBe(false)
        expect(isValidDailyLog(null)).toBe(false)
    })
})

// ================================================================
// Workout Log Validation
// ================================================================
describe('isValidWorkoutLog', () => {
    it('should accept a valid workout log', () => {
        expect(isValidWorkoutLog({
            id: 'w1', date: '2026-01-01', workoutType: 'push', completed: true, exercises: [],
        })).toBe(true)
    })

    it('should reject missing completed field', () => {
        expect(isValidWorkoutLog({
            id: 'w1', date: '2026-01-01', workoutType: 'push', exercises: [],
        })).toBe(false)
    })

    it('should reject non-object', () => {
        expect(isValidWorkoutLog(null)).toBe(false)
    })
})

// ================================================================
// Avatar Validation
// ================================================================
describe('isValidArchetype', () => {
    it('should accept all 5 archetypes', () => {
        expect(isValidArchetype('bro')).toBe(true)
        expect(isValidArchetype('himbo')).toBe(true)
        expect(isValidArchetype('brute')).toBe(true)
        expect(isValidArchetype('pup')).toBe(true)
        expect(isValidArchetype('bull')).toBe(true)
    })

    it('should reject invalid values', () => {
        expect(isValidArchetype('warrior')).toBe(false)
        expect(isValidArchetype('')).toBe(false)
        expect(isValidArchetype(null)).toBe(false)
    })
})

describe('isValidMood', () => {
    it('should accept all 5 moods', () => {
        expect(isValidMood('happy')).toBe(true)
        expect(isValidMood('neutral')).toBe(true)
        expect(isValidMood('sad')).toBe(true)
        expect(isValidMood('hyped')).toBe(true)
        expect(isValidMood('neglected')).toBe(true)
    })

    it('should reject invalid moods', () => {
        expect(isValidMood('angry')).toBe(false)
        expect(isValidMood(42)).toBe(false)
    })
})

// ================================================================
// validateImportData
// ================================================================
describe('validateImportData', () => {
    it('should pass with valid data and validators', () => {
        const result = validateImportData(
            { name: 'JASPER', age: 28 },
            [
                { field: 'name', check: isString },
                { field: 'age', check: isNumber },
            ]
        )
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })

    it('should fail with invalid field values', () => {
        const result = validateImportData(
            { name: 42, age: 'not a number' },
            [
                { field: 'name', check: isString },
                { field: 'age', check: isNumber },
            ]
        )
        expect(result.valid).toBe(false)
        expect(result.errors).toHaveLength(2)
        expect(result.errors[0]).toContain('name')
        expect(result.errors[1]).toContain('age')
    })

    it('should pass when optional fields are missing', () => {
        const result = validateImportData(
            { name: 'JASPER' },
            [
                { field: 'name', check: isString },
                { field: 'optionalField', check: isNumber },
            ]
        )
        expect(result.valid).toBe(true)
    })

    it('should reject non-object data', () => {
        const result = validateImportData('not an object', [])
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Data must be an object')
    })

    it('should reject null', () => {
        const result = validateImportData(null, [])
        expect(result.valid).toBe(false)
    })
})
