/**
 * LinkedIn Company Profile Scraper
 * Extracts company information from LinkedIn company pages
 */

export interface LinkedInCompanyData {
  name: string | null
  website: string | null
  description: string | null
}

/**
 * Scrapes a LinkedIn company profile page and extracts relevant data
 * @param linkedinUrl - The LinkedIn company profile URL
 * @returns Extracted company data
 */
export async function scrapeLinkedInCompany(
  linkedinUrl: string
): Promise<LinkedInCompanyData> {
  try {
    // Validate URL
    if (!linkedinUrl.includes('linkedin.com/company/')) {
      throw new Error('Invalid LinkedIn company URL')
    }

    // Fetch the page using a simple fetch (LinkedIn pages are public)
    const response = await fetch(linkedinUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch LinkedIn page')
    }

    const html = await response.text()

    // Extract data from HTML
    const data: LinkedInCompanyData = {
      name: extractName(html),
      website: extractWebsite(html),
      description: extractDescription(html),
    }

    return data
  } catch (error) {
    console.error('Error scraping LinkedIn:', error)
    throw error
  }
}

/**
 * Extract company name from HTML
 * Looks for og:title meta tag and removes " | LinkedIn" suffix
 */
function extractName(html: string): string | null {
  const ogTitleMatch = html.match(
    /<meta property="og:title" content="([^"]+)">/
  )
  if (ogTitleMatch) {
    // Remove " | LinkedIn" suffix
    return ogTitleMatch[1].replace(/\s*\|\s*LinkedIn\s*$/, '').trim()
  }
  return null
}

/**
 * Extract company website from HTML
 * Looks for the website link in the about section
 */
function extractWebsite(html: string): string | null {
  // Look for website in the structured data
  const websiteMatch = html.match(
    /data-test-id="about-us__website"[^>]*>[\s\S]*?href="([^"]+)"/
  )
  if (websiteMatch) {
    // This might be a LinkedIn redirect URL, extract the actual URL
    const url = websiteMatch[1]
    const urlMatch = url.match(/url=([^&]+)/)
    if (urlMatch) {
      return decodeURIComponent(urlMatch[1])
    }
    return url
  }
  return null
}

/**
 * Extract company description from HTML
 * Looks for meta description tag and removes LinkedIn metadata
 */
function extractDescription(html: string): string | null {
  const descMatch = html.match(
    /<meta name="description" content="([^"]+)">/
  )
  if (descMatch) {
    let description = descMatch[1]
    // Remove the "X followers on LinkedIn. " prefix
    description = description.replace(/^[^|]*\|\s*[\d,]+\s+followers on LinkedIn\.\s*/, '')
    return description.trim()
  }
  return null
}
