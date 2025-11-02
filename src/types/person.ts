export interface PersonEmail {
  id: string
  person_id: string
  email: string
  is_primary: boolean
  created_at: string
}

export interface PersonPhone {
  id: string
  person_id: string
  phone_number: string
  is_primary: boolean
  created_at: string
}

export interface PersonOrganization {
  id: string
  person_id: string
  organization_id: string
  role: string
  created_at: string
  updated_at: string
}

export interface PersonTag {
  id: string
  name: string
  object_type: 'person'
  user_id: string
  created_at: string
  updated_at: string
}

export interface Person {
  id: string
  user_id: string
  first_name: string
  last_name: string
  linkedin_url: string | null
  street_address: string | null
  city: string | null
  state_province: string | null
  postal_code: string | null
  country: string | null
  formatted_address: string | null
  place_id: string | null
  status: 'Active' | 'Inactive'
  created_at: string
  updated_at: string
  tags?: PersonTag[]
}

export interface PersonWithDetails extends Person {
  emails: PersonEmail[]
  phones: PersonPhone[]
  organizations: PersonOrganization[]
}

// Action Types and Interfaces
export type ActionType =
  | 'linkedin_connection_request_sent'
  | 'linkedin_connection_request_retracted'
  | 'linkedin_message_sent'
  | 'email_sent'
  | 'email_received'

// Additional data schema for each action type
export interface LinkedInConnectionRequestSentData {
  message?: string
}

export interface LinkedInConnectionRequestRetractedData {}

export interface LinkedInMessageSentData {
  message: string
}

export interface EmailSentData {
  subject: string
  body: string
}

export interface EmailReceivedData {
  subject: string
  body: string
}

export type ActionAdditionalData =
  | LinkedInConnectionRequestSentData
  | LinkedInConnectionRequestRetractedData
  | LinkedInMessageSentData
  | EmailSentData
  | EmailReceivedData

export interface PersonAction {
  id: string
  person_id: string
  user_id: string
  action_type: ActionType
  occurred_at: string
  additional_data: ActionAdditionalData
  created_at: string
  updated_at: string
}
