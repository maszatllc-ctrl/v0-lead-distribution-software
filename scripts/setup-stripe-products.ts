/**
 * Script to create Stripe subscription products and prices
 * Run with: npx ts-node scripts/setup-stripe-products.ts
 */

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY not found in environment variables')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
})

async function setupProducts() {
  try {
    console.log('Creating Stripe products and prices...\n')

    // Starter Plan
    const starterProduct = await stripe.products.create({
      name: 'LeadFlow Starter',
      description: 'Perfect for small agencies getting started with lead distribution',
      metadata: {
        tier: 'starter',
      },
    })

    const starterPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 4900, // $49/month
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 14,
      },
      metadata: {
        tier: 'starter',
      },
    })

    console.log('✅ Starter Plan Created:')
    console.log(`   Product ID: ${starterProduct.id}`)
    console.log(`   Price ID: ${starterPrice.id}`)
    console.log(`   Price: $49/month\n`)

    // Professional Plan
    const professionalProduct = await stripe.products.create({
      name: 'LeadFlow Professional',
      description: 'For growing agencies with higher volume needs',
      metadata: {
        tier: 'professional',
      },
    })

    const professionalPrice = await stripe.prices.create({
      product: professionalProduct.id,
      unit_amount: 14900, // $149/month
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 14,
      },
      metadata: {
        tier: 'professional',
      },
    })

    console.log('✅ Professional Plan Created:')
    console.log(`   Product ID: ${professionalProduct.id}`)
    console.log(`   Price ID: ${professionalPrice.id}`)
    console.log(`   Price: $149/month\n`)

    // Enterprise Plan
    const enterpriseProduct = await stripe.products.create({
      name: 'LeadFlow Enterprise',
      description: 'Unlimited lead distribution for large operations',
      metadata: {
        tier: 'enterprise',
      },
    })

    const enterprisePrice = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 49900, // $499/month
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 14,
      },
      metadata: {
        tier: 'enterprise',
      },
    })

    console.log('✅ Enterprise Plan Created:')
    console.log(`   Product ID: ${enterpriseProduct.id}`)
    console.log(`   Price ID: ${enterprisePrice.id}`)
    console.log(`   Price: $499/month\n`)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Add these to your .env.local file:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log(`STRIPE_PRICE_STARTER="${starterPrice.id}"`)
    console.log(`STRIPE_PRICE_PROFESSIONAL="${professionalPrice.id}"`)
    console.log(`STRIPE_PRICE_ENTERPRISE="${enterprisePrice.id}"`)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('✅ All products created successfully!')
  } catch (error: any) {
    console.error('Error creating products:', error.message)
    process.exit(1)
  }
}

setupProducts()
