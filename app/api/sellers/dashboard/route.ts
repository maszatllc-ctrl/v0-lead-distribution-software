import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { UserRole } from '@prisma/client'

// POST /api/sellers/dashboard - Create Stripe dashboard login link
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== UserRole.SELLER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    if (!seller.stripeAccountId) {
      return NextResponse.json(
        { error: 'No Stripe account connected' },
        { status: 400 }
      )
    }

    // Create login link
    const loginLink = await stripe.accounts.createLoginLink(seller.stripeAccountId)

    return NextResponse.json(
      {
        url: loginLink.url,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Create dashboard link error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while creating dashboard link' },
      { status: 500 }
    )
  }
}
