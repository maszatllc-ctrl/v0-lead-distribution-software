/**
 * Script to create Stripe subscription products and prices
 * Run with: npx ts-node scripts/setup-stripe-products.ts
 */

import Stripe from 'stripe'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY not found in environment variables')
  console.error('Make sure .env.local exists with your Stripe credentials')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
})

async function setupProducts() {
  try {
    console.log('Creating Stripe products and prices...\n')

    // Growth Plan - $199/mo
    const growthProduct = await stripe.products.create({
      name: 'LeadFlow Growth',
      description: 'Perfect for growing agencies - Up to 500 leads/mo, up to 10 buyers',
      metadata: {
        tier: 'growth',
        maxLeadsPerMonth: '500',
        maxBuyers: '10',
        transactionFee: '5',
      },
    })

    const growthPrice = await stripe.prices.create({
      product: growthProduct.id,
      unit_amount: 19900, // $199/month
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 14,
      },
      metadata: {
        tier: 'growth',
      },
    })

    console.log('✅ Growth Plan Created:')
    console.log(`   Product ID: ${growthProduct.id}`)
    console.log(`   Price ID: ${growthPrice.id}`)
    console.log(`   Price: $199/month`)
    console.log(`   Limits: 500 leads/mo, 10 buyers max`)
    console.log(`   Transaction Fee: 5%\n`)

    // Professional Plan - $499/mo
    const professionalProduct = await stripe.products.create({
      name: 'LeadFlow Professional',
      description: 'For established agencies - Up to 2,000 leads/mo, unlimited buyers',
      metadata: {
        tier: 'professional',
        maxLeadsPerMonth: '2000',
        maxBuyers: 'unlimited',
        transactionFee: '5',
      },
    })

    const professionalPrice = await stripe.prices.create({
      product: professionalProduct.id,
      unit_amount: 49900, // $499/month
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
    console.log(`   Price: $499/month`)
    console.log(`   Limits: 2,000 leads/mo, unlimited buyers`)
    console.log(`   Transaction Fee: 5%\n`)

    // Enterprise Plan - $999/mo
    const enterpriseProduct = await stripe.products.create({
      name: 'LeadFlow Enterprise',
      description: 'Unlimited everything - For high-volume operations',
      metadata: {
        tier: 'enterprise',
        maxLeadsPerMonth: 'unlimited',
        maxBuyers: 'unlimited',
        transactionFee: '5',
      },
    })

    const enterprisePrice = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 99900, // $999/month
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
    console.log(`   Price: $999/month`)
    console.log(`   Limits: Unlimited leads, unlimited buyers`)
    console.log(`   Transaction Fee: 5%\n`)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Add these to your .env.local file:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log(`STRIPE_PRICE_GROWTH="${growthPrice.id}"`)
    console.log(`STRIPE_PRICE_PROFESSIONAL="${professionalPrice.id}"`)
    console.log(`STRIPE_PRICE_ENTERPRISE="${enterprisePrice.id}"`)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('✅ All products created successfully!')
    console.log('\n📋 Pricing Summary:')
    console.log('   Growth:        $199/mo + 5% fee (500 leads, 10 buyers)')
    console.log('   Professional:  $499/mo + 5% fee (2000 leads, unlimited buyers)')
    console.log('   Enterprise:    $999/mo + 5% fee (unlimited)')
  } catch (error: any) {
    console.error('Error creating products:', error.message)
    process.exit(1)
  }
}

setupProducts()
