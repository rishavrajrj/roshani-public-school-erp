// ============================================================
// Roshani Public School ERP - School-Configurable Field Validator
// ============================================================

import type { SchoolFieldConfig, EntityType } from '@/types/features'

export interface FieldValidationError {
  field: string
  label: string
  message: string
}

export interface FieldValidationResult {
  valid: boolean
  errors: FieldValidationError[]
}

/**
 * Validates entity submission data against dynamic school-configured required fields.
 * Performs strict server-side validation.
 */
export function validateDynamicSchoolFields(
  entityType: EntityType,
  data: Record<string, unknown>,
  configs: SchoolFieldConfig[]
): FieldValidationResult {
  const errors: FieldValidationError[] = []

  for (const config of configs) {
    if (!config.is_enabled) continue

    if (config.is_required) {
      const val = data[config.field_name]
      const label = config.custom_label || formatFieldLabel(config.field_name)

      if (val === undefined || val === null || val === '') {
        errors.push({
          field: config.field_name,
          label,
          message: `${label} is required by school policy.`,
        })
      } else if (typeof val === 'string' && val.trim().length === 0) {
        errors.push({
          field: config.field_name,
          label,
          message: `${label} cannot be empty.`,
        })
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

function formatFieldLabel(fieldName: string): string {
  return fieldName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
