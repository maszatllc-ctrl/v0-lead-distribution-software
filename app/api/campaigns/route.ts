import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

// GET /api/campaigns - List campaigns
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    if (session.user.role === UserRole.SELLER) {
      // Get seller's campaigns
      const seller = await prisma.seller.findUnique({
        where: { userId: session.user.id },
      })

      if (!seller) {
        return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
      }

      const campaigns = await prisma.campaign.findMany({
        where: {
          sellerId: seller.id,
          ...(status && { status: status as any }),
        },
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
              subscriptions: true,
              leads: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json({ campaigns }, { status: 200 })
    } else if (session.user.role === UserRole.BUYER) {
      // Get campaigns available to this buyer
      const buyer = await prisma.buyer.findUnique({
        where: { userId: session.user.id },
      })

      if (!buyer) {
        return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
      }

      const campaigns = await prisma.campaign.findMany({
        where: {
          sellerId: buyer.sellerId,
          status: 'ACTIVE',
        },
        include: {
          category: true,
          subscriptions: {
            where: {
              buyerId: buyer.id,
            },
          },
          _count: {
            select: {
              subscriptions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json({ campaigns }, { status: 200 })
    } else {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 403 })
    }
  } catch (error) {
    console.error('Get campaigns error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching campaigns' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns - Create campaign (seller only)
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      categoryId,
      name,
      description,
      pricePerLead,
      distributionLogic,
      allowStateSelection,
      status,
    } = body

    // Validate required fields
    if (!categoryId || !name || !pricePerLead || !distributionLogic) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify category belongs to this seller
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        sellerId: seller.id,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found or does not belong to this seller' },
        { status: 404 }
      )
    }

    const campaign = await prisma.campaign.create({
      data: {
        sellerId: seller.id,
        categoryId,
        name,
        description,
        pricePerLead: parseFloat(pricePerLead),
        distributionLogic,
        allowStateSelection: allowStateSelection ?? true,
        status: status || 'ACTIVE',
      },
      include: {
        category: true,
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'Campaign created successfully', campaign },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create campaign error:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating campaign' },
      { status: 500 }
    )
  }
}
