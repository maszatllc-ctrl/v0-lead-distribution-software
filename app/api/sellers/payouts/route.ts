import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { calculateSellerPayout } from '@/lib/payouts'
import { UserRole } from '@prisma/client'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

// GET /api/sellers/payouts - Get payout information
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
    const period = searchParams.get('period') || 'current'

    let startDate: Date
    let endDate: Date

    if (period === 'current') {
      // Current month
      startDate = startOfMonth(new Date())
      endDate = endOfMonth(new Date())
    } else if (period === 'last') {
      // Last month
      const lastMonth = subMonths(new Date(), 1)
      startDate = startOfMonth(lastMonth)
      endDate = endOfMonth(lastMonth)
    } else {
      // Custom period (expects startDate and endDate params)
      const start = searchParams.get('startDate')
      const end = searchParams.get('endDate')

      if (!start || !end) {
        return NextResponse.json(
          { error: 'Start and end dates required for custom period' },
          { status: 400 }
        )
      }

      startDate = new Date(start)
      endDate = new Date(end)
    }

    const payout = await calculateSellerPayout(seller.id, startDate, endDate)

    return NextResponse.json(
      {
        period: {
          start: startDate,
          end: endDate,
        },
        ...payout,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get payouts error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching payouts' },
      { status: 500 }
    )
  }
}
