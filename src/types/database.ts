export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string
          name: string
          code: string
          address: string | null
          city: string | null
          state: string | null
          country: string
          phone: string | null
          email: string | null
          website: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      school_settings: {
        Row: {
          id: string
          school_id: string
          key: string
          value: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          key: string
          value?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          key?: string
          value?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      academic_sessions: {
        Row: {
          id: string
          school_id: string
          name: string
          start_date: string
          end_date: string
          is_current: boolean
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          start_date: string
          end_date: string
          is_current?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          name?: string
          start_date?: string
          end_date?: string
          is_current?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          school_id: string
          name: string
          display_order: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          display_order: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          name?: string
          display_order?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      sections: {
        Row: {
          id: string
          school_id: string
          class_id: string
          name: string
          capacity: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          class_id: string
          name: string
          capacity?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          class_id?: string
          name?: string
          capacity?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          school_id: string
          name: string
          code: string
          display_order: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          code: string
          display_order?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          name?: string
          code?: string
          display_order?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      class_subjects: {
        Row: {
          id: string
          school_id: string
          class_id: string
          subject_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          class_id: string
          subject_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          class_id?: string
          subject_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          auth_user_id: string
          school_id: string | null
          full_name: string
          phone: string | null
          avatar_url: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          school_id?: string | null
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          school_id?: string | null
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          profile_id: string
          role_id: string
          school_id: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          role_id: string
          school_id: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          role_id?: string
          school_id?: string
          created_at?: string
        }
      }
      guardians: {
        Row: {
          id: string
          school_id: string
          profile_id: string | null
          full_name: string
          relationship: string | null
          phone: string | null
          alternate_phone: string | null
          email: string | null
          address: string | null
          occupation: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          profile_id?: string | null
          full_name: string
          relationship?: string | null
          phone?: string | null
          alternate_phone?: string | null
          email?: string | null
          address?: string | null
          occupation?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          profile_id?: string | null
          full_name?: string
          relationship?: string | null
          phone?: string | null
          alternate_phone?: string | null
          email?: string | null
          address?: string | null
          occupation?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          school_id: string
          profile_id: string | null
          admission_number: string
          roll_number: string | null
          first_name: string
          middle_name: string | null
          last_name: string
          date_of_birth: string | null
          gender: string | null
          photo_url: string | null
          phone: string | null
          email: string | null
          address: string | null
          city: string | null
          state: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          profile_id?: string | null
          admission_number: string
          roll_number?: string | null
          first_name: string
          middle_name?: string | null
          last_name: string
          date_of_birth?: string | null
          gender?: string | null
          photo_url?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          profile_id?: string | null
          admission_number?: string
          roll_number?: string | null
          first_name?: string
          middle_name?: string | null
          last_name?: string
          date_of_birth?: string | null
          gender?: string | null
          photo_url?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      student_guardians: {
        Row: {
          id: string
          student_id: string
          guardian_id: string
          school_id: string
          relationship: string
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          guardian_id: string
          school_id: string
          relationship: string
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          guardian_id?: string
          school_id?: string
          relationship?: string
          is_primary?: boolean
          created_at?: string
        }
      }
      student_academic_history: {
        Row: {
          id: string
          student_id: string
          academic_session_id: string
          class_id: string
          section_id: string
          school_id: string
          roll_number: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          academic_session_id: string
          class_id: string
          section_id: string
          school_id: string
          roll_number?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          academic_session_id?: string
          class_id?: string
          section_id?: string
          school_id?: string
          roll_number?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      student_documents: {
        Row: {
          id: string
          student_id: string
          document_type: string
          file_path: string
          file_name: string
          mime_type: string | null
          file_size: number | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          document_type: string
          file_path: string
          file_name: string
          mime_type?: string | null
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          document_type?: string
          file_path?: string
          file_name?: string
          mime_type?: string | null
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          school_id: string | null
          actor_profile_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          old_data: Json | null
          new_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id?: string | null
          actor_profile_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string | null
          actor_profile_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
      }
    }
    Functions: {
      get_current_profile_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_current_school_id: {
        Args: Record<string, never>
        Returns: string
      }
      has_role: {
        Args: { role_name: string }
        Returns: boolean
      }
      has_any_role: {
        Args: { role_names: string[] }
        Returns: boolean
      }
      is_guardian_of_student: {
        Args: { p_student_id: string }
        Returns: boolean
      }
    }
  }
}
