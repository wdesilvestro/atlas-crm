import { NextRequest, NextResponse } from 'next/server'
import { scrapeLinkedInCompany } from '@/lib/linkedin-scraper'

export async function POST(request: NextRequest) {
  try {
    const { linkedinUrl } = await request.json()

    if (!linkedinUrl) {
      return NextResponse.json(
        { error: 'LinkedIn URL is required' },
        { status: 400 }
      )
    }

    if (!linkedinUrl.includes('linkedin.com/company/')) {
      return NextResponse.json(
        { error: 'Invalid LinkedIn company URL' },
        { status: 400 }
      )
    }

    const data = await scrapeLinkedInCompany(linkedinUrl)

    // Log extracted data for debugging
    console.log('Extracted LinkedIn data:', {
      name: data.name,
      website: data.website,
      description: data.description ? `${data.description.substring(0, 50)}...` : 'Not found',
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error scraping LinkedIn:', error)
    return NextResponse.json(
      { error: 'Failed to fetch LinkedIn data' },
      { status: 500 }
    )
  }
}
