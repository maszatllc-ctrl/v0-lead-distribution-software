import twilio from 'twilio'
import { prisma } from './prisma'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER
const BASE_SMS_COST = parseFloat(process.env.BASE_SMS_COST || '0.0075')

let twilioClient: twilio.Twilio | null = null

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
} else {
  console.warn('Twilio credentials not configured')
}

export async function sendSMS(
  to: string,
  message: string,
  sellerId?: string
): Promise<boolean> {
  if (!twilioClient || !TWILIO_PHONE_NUMBER) {
    console.error('Twilio not configured')
    return false
  }

  try {
    const response = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to,
    })

    // Log notification
    await prisma.notificationLog.create({
      data: {
        type: 'SMS',
        recipient: to,
        content: message,
        status: 'SENT',
        provider: 'twilio',
        providerId: response.sid,
      },
    })

    // Track usage for rebilling if sellerId provided
    if (sellerId) {
      await trackSMSUsage(sellerId)
    }

    return true
  } catch (error: any) {
    console.error('Twilio error:', error)

    // Log failed notification
    await prisma.notificationLog.create({
      data: {
        type: 'SMS',
        recipient: to,
        content: message,
        status: 'FAILED',
        provider: 'twilio',
        error: error.message || 'Unknown error',
      },
    })

    return false
  }
}

export async function sendLeadNotificationSMS(
  buyerId: string,
  leadInfo: string
): Promise<boolean> {
  try {
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
      include: {
        user: true,
        notificationPreference: true,
      },
    })

    if (!buyer || !buyer.notificationPreference?.smsOnLead) {
      return false
    }

    // You would need to add a phone number field to the buyer/user model
    // For now, this is a placeholder
    const phoneNumber = (buyer.user as any).phoneNumber

    if (!phoneNumber) {
      console.log('No phone number for buyer:', buyerId)
      return false
    }

    const message = `New lead assigned! ${leadInfo}\n\nView: ${process.env.APP_URL}/buyer/leads`

    return await sendSMS(phoneNumber, message, buyer.sellerId)
  } catch (error) {
    console.error('Send lead notification SMS error:', error)
    return false
  }
}

export async function sendLowBalanceSMS(buyerId: string): Promise<boolean> {
  try {
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
      include: {
        user: true,
      },
    })

    if (!buyer) {
      return false
    }

    const phoneNumber = (buyer.user as any).phoneNumber

    if (!phoneNumber) {
      return false
    }

    const message = `Your LeadFlow wallet balance is low: $${buyer.walletBalance.toFixed(
      2
    )}. Add funds: ${process.env.APP_URL}/buyer/wallet`

    return await sendSMS(phoneNumber, message, buyer.sellerId)
  } catch (error) {
    console.error('Send low balance SMS error:', error)
    return false
  }
}

async function trackSMSUsage(sellerId: string): Promise<void> {
  try {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        sellerSettings: true,
      },
    })

    if (!seller || !seller.sellerSettings) {
      return
    }

    const markup = seller.sellerSettings.smsMarkup
    const cost = BASE_SMS_COST
    const totalCharge = cost + cost * markup

    // Get current billing period (monthly)
    const now = new Date()
    const billingPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const billingPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    await prisma.usageLog.create({
      data: {
        sellerId,
        type: 'SMS',
        count: 1,
        cost,
        markup: cost * markup,
        totalCharge,
        billingPeriodStart,
        billingPeriodEnd,
      },
    })
  } catch (error) {
    console.error('Track SMS usage error:', error)
  }
}
