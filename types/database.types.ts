export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type CallDisposition =
  | 'answered'
  | 'no_answer'
  | 'busy'
  | 'voicemail'
  | 'other'

export interface Database {
  public: {
    Tables: {
      calls: {
        Row: {
          id: string
          user_id: string
          disposition: CallDisposition
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          disposition: CallDisposition
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          disposition?: CallDisposition
          created_at?: string
        }
      }
    }
  }
}

