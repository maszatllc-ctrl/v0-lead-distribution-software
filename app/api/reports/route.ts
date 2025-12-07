import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next/auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { startOfDay, endOfDay, subDays } from 'date-fns'

// GET /api/reports - Get reports/analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const reportType = searchParams.get('type') || 'overview'
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let dateRange: { gte: Date; lte: Date }

    if (startDate && endDate) {
      dateRange = {
        gte: startOfDay(new Date(startDate)),
        lte: endOfDay(new Date(endDate)),
      }
    } else {
      dateRange = {
        gte: startOfDay(subDays(new Date(), days)),
        lte: endOfDay(new Date()),
      }
    }

    if (session.user.role === UserRole.BUYER) {
      const buyer = await prisma.buyer.findUnique({
        where: { userId: session.user.id },
      })

      if (!buyer) {
        return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
      }

      if (reportType === 'overview') {
        return await getBuyerOverview(buyer.id, dateRange)
      } else if (reportType === 'spending') {
        return await getBuyerSpending(buyer.id, dateRange)
      } else if (reportType === 'leads') {
        return await getBuyerLeadStats(buyer.id, dateRange)
      }
    } else if (session.user.role === UserRole.SELLER) {
      const seller = await prisma.seller.findUnique({
        where: { userId: session.user.id },
      })

      if (!seller) {
        return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
      }

      if (reportType === 'overview') {
        return await getSellerOverview(seller.id, dateRange)
      } else if (reportType === 'revenue') {
        return await getSellerRevenue(seller.id, dateRange)
      } else if (reportType === 'buyers') {
        return await getSellerBuyerStats(seller.id, dateRange)
      } else if (reportType === 'usage') {
        return await getSellerUsage(seller.id, dateRange)
      }
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
  } catch (error: any) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching reports' },
      { status: 500 }
    )
  }
}

async function getBuyerOverview(buyerId: string, dateRange: { gte: Date; lte: Date }) {
  const [leadsAssigned, totalSpent, walletBalance] = await Promise.all([
    prisma.leadAssignment.count({
      where: {
        buyerId,
        assignedAt: dateRange,
      },
    }),
    prisma.transaction.aggregate({
      where: {
        buyerId,
        type: 'DEBIT',
        createdAt: dateRange,
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.buyer.findUnique({
      where: { id: buyerId },
      select: { walletBalance: true },
    }),
  ])

  // Get leads by category
  const leadsByCategory = await prisma.leadAssignment.groupBy({
    by: ['campaignSubscriptionId'],
    where: {
      buyerId,
      assignedAt: dateRange,
    },
    _count: true,
  })

  // Get leads by day for chart
  const leadsByDay = await prisma.$queryRaw`
    SELECT DATE(assigned_at) as date, COUNT(*) as count
    FROM "LeadAssignment"
    WHERE buyer_id = ${buyerId}
    AND assigned_at >= ${dateRange.gte}
    AND assigned_at <= ${dateRange.lte}
    GROUP BY DATE(assigned_at)
    ORDER BY date ASC
  `

  return NextResponse.json(
    {
      overview: {
        leadsReceived: leadsAssigned,
        totalSpent: Math.abs(totalSpent._sum.amount || 0),
        walletBalance: walletBalance?.walletBalance || 0,
      },
      leadsByCategory: leadsByCategory.length,
      leadsByDay,
    },
    { status: 200 }
  )
}

async function getBuyerSpending(buyerId: string, dateRange: { gte: Date; lte: Date }) {
  const transactions = await prisma.transaction.findMany({
    where: {
      buyerId,
      createdAt: dateRange,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  })

  // Spending by type
  const spendingByType = await prisma.transaction.groupBy({
    by: ['type'],
    where: {
      buyerId,
      createdAt: dateRange,
    },
    _sum: {
      amount: true,
    },
    _count: true,
  })

  return NextResponse.json(
    {
      transactions,
      spendingByType,
    },
    { status: 200 }
  )
}

async function getBuyerLeadStats(buyerId: string, dateRange: { gte: Date; lte: Date }) {
  const leads = await prisma.leadAssignment.findMany({
    where: {
      buyerId,
      assignedAt: dateRange,
    },
    include: {
      lead: {
        include: {
          category: true,
        },
      },
      campaignSubscription: {
        include: {
          campaign: true,
        },
      },
    },
  })

  // Group by status
  const byStatus = leads.reduce((acc: any, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1
    return acc
  }, {})

  // Group by quality
  const byQuality = leads.reduce((acc: any, lead) => {
    const quality = lead.lead.quality
    acc[quality] = (acc[quality] || 0) + 1
    return acc
  }, {})

  return NextResponse.json(
    {
      totalLeads: leads.length,
      byStatus,
      byQuality,
      leads: leads.slice(0, 50), // Return first 50
    },
    { status: 200 }
  )
}

async function getSellerOverview(sellerId: string, dateRange: { gte: Date; lte: Date }) {
  const [leadsSold, revenue, activeBuyers, activeSuppliers] = await Promise.all([
    prisma.leadAssignment.count({
      where: {
        assignedAt: dateRange,
        campaignSubscription: {
          campaign: {
            sellerId,
          },
        },
      },
    }),
    prisma.leadAssignment.aggregate({
      where: {
        assignedAt: dateRange,
        campaignSubscription: {
          campaign: {
            sellerId,
          },
        },
      },
      _sum: {
        price: true,
      },
    }),
    prisma.buyer.count({
      where: {
        sellerId,
        status: 'ACTIVE',
      },
    }),
    prisma.supplier.count({
      where: {
        sellerId,
        status: 'ACTIVE',
      },
    }),
  ])

  return NextResponse.json(
    {
      overview: {
        leadsSold,
        revenue: revenue._sum.price || 0,
        activeBuyers,
        activeSuppliers,
      },
    },
    { status: 200 }
  )
}

async function getSellerRevenue(sellerId: string, dateRange: { gte: Date; lte: Date }) {
  // Revenue by day
  const revenueByDay = await prisma.$queryRaw`
    SELECT DATE(la.assigned_at) as date, SUM(la.price) as revenue
    FROM "LeadAssignment" la
    JOIN "CampaignSubscription" cs ON la.campaign_subscription_id = cs.id
    JOIN "Campaign" c ON cs.campaign_id = c.id
    WHERE c.seller_id = ${sellerId}
    AND la.assigned_at >= ${dateRange.gte}
    AND la.assigned_at <= ${dateRange.lte}
    GROUP BY DATE(la.assigned_at)
    ORDER BY date ASC
  `

  // Revenue by campaign
  const revenueByCampaign = await prisma.leadAssignment.groupBy({
    by: ['campaignSubscriptionId'],
    where: {
      assignedAt: dateRange,
      campaignSubscription: {
        campaign: {
          sellerId,
        },
      },
    },
    _sum: {
      price: true,
    },
    _count: true,
  })

  return NextResponse.json(
    {
      revenueByDay,
      revenueByCampaign,
    },
    { status: 200 }
  )
}

async function getSellerBuyerStats(sellerId: string, dateRange: { gte: Date; lte: Date }) {
  const buyers = await prisma.buyer.findMany({
    where: {
      sellerId,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          leadAssignments: true,
        },
      },
    },
  })

  // Get spending per buyer
  const buyerSpending = await Promise.all(
    buyers.map(async (buyer) => {
      const spending = await prisma.leadAssignment.aggregate({
        where: {
          buyerId: buyer.id,
          assignedAt: dateRange,
        },
        _sum: {
          price: true,
        },
        _count: true,
      })

      return {
        id: buyer.id,
        name: buyer.user.name,
        email: buyer.user.email,
        totalSpent: spending._sum.price || 0,
        leadsReceived: spending._count,
        walletBalance: buyer.walletBalance,
      }
    })
  )

  return NextResponse.json(
    {
      buyers: buyerSpending.sort((a, b) => b.totalSpent - a.totalSpent),
    },
    { status: 200 }
  )
}

async function getSellerUsage(sellerId: string, dateRange: { gte: Date; lte: Date }) {
  const usageLogs = await prisma.usageLog.findMany({
    where: {
      sellerId,
      createdAt: dateRange,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Group by type
  const usageByType = await prisma.usageLog.groupBy({
    by: ['type'],
    where: {
      sellerId,
      createdAt: dateRange,
    },
    _sum: {
      count: true,
      cost: true,
      markup: true,
      totalCharge: true,
    },
  })

  return NextResponse.json(
    {
      usageLogs,
      usageByType,
    },
    { status: 200 }
  )
}
