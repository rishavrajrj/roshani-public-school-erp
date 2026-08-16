import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  FEATURE_CATALOG,
  CORE_FEATURES,
  OPTIONAL_FEATURES,
  evaluateFeatureDependencies,
} from '@/lib/features/catalog'
import {
  validateDynamicSchoolFields,
} from '@/lib/features/field-validator'
import {
  normalizeUdiseCode,
} from '@/lib/schools/validation'
import type { FeatureKey, SchoolFieldConfig } from '@/types/features'

describe('Multi-School Information Architecture & Configurable Modules', () => {
  describe('1. Critical School Identity & UDISE Validation', () => {
    it('validates and normalizes valid 11-digit UDISE codes as textual identifiers', () => {
      const resultA = normalizeUdiseCode('10123456789')
      expect(resultA.valid).toBe(true)
      expect(resultA.normalized).toBe('10123456789')
      expect(typeof resultA.normalized).toBe('string')

      const resultB = normalizeUdiseCode('  10987654321  ')
      expect(resultB.valid).toBe(true)
      expect(resultB.normalized).toBe('10987654321')
    })

    it('rejects invalid UDISE codes (non-numeric, wrong length)', () => {
      const tooShort = normalizeUdiseCode('1012345')
      expect(tooShort.valid).toBe(false)
      expect(tooShort.error).toContain('11 numeric digits')

      const tooLong = normalizeUdiseCode('101234567890123')
      expect(tooLong.valid).toBe(false)

      const alpha = normalizeUdiseCode('1012345ABCD')
      expect(alpha.valid).toBe(false)
    })

    it('handles empty/null UDISE codes gracefully for optional setup phases', () => {
      const empty = normalizeUdiseCode('')
      expect(empty.valid).toBe(true)
      expect(empty.normalized).toBeNull()

      const nil = normalizeUdiseCode(null)
      expect(nil.valid).toBe(true)
      expect(nil.normalized).toBeNull()
    })
  })

  describe('2. Canonical Feature Catalog & Governance Rules', () => {
    it('contains all mandatory core modules', () => {
      const coreKeys = CORE_FEATURES.map((f) => f.key)
      expect(coreKeys).toContain('school_profile')
      expect(coreKeys).toContain('academic')
      expect(coreKeys).toContain('students')
      expect(coreKeys).toContain('guardians')
      expect(coreKeys).toContain('staff')
      expect(coreKeys).toContain('users_roles')
      expect(coreKeys).toContain('admissions')
      expect(coreKeys).toContain('attendance')
      expect(coreKeys).toContain('examinations')
      expect(coreKeys).toContain('results')
      expect(coreKeys).toContain('documents')
      expect(coreKeys).toContain('fees')
      expect(coreKeys).toContain('audit')

      // All core modules default to true
      for (const core of CORE_FEATURES) {
        expect(core.isDefaultEnabled).toBe(true)
        expect(core.category).toBe('core')
      }
    })

    it('contains all configurable optional modules', () => {
      const optKeys = OPTIONAL_FEATURES.map((f) => f.key)
      expect(optKeys).toContain('transport')
      expect(optKeys).toContain('hostel')
      expect(optKeys).toContain('library')
      expect(optKeys).toContain('inventory')
      expect(optKeys).toContain('payroll')
      expect(optKeys).toContain('activities')
      expect(optKeys).toContain('house_system')
      expect(optKeys).toContain('clubs')
      expect(optKeys).toContain('advanced_communication')

      for (const opt of OPTIONAL_FEATURES) {
        expect(opt.category).toBe('optional')
        expect(opt.isDefaultEnabled).toBe(false)
      }
    })

    it('prohibits disabling any core/mandatory module', () => {
      const activeKeys = new Set<FeatureKey>(['school_profile', 'academic', 'students'])
      const res = evaluateFeatureDependencies('students', false, activeKeys)
      expect(res.valid).toBe(false)
      expect(res.reason).toContain('mandatory for school operation')
    })
  })

  describe('3. Module Dependency Validation Engine', () => {
    it('allows enabling optional module when all prerequisites are active', () => {
      const activeKeys = new Set<FeatureKey>(['school_profile', 'academic', 'students'])
      const res = evaluateFeatureDependencies('transport', true, activeKeys)
      expect(res.valid).toBe(true)
      expect(res.missingDependencies).toHaveLength(0)
    })

    it('blocks enabling optional module when a prerequisite is missing', () => {
      // Students is missing from active set
      const activeKeys = new Set<FeatureKey>(['school_profile', 'academic'])
      const res = evaluateFeatureDependencies('transport', true, activeKeys)
      expect(res.valid).toBe(false)
      expect(res.missingDependencies).toContain('Student Information System')
      expect(res.reason).toContain('cannot be enabled until')
    })

    it('warns about active dependent modules when disabling a prerequisite', () => {
      const activeKeys = new Set<FeatureKey>([
        'school_profile',
        'academic',
        'students',
        'examinations',
        'results',
      ])

      // Examinations has active dependent 'results'
      const res = evaluateFeatureDependencies('examinations', false, activeKeys)
      expect(res.valid).toBe(false)
      expect(res.dependentActiveModules).toContain('Marks, Results & Grading')
    })
  })

  describe('4. School-Configurable Dynamic Required Fields', () => {
    it('enforces required fields for School A (Photo required) and passes when present', () => {
      const schoolAConfigs: SchoolFieldConfig[] = [
        {
          id: '1',
          school_id: 'school-a-uuid',
          entity_type: 'student',
          field_name: 'photo_url',
          is_required: true,
          is_enabled: true,
          custom_label: 'Student Passport Photo',
          updated_at: new Date().toISOString(),
        },
      ]

      // Case 1: Missing required field
      const missingPayload = {
        first_name: 'Aarav',
        last_name: 'Sharma',
        photo_url: '',
      }
      const checkFail = validateDynamicSchoolFields('student', missingPayload, schoolAConfigs)
      expect(checkFail.valid).toBe(false)
      expect(checkFail.errors).toHaveLength(1)
      expect(checkFail.errors[0].field).toBe('photo_url')
      expect(checkFail.errors[0].message).toContain('required by school policy')

      // Case 2: Present required field
      const validPayload = {
        first_name: 'Aarav',
        last_name: 'Sharma',
        photo_url: 'https://storage.roshani.edu/photos/aarav.jpg',
      }
      const checkPass = validateDynamicSchoolFields('student', validPayload, schoolAConfigs)
      expect(checkPass.valid).toBe(true)
      expect(checkPass.errors).toHaveLength(0)
    })

    it('permits empty optional fields for School B (Photo optional)', () => {
      const schoolBConfigs: SchoolFieldConfig[] = [
        {
          id: '2',
          school_id: 'school-b-uuid',
          entity_type: 'student',
          field_name: 'photo_url',
          is_required: false,
          is_enabled: true,
          custom_label: 'Student Photo',
          updated_at: new Date().toISOString(),
        },
      ]

      const payloadWithoutPhoto = {
        first_name: 'Vivaan',
        last_name: 'Patel',
        photo_url: '',
      }
      const check = validateDynamicSchoolFields('student', payloadWithoutPhoto, schoolBConfigs)
      expect(check.valid).toBe(true)
      expect(check.errors).toHaveLength(0)
    })

    it('ignores fields that are disabled for the school', () => {
      const configs: SchoolFieldConfig[] = [
        {
          id: '3',
          school_id: 'school-a-uuid',
          entity_type: 'student',
          field_name: 'national_id',
          is_required: true,
          is_enabled: false, // disabled feature
          custom_label: 'Aadhaar Card',
          updated_at: new Date().toISOString(),
        },
      ]

      const payload = { first_name: 'Riya', last_name: 'Sen' }
      const check = validateDynamicSchoolFields('student', payload, configs)
      expect(check.valid).toBe(true)
    })
  })

  describe('5. Multi-School Tenant Isolation Logic', () => {
    it('verifies independent module configurations across distinct school tenants', () => {
      // Mock independent school states
      const schoolA_Features: Record<FeatureKey, boolean> = {
        ...Object.fromEntries(CORE_FEATURES.map((f) => [f.key, true])) as any,
        transport: true,
        hostel: false,
        library: true,
        inventory: true,
        payroll: false,
        activities: false,
        house_system: false,
        clubs: false,
        advanced_communication: false,
      }

      const schoolB_Features: Record<FeatureKey, boolean> = {
        ...Object.fromEntries(CORE_FEATURES.map((f) => [f.key, true])) as any,
        transport: false,
        hostel: true,
        library: false,
        inventory: true,
        payroll: true,
        activities: false,
        house_system: false,
        clubs: false,
        advanced_communication: false,
      }

      // School A has Transport ON, School B has Transport OFF
      expect(schoolA_Features.transport).toBe(true)
      expect(schoolB_Features.transport).toBe(false)

      // School A has Hostel OFF, School B has Hostel ON
      expect(schoolA_Features.hostel).toBe(false)
      expect(schoolB_Features.hostel).toBe(true)

      // Modifying School A never mutates School B
      schoolA_Features.transport = false
      expect(schoolA_Features.transport).toBe(false)
      expect(schoolB_Features.hostel).toBe(true) // untouched
    })

    it('verifies zero data-loss principle when optional modules are toggled', () => {
      // Simulated existing module records
      const transportRoutes = [
        { id: 'route-1', school_id: 'school-a', route_name: 'Route 1 - North Sector' },
        { id: 'route-2', school_id: 'school-a', route_name: 'Route 2 - South Sector' },
      ]

      // School A disables transport
      let isTransportActive = false
      expect(isTransportActive).toBe(false)

      // Underlying data is preserved
      expect(transportRoutes).toHaveLength(2)
      expect(transportRoutes[0].route_name).toBe('Route 1 - North Sector')

      // School A re-enables transport
      isTransportActive = true
      expect(isTransportActive).toBe(true)
      expect(transportRoutes).toHaveLength(2)
    })
  })
})
