'use server'

// ============================================================
// Roshani Public School ERP - School Feature & Field Services
// ============================================================

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import {
  FEATURE_CATALOG,
  evaluateFeatureDependencies,
} from './catalog'
import type {
  FeatureKey,
  SchoolFeature,
  SchoolFieldConfig,
  EntityType,
} from '@/types/features'

export interface ToggleFeatureResult {
  success: boolean
  error?: string
  message?: string
  feature?: SchoolFeature
}

/**
 * Retrieves all feature flags and configurations for the current authenticated user's school.
 * Core features default to enabled if not explicitly recorded.
 */
export const getSchoolFeatures = cache(async function getSchoolFeatures(): Promise<{
  features: Record<FeatureKey, boolean>
  featureRecords: SchoolFeature[]
}> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { features: {} as Record<FeatureKey, boolean>, featureRecords: [] }
  }

  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('school_features') as any)
    .select('*')
    .eq('school_id', authState.user.schoolId)

  const featureMap: Record<string, boolean> = {}

  // Initialize defaults from catalog
  for (const [key, def] of Object.entries(FEATURE_CATALOG)) {
    featureMap[key] = def.isDefaultEnabled
  }

  const records: SchoolFeature[] = []

  if (!error && data) {
    for (const record of data) {
      featureMap[record.feature_key] = record.enabled
      records.push(record as SchoolFeature)
    }
  }

  return {
    features: featureMap as Record<FeatureKey, boolean>,
    featureRecords: records,
  }
})

/**
 * Checks if a specific feature is enabled for the authenticated user's school.
 */
export async function isFeatureEnabled(featureKey: FeatureKey): Promise<boolean> {
  const { features } = await getSchoolFeatures()
  const val = features[featureKey]
  if (val !== undefined) return val
  return FEATURE_CATALOG[featureKey]?.isDefaultEnabled ?? false
}

/**
 * Toggles an optional feature for the current school.
 * Validates dependencies and permissions.
 * Never deletes existing operational data when disabled.
 */
export async function toggleSchoolFeature(params: {
  featureKey: FeatureKey
  enabled: boolean
  config?: Record<string, unknown>
}): Promise<ToggleFeatureResult> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { success: false, error: 'Unauthorized: Authentication required.' }
  }

  const { user } = authState
  if (!hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])) {
    return { success: false, error: 'Forbidden: Only administrators can modify school features.' }
  }

  const { featureKey, enabled, config = {} } = params
  const definition = FEATURE_CATALOG[featureKey]

  if (!definition) {
    return { success: false, error: `Invalid feature: '${featureKey}'` }
  }

  // Get active features to validate dependency constraints
  const { features } = await getSchoolFeatures()
  const activeKeys = new Set<FeatureKey>()
  for (const [k, isAct] of Object.entries(features)) {
    if (isAct) activeKeys.add(k as FeatureKey)
  }

  const depCheck = evaluateFeatureDependencies(featureKey, enabled, activeKeys)
  if (!depCheck.valid) {
    return {
      success: false,
      error: depCheck.reason || 'Dependency rule validation failed.',
    }
  }

  const supabase = await createClient()

  // Upsert the school_feature row
  const now = new Date().toISOString()
  const payload: Record<string, unknown> = {
    school_id: user.schoolId,
    feature_key: featureKey,
    enabled,
    config,
    updated_at: now,
  }

  if (enabled) {
    payload.enabled_at = now
    payload.enabled_by = user.profileId
  } else {
    payload.disabled_at = now
  }

  const { data, error } = await (supabase
    .from('school_features') as any)
    .upsert(payload, { onConflict: 'school_id,feature_key' })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Log to audit trail
  await (supabase.from('audit_logs') as any).insert({
    school_id: user.schoolId,
    actor_profile_id: user.profileId,
    action: enabled ? 'FEATURE_ENABLED' : 'FEATURE_DISABLED',
    entity_type: 'school_feature',
    entity_id: data.id,
    new_data: { feature_key: featureKey, enabled, config },
  })

  return {
    success: true,
    message: `${definition.name} successfully ${enabled ? 'enabled' : 'disabled'}.`,
    feature: data as SchoolFeature,
  }
}

/**
 * Retrieves school-level field configurations for an entity type (e.g. 'student', 'guardian').
 */
export const getSchoolFieldConfigs = cache(async function getSchoolFieldConfigs(
  entityType: EntityType
): Promise<SchoolFieldConfig[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return []
  }

  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('school_field_configs') as any)
    .select('*')
    .eq('school_id', authState.user.schoolId)
    .eq('entity_type', entityType)

  if (error || !data) return []
  return data as SchoolFieldConfig[]
})

/**
 * Saves configurable field rules for an entity type for the current school.
 */
export async function saveSchoolFieldConfigs(
  entityType: EntityType,
  configs: Array<{
    field_name: string
    is_required: boolean
    is_enabled: boolean
    custom_label?: string | null
  }>
): Promise<{ success: boolean; error?: string; message?: string }> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { success: false, error: 'Unauthorized' }
  }

  const { user } = authState
  if (!hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])) {
    return { success: false, error: 'Forbidden: Insufficient privileges.' }
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  const rows = configs.map((c) => ({
    school_id: user.schoolId,
    entity_type: entityType,
    field_name: c.field_name,
    is_required: c.is_required,
    is_enabled: c.is_enabled,
    custom_label: c.custom_label || null,
    updated_at: now,
  }))

  const { error } = await (supabase
    .from('school_field_configs') as any)
    .upsert(rows, { onConflict: 'school_id,entity_type,field_name' })

  if (error) {
    return { success: false, error: error.message }
  }

  // Audit log
  await (supabase.from('audit_logs') as any).insert({
    school_id: user.schoolId,
    actor_profile_id: user.profileId,
    action: 'FIELD_CONFIGS_UPDATED',
    entity_type: 'school_field_configs',
    entity_id: user.schoolId,
    new_data: { entityType, count: configs.length },
  })

  return {
    success: true,
    message: `Field configurations for ${entityType} updated successfully.`,
  }
}
