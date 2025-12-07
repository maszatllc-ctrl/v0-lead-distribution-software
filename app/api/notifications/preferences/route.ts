import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import crypto from 'crypto'

// GET /api/notifications/preferences - Get notification preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== UserRole.BUYER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buyer = await prisma.buyer.findUnique({
      where: { userId: session.user.id },
      include: {
        notificationPreference: true,
      },
    })

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    return NextResponse.json(
      { preferences: buyer.notificationPreference },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get notification preferences error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching preferences' },
      { status: 500 }
    )
  }
}

// PUT /api/notifications/preferences - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== UserRole.BUYER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buyer = await prisma.buyer.findUnique({
      where: { userId: session.user.id },
      include: {
        notificationPreference: true,
      },
    })

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    const body = await request.json()
    const { emailOnLead, smsOnLead, webhookEnabled, webhookUrl, emailNotifications } =
      body

    // Generate webhook secret if enabling webhook for the first time
    let webhookSecret = buyer.notificationPreference?.webhookSecret
    if (webhookEnabled && webhookUrl && !webhookSecret) {
      webhookSecret = crypto.randomBytes(32).toString('hex')
    }

    if (buyer.notificationPreference) {
      // Update existing preferences
      const updated = await prisma.notificationPreference.update({
        where: { id: buyer.notificationPreference.id },
        data: {
          ...(emailOnLead !== undefined && { emailOnLead }),
          ...(smsOnLead !== undefined && { smsOnLead }),
          ...(webhookEnabled !== undefined && { webhookEnabled }),
          ...(webhookUrl !== undefined && { webhookUrl }),
          ...(webhookSecret && { webhookSecret }),
          ...(emailNotifications && { emailNotifications }),
        },
      })

      return NextResponse.json(
        {
          message: 'Preferences updated successfully',
          preferences: updated,
        },
        { status: 200 }
      )
    } else {
      // Create preferences if they don't exist
      const created = await prisma.notificationPreference.create({
        data: {
          buyerId: buyer.id,
          emailOnLead: emailOnLead ?? true,
          smsOnLead: smsOnLead ?? false,
          webhookEnabled: webhookEnabled ?? false,
          webhookUrl: webhookUrl || null,
          webhookSecret,
          emailNotifications: emailNotifications || null,
        },
      })

      return NextResponse.json(
        {
          message: 'Preferences created successfully',
          preferences: created,
        },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error('Update notification preferences error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating preferences' },
      { status: 500 }
    )
  }
}
