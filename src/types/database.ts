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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "school_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "academic_sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "sections_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "class_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "user_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "guardians_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardians_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "student_guardians_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "student_academic_history_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_academic_history_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_academic_history_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_academic_history_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_academic_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      admission_applications: {
        Row: {
          id: string
          school_id: string
          academic_session_id: string
          application_number: string
          applicant_first_name: string
          applicant_middle_name: string | null
          applicant_last_name: string
          date_of_birth: string | null
          gender: string | null
          applying_for_class_id: string
          guardian_name: string
          guardian_phone: string
          guardian_email: string | null
          address: string | null
          city: string | null
          state: string | null
          source: string | null
          notes: string | null
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          approved_at: string | null
          rejected_at: string | null
          converted_at: string | null
          converted_student_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          academic_session_id: string
          application_number: string
          applicant_first_name: string
          applicant_middle_name?: string | null
          applicant_last_name: string
          date_of_birth?: string | null
          gender?: string | null
          applying_for_class_id: string
          guardian_name: string
          guardian_phone: string
          guardian_email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          source?: string | null
          notes?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          converted_at?: string | null
          converted_student_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          academic_session_id?: string
          application_number?: string
          applicant_first_name?: string
          applicant_middle_name?: string | null
          applicant_last_name?: string
          date_of_birth?: string | null
          gender?: string | null
          applying_for_class_id?: string
          guardian_name?: string
          guardian_phone?: string
          guardian_email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          source?: string | null
          notes?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          converted_at?: string | null
          converted_student_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admission_applications_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_applications_applying_for_class_id_fkey"
            columns: ["applying_for_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_applications_converted_student_id_fkey"
            columns: ["converted_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_applications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          }
        ]
      }
      teacher_assignments: {
        Row: {
          id: string
          school_id: string
          teacher_profile_id: string
          academic_session_id: string
          class_id: string
          section_id: string
          assigned_at: string
          assigned_by: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          teacher_profile_id: string
          academic_session_id: string
          class_id: string
          section_id: string
          assigned_at?: string
          assigned_by?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          teacher_profile_id?: string
          academic_session_id?: string
          class_id?: string
          section_id?: string
          assigned_at?: string
          assigned_by?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance_sessions: {
        Row: {
          id: string
          school_id: string
          academic_session_id: string
          class_id: string
          section_id: string
          attendance_date: string
          status: string
          marked_by: string
          marked_at: string
          locked_at: string | null
          locked_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          academic_session_id: string
          class_id: string
          section_id: string
          attendance_date: string
          status?: string
          marked_by: string
          marked_at?: string
          locked_at?: string | null
          locked_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          academic_session_id?: string
          class_id?: string
          section_id?: string
          attendance_date?: string
          status?: string
          marked_by?: string
          marked_at?: string
          locked_at?: string | null
          locked_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          id: string
          school_id: string
          academic_session_id: string
          session_id: string
          student_id: string
          class_id: string
          section_id: string
          attendance_date: string
          status: string
          remarks: string | null
          marked_by: string
          marked_at: string
          updated_by: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          academic_session_id: string
          session_id: string
          student_id: string
          class_id: string
          section_id: string
          attendance_date: string
          status: string
          remarks?: string | null
          marked_by: string
          marked_at?: string
          updated_by?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          academic_session_id?: string
          session_id?: string
          student_id?: string
          class_id?: string
          section_id?: string
          attendance_date?: string
          status?: string
          remarks?: string | null
          marked_by?: string
          marked_at?: string
          updated_by?: string | null
          updated_at?: string
          created_at?: string
        }
        Relationships: []
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
      generate_application_number: {
        Args: { p_school_id: string; p_session_id: string }
        Returns: string
      }
      generate_admission_number: {
        Args: { p_school_id: string }
        Returns: string
      }
      convert_admission_application: {
        Args: {
          p_application_id: string
          p_section_id: string
          p_roll_number?: string | null
          p_admission_number?: string | null
        }
        Returns: string
      }
    }
  }
}
