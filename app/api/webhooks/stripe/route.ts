import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.warn('STRIPE_WEBHOOK_SECRET not configured, skipping verification')
      event = JSON.parse(body) as Stripe.Event
    } else {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  console.log(`Received webhook event: ${event.type}`)

  try {
    switch (event.type) {
      // Payment Intent Events
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      // Subscription Events
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      // Connect Account Events
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      case 'account.application.deauthorized':
        await handleAccountDeauthorized(event.data.object as any)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error(`Error processing webhook ${event.type}:`, error)
    return NextResponse.json(
      { error: `Webhook processing error: ${error.message}` },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment succeeded: ${paymentIntent.id}`)

  // Payment intents for wallet top-ups are handled in the wallet API
  // This is mainly for logging and additional processing if needed
  const metadata = paymentIntent.metadata

  if (metadata.buyerId) {
    console.log(`Payment for buyer ${metadata.buyerId}: $${paymentIntent.amount / 100}`)
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.error(`Payment failed: ${paymentIntent.id}`)

  const metadata = paymentIntent.metadata

  if (metadata.buyerId) {
    const buyer = await prisma.buyer.findUnique({
      where: { id: metadata.buyerId },
      include: { user: true },
    })

    if (buyer) {
      console.error(
        `Payment failed for buyer ${buyer.user.name} (${buyer.user.email})`
      )
      // TODO: Send notification email about failed payment
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`Subscription updated: ${subscription.id}`)

  const sellerId = subscription.metadata.sellerId

  if (!sellerId) {
    console.warn('No sellerId in subscription metadata')
    return
  }

  const sellerSubscription = await prisma.sellerSubscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  })

  if (!sellerSubscription) {
    console.warn(`Seller subscription not found for Stripe subscription ${subscription.id}`)
    return
  }

  // Update subscription status
  await prisma.sellerSubscription.update({
    where: { id: sellerSubscription.id },
    data: {
      status: subscription.status.toUpperCase() as any,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  })

  // Update seller status
  await prisma.seller.update({
    where: { id: sellerId },
    data: {
      subscriptionStatus: subscription.status.toUpperCase() as any,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  })

  console.log(`Updated subscription status to ${subscription.status} for seller ${sellerId}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`Subscription deleted: ${subscription.id}`)

  const sellerId = subscription.metadata.sellerId

  if (!sellerId) {
    console.warn('No sellerId in subscription metadata')
    return
  }

  await prisma.sellerSubscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELED',
    },
  })

  await prisma.seller.update({
    where: { id: sellerId },
    data: {
      subscriptionStatus: 'CANCELED',
    },
  })

  console.log(`Subscription canceled for seller ${sellerId}`)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`Invoice payment succeeded: ${invoice.id}`)

  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    )
    await handleSubscriptionUpdated(subscription)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.error(`Invoice payment failed: ${invoice.id}`)

  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    )

    const sellerId = subscription.metadata.sellerId

    if (sellerId) {
      // Update to past_due status
      await prisma.seller.update({
        where: { id: sellerId },
        data: {
          subscriptionStatus: 'PAST_DUE',
        },
      })

      console.log(`Marked seller ${sellerId} subscription as PAST_DUE`)
      // TODO: Send notification email about failed payment
    }
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  console.log(`Connect account updated: ${account.id}`)

  const seller = await prisma.seller.findUnique({
    where: { stripeAccountId: account.id },
  })

  if (!seller) {
    console.warn(`Seller not found for Stripe account ${account.id}`)
    return
  }

  const onboardingComplete = account.details_submitted && account.charges_enabled

  // Update onboarding status
  await prisma.seller.update({
    where: { id: seller.id },
    data: {
      stripeOnboardingComplete: onboardingComplete,
    },
  })

  console.log(
    `Updated seller ${seller.id} onboarding status: ${onboardingComplete ? 'complete' : 'incomplete'}`
  )
}

async function handleAccountDeauthorized(data: any) {
  console.log(`Connect account deauthorized: ${data.account}`)

  const seller = await prisma.seller.findUnique({
    where: { stripeAccountId: data.account },
  })

  if (seller) {
    await prisma.seller.update({
      where: { id: seller.id },
      data: {
        stripeAccountId: null,
        stripeOnboardingComplete: false,
      },
    })

    console.log(`Removed Stripe account from seller ${seller.id}`)
  }
}
