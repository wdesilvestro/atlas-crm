import { useEffect, useState } from 'react'

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

let scriptLoaded = false
let scriptLoading = false
let loadedResolve: (() => void) | null = null

export function useGoogleMapsApi() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Skip if no API key is set
    if (!API_KEY || API_KEY === 'your_google_maps_api_key_here') {
      setError(
        'Google Maps API key not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local',
      )
      return
    }

    // If already loaded, just set the state
    if (scriptLoaded) {
      setIsLoaded(true)
      return
    }

    // If currently loading, wait for it
    if (scriptLoading) {
      const promise = new Promise<void>((resolve) => {
        loadedResolve = resolve
      })
      promise.then(() => setIsLoaded(true))
      return
    }

    // Start loading
    scriptLoading = true

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`
    script.async = true
    script.defer = true

    script.onload = () => {
      scriptLoaded = true
      scriptLoading = false
      setIsLoaded(true)
      if (loadedResolve) {
        loadedResolve()
        loadedResolve = null
      }
    }

    script.onerror = () => {
      scriptLoading = false
      setError('Failed to load Google Maps API')
    }

    document.head.appendChild(script)
  }, [])

  return { isLoaded, error }
}
