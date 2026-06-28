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
      institutes: {
        Row: {
          id: string
          name: string
          subdomain: string | null
          plan: string
          status: string
          whatsapp_token: string | null
          whatsapp_phone_id: string | null
          join_code: string | null
          webhook_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subdomain?: string | null
          plan?: string
          status?: string
          whatsapp_token?: string | null
          whatsapp_phone_id?: string | null
          join_code?: string | null
          webhook_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          subdomain?: string | null
          plan?: string
          status?: string
          whatsapp_token?: string | null
          whatsapp_phone_id?: string | null
          join_code?: string | null
          webhook_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users_profile: {
        Row: {
          id: string
          institute_id: string | null
          email: string
          password_hash: string
          role: string
          name: string
          phone: string | null
          guardian_name: string | null
          guardian_phone: string | null
          student_id: string | null
          fee_status: string | null
          is_active: boolean
          requires_password_change: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institute_id?: string | null
          email: string
          password_hash: string
          role: string
          name: string
          phone?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          student_id?: string | null
          fee_status?: string | null
          is_active?: boolean
          requires_password_change?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institute_id?: string | null
          email?: string
          password_hash?: string
          role?: string
          name?: string
          phone?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          student_id?: string | null
          fee_status?: string | null
          is_active?: boolean
          requires_password_change?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      batches: {
        Row: {
          id: string
          institute_id: string
          name: string
          subject: string
          schedule: string
          capacity: number
          teacher_id: string | null
          join_code: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institute_id: string
          name: string
          subject: string
          schedule: string
          capacity?: number
          teacher_id?: string | null
          join_code?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institute_id?: string
          name?: string
          subject?: string
          schedule?: string
          capacity?: number
          teacher_id?: string | null
          join_code?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      batch_students: {
        Row: {
          batch_id: string
          student_id: string
          created_at: string
        }
        Insert: {
          batch_id: string
          student_id: string
          created_at?: string
        }
        Update: {
          batch_id?: string
          student_id?: string
          created_at?: string
        }
      }
      exams: {
        Row: {
          id: string
          institute_id: string
          batch_id: string
          name: string
          max_marks: number
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institute_id: string
          batch_id: string
          name: string
          max_marks: number
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institute_id?: string
          batch_id?: string
          name?: string
          max_marks?: number
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      marks: {
        Row: {
          id: string
          exam_id: string
          student_id: string
          score: string
          marked_by_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          student_id: string
          score: string
          marked_by_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          student_id?: string
          score?: string
          marked_by_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          institute_id: string
          batch_id: string
          student_id: string
          date: string
          status: string
          marked_by_id: string
          created_at: string
        }
        Insert: {
          id?: string
          institute_id: string
          batch_id: string
          student_id: string
          date: string
          status: string
          marked_by_id: string
          created_at?: string
        }
        Update: {
          id?: string
          institute_id?: string
          batch_id?: string
          student_id?: string
          date?: string
          status?: string
          marked_by_id?: string
          created_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          institute_id: string
          batch_id: string | null
          title: string
          body: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institute_id: string
          batch_id?: string | null
          title: string
          body: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institute_id?: string
          batch_id?: string | null
          title?: string
          body?: string
          created_at?: string
          updated_at?: string
        }
      }
      fee_payments: {
        Row: {
          id: string
          student_id: string
          institute_id: string
          amount: number
          status: string
          period_month: string
          payment_method: string
          transaction_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          institute_id: string
          amount: number
          status: string
          period_month: string
          payment_method: string
          transaction_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          institute_id?: string
          amount?: number
          status?: string
          period_month?: string
          payment_method?: string
          transaction_id?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          institute_id: string
          amount: number
          status: string
          period_month: string
          transaction_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          institute_id: string
          amount: number
          status: string
          period_month: string
          transaction_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          institute_id?: string
          amount?: number
          status?: string
          period_month?: string
          transaction_id?: string | null
          created_at?: string
        }
      }
      invite_codes: {
        Row: {
          id: string
          institute_id: string
          code: string
          role: string
          max_uses: number
          uses: number
          expires_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          institute_id: string
          code: string
          role: string
          max_uses?: number
          uses?: number
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          institute_id?: string
          code?: string
          role?: string
          max_uses?: number
          uses?: number
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      password_reset_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          expires_at?: string
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          institute_id: string
          user_id: string
          action: string
          entity: string
          entity_id: string | null
          details: string | null
          created_at: string
        }
        Insert: {
          id?: string
          institute_id: string
          user_id: string
          action: string
          entity: string
          entity_id?: string | null
          details?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          institute_id?: string
          user_id?: string
          action?: string
          entity?: string
          entity_id?: string | null
          details?: string | null
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          institute_id: string
          student_id: string
          status: string
          due_date: string
          total_amount: number
          items_json: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institute_id: string
          student_id: string
          status: string
          due_date: string
          total_amount: number
          items_json: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institute_id?: string
          student_id?: string
          status?: string
          due_date?: string
          total_amount?: number
          items_json?: string
          created_at?: string
          updated_at?: string
        }
      }
      notification_queue: {
        Row: {
          id: string
          institute_id: string
          recipient: string
          type: string
          payload: string
          status: string
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institute_id: string
          recipient: string
          type: string
          payload: string
          status?: string
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institute_id?: string
          recipient?: string
          type?: string
          payload?: string
          status?: string
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      whatsapp_logs: {
        Row: {
          id: string
          institute_id: string | null
          recipient: string
          status: string
          message_type: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          institute_id?: string | null
          recipient: string
          status: string
          message_type?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          institute_id?: string | null
          recipient?: string
          status?: string
          message_type?: string | null
          error_message?: string | null
          created_at?: string
        }
      }
    }
  }
}
