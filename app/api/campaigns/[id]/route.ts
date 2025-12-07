import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

// GET /api/campaigns/[id] - Get single campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        subscriptions: {
          include: {
            buyer: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            leads: true,
            subscriptions: true,
          },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Verify access
    if (session.user.role === UserRole.SELLER) {
      const seller = await prisma.seller.findUnique({
        where: { userId: session.user.id },
      })

      if (campaign.sellerId !== seller?.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (session.user.role === UserRole.BUYER) {
      const buyer = await prisma.buyer.findUnique({
        where: { userId: session.user.id },
      })

      if (campaign.sellerId !== buyer?.sellerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json({ campaign }, { status: 200 })
  } catch (error) {
    console.error('Get campaign error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching campaign' },
      { status: 500 }
    )
  }
}

// PUT /api/campaigns/[id] - Update campaign (seller only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== UserRole.SELLER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.sellerId !== seller.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      pricePerLead,
      distributionLogic,
      allowStateSelection,
      status,
    } = body

    const updatedCampaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(pricePerLead && { pricePerLead: parseFloat(pricePerLead) }),
        ...(distributionLogic && { distributionLogic }),
        ...(allowStateSelection !== undefined && { allowStateSelection }),
        ...(status && { status }),
      },
      include: {
        category: true,
        _count: {
          select: {
            subscriptions: true,
            leads: true,
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'Campaign updated successfully', campaign: updatedCampaign },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update campaign error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating campaign' },
      { status: 500 }
    )
  }
}

// DELETE /api/campaigns/[id] - Delete campaign (seller only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== UserRole.SELLER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.sellerId !== seller.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete by archiving instead of hard delete
    await prisma.campaign.update({
      where: { id: params.id },
      data: {
        status: 'ARCHIVED',
      },
    })

    return NextResponse.json(
      { message: 'Campaign archived successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete campaign error:', error)
    return NextResponse.json(
      { error: 'An error occurred while deleting campaign' },
      { status: 500 }
    )
  }
}
