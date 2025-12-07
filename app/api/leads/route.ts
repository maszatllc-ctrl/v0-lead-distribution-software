import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

// GET /api/leads - List leads
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (session.user.role === UserRole.BUYER) {
      const buyer = await prisma.buyer.findUnique({
        where: { userId: session.user.id },
      })

      if (!buyer) {
        return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
      }

      // Get leads assigned to this buyer
      const where: any = {
        buyerId: buyer.id,
      }

      if (status) {
        where.status = status
      }

      if (startDate || endDate) {
        where.assignedAt = {}
        if (startDate) where.assignedAt.gte = new Date(startDate)
        if (endDate) where.assignedAt.lte = new Date(endDate)
      }

      const [assignments, total] = await Promise.all([
        prisma.leadAssignment.findMany({
          where,
          include: {
            lead: {
              include: {
                category: true,
                campaign: true,
              },
            },
            campaignSubscription: {
              include: {
                campaign: true,
              },
            },
          },
          orderBy: {
            assignedAt: 'desc',
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.leadAssignment.count({ where }),
      ])

      return NextResponse.json(
        {
          leads: assignments.map((a) => ({
            id: a.lead.id,
            assignmentId: a.id,
            category: a.lead.category.name,
            campaign: a.campaignSubscription.campaign.name,
            data: a.lead.data,
            state: a.lead.state,
            quality: a.lead.quality,
            price: a.price,
            assignedAt: a.assignedAt,
            deliveredAt: a.deliveredAt,
            viewedAt: a.viewedAt,
            status: a.status,
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        { status: 200 }
      )
    } else if (session.user.role === UserRole.SELLER) {
      const seller = await prisma.seller.findUnique({
        where: { userId: session.user.id },
      })

      if (!seller) {
        return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
      }

      // Get all leads for seller's campaigns
      const where: any = {
        campaign: {
          sellerId: seller.id,
        },
      }

      if (status) {
        where.status = status
      }

      if (category) {
        where.categoryId = category
      }

      if (startDate || endDate) {
        where.receivedAt = {}
        if (startDate) where.receivedAt.gte = new Date(startDate)
        if (endDate) where.receivedAt.lte = new Date(endDate)
      }

      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where,
          include: {
            category: true,
            campaign: true,
            supplier: {
              select: {
                id: true,
                name: true,
              },
            },
            assignments: {
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
          },
          orderBy: {
            receivedAt: 'desc',
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.lead.count({ where }),
      ])

      return NextResponse.json(
        {
          leads,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        { status: 200 }
      )
    }

    return NextResponse.json({ error: 'Invalid user role' }, { status: 403 })
  } catch (error) {
    console.error('Get leads error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching leads' },
      { status: 500 }
    )
  }
}
