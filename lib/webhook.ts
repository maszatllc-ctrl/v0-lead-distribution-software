import { prisma } from './prisma'
import crypto from 'crypto'

export async function sendWebhook(
  buyerId: string,
  leadId: string,
  leadData: any
): Promise<boolean> {
  try {
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
      include: {
        notificationPreference: true,
      },
    })

    if (
      !buyer ||
      !buyer.notificationPreference?.webhookEnabled ||
      !buyer.notificationPreference?.webhookUrl
    ) {
      return false
    }

    const webhookUrl = buyer.notificationPreference.webhookUrl
    const webhookSecret = buyer.notificationPreference.webhookSecret

    // Prepare payload
    const payload = {
      event: 'lead.assigned',
      timestamp: new Date().toISOString(),
      data: {
        leadId,
        buyerId,
        ...leadData,
      },
    }

    // Generate signature if secret is provided
    let signature: string | undefined
    if (webhookSecret) {
      const hmac = crypto.createHmac('sha256', webhookSecret)
      hmac.update(JSON.stringify(payload))
      signature = hmac.digest('hex')
    }

    // Create webhook delivery record
    const delivery = await prisma.webhookDelivery.create({
      data: {
        buyerId,
        leadId,
        url: webhookUrl,
        payload,
        status: 'PENDING',
        attempts: 0,
      },
    })

    // Send webhook
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(signature && { 'X-Webhook-Signature': signature }),
          'User-Agent': 'LeadFlow-Webhook/1.0',
        },
        body: JSON.stringify(payload),
      })

      const responseBody = await response.text()

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: response.ok ? 'DELIVERED' : 'FAILED',
          attempts: 1,
          lastAttemptAt: new Date(),
          responseStatus: response.status,
          responseBody: responseBody.substring(0, 1000), // Limit to 1000 chars
        },
      })

      // Log notification
      await prisma.notificationLog.create({
        data: {
          type: 'WEBHOOK',
          recipient: webhookUrl,
          content: JSON.stringify(payload),
          status: response.ok ? 'SENT' : 'FAILED',
          provider: 'webhook',
          providerId: delivery.id,
          metadata: {
            statusCode: response.status,
            leadId,
          },
        },
      })

      return response.ok
    } catch (fetchError: any) {
      console.error('Webhook fetch error:', fetchError)

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'FAILED',
          attempts: 1,
          lastAttemptAt: new Date(),
          error: fetchError.message,
        },
      })

      await prisma.notificationLog.create({
        data: {
          type: 'WEBHOOK',
          recipient: webhookUrl,
          content: JSON.stringify(payload),
          status: 'FAILED',
          provider: 'webhook',
          error: fetchError.message,
        },
      })

      return false
    }
  } catch (error) {
    console.error('Send webhook error:', error)
    return false
  }
}

export async function retryFailedWebhooks(): Promise<void> {
  try {
    const failedDeliveries = await prisma.webhookDelivery.findMany({
      where: {
        status: 'FAILED',
        attempts: {
          lt: 3, // Max 3 attempts
        },
      },
      include: {
        buyer: {
          include: {
            notificationPreference: true,
          },
        },
      },
      take: 10, // Process 10 at a time
    })

    for (const delivery of failedDeliveries) {
      if (!delivery.buyer.notificationPreference?.webhookUrl) {
        continue
      }

      const webhookUrl = delivery.buyer.notificationPreference.webhookUrl
      const webhookSecret = delivery.buyer.notificationPreference.webhookSecret

      // Generate signature
      let signature: string | undefined
      if (webhookSecret) {
        const hmac = crypto.createHmac('sha256', webhookSecret)
        hmac.update(JSON.stringify(delivery.payload))
        signature = hmac.digest('hex')
      }

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(signature && { 'X-Webhook-Signature': signature }),
            'User-Agent': 'LeadFlow-Webhook/1.0',
          },
          body: JSON.stringify(delivery.payload),
        })

        const responseBody = await response.text()

        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: response.ok ? 'DELIVERED' : 'FAILED',
            attempts: delivery.attempts + 1,
            lastAttemptAt: new Date(),
            responseStatus: response.status,
            responseBody: responseBody.substring(0, 1000),
          },
        })
      } catch (error: any) {
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'FAILED',
            attempts: delivery.attempts + 1,
            lastAttemptAt: new Date(),
            error: error.message,
          },
        })
      }
    }
  } catch (error) {
    console.error('Retry failed webhooks error:', error)
  }
}
