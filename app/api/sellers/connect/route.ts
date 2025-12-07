import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { createConnectedAccount, createAccountLink } from '@/lib/stripe'
import { UserRole } from '@prisma/client'

// POST /api/sellers/connect - Create Stripe Connect account for seller
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== UserRole.SELLER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
      },
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Check if already has Stripe account
    if (seller.stripeAccountId) {
      // Check if onboarding is complete
      if (seller.stripeOnboardingComplete) {
        return NextResponse.json(
          { error: 'Stripe account already set up' },
          { status: 400 }
        )
      }

      // Continue onboarding with existing account
      const accountLink = await createAccountLink(
        seller.stripeAccountId,
        `${process.env.APP_URL}/seller/settings?refresh=true`,
        `${process.env.APP_URL}/seller/settings?success=true`
      )

      return NextResponse.json(
        {
          url: accountLink.url,
          accountId: seller.stripeAccountId,
        },
        { status: 200 }
      )
    }

    // Create new Stripe Connect account
    const account = await createConnectedAccount(seller.user.email, 'express')

    // Save account ID to database
    await prisma.seller.update({
      where: { id: seller.id },
      data: {
        stripeAccountId: account.id,
      },
    })

    // Create account link for onboarding
    const accountLink = await createAccountLink(
      account.id,
      `${process.env.APP_URL}/seller/settings?refresh=true`,
      `${process.env.APP_URL}/seller/settings?success=true`
    )

    return NextResponse.json(
      {
        url: accountLink.url,
        accountId: account.id,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create Stripe Connect account error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while setting up Stripe account' },
      { status: 500 }
    )
  }
}

// GET /api/sellers/connect - Get Stripe Connect account status
export async function GET(request: NextRequest) {
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
        {
          connected: false,
          onboardingComplete: false,
        },
        { status: 200 }
      )
    }

    // Fetch account details from Stripe
    const stripe = require('@/lib/stripe').stripe
    const account = await stripe.accounts.retrieve(seller.stripeAccountId)

    const onboardingComplete = account.details_submitted && account.charges_enabled

    // Update database if status changed
    if (onboardingComplete !== seller.stripeOnboardingComplete) {
      await prisma.seller.update({
        where: { id: seller.id },
        data: { stripeOnboardingComplete: onboardingComplete },
      })
    }

    return NextResponse.json(
      {
        connected: true,
        onboardingComplete,
        accountId: seller.stripeAccountId,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get Stripe Connect status error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching account status' },
      { status: 500 }
    )
  }
}
