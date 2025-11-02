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
  created_at: string
  updated_at: string
}

export interface PersonWithDetails extends Person {
  emails: PersonEmail[]
  phones: PersonPhone[]
  organizations: PersonOrganization[]
}
