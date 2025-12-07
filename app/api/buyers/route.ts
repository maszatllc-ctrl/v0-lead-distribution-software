import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { UserRole } from '@prisma/client'

// GET /api/buyers - List buyers (seller only)
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    const buyers = await prisma.buyer.findMany({
      where: {
        sellerId: seller.id,
        ...(status && { status: status as any }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
        campaignSubscriptions: {
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        leadAssignments: {
          select: {
            id: true,
            price: true,
            assignedAt: true,
          },
          orderBy: {
            assignedAt: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            leadAssignments: true,
            transactions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate stats for each buyer
    const buyersWithStats = await Promise.all(
      buyers.map(async (buyer) => {
        const totalSpent = await prisma.transaction.aggregate({
          where: {
            buyerId: buyer.id,
            type: 'DEBIT',
          },
          _sum: {
            amount: true,
          },
        })

        const lastPurchase = buyer.leadAssignments[0]

        return {
          ...buyer,
          totalPurchases: buyer._count.leadAssignments,
          totalSpent: Math.abs(totalSpent._sum.amount || 0),
          lastPurchase: lastPurchase?.assignedAt || null,
        }
      })
    )

    return NextResponse.json({ buyers: buyersWithStats }, { status: 200 })
  } catch (error) {
    console.error('Get buyers error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching buyers' },
      { status: 500 }
    )
  }
}

// POST /api/buyers - Create buyer (seller only)
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
    const { email, password, name, companyName, priority } = body

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: UserRole.BUYER,
        buyer: {
          create: {
            companyName: companyName || name,
            sellerId: seller.id,
            priority: priority ? parseInt(priority) : 5,
            status: 'ACTIVE',
            notificationPreference: {
              create: {
                emailOnLead: true,
                smsOnLead: false,
                webhookEnabled: false,
              },
            },
          },
        },
      },
      include: {
        buyer: true,
      },
    })

    return NextResponse.json(
      {
        message: 'Buyer created successfully',
        buyer: {
          id: user.buyer?.id,
          userId: user.id,
          email: user.email,
          name: user.name,
          companyName: user.buyer?.companyName,
          priority: user.buyer?.priority,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create buyer error:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating buyer' },
      { status: 500 }
    )
  }
}
