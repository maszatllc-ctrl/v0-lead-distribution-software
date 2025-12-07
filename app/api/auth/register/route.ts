import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateInviteCode } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, role, companyName, inviteCode } = body

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
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

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Handle registration based on role
    if (role === UserRole.SELLER) {
      // Create seller account
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: UserRole.SELLER,
          seller: {
            create: {
              companyName: companyName || name,
              inviteCode: generateInviteCode(),
              trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
              sellerSettings: {
                create: {
                  smsMarkup: parseFloat(process.env.DEFAULT_SMS_MARKUP || '0.20'),
                  emailMarkup: parseFloat(process.env.DEFAULT_EMAIL_MARKUP || '0.15'),
                  platformFeePercent: parseFloat(process.env.DEFAULT_PLATFORM_FEE_PERCENT || '5.0'),
                },
              },
            },
          },
        },
        include: {
          seller: true,
        },
      })

      return NextResponse.json(
        {
          message: 'Seller account created successfully',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            inviteCode: user.seller?.inviteCode,
          },
        },
        { status: 201 }
      )
    } else if (role === UserRole.BUYER) {
      // Validate invite code for buyer registration
      if (!inviteCode) {
        return NextResponse.json(
          { error: 'Invite code is required for buyer registration' },
          { status: 400 }
        )
      }

      // Find seller by invite code
      const seller = await prisma.seller.findUnique({
        where: { inviteCode },
      })

      if (!seller) {
        return NextResponse.json(
          { error: 'Invalid invite code' },
          { status: 400 }
        )
      }

      // Create buyer account
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
              priority: 5, // Default priority
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
          buyer: {
            include: {
              seller: true,
            },
          },
        },
      })

      return NextResponse.json(
        {
          message: 'Buyer account created successfully',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            sellerId: user.buyer?.sellerId,
          },
        },
        { status: 201 }
      )
    } else {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}
