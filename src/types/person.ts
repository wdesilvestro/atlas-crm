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

export interface RelationshipOwner {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Person {
  id: string
  user_id: string
  first_name: string
  last_name: string
  linkedin_url: string | null
  photo: string | null
  street_address: string | null
  city: string | null
  state_province: string | null
  postal_code: string | null
  country: string | null
  formatted_address: string | null
  place_id: string | null
  status: 'Active' | 'Inactive'
  notes: string | null
  relationship_owner_id: string | null
  created_at: string
  updated_at: string
  tags?: PersonTag[]
  relationship_owner?: RelationshipOwner
  todos?: any[] // Array of todos associated with this person
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
  | 'linkedin_connection_request_accepted'
  | 'linkedin_message_sent'
  | 'linkedin_message_received'
  | 'email_sent'
  | 'email_received'
  | 'meeting'

// Additional data schema for each action type
export interface LinkedInConnectionRequestSentData {
  message?: string
}

export interface LinkedInConnectionRequestRetractedData {}

export interface LinkedInConnectionRequestAcceptedData {}

export interface LinkedInMessageSentData {
  message: string
}

export interface LinkedInMessageReceivedData {
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

export interface MeetingData {
  meeting_name: string
}

export type ActionAdditionalData =
  | LinkedInConnectionRequestSentData
  | LinkedInConnectionRequestRetractedData
  | LinkedInConnectionRequestAcceptedData
  | LinkedInMessageSentData
  | LinkedInMessageReceivedData
  | EmailSentData
  | EmailReceivedData
  | MeetingData

export interface PersonAction {
  id: string
  person_id: string
  user_id: string
  user_email?: string // Email of the user who logged the action
  user_display_name?: string // Custom display name of the user who logged the action
  action_type: ActionType
  occurred_at: string
  additional_data: ActionAdditionalData
  created_at: string
  updated_at: string
}

export interface UserDisplayName {
  id: string
  user_id: string
  display_name: string
  created_at: string
  updated_at: string
}
