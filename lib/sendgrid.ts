import sgMail from '@sendgrid/mail'
import { prisma } from './prisma'

if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY is not defined in environment variables')
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@leadflow.com'
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'LeadFlow'
const BASE_EMAIL_COST = parseFloat(process.env.BASE_EMAIL_COST || '0.001')

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string,
  sellerId?: string
): Promise<boolean> {
  try {
    const msg = {
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject,
      text: text || subject,
      html,
    }

    const response = await sgMail.send(msg)

    // Log notification
    await prisma.notificationLog.create({
      data: {
        type: 'EMAIL',
        recipient: to,
        subject,
        content: html,
        status: 'SENT',
        provider: 'sendgrid',
        providerId: response[0].headers['x-message-id'] as string,
      },
    })

    // Track usage for rebilling if sellerId provided
    if (sellerId) {
      await trackEmailUsage(sellerId)
    }

    return true
  } catch (error: any) {
    console.error('SendGrid error:', error)

    // Log failed notification
    await prisma.notificationLog.create({
      data: {
        type: 'EMAIL',
        recipient: to,
        subject,
        content: html,
        status: 'FAILED',
        provider: 'sendgrid',
        error: error.message || 'Unknown error',
      },
    })

    return false
  }
}

export async function sendLeadNotificationEmail(
  buyerId: string,
  leadData: any
): Promise<boolean> {
  try {
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
      include: {
        user: true,
        seller: true,
        notificationPreference: true,
      },
    })

    if (!buyer || !buyer.notificationPreference?.emailOnLead) {
      return false
    }

    const subject = 'New Lead Assigned'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Lead Assigned</h2>
        <p>Hello ${buyer.user.name},</p>
        <p>A new lead has been assigned to your account.</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #666;">Lead Details</h3>
          ${Object.entries(leadData)
            .map(
              ([key, value]) =>
                `<p><strong>${key}:</strong> ${value}</p>`
            )
            .join('')}
        </div>

        <p>
          <a href="${process.env.APP_URL}/buyer/leads"
             style="background: #007bff; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            View Lead
          </a>
        </p>

        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          You're receiving this email because you have lead notifications enabled.
          You can change your notification preferences in your
          <a href="${process.env.APP_URL}/buyer/settings">account settings</a>.
        </p>
      </div>
    `

    return await sendEmail(buyer.user.email, subject, html, undefined, buyer.sellerId)
  } catch (error) {
    console.error('Send lead notification email error:', error)
    return false
  }
}

export async function sendLowBalanceEmail(buyerId: string): Promise<boolean> {
  try {
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
      include: {
        user: true,
        seller: true,
      },
    })

    if (!buyer) {
      return false
    }

    const subject = 'Low Wallet Balance'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b6b;">Low Wallet Balance</h2>
        <p>Hello ${buyer.user.name},</p>
        <p>Your wallet balance is running low.</p>

        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0;"><strong>Current Balance:</strong> $${buyer.walletBalance.toFixed(2)}</p>
        </div>

        <p>Please add funds to your wallet to continue receiving leads.</p>

        <p>
          <a href="${process.env.APP_URL}/buyer/wallet"
             style="background: #28a745; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Add Funds
          </a>
        </p>
      </div>
    `

    return await sendEmail(buyer.user.email, subject, html, undefined, buyer.sellerId)
  } catch (error) {
    console.error('Send low balance email error:', error)
    return false
  }
}

async function trackEmailUsage(sellerId: string): Promise<void> {
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

    const markup = seller.sellerSettings.emailMarkup
    const cost = BASE_EMAIL_COST
    const totalCharge = cost + cost * markup

    // Get current billing period (monthly)
    const now = new Date()
    const billingPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const billingPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    await prisma.usageLog.create({
      data: {
        sellerId,
        type: 'EMAIL',
        count: 1,
        cost,
        markup: cost * markup,
        totalCharge,
        billingPeriodStart,
        billingPeriodEnd,
      },
    })
  } catch (error) {
    console.error('Track email usage error:', error)
  }
}
