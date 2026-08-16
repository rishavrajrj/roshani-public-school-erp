// ============================================================
// Roshani Public School ERP - School Profile & Identity Types
// ============================================================

export type SchoolStatus = 'active' | 'inactive' | 'suspended' | 'onboarding'
export type SchoolType = 'co-ed' | 'boys' | 'girls'
export type ManagementType = 'private' | 'government_aided' | 'trust' | 'society'
export type AffiliationBoard = 'CBSE' | 'ICSE' | 'State Board' | 'IB' | 'Cambridge' | 'Other'

export interface SchoolProfile {
  id: string
  name: string
  code: string
  udise_code: string | null
  short_name: string | null
  school_type: SchoolType
  management_type: ManagementType
  affiliation: AffiliationBoard
  affiliation_number: string | null
  recognition_number: string | null
  registration_number: string | null
  address: string | null
  village_town_city: string | null
  city: string | null
  district: string | null
  state: string | null
  pin_code: string | null
  country: string
  phone: string | null
  alternate_phone: string | null
  email: string | null
  website: string | null
  logo_url: string | null
  seal_url: string | null
  campus_image_url: string | null
  motto: string | null
  mission: string | null
  vision: string | null
  established_year: number | null
  principal_profile_id: string | null
  status: SchoolStatus
  created_at: string
  updated_at: string
}

export interface UpdateSchoolProfileInput {
  name: string
  udise_code?: string | null
  short_name?: string | null
  school_type?: SchoolType
  management_type?: ManagementType
  affiliation?: AffiliationBoard
  affiliation_number?: string | null
  recognition_number?: string | null
  registration_number?: string | null
  address?: string | null
  village_town_city?: string | null
  city?: string | null
  district?: string | null
  state?: string | null
  pin_code?: string | null
  country?: string
  phone?: string | null
  alternate_phone?: string | null
  email?: string | null
  website?: string | null
  logo_url?: string | null
  seal_url?: string | null
  campus_image_url?: string | null
  motto?: string | null
  mission?: string | null
  vision?: string | null
  established_year?: number | null
  status?: SchoolStatus
}
