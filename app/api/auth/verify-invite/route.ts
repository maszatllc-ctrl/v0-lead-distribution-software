import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const inviteCode = searchParams.get('code')

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      )
    }

    const seller = await prisma.seller.findUnique({
      where: { inviteCode },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!seller) {
      return NextResponse.json(
        { valid: false, error: 'Invalid invite code' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        valid: true,
        seller: {
          companyName: seller.companyName,
          contactName: seller.user.name,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Verify invite error:', error)
    return NextResponse.json(
      { error: 'An error occurred while verifying invite code' },
      { status: 500 }
    )
  }
}
