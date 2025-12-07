import { prisma } from './prisma'
import { chargeCustomer } from './stripe'

export async function checkAndTriggerAutoRecharge(buyerId: string): Promise<boolean> {
  try {
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
      include: {
        paymentMethods: {
          where: { isPrimary: true },
        },
      },
    })

    if (!buyer) {
      console.error('Buyer not found for auto-recharge:', buyerId)
      return false
    }

    // Check if auto-recharge is enabled
    if (!buyer.autoRechargeEnabled) {
      return false
    }

    // Check if balance is below threshold
    if (buyer.walletBalance >= buyer.autoRechargeThreshold) {
      return false
    }

    // Check if we have a payment method
    if (!buyer.stripeCustomerId || buyer.paymentMethods.length === 0) {
      console.warn('No payment method for auto-recharge:', buyerId)
      return false
    }

    const paymentMethodId = buyer.paymentMethods[0].stripePaymentMethodId

    // Charge the customer
    const paymentIntent = await chargeCustomer(
      buyer.stripeCustomerId,
      buyer.autoRechargeAmount,
      'Wallet auto-recharge',
      paymentMethodId,
      {
        buyerId: buyer.id,
        type: 'auto_recharge',
      }
    )

    if (paymentIntent.status !== 'succeeded') {
      console.error('Auto-recharge payment failed:', paymentIntent.status)
      return false
    }

    // Update wallet balance
    const newBalance = buyer.walletBalance + buyer.autoRechargeAmount

    await prisma.buyer.update({
      where: { id: buyerId },
      data: { walletBalance: newBalance },
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        buyerId: buyer.id,
        type: 'AUTO_RECHARGE',
        amount: buyer.autoRechargeAmount,
        balanceBefore: buyer.walletBalance,
        balanceAfter: newBalance,
        description: 'Wallet auto-recharge',
        stripePaymentIntentId: paymentIntent.id,
      },
    })

    console.log(`Auto-recharge successful for buyer ${buyerId}: $${buyer.autoRechargeAmount}`)
    return true
  } catch (error) {
    console.error('Auto-recharge error:', error)
    return false
  }
}
