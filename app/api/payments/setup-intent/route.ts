import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { createSetupIntent, createStripeCustomer } from '@/lib/stripe'
import { UserRole } from '@prisma/client'

// POST /api/payments/setup-intent - Create setup intent for adding payment method
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== UserRole.BUYER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buyer = await prisma.buyer.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
      },
    })

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    // Create Stripe customer if doesn't exist
    let stripeCustomerId = buyer.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await createStripeCustomer(
        buyer.user.email,
        buyer.user.name || buyer.companyName,
        {
          buyerId: buyer.id,
          userId: buyer.userId,
        }
      )
      stripeCustomerId = customer.id

      await prisma.buyer.update({
        where: { id: buyer.id },
        data: { stripeCustomerId },
      })
    }

    const setupIntent = await createSetupIntent(stripeCustomerId)

    return NextResponse.json(
      {
        clientSecret: setupIntent.client_secret,
        customerId: stripeCustomerId,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Create setup intent error:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating setup intent' },
      { status: 500 }
    )
  }
}
