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
      leave_types: {
        Row: {
          id: string
          school_id: string
          code: string
          name: string
          applicant_category: string
          default_days_per_year: number
          requires_document: boolean
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          code: string
          name: string
          applicant_category?: string
          default_days_per_year?: number
          requires_document?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          code?: string
          name?: string
          applicant_category?: string
          default_days_per_year?: number
          requires_document?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      leave_applications: {
        Row: {
          id: string
          school_id: string
          academic_session_id: string
          applicant_profile_id: string
          applicant_role: string
          student_id: string | null
          leave_type_id: string
          start_date: string
          end_date: string
          duration_type: string
          calculated_days: number
          reason: string
          status: string
          document_path: string | null
          submitted_at: string
          reviewed_at: string | null
          approved_at: string | null
          cancelled_at: string | null
          rejection_reason: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          academic_session_id: string
          applicant_profile_id: string
          applicant_role: string
          student_id?: string | null
          leave_type_id: string
          start_date: string
          end_date: string
          duration_type?: string
          calculated_days: number
          reason: string
          status?: string
          document_path?: string | null
          submitted_at?: string
          reviewed_at?: string | null
          approved_at?: string | null
          cancelled_at?: string | null
          rejection_reason?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          academic_session_id?: string
          applicant_profile_id?: string
          applicant_role?: string
          student_id?: string | null
          leave_type_id?: string
          start_date?: string
          end_date?: string
          duration_type?: string
          calculated_days?: number
          reason?: string
          status?: string
          document_path?: string | null
          submitted_at?: string
          reviewed_at?: string | null
          approved_at?: string | null
          cancelled_at?: string | null
          rejection_reason?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      leave_approvals: {
        Row: {
          id: string
          school_id: string
          leave_application_id: string
          step_order: number
          approver_profile_id: string
          approver_role: string
          status: string
          comments: string | null
          acted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          leave_application_id: string
          step_order?: number
          approver_profile_id: string
          approver_role: string
          status?: string
          comments?: string | null
          acted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          leave_application_id?: string
          step_order?: number
          approver_profile_id?: string
          approver_role?: string
          status?: string
          comments?: string | null
          acted_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      leave_entitlements: {
        Row: {
          id: string
          school_id: string
          academic_session_id: string
          profile_id: string
          leave_type_id: string
          entitlement_days: number
          used_days: number
          remaining_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          academic_session_id: string
          profile_id: string
          leave_type_id: string
          entitlement_days?: number
          used_days?: number
          remaining_days?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          academic_session_id?: string
          profile_id?: string
          leave_type_id?: string
          entitlement_days?: number
          used_days?: number
          remaining_days?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          school_id: string
          recipient_profile_id: string
          actor_profile_id: string | null
          event_type: string
          title: string
          message: string
          link_url: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          recipient_profile_id: string
          actor_profile_id?: string | null
          event_type: string
          title: string
          message: string
          link_url?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          recipient_profile_id?: string
          actor_profile_id?: string | null
          event_type?: string
          title?: string
          message?: string
          link_url?: string | null
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      fee_heads: {
        Row: {
          id: string
          school_id: string
          code: string
          name: string
          description: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          code: string
          name: string
          description?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          code?: string
          name?: string
          description?: string | null
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      fee_structures: {
        Row: {
          id: string
          school_id: string
          academic_session_id: string
          class_id: string
          section_id: string | null
          name: string
          description: string | null
          version: number
          is_active: boolean
          effective_from: string
          effective_to: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          academic_session_id: string
          class_id: string
          section_id?: string | null
          name: string
          description?: string | null
          version?: number
          is_active?: boolean
          effective_from: string
          effective_to?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          academic_session_id?: string
          class_id?: string
          section_id?: string | null
          name?: string
          description?: string | null
          version?: number
          is_active?: boolean
          effective_from?: string
          effective_to?: string | null
          created_at?: string
        }
        Relationships: []
      }
      fee_structure_items: {
        Row: {
          id: string
          school_id: string
          fee_structure_id: string
          fee_head_id: string
          amount: number
          frequency: string
          due_day: number | null
          is_mandatory: boolean
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          fee_structure_id: string
          fee_head_id: string
          amount: number
          frequency: string
          due_day?: number | null
          is_mandatory?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          fee_structure_id?: string
          fee_head_id?: string
          amount?: number
          frequency?: string
          due_day?: number | null
          is_mandatory?: boolean
          created_at?: string
        }
        Relationships: []
      }
      student_fee_assignments: {
        Row: {
          id: string
          school_id: string
          academic_session_id: string
          student_id: string
          fee_structure_id: string
          assigned_at: string
        }
        Insert: {
          id?: string
          school_id: string
          academic_session_id: string
          student_id: string
          fee_structure_id: string
          assigned_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          academic_session_id?: string
          student_id?: string
          fee_structure_id?: string
          assigned_at?: string
        }
        Relationships: []
      }
      student_concessions: {
        Row: {
          id: string
          school_id: string
          academic_session_id: string
          student_id: string
          fee_head_id: string | null
          concession_type: string
          value: number
          reason: string
          approved_by: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          academic_session_id: string
          student_id: string
          fee_head_id?: string | null
          concession_type: string
          value: number
          reason: string
          approved_by?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          academic_session_id?: string
          student_id?: string
          fee_head_id?: string | null
          concession_type?: string
          value?: number
          reason?: string
          approved_by?: string | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          school_id: string
          academic_session_id: string
          student_id: string
          invoice_number: string
          issue_date: string
          due_date: string
          gross_amount: number
          discount_amount: number
          concession_amount: number
          late_fee_amount: number
          previous_balance_amount: number
          net_amount: number
          paid_amount: number
          outstanding_amount: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          academic_session_id: string
          student_id: string
          invoice_number: string
          issue_date: string
          due_date: string
          gross_amount: number
          discount_amount?: number
          concession_amount?: number
          late_fee_amount?: number
          previous_balance_amount?: number
          net_amount: number
          paid_amount?: number
          outstanding_amount: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          academic_session_id?: string
          student_id?: string
          invoice_number?: string
          issue_date?: string
          due_date?: string
          gross_amount?: number
          discount_amount?: number
          concession_amount?: number
          late_fee_amount?: number
          previous_balance_amount?: number
          net_amount?: number
          paid_amount?: number
          outstanding_amount?: number
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          id: string
          school_id: string
          invoice_id: string
          fee_head_id: string
          description: string
          amount: number
          discount_amount: number
          net_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          invoice_id: string
          fee_head_id: string
          description: string
          amount: number
          discount_amount?: number
          net_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          invoice_id?: string
          fee_head_id?: string
          description?: string
          amount?: number
          discount_amount?: number
          net_amount?: number
          created_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          school_id: string
          academic_session_id: string
          student_id: string
          payment_number: string
          payment_date: string
          payment_method: string
          amount: number
          currency: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          transaction_reference: string | null
          cheque_number: string | null
          bank_name: string | null
          status: string
          received_by: string | null
          verified_by: string | null
          verified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          academic_session_id: string
          student_id: string
          payment_number: string
          payment_date: string
          payment_method: string
          amount: number
          currency?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          transaction_reference?: string | null
          cheque_number?: string | null
          bank_name?: string | null
          status?: string
          received_by?: string | null
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          academic_session_id?: string
          student_id?: string
          payment_number?: string
          payment_date?: string
          payment_method?: string
          amount?: number
          currency?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          transaction_reference?: string | null
          cheque_number?: string | null
          bank_name?: string | null
          status?: string
          received_by?: string | null
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      payment_allocations: {
        Row: {
          id: string
          school_id: string
          payment_id: string
          invoice_id: string
          amount: number
          allocated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          payment_id: string
          invoice_id: string
          amount: number
          allocated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          payment_id?: string
          invoice_id?: string
          amount?: number
          allocated_at?: string
        }
        Relationships: []
      }
      financial_ledger: {
        Row: {
          id: string
          school_id: string
          academic_session_id: string
          student_id: string
          invoice_id: string | null
          payment_id: string | null
          transaction_type: string
          amount: number
          running_balance: number
          description: string
          actor_profile_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          academic_session_id: string
          student_id: string
          invoice_id?: string | null
          payment_id?: string | null
          transaction_type: string
          amount: number
          running_balance?: number
          description: string
          actor_profile_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          academic_session_id?: string
          student_id?: string
          invoice_id?: string | null
          payment_id?: string | null
          transaction_type?: string
          amount?: number
          running_balance?: number
          description?: string
          actor_profile_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          id: string
          school_id: string
          payment_id: string
          student_id: string
          refund_number: string
          amount: number
          reason: string
          status: string
          requested_by: string
          approved_by: string | null
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          payment_id: string
          student_id: string
          refund_number: string
          amount: number
          reason: string
          status?: string
          requested_by: string
          approved_by?: string | null
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          payment_id?: string
          student_id?: string
          refund_number?: string
          amount?: number
          reason?: string
          status?: string
          requested_by?: string
          approved_by?: string | null
          processed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      adjustments: {
        Row: {
          id: string
          school_id: string
          invoice_id: string
          student_id: string
          adjustment_type: string
          amount: number
          reason: string
          actor_profile_id: string
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          invoice_id: string
          student_id: string
          adjustment_type: string
          amount: number
          reason: string
          actor_profile_id: string
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          invoice_id?: string
          student_id?: string
          adjustment_type?: string
          amount?: number
          reason?: string
          actor_profile_id?: string
          created_at?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          id: string
          school_id: string
          payment_id: string
          receipt_number: string
          issue_date: string
          pdf_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          payment_id: string
          receipt_number: string
          issue_date: string
          pdf_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          payment_id?: string
          receipt_number?: string
          issue_date?: string
          pdf_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      financial_clearance: {
        Row: {
          id: string
          school_id: string
          academic_session_id: string
          student_id: string
          status: string
          total_outstanding: number
          calculated_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          academic_session_id: string
          student_id: string
          status?: string
          total_outstanding?: number
          calculated_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          academic_session_id?: string
          student_id?: string
          status?: string
          total_outstanding?: number
          calculated_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          id: string
          school_id: string
          event_type: string
          external_event_id: string
          payload: Json
          processed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          event_type: string
          external_event_id: string
          payload?: Json
          processed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          event_type?: string
          external_event_id?: string
          payload?: Json
          processed_at?: string
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
