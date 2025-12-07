import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { stripe, attachPaymentMethod, detachPaymentMethod, setDefaultPaymentMethod, createStripeCustomer } from '@/lib/stripe'
import { UserRole } from '@prisma/client'

// GET /api/payments/methods - List payment methods
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== UserRole.BUYER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buyer = await prisma.buyer.findUnique({
      where: { userId: session.user.id },
      include: {
        paymentMethods: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    return NextResponse.json({ paymentMethods: buyer.paymentMethods }, { status: 200 })
  } catch (error) {
    console.error('Get payment methods error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching payment methods' },
      { status: 500 }
    )
  }
}

// POST /api/payments/methods - Add payment method
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== UserRole.BUYER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buyer = await prisma.buyer.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        paymentMethods: true,
      },
    })

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    const body = await request.json()
    const { paymentMethodId, setAsPrimary } = body

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      )
    }

    // Create Stripe customer if doesn't exist
    let stripeCustomerId = buyer.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await createStripeCustomer(
        buyer.user.email,
        buyer.user.name || buyer.companyName,
        {
          buyerId: buyer.id,
          userId: buyer.userId,
        }
      )
      stripeCustomerId = customer.id

      await prisma.buyer.update({
        where: { id: buyer.id },
        data: { stripeCustomerId },
      })
    }

    // Attach payment method to customer
    const paymentMethod = await attachPaymentMethod(paymentMethodId, stripeCustomerId)

    // If this is the first payment method or setAsPrimary is true, make it primary
    const isPrimary = setAsPrimary || buyer.paymentMethods.length === 0

    if (isPrimary) {
      // Unset other primary payment methods
      await prisma.paymentMethod.updateMany({
        where: { buyerId: buyer.id },
        data: { isPrimary: false },
      })

      // Set as default in Stripe
      await setDefaultPaymentMethod(stripeCustomerId, paymentMethodId)
    }

    // Save to database
    const savedPaymentMethod = await prisma.paymentMethod.create({
      data: {
        buyerId: buyer.id,
        stripePaymentMethodId: paymentMethod.id,
        brand: paymentMethod.card?.brand || 'unknown',
        last4: paymentMethod.card?.last4 || '0000',
        expMonth: paymentMethod.card?.exp_month || 0,
        expYear: paymentMethod.card?.exp_year || 0,
        isPrimary,
      },
    })

    return NextResponse.json(
      {
        message: 'Payment method added successfully',
        paymentMethod: savedPaymentMethod,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Add payment method error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while adding payment method' },
      { status: 500 }
    )
  }
}

// DELETE /api/payments/methods - Remove payment method
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
    const paymentMethodId = searchParams.get('id')

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      )
    }

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    })

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    if (paymentMethod.buyerId !== buyer.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Detach from Stripe
    await detachPaymentMethod(paymentMethod.stripePaymentMethodId)

    // Delete from database
    await prisma.paymentMethod.delete({
      where: { id: paymentMethodId },
    })

    return NextResponse.json(
      { message: 'Payment method removed successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Remove payment method error:', error)
    return NextResponse.json(
      { error: 'An error occurred while removing payment method' },
      { status: 500 }
    )
  }
}

// PUT /api/payments/methods - Update payment method (set as primary)
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
    const { paymentMethodId } = body

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      )
    }

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    })

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    if (paymentMethod.buyerId !== buyer.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Unset other primary payment methods
    await prisma.paymentMethod.updateMany({
      where: { buyerId: buyer.id },
      data: { isPrimary: false },
    })

    // Set this one as primary
    await prisma.paymentMethod.update({
      where: { id: paymentMethodId },
      data: { isPrimary: true },
    })

    // Update in Stripe
    if (buyer.stripeCustomerId) {
      await setDefaultPaymentMethod(
        buyer.stripeCustomerId,
        paymentMethod.stripePaymentMethodId
      )
    }

    return NextResponse.json(
      { message: 'Primary payment method updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update payment method error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating payment method' },
      { status: 500 }
    )
  }
}
