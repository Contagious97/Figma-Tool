import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isValidFigmaTokenFormat } from '@/lib/encryption'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { token } = await req.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Validate token format (Figma tokens start with figd_)
    if (!isValidFigmaTokenFormat(token)) {
      return NextResponse.json(
        { error: 'Invalid token format. Figma tokens start with "figd_"' },
        { status: 400 }
      )
    }

    // Validate with Figma API
    const response = await fetch('https://api.figma.com/v1/me', {
      headers: {
        'X-Figma-Token': token,
      },
    })

    if (!response.ok) {
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'Invalid token. Please check and try again.' },
          { status: 403 }
        )
      }
      throw new Error('Figma API error')
    }

    const user = await response.json()

    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
      },
    })
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate token with Figma' },
      { status: 500 }
    )
  }
}
