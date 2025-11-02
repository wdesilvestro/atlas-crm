import { PersonOrganization } from './person'

export interface Organization {
  id: string
  user_id: string
  name: string
  website: string | null
  linkedin_url: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationWithDetails extends Organization {
  persons: PersonOrganization[]
}
