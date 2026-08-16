// ============================================================
// Roshani Public School ERP - Feature Catalog & Configuration Types
// ============================================================

export type FeatureCategory = 'core' | 'optional'

export type CoreFeatureKey =
  | 'school_profile'
  | 'academic'
  | 'students'
  | 'guardians'
  | 'staff'
  | 'users_roles'
  | 'admissions'
  | 'attendance'
  | 'examinations'
  | 'results'
  | 'documents'
  | 'fees'
  | 'audit'

export type OptionalFeatureKey =
  | 'transport'
  | 'hostel'
  | 'library'
  | 'inventory'
  | 'payroll'
  | 'activities'
  | 'house_system'
  | 'clubs'
  | 'advanced_communication'

export type FeatureKey = CoreFeatureKey | OptionalFeatureKey

export interface FeatureDefinition {
  key: FeatureKey
  name: string
  description: string
  category: FeatureCategory
  isDefaultEnabled: boolean
  dependencies: FeatureKey[]
  requiredRoles: string[]
  iconName?: string
}

export interface SchoolFeature {
  id: string
  school_id: string
  feature_key: FeatureKey
  enabled: boolean
  config: Record<string, unknown>
  enabled_at: string | null
  disabled_at: string | null
  enabled_by: string | null
  updated_at: string
}

export type EntityType = 'student' | 'guardian' | 'staff' | 'admission'

export interface SchoolFieldConfig {
  id: string
  school_id: string
  entity_type: EntityType
  field_name: string
  is_required: boolean
  is_enabled: boolean
  custom_label: string | null
  updated_at: string
}

export interface FeatureDependencyCheck {
  valid: boolean
  missingDependencies: string[]
  dependentActiveModules: string[]
  message?: string
}
