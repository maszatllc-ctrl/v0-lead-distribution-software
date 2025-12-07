import { prisma } from './prisma'
import { createTransfer } from './stripe'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function calculateSellerPayout(
  sellerId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalRevenue: number
  platformFee: number
  usageFees: number
  netPayout: number
  leadsSold: number
}> {
  // Get all leads sold in this period
  const leadAssignments = await prisma.leadAssignment.findMany({
    where: {
      assignedAt: {
        gte: startDate,
        lte: endDate,
      },
      campaignSubscription: {
        campaign: {
          sellerId,
        },
      },
      status: {
        not: 'REJECTED', // Don't count rejected leads
      },
    },
    include: {
      campaignSubscription: {
        include: {
          campaign: true,
        },
      },
    },
  })

  const totalRevenue = leadAssignments.reduce((sum, assignment) => sum + assignment.price, 0)
  const leadsSold = leadAssignments.length

  // Get seller settings for platform fee
  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
    include: {
      sellerSettings: true,
    },
  })

  const platformFeePercent = seller?.sellerSettings?.platformFeePercent || 5.0
  const platformFee = totalRevenue * (platformFeePercent / 100)

  // Get usage fees (email/SMS costs with markup)
  const usageLogs = await prisma.usageLog.findMany({
    where: {
      sellerId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  })

  const usageFees = usageLogs.reduce((sum, log) => sum + log.totalCharge, 0)

  // Net payout = Revenue - Platform Fee - Usage Fees
  const netPayout = totalRevenue - platformFee - usageFees

  return {
    totalRevenue,
    platformFee,
    usageFees,
    netPayout,
    leadsSold,
  }
}

export async function executeSellerPayout(
  sellerId: string,
  amount: number,
  description: string,
  metadata?: Record<string, string>
): Promise<boolean> {
  try {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
    })

    if (!seller) {
      console.error('Seller not found:', sellerId)
      return false
    }

    if (!seller.stripeAccountId) {
      console.error('Seller has no Stripe account:', sellerId)
      return false
    }

    if (!seller.stripeOnboardingComplete) {
      console.error('Seller onboarding not complete:', sellerId)
      return false
    }

    if (amount <= 0) {
      console.error('Invalid payout amount:', amount)
      return false
    }

    // Create Stripe transfer
    const transfer = await createTransfer(amount, seller.stripeAccountId, {
      sellerId,
      description,
      ...metadata,
    })

    console.log(`Payout successful for seller ${sellerId}: $${amount}`)
    return true
  } catch (error) {
    console.error('Execute payout error:', error)
    return false
  }
}

export async function processMonthlyPayouts(): Promise<void> {
  console.log('Starting monthly payout processing...')

  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const startDate = startOfMonth(lastMonth)
  const endDate = endOfMonth(lastMonth)

  // Get all active sellers with Stripe accounts
  const sellers = await prisma.seller.findMany({
    where: {
      stripeAccountId: { not: null },
      stripeOnboardingComplete: true,
    },
  })

  for (const seller of sellers) {
    try {
      const payout = await calculateSellerPayout(seller.id, startDate, endDate)

      if (payout.netPayout > 0) {
        await executeSellerPayout(
          seller.id,
          payout.netPayout,
          `Monthly payout for ${lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          {
            month: lastMonth.toISOString(),
            leadsSold: payout.leadsSold.toString(),
            totalRevenue: payout.totalRevenue.toString(),
            platformFee: payout.platformFee.toString(),
            usageFees: payout.usageFees.toString(),
          }
        )
      } else {
        console.log(`No payout for seller ${seller.id}: net amount is $${payout.netPayout}`)
      }
    } catch (error) {
      console.error(`Error processing payout for seller ${seller.id}:`, error)
    }
  }

  console.log('Monthly payout processing complete')
}
