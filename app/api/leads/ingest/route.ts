import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { distributeLeadToBuyers } from '@/lib/distribution-engine'

export async function POST(request: NextRequest) {
  try {
    // Authenticate supplier via API key
    const apiKey = request.headers.get('X-API-Key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401 }
      )
    }

    const supplier = await prisma.supplier.findUnique({
      where: { apiKey },
      include: {
        seller: true,
      },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    if (supplier.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Supplier account is not active' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { campaignId, categoryId, data, state, quality } = body

    // Validate required fields
    if (!campaignId || !categoryId || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: campaignId, categoryId, data' },
        { status: 400 }
      )
    }

    // Verify campaign exists and belongs to supplier's seller
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        category: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.sellerId !== supplier.sellerId) {
      return NextResponse.json(
        { error: 'Campaign does not belong to your seller' },
        { status: 403 }
      )
    }

    if (campaign.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Campaign is not active' },
        { status: 400 }
      )
    }

    // Verify category
    if (campaign.categoryId !== categoryId) {
      return NextResponse.json(
        { error: 'Category does not match campaign' },
        { status: 400 }
      )
    }

    // Verify supplier can submit to this category
    if (!supplier.categories.includes(categoryId)) {
      return NextResponse.json(
        { error: 'Supplier is not authorized to submit leads for this category' },
        { status: 403 }
      )
    }

    // Validate lead data against category fields
    const category = campaign.category
    const fields = category.fields as any[]

    for (const field of fields) {
      if (field.required && !data[field.name]) {
        return NextResponse.json(
          { error: `Missing required field: ${field.name}` },
          { status: 400 }
        )
      }
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        campaignId,
        supplierId: supplier.id,
        categoryId,
        data,
        state: state || null,
        quality: quality || 'WARM',
        status: 'PENDING',
      },
    })

    // Update supplier stats
    await prisma.supplier.update({
      where: { id: supplier.id },
      data: {
        leadsDelivered: { increment: 1 },
        lastDeliveryAt: new Date(),
      },
    })

    // Trigger distribution engine
    try {
      const assignedBuyerIds = await distributeLeadToBuyers(
        lead.id,
        campaignId,
        campaign.distributionLogic
      )

      return NextResponse.json(
        {
          success: true,
          leadId: lead.id,
          distributed: assignedBuyerIds.length > 0,
          buyersAssigned: assignedBuyerIds.length,
          message: assignedBuyerIds.length > 0
            ? `Lead distributed to ${assignedBuyerIds.length} buyer(s)`
            : 'Lead received but not distributed (no eligible buyers)',
        },
        { status: 201 }
      )
    } catch (distributionError) {
      console.error('Distribution error:', distributionError)
      // Lead was created but distribution failed
      return NextResponse.json(
        {
          success: true,
          leadId: lead.id,
          distributed: false,
          warning: 'Lead created but distribution failed',
        },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error('Lead ingestion error:', error)
    return NextResponse.json(
      { error: 'An error occurred while ingesting lead' },
      { status: 500 }
    )
  }
}
