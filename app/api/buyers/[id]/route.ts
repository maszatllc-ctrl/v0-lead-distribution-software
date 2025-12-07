import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

// GET /api/buyers/[id] - Get single buyer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buyer = await prisma.buyer.findUnique({
      where: { id: params.id },
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
        seller: {
          select: {
            id: true,
            companyName: true,
          },
        },
        campaignSubscriptions: {
          include: {
            campaign: {
              include: {
                category: true,
              },
            },
          },
        },
        notificationPreference: true,
        _count: {
          select: {
            leadAssignments: true,
            transactions: true,
          },
        },
      },
    })

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    // Verify access
    if (session.user.role === UserRole.SELLER) {
      const seller = await prisma.seller.findUnique({
        where: { userId: session.user.id },
      })

      if (buyer.sellerId !== seller?.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (session.user.role === UserRole.BUYER) {
      if (buyer.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Calculate buyer stats
    const totalSpent = await prisma.transaction.aggregate({
      where: {
        buyerId: buyer.id,
        type: 'DEBIT',
      },
      _sum: {
        amount: true,
      },
    })

    const lastPurchase = await prisma.leadAssignment.findFirst({
      where: { buyerId: buyer.id },
      orderBy: { assignedAt: 'desc' },
      select: { assignedAt: true },
    })

    const buyerWithStats = {
      ...buyer,
      totalPurchases: buyer._count.leadAssignments,
      totalSpent: Math.abs(totalSpent._sum.amount || 0),
      lastPurchase: lastPurchase?.assignedAt || null,
    }

    return NextResponse.json({ buyer: buyerWithStats }, { status: 200 })
  } catch (error) {
    console.error('Get buyer error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching buyer' },
      { status: 500 }
    )
  }
}

// PUT /api/buyers/[id] - Update buyer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buyer = await prisma.buyer.findUnique({
      where: { id: params.id },
    })

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    const body = await request.json()

    // Seller can update priority, status, spending limits
    if (session.user.role === UserRole.SELLER) {
      const seller = await prisma.seller.findUnique({
        where: { userId: session.user.id },
      })

      if (buyer.sellerId !== seller?.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const {
        companyName,
        priority,
        status,
        monthlySpendingLimit,
        weeklySpendingLimit,
      } = body

      const updatedBuyer = await prisma.buyer.update({
        where: { id: params.id },
        data: {
          ...(companyName && { companyName }),
          ...(priority !== undefined && { priority: parseInt(priority) }),
          ...(status && { status }),
          ...(monthlySpendingLimit !== undefined && {
            monthlySpendingLimit: monthlySpendingLimit ? parseFloat(monthlySpendingLimit) : null,
          }),
          ...(weeklySpendingLimit !== undefined && {
            weeklySpendingLimit: weeklySpendingLimit ? parseFloat(weeklySpendingLimit) : null,
          }),
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

      return NextResponse.json(
        { message: 'Buyer updated successfully', buyer: updatedBuyer },
        { status: 200 }
      )
    }

    // Buyer can update their own settings
    if (session.user.role === UserRole.BUYER) {
      if (buyer.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const {
        companyName,
        autoRechargeEnabled,
        autoRechargeThreshold,
        autoRechargeAmount,
      } = body

      const updatedBuyer = await prisma.buyer.update({
        where: { id: params.id },
        data: {
          ...(companyName && { companyName }),
          ...(autoRechargeEnabled !== undefined && { autoRechargeEnabled }),
          ...(autoRechargeThreshold !== undefined && {
            autoRechargeThreshold: parseFloat(autoRechargeThreshold),
          }),
          ...(autoRechargeAmount !== undefined && {
            autoRechargeAmount: parseFloat(autoRechargeAmount),
          }),
        },
      })

      return NextResponse.json(
        { message: 'Settings updated successfully', buyer: updatedBuyer },
        { status: 200 }
      )
    }

    return NextResponse.json({ error: 'Invalid user role' }, { status: 403 })
  } catch (error) {
    console.error('Update buyer error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating buyer' },
      { status: 500 }
    )
  }
}

// DELETE /api/buyers/[id] - Delete buyer (seller only)
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

    const buyer = await prisma.buyer.findUnique({
      where: { id: params.id },
    })

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    if (buyer.sellerId !== seller.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete by marking as inactive
    await prisma.buyer.update({
      where: { id: params.id },
      data: {
        status: 'INACTIVE',
      },
    })

    return NextResponse.json(
      { message: 'Buyer deactivated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete buyer error:', error)
    return NextResponse.json(
      { error: 'An error occurred while deleting buyer' },
      { status: 500 }
    )
  }
}
