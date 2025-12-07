import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

// POST /api/campaigns/subscribe - Subscribe to a campaign (buyer only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== UserRole.BUYER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buyer = await prisma.buyer.findUnique({
      where: { userId: session.user.id },
    })

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    const body = await request.json()
    const { campaignId, dailyCap, states, waterfallPriority } = body

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    // Verify campaign exists and belongs to buyer's seller
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.sellerId !== buyer.sellerId) {
      return NextResponse.json(
        { error: 'This campaign does not belong to your seller' },
        { status: 403 }
      )
    }

    if (campaign.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This campaign is not active' },
        { status: 400 }
      )
    }

    // Check if already subscribed
    const existingSubscription = await prisma.campaignSubscription.findUnique({
      where: {
        campaignId_buyerId: {
          campaignId,
          buyerId: buyer.id,
        },
      },
    })

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Already subscribed to this campaign' },
        { status: 400 }
      )
    }

    // Validate state selection
    if (states && states.length > 0 && !campaign.allowStateSelection) {
      return NextResponse.json(
        { error: 'State selection is not allowed for this campaign' },
        { status: 400 }
      )
    }

    const subscription = await prisma.campaignSubscription.create({
      data: {
        campaignId,
        buyerId: buyer.id,
        dailyCap: dailyCap ? parseInt(dailyCap) : null,
        states: campaign.allowStateSelection && states ? states : [],
        waterfallPriority: waterfallPriority ? parseInt(waterfallPriority) : null,
        status: 'ACTIVE',
      },
      include: {
        campaign: {
          include: {
            category: true,
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'Subscribed to campaign successfully', subscription },
      { status: 201 }
    )
  } catch (error) {
    console.error('Subscribe to campaign error:', error)
    return NextResponse.json(
      { error: 'An error occurred while subscribing to campaign' },
      { status: 500 }
    )
  }
}

// PUT /api/campaigns/subscribe - Update subscription (buyer only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== UserRole.BUYER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buyer = await prisma.buyer.findUnique({
      where: { userId: session.user.id },
    })

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    const body = await request.json()
    const { subscriptionId, dailyCap, states, status, waterfallPriority } = body

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    const subscription = await prisma.campaignSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        campaign: true,
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    if (subscription.buyerId !== buyer.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate state selection
    if (states && states.length > 0 && !subscription.campaign.allowStateSelection) {
      return NextResponse.json(
        { error: 'State selection is not allowed for this campaign' },
        { status: 400 }
      )
    }

    const updatedSubscription = await prisma.campaignSubscription.update({
      where: { id: subscriptionId },
      data: {
        ...(dailyCap !== undefined && { dailyCap: dailyCap ? parseInt(dailyCap) : null }),
        ...(states !== undefined && { states }),
        ...(status && { status }),
        ...(waterfallPriority !== undefined && {
          waterfallPriority: waterfallPriority ? parseInt(waterfallPriority) : null
        }),
      },
      include: {
        campaign: {
          include: {
            category: true,
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'Subscription updated successfully', subscription: updatedSubscription },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update subscription error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating subscription' },
      { status: 500 }
    )
  }
}

// DELETE /api/campaigns/subscribe - Unsubscribe from campaign (buyer only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== UserRole.BUYER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buyer = await prisma.buyer.findUnique({
      where: { userId: session.user.id },
    })

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const subscriptionId = searchParams.get('id')

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    const subscription = await prisma.campaignSubscription.findUnique({
      where: { id: subscriptionId },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    if (subscription.buyerId !== buyer.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.campaignSubscription.delete({
      where: { id: subscriptionId },
    })

    return NextResponse.json(
      { message: 'Unsubscribed from campaign successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: 'An error occurred while unsubscribing' },
      { status: 500 }
    )
  }
}
