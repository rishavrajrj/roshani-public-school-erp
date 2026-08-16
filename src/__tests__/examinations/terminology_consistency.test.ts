import { describe, it, expect } from 'vitest'
import { CANONICAL_EXAM_TYPES, getCanonicalExamName, DEFAULT_EXAMINATION_FALLBACK } from '@/lib/examinations/constants'

describe('Roshani Public School ERP — Examination Terminology Consistency', () => {
  it('1. should define exact canonical names for all 7 standard examination codes', () => {
    expect(CANONICAL_EXAM_TYPES.UT).toBe('Unit Test')
    expect(CANONICAL_EXAM_TYPES.PT).toBe('Periodic Test')
    expect(CANONICAL_EXAM_TYPES.HY).toBe('Half-Yearly Examination')
    expect(CANONICAL_EXAM_TYPES.PA).toBe('Pre-Annual Examination')
    expect(CANONICAL_EXAM_TYPES.ANNUAL).toBe('Annual Examination')
    expect(CANONICAL_EXAM_TYPES.PRAC).toBe('Practical Examination')
    expect(CANONICAL_EXAM_TYPES.IA).toBe('Internal Assessment')
  })

  it('2. should not contain any legacy "semester" terminology in canonical mappings', () => {
    Object.values(CANONICAL_EXAM_TYPES).forEach((name) => {
      expect(name.toLowerCase()).not.toContain('semester')
    })
  })

  it('3. should resolve canonical examination names from code accurately', () => {
    expect(getCanonicalExamName('HY')).toBe('Half-Yearly Examination')
    expect(getCanonicalExamName('ANNUAL')).toBe('Annual Examination')
    expect(getCanonicalExamName('hy')).toBe('Half-Yearly Examination')
    expect(getCanonicalExamName('pa')).toBe('Pre-Annual Examination')
    expect(getCanonicalExamName('ut')).toBe('Unit Test')
  })

  it('4. should fall back to canonical Half-Yearly Examination when code and name are absent', () => {
    expect(getCanonicalExamName(null, null)).toBe('Half-Yearly Examination')
    expect(getCanonicalExamName(undefined, undefined)).toBe('Half-Yearly Examination')
  })

  it('5. should have canonical default fallback for student and examination portal', () => {
    expect(DEFAULT_EXAMINATION_FALLBACK).toBe('Half-Yearly Examination 2024–25')
    expect(DEFAULT_EXAMINATION_FALLBACK).not.toContain('Semester')
  })
})
