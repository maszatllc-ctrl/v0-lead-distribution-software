import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

// GET /api/categories - List categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role === UserRole.SELLER) {
      const seller = await prisma.seller.findUnique({
        where: { userId: session.user.id },
      })

      if (!seller) {
        return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
      }

      const categories = await prisma.category.findMany({
        where: {
          sellerId: seller.id,
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
      })

      return NextResponse.json({ categories }, { status: 200 })
    } else if (session.user.role === UserRole.BUYER) {
      // Buyers can see their seller's categories
      const buyer = await prisma.buyer.findUnique({
        where: { userId: session.user.id },
      })

      if (!buyer) {
        return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
      }

      const categories = await prisma.category.findMany({
        where: {
          sellerId: buyer.sellerId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
        },
        orderBy: {
          name: 'asc',
        },
      })

      return NextResponse.json({ categories }, { status: 200 })
    }

    return NextResponse.json({ error: 'Invalid user role' }, { status: 403 })
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create category (seller only)
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
    const { name, description, fields } = body

    if (!name || !fields) {
      return NextResponse.json(
        { error: 'Name and fields are required' },
        { status: 400 }
      )
    }

    // Check if category with same name already exists for this seller
    const existing = await prisma.category.findUnique({
      where: {
        sellerId_name: {
          sellerId: seller.id,
          name,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        sellerId: seller.id,
        name,
        description,
        fields,
      },
    })

    return NextResponse.json(
      { message: 'Category created successfully', category },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating category' },
      { status: 500 }
    )
  }
}
