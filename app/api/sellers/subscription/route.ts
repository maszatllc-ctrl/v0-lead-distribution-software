import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { stripe, createSubscription, cancelSubscription } from '@/lib/stripe'
import { UserRole } from '@prisma/client'

// GET /api/sellers/subscription - Get current subscription
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== UserRole.SELLER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
      include: {
        sellerSubscription: true,
      },
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Check if in trial
    const now = new Date()
    const inTrial = seller.trialEndsAt && seller.trialEndsAt > now

    if (!seller.sellerSubscription) {
      return NextResponse.json(
        {
          status: inTrial ? 'trial' : 'none',
          trialEndsAt: seller.trialEndsAt,
          plan: seller.subscriptionTier,
        },
        { status: 200 }
      )
    }

    // Fetch latest subscription data from Stripe
    if (seller.sellerSubscription.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(
        seller.sellerSubscription.stripeSubscriptionId
      )

      // Update local database if status changed
      if (subscription.status !== seller.sellerSubscription.status) {
        await prisma.sellerSubscription.update({
          where: { id: seller.sellerSubscription.id },
          data: {
            status: subscription.status.toUpperCase() as any,
          },
        })
      }

      return NextResponse.json(
        {
          ...seller.sellerSubscription,
          stripeStatus: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { subscription: seller.sellerSubscription },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching subscription' },
      { status: 500 }
    )
  }
}

// POST /api/sellers/subscription - Create subscription
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
        sellerSubscription: true,
      },
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    if (seller.sellerSubscription) {
      return NextResponse.json(
        { error: 'Subscription already exists' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { tier, paymentMethodId } = body

    if (!tier || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Tier and payment method required' },
        { status: 400 }
      )
    }

    // Get price ID for tier
    const priceIds: Record<string, string> = {
      STARTER: process.env.STRIPE_PRICE_STARTER || '',
      GROWTH: process.env.STRIPE_PRICE_GROWTH || '',
      PROFESSIONAL: process.env.STRIPE_PRICE_PROFESSIONAL || '',
    }

    const priceId = priceIds[tier]
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Create or get Stripe customer
    let stripeCustomerId = seller.stripeAccountId // Using Connect account as customer for simplicity

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: seller.user.email,
        name: seller.companyName,
        metadata: {
          sellerId: seller.id,
          userId: seller.userId,
        },
      })
      stripeCustomerId = customer.id
    }

    // Attach payment method
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    })

    // Set as default payment method
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    // Create subscription
    const subscription = await createSubscription(stripeCustomerId, priceId, {
      sellerId: seller.id,
      tier,
    })

    // Save to database
    await prisma.sellerSubscription.create({
      data: {
        sellerId: seller.id,
        stripeSubscriptionId: subscription.id,
        plan: tier,
        status: subscription.status.toUpperCase() as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    })

    // Update seller status
    await prisma.seller.update({
      where: { id: seller.id },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionTier: tier,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    })

    return NextResponse.json(
      {
        message: 'Subscription created successfully',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create subscription error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while creating subscription' },
      { status: 500 }
    )
  }
}

// DELETE /api/sellers/subscription - Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== UserRole.SELLER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
      include: {
        sellerSubscription: true,
      },
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    if (!seller.sellerSubscription) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
    }

    const searchParams = request.nextUrl.searchParams
    const immediate = searchParams.get('immediate') === 'true'

    // Cancel subscription
    await cancelSubscription(
      seller.sellerSubscription.stripeSubscriptionId,
      !immediate
    )

    // Update database
    if (immediate) {
      await prisma.sellerSubscription.update({
        where: { id: seller.sellerSubscription.id },
        data: {
          status: 'CANCELED',
        },
      })

      await prisma.seller.update({
        where: { id: seller.id },
        data: {
          subscriptionStatus: 'CANCELED',
        },
      })
    } else {
      await prisma.sellerSubscription.update({
        where: { id: seller.sellerSubscription.id },
        data: {
          cancelAtPeriodEnd: true,
        },
      })
    }

    return NextResponse.json(
      {
        message: immediate
          ? 'Subscription canceled immediately'
          : 'Subscription will cancel at end of billing period',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while canceling subscription' },
      { status: 500 }
    )
  }
}
