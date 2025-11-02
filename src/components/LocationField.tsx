'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useGoogleMapsApi } from '@/lib/hooks/use-google-maps-api'

interface LocationData {
  street_address: string
  city: string
  state_province: string
  postal_code: string
  country: string
  formatted_address: string
  place_id: string
}

interface LocationFieldProps {
  value: Partial<LocationData>
  onChange: (location: Partial<LocationData>) => void
  placeholder?: string
  disabled?: boolean
}

export function LocationField({
  value,
  onChange,
  placeholder = 'Enter city, state, or country',
  disabled = false,
}: LocationFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isLoaded: isApiLoaded, error: apiError } = useGoogleMapsApi()

  useEffect(() => {
    if (apiError) {
      setError(apiError)
      return
    }

    // Wait for Google Maps API to load
    if (!isApiLoaded) {
      return
    }

    // Check if Google Maps API is loaded
    if (typeof google === 'undefined') {
      setError('Google Maps API not loaded')
      return
    }

    if (!inputRef.current) return

    try {
      // Initialize autocomplete with types (global, no country restrictions)
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['(regions)'],
      })

      autocompleteRef.current = autocomplete

      // Listen for place changes
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()

        if (!place.formatted_address) {
          setError('Please select a valid location from the dropdown')
          return
        }

        setError(null)

        // Extract location components from the place object
        const addressComponents = place.address_components || []
        const locationData: Partial<LocationData> = {
          formatted_address: place.formatted_address,
          place_id: place.place_id,
          street_address: '',
          city: '',
          state_province: '',
          postal_code: '',
          country: '',
        }

        // Parse address components
        addressComponents.forEach((component) => {
          const types = component.types
          if (types.includes('street_number') || types.includes('route')) {
            locationData.street_address = (locationData.street_address || '') + component.long_name
            if (types.includes('street_number')) {
              locationData.street_address = component.long_name + ' ' + locationData.street_address
            }
          } else if (types.includes('locality')) {
            locationData.city = component.long_name
          } else if (types.includes('administrative_area_level_1')) {
            locationData.state_province = component.short_name
          } else if (types.includes('postal_code')) {
            locationData.postal_code = component.long_name
          } else if (types.includes('country')) {
            locationData.country = component.long_name
          }
        })

        // Clean up street address
        if (locationData.street_address) {
          locationData.street_address = locationData.street_address.trim()
        }

        onChange(locationData)
      })
    } catch (err) {
      setError('Error initializing location search')
      console.error('Autocomplete error:', err)
    }
  }, [onChange, isApiLoaded, apiError])

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          disabled={disabled || isLoading}
          defaultValue={value.formatted_address || ''}
          onChange={(e) => {
            // Allow manual input, autocomplete will handle the rest
          }}
          className="w-full"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {/* Display parsed location components if available */}
      {value.formatted_address && (
        <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200 text-sm">
          <div className="space-y-1">
            {value.street_address && (
              <div>
                <span className="font-semibold text-gray-600">Address:</span> {value.street_address}
              </div>
            )}
            {value.city && (
              <div>
                <span className="font-semibold text-gray-600">City:</span> {value.city}
              </div>
            )}
            {value.state_province && (
              <div>
                <span className="font-semibold text-gray-600">State:</span> {value.state_province}
              </div>
            )}
            {value.postal_code && (
              <div>
                <span className="font-semibold text-gray-600">Postal Code:</span> {value.postal_code}
              </div>
            )}
            {value.country && (
              <div>
                <span className="font-semibold text-gray-600">Country:</span> {value.country}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
