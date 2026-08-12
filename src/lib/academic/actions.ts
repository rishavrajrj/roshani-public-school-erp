'use server'

import { createClient } from '@/lib/supabase/server'
import { resolveUser } from '@/lib/auth/resolve-user'

export async function getAcademicSessions() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { success: false, error: 'Unauthorized', data: [] }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('academic_sessions')
    .select('id, name, start_date, end_date, is_current, status')
    .eq('school_id', authState.user.schoolId)
    .order('is_current', { ascending: false })
    .order('name', { ascending: false })

  if (error) {
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function getClasses() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { success: false, error: 'Unauthorized', data: [] }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, display_order, status')
    .eq('school_id', authState.user.schoolId)
    .eq('status', 'active')
    .order('display_order', { ascending: true })

  if (error) {
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function getSectionsByClass(classId: string) {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { success: false, error: 'Unauthorized', data: [] }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sections')
    .select('id, name, class_id, capacity, status')
    .eq('school_id', authState.user.schoolId)
    .eq('class_id', classId)
    .eq('status', 'active')
    .order('name', { ascending: true })

  if (error) {
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}
