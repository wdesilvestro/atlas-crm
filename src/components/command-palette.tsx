'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  UsersIcon,
  Building2,
  UserCheck,
  UserCog,
  TagsIcon,
  Search,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { usePersons } from '@/lib/hooks/use-persons'
import { useOrganizations } from '@/lib/hooks/use-organizations'
import Photo from '@/components/Photo'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

const navItems = [
  {
    title: 'Persons',
    url: '/persons',
    icon: UsersIcon,
  },
  {
    title: 'Organizations',
    url: '/organizations',
    icon: Building2,
  },
  {
    title: 'Relationship Owners',
    url: '/relationship-owners',
    icon: UserCheck,
  },
  {
    title: 'Users',
    url: '/users',
    icon: UserCog,
  },
  {
    title: 'Person Tags',
    url: '/tags#person-tags',
    icon: TagsIcon,
  },
  {
    title: 'Organization Tags',
    url: '/tags#org-tags',
    icon: TagsIcon,
  },
]

interface PersonWithOrganization {
  id: string
  first_name: string
  last_name: string
  photo: string | null
  organization_name?: string
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { persons } = usePersons()
  const { organizations } = useOrganizations()
  const [personsWithOrgs, setPersonsWithOrgs] = useState<PersonWithOrganization[]>([])

  // Fetch organization names for persons
  useEffect(() => {
    const fetchPersonOrganizations = async () => {
      if (!persons || persons.length === 0) {
        setPersonsWithOrgs([])
        return
      }

      const personIds = persons.map((p) => p.id)

      // Fetch organization links with organization names
      const { data: orgLinks } = await supabase
        .from('person_organization')
        .select('person_id, organization:organization_id(name)')
        .in('person_id', personIds)

      // Create a map of person_id to organization name
      const orgMap = new Map<string, string>()
      if (orgLinks) {
        orgLinks.forEach((link: any) => {
          if (link.organization && !orgMap.has(link.person_id)) {
            orgMap.set(link.person_id, link.organization.name)
          }
        })
      }

      // Combine persons with their organization names
      const personsWithOrgData = persons.map((person) => ({
        id: person.id,
        first_name: person.first_name,
        last_name: person.last_name,
        photo: person.photo,
        organization_name: orgMap.get(person.id),
      }))

      setPersonsWithOrgs(personsWithOrgData)
    }

    fetchPersonOrganizations()
  }, [persons])

  // Register keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = (url: string) => {
    setOpen(false)
    router.push(url)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search for navigation, persons, or organizations..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Navigation Section */}
        <CommandGroup heading="Navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <CommandItem
                key={item.url}
                value={item.title}
                onSelect={() => handleSelect(item.url)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Persons Section */}
        <CommandGroup heading="Persons">
          {personsWithOrgs.slice(0, 50).map((person) => (
            <CommandItem
              key={person.id}
              value={`${person.first_name} ${person.last_name}`}
              onSelect={() => handleSelect(`/persons/${person.id}`)}
              className="flex items-center gap-3"
            >
              <Photo
                src={person.photo}
                alt={`${person.first_name} ${person.last_name}`}
                variant="circular"
                size="sm"
                type="person"
              />
              <div className="flex flex-col">
                <span className="font-medium">
                  {person.first_name} {person.last_name}
                </span>
                {person.organization_name && (
                  <span className="text-xs text-muted-foreground">
                    {person.organization_name}
                  </span>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Organizations Section */}
        <CommandGroup heading="Organizations">
          {organizations.slice(0, 50).map((org) => (
            <CommandItem
              key={org.id}
              value={org.name}
              onSelect={() => handleSelect(`/organizations/${org.id}`)}
              className="flex items-center gap-3"
            >
              <Photo
                src={org.photo}
                alt={org.name}
                variant="horizontal"
                size="sm"
                type="organization"
              />
              <div className="flex flex-col">
                <span className="font-medium">{org.name}</span>
                {org.website && (
                  <span className="text-xs text-muted-foreground">
                    {org.website}
                  </span>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
