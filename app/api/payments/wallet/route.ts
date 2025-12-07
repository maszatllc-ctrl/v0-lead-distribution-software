import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { chargeCustomer } from '@/lib/stripe'
import { UserRole } from '@prisma/client'

// GET /api/payments/wallet - Get wallet balance and transactions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== UserRole.BUYER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buyer = await prisma.buyer.findUnique({
      where: { userId: session.user.id },
      include: {
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        },
      },
    })

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    return NextResponse.json(
      {
        balance: buyer.walletBalance,
        autoRechargeEnabled: buyer.autoRechargeEnabled,
        autoRechargeThreshold: buyer.autoRechargeThreshold,
        autoRechargeAmount: buyer.autoRechargeAmount,
        transactions: buyer.transactions,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get wallet error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching wallet' },
      { status: 500 }
    )
  }
}

// POST /api/payments/wallet - Add funds to wallet
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== UserRole.BUYER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buyer = await prisma.buyer.findUnique({
      where: { userId: session.user.id },
      include: {
        paymentMethods: {
          where: { isPrimary: true },
        },
      },
    })

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    if (!buyer.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer ID found' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { amount, paymentMethodId, isAutoRecharge } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Use provided payment method or primary
    let pmId = paymentMethodId
    if (!pmId && buyer.paymentMethods.length > 0) {
      pmId = buyer.paymentMethods[0].stripePaymentMethodId
    }

    if (!pmId) {
      return NextResponse.json(
        { error: 'No payment method available' },
        { status: 400 }
      )
    }

    // Charge customer
    const paymentIntent = await chargeCustomer(
      buyer.stripeCustomerId,
      amount,
      `Wallet recharge${isAutoRecharge ? ' (Auto)' : ''}`,
      pmId,
      {
        buyerId: buyer.id,
        type: isAutoRecharge ? 'auto_recharge' : 'manual',
      }
    )

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment failed', details: paymentIntent.status },
        { status: 400 }
      )
    }

    // Update wallet balance
    const newBalance = buyer.walletBalance + amount

    await prisma.buyer.update({
      where: { id: buyer.id },
      data: { walletBalance: newBalance },
    })

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        buyerId: buyer.id,
        type: isAutoRecharge ? 'AUTO_RECHARGE' : 'CREDIT',
        amount,
        balanceBefore: buyer.walletBalance,
        balanceAfter: newBalance,
        description: `Wallet recharge${isAutoRecharge ? ' (Auto)' : ''}`,
        stripePaymentIntentId: paymentIntent.id,
      },
    })

    return NextResponse.json(
      {
        message: 'Funds added successfully',
        balance: newBalance,
        transaction,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Add funds error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while adding funds' },
      { status: 500 }
    )
  }
}

// PUT /api/payments/wallet - Update auto-recharge settings
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
    const { autoRechargeEnabled, autoRechargeThreshold, autoRechargeAmount } = body

    const updatedBuyer = await prisma.buyer.update({
      where: { id: buyer.id },
      data: {
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
      {
        message: 'Auto-recharge settings updated successfully',
        autoRechargeEnabled: updatedBuyer.autoRechargeEnabled,
        autoRechargeThreshold: updatedBuyer.autoRechargeThreshold,
        autoRechargeAmount: updatedBuyer.autoRechargeAmount,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update auto-recharge error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating auto-recharge settings' },
      { status: 500 }
    )
  }
}
