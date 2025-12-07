import { prisma } from './prisma'
import { DistributionLogic, CampaignSubscription, Buyer } from '@prisma/client'
import { startOfDay, endOfDay } from 'date-fns'
import { checkAndTriggerAutoRecharge } from './auto-recharge'

type SubscriptionWithBuyer = CampaignSubscription & {
  buyer: Buyer
}

export async function distributeLeadToBuyers(
  leadId: string,
  campaignId: string,
  logic: DistributionLogic
): Promise<string[]> {
  const assignedBuyerIds: string[] = []

  // Get all active subscriptions for this campaign
  const subscriptions = await prisma.campaignSubscription.findMany({
    where: {
      campaignId,
      status: 'ACTIVE',
      buyer: {
        status: 'ACTIVE',
      },
    },
    include: {
      buyer: true,
    },
  })

  if (subscriptions.length === 0) {
    console.log('No active subscriptions for campaign:', campaignId)
    return []
  }

  // Filter subscriptions based on state and daily cap
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  })

  if (!lead) {
    throw new Error('Lead not found')
  }

  const eligibleSubscriptions = await filterEligibleSubscriptions(
    subscriptions,
    lead.state || ''
  )

  if (eligibleSubscriptions.length === 0) {
    console.log('No eligible buyers for this lead')
    return []
  }

  switch (logic) {
    case 'ROUND_ROBIN':
      assignedBuyerIds.push(...(await distributeRoundRobin(leadId, eligibleSubscriptions)))
      break
    case 'WEIGHTED_ROUND_ROBIN':
      assignedBuyerIds.push(...(await distributeWeightedRoundRobin(leadId, eligibleSubscriptions)))
      break
    case 'WATERFALL':
      assignedBuyerIds.push(...(await distributeWaterfall(leadId, eligibleSubscriptions)))
      break
    case 'BROADCAST':
      assignedBuyerIds.push(...(await distributeBroadcast(leadId, eligibleSubscriptions)))
      break
  }

  return assignedBuyerIds
}

async function filterEligibleSubscriptions(
  subscriptions: SubscriptionWithBuyer[],
  leadState: string
): Promise<SubscriptionWithBuyer[]> {
  const eligible: SubscriptionWithBuyer[] = []

  for (const subscription of subscriptions) {
    // Check state filter
    if (subscription.states.length > 0 && leadState) {
      if (!subscription.states.includes(leadState)) {
        continue
      }
    }

    // Check daily cap
    if (subscription.dailyCap) {
      const today = new Date()
      const todayStart = startOfDay(today)
      const todayEnd = endOfDay(today)

      const todayAssignments = await prisma.leadAssignment.count({
        where: {
          buyerId: subscription.buyerId,
          campaignSubscriptionId: subscription.id,
          assignedAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      })

      if (todayAssignments >= subscription.dailyCap) {
        continue
      }
    }

    // Check buyer wallet balance
    const campaign = await prisma.campaign.findUnique({
      where: { id: subscription.campaignId },
    })

    if (campaign && subscription.buyer.walletBalance < campaign.pricePerLead) {
      // Try auto-recharge if enabled
      const recharged = await checkAndTriggerAutoRecharge(subscription.buyerId)

      if (recharged) {
        // Refetch buyer to get updated balance
        const updatedBuyer = await prisma.buyer.findUnique({
          where: { id: subscription.buyerId },
        })

        if (updatedBuyer && updatedBuyer.walletBalance >= campaign.pricePerLead) {
          subscription.buyer = updatedBuyer
          eligible.push(subscription)
        }
      }
      continue
    }

    eligible.push(subscription)
  }

  return eligible
}

async function distributeRoundRobin(
  leadId: string,
  subscriptions: SubscriptionWithBuyer[]
): Promise<string[]> {
  if (subscriptions.length === 0) return []

  // Sort by lastDistributedAt (null first, then oldest)
  const sorted = subscriptions.sort((a, b) => {
    if (!a.lastDistributedAt) return -1
    if (!b.lastDistributedAt) return 1
    return a.lastDistributedAt.getTime() - b.lastDistributedAt.getTime()
  })

  const selectedSubscription = sorted[0]
  await assignLeadToBuyer(leadId, selectedSubscription)

  // Update lastDistributedAt
  await prisma.campaignSubscription.update({
    where: { id: selectedSubscription.id },
    data: { lastDistributedAt: new Date() },
  })

  return [selectedSubscription.buyerId]
}

async function distributeWeightedRoundRobin(
  leadId: string,
  subscriptions: SubscriptionWithBuyer[]
): Promise<string[]> {
  if (subscriptions.length === 0) return []

  // Calculate total weight
  const totalWeight = subscriptions.reduce((sum, sub) => sum + sub.buyer.priority, 0)

  // Generate random number
  let random = Math.random() * totalWeight

  // Select buyer based on weight
  for (const subscription of subscriptions) {
    random -= subscription.buyer.priority
    if (random <= 0) {
      await assignLeadToBuyer(leadId, subscription)
      await prisma.campaignSubscription.update({
        where: { id: subscription.id },
        data: { lastDistributedAt: new Date() },
      })
      return [subscription.buyerId]
    }
  }

  // Fallback to first subscription
  await assignLeadToBuyer(leadId, subscriptions[0])
  return [subscriptions[0].buyerId]
}

async function distributeWaterfall(
  leadId: string,
  subscriptions: SubscriptionWithBuyer[]
): Promise<string[]> {
  if (subscriptions.length === 0) return []

  // Sort by waterfallPriority (highest first), then by buyer priority
  const sorted = subscriptions.sort((a, b) => {
    if (a.waterfallPriority && b.waterfallPriority) {
      return b.waterfallPriority - a.waterfallPriority
    }
    if (a.waterfallPriority) return -1
    if (b.waterfallPriority) return 1
    return b.buyer.priority - a.buyer.priority
  })

  // Try each buyer in order until one accepts
  for (const subscription of sorted) {
    const eligible = await filterEligibleSubscriptions([subscription], '')
    if (eligible.length > 0) {
      await assignLeadToBuyer(leadId, subscription)
      return [subscription.buyerId]
    }
  }

  return []
}

async function distributeBroadcast(
  leadId: string,
  subscriptions: SubscriptionWithBuyer[]
): Promise<string[]> {
  const assignedBuyerIds: string[] = []

  for (const subscription of subscriptions) {
    await assignLeadToBuyer(leadId, subscription)
    assignedBuyerIds.push(subscription.buyerId)
  }

  return assignedBuyerIds
}

async function assignLeadToBuyer(
  leadId: string,
  subscription: SubscriptionWithBuyer
): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: subscription.campaignId },
  })

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  // Create lead assignment
  const assignment = await prisma.leadAssignment.create({
    data: {
      leadId,
      buyerId: subscription.buyerId,
      campaignSubscriptionId: subscription.id,
      price: campaign.pricePerLead,
      status: 'DELIVERED',
      deliveredAt: new Date(),
    },
  })

  // Deduct from buyer wallet and create transaction
  const buyer = await prisma.buyer.findUnique({
    where: { id: subscription.buyerId },
  })

  if (!buyer) {
    throw new Error('Buyer not found')
  }

  const newBalance = buyer.walletBalance - campaign.pricePerLead

  await prisma.buyer.update({
    where: { id: subscription.buyerId },
    data: { walletBalance: newBalance },
  })

  await prisma.transaction.create({
    data: {
      buyerId: subscription.buyerId,
      type: 'DEBIT',
      amount: -campaign.pricePerLead,
      balanceBefore: buyer.walletBalance,
      balanceAfter: newBalance,
      description: `Lead purchase - Campaign: ${campaign.name}`,
      leadAssignmentId: assignment.id,
    },
  })

  // Update lead status
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: 'DISTRIBUTED',
      distributedAt: new Date(),
    },
  })

  console.log(`Lead ${leadId} assigned to buyer ${subscription.buyerId}`)

  // Send notifications (fire and forget - don't wait for them)
  sendLeadNotifications(leadId, subscription.buyerId).catch((error) => {
    console.error('Error sending lead notifications:', error)
  })
}

async function sendLeadNotifications(leadId: string, buyerId: string): Promise<void> {
  const { sendLeadNotificationEmail } = await import('./sendgrid')
  const { sendLeadNotificationSMS } = await import('./twilio')
  const { sendWebhook } = await import('./webhook')

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  })

  if (!lead) return

  const leadData = lead.data as any

  // Send email, SMS, and webhook notifications in parallel
  await Promise.allSettled([
    sendLeadNotificationEmail(buyerId, leadData),
    sendLeadNotificationSMS(buyerId, JSON.stringify(leadData).substring(0, 100)),
    sendWebhook(buyerId, leadId, leadData),
  ])
}
