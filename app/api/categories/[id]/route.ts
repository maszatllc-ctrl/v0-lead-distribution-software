import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

// GET /api/categories/[id] - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const category = await prisma.category.findUnique({
      where: { id: params.id },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Verify access
    if (session.user.role === UserRole.SELLER) {
      const seller = await prisma.seller.findUnique({
        where: { userId: session.user.id },
      })

      if (category.sellerId !== seller?.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (session.user.role === UserRole.BUYER) {
      const buyer = await prisma.buyer.findUnique({
        where: { userId: session.user.id },
      })

      if (category.sellerId !== buyer?.sellerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Return limited info for buyers
      return NextResponse.json({
        category: {
          id: category.id,
          name: category.name,
          description: category.description,
        },
      }, { status: 200 })
    }

    return NextResponse.json({ category }, { status: 200 })
  } catch (error) {
    console.error('Get category error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching category' },
      { status: 500 }
    )
  }
}

// PUT /api/categories/[id] - Update category (seller only)
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

    const category = await prisma.category.findUnique({
      where: { id: params.id },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    if (category.sellerId !== seller.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, fields, isActive } = body

    const updatedCategory = await prisma.category.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(fields && { fields }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(
      { message: 'Category updated successfully', category: updatedCategory },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update category error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating category' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - Delete category (seller only)
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

    const category = await prisma.category.findUnique({
      where: { id: params.id },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    if (category.sellerId !== seller.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if category is used in any campaigns
    const campaignsCount = await prisma.campaign.count({
      where: {
        categoryId: params.id,
        status: { not: 'ARCHIVED' },
      },
    })

    if (campaignsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category that is used in active campaigns' },
        { status: 400 }
      )
    }

    // Soft delete by marking as inactive
    await prisma.category.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json(
      { message: 'Category deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { error: 'An error occurred while deleting category' },
      { status: 500 }
    )
  }
}
