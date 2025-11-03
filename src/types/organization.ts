import { PersonOrganization } from './person'

export interface OrganizationTag {
  id: string
  name: string
  object_type: 'organization'
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

export interface Organization {
  id: string
  user_id: string
  name: string
  website: string | null
  linkedin_url: string | null
  status: 'Active' | 'Inactive'
  notes: string | null
  relationship_owner_id: string | null
  created_at: string
  updated_at: string
  tags?: OrganizationTag[]
  relationship_owner?: RelationshipOwner
}

export interface OrganizationWithDetails extends Organization {
  persons: PersonOrganization[]
}
