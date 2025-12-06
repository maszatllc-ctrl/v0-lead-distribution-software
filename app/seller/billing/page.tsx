"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CreditCard, Download, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface PaymentMethod {
  id: string
  type: string
  last4: string
  expiry: string
  isPrimary: boolean
}

const initialPaymentHistory = [
  { id: "1", date: "2025-01-01", amount: 99.0, status: "paid", invoice: "INV-2025-001" },
  { id: "2", date: "2024-12-01", amount: 99.0, status: "paid", invoice: "INV-2024-012" },
  { id: "3", date: "2024-11-01", amount: 99.0, status: "paid", invoice: "INV-2024-011" },
  { id: "4", date: "2024-10-01", amount: 99.0, status: "paid", invoice: "INV-2024-010" },
]

export default function SellerBilling() {
  const [paymentHistory] = useState(initialPaymentHistory)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    id: "1",
    type: "Visa",
    last4: "4242",
    expiry: "12/2026",
    isPrimary: true,
  })
  const [showEditPayment, setShowEditPayment] = useState(false)
  const [showUpdateBilling, setShowUpdateBilling] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showCancel, setShowCancel] = useState(false)

  const [billingInfo, setBillingInfo] = useState({
    email: "seller@leadflow.com",
    company: "LeadFlow Inc.",
    address: "123 Main St, Austin, TX 78701",
  })

  const [editBillingInfo, setEditBillingInfo] = useState({ ...billingInfo })
  const [editPaymentInfo, setEditPaymentInfo] = useState({
    cardNumber: "",
    expiry: "",
    cvc: "",
  })

  const handleDownloadInvoice = (invoice: string) => {
    toast.success(`Downloading ${invoice}...`)
  }

  const handleUpgradePlan = () => {
    setShowUpgrade(false)
    toast.success("Plan upgraded successfully")
  }

  const handleCancelSubscription = () => {
    setShowCancel(false)
    toast.success("Subscription cancelled. You will have access until the end of your billing period.")
  }

  const handleUpdatePayment = () => {
    setPaymentMethod({
      ...paymentMethod,
      last4: editPaymentInfo.cardNumber.slice(-4) || paymentMethod.last4,
      expiry: editPaymentInfo.expiry || paymentMethod.expiry,
    })
    setShowEditPayment(false)
    setEditPaymentInfo({ cardNumber: "", expiry: "", cvc: "" })
    toast.success("Payment method updated successfully")
  }

  const handleUpdateBilling = () => {
    setBillingInfo({ ...editBillingInfo })
    setShowUpdateBilling(false)
    toast.success("Billing information updated successfully")
  }

  return (
    <DashboardLayout userType="seller">
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing</h1>
          <p className="text-muted-foreground mt-1">Manage your subscription and payment information.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Current Plan</h2>
              <p className="text-sm text-muted-foreground mt-1">Your subscription details</p>
            </div>

            <div className="p-4 border border-border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Pro Plan</h3>
                  <p className="text-sm text-muted-foreground mt-1">Perfect for growing businesses</p>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  Active
                </Badge>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">$99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-foreground">Unlimited buyers</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-foreground">Unlimited leads</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-foreground">Advanced analytics</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-foreground">Priority support</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => setShowUpgrade(true)}>
                Upgrade Plan
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowCancel(true)}>
                Cancel Subscription
              </Button>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Payment Method</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage your payment details</p>
            </div>

            <div className="p-4 border border-border rounded-lg flex items-center gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <CreditCard className="w-6 h-6 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {paymentMethod.type} ending in {paymentMethod.last4}
                </p>
                <p className="text-sm text-muted-foreground">Expires {paymentMethod.expiry}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowEditPayment(true)}>
                Edit
              </Button>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground">Billing Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground">{billingInfo.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company</span>
                  <span className="text-foreground">{billingInfo.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span className="text-foreground text-right">{billingInfo.address}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent"
                onClick={() => {
                  setEditBillingInfo({ ...billingInfo })
                  setShowUpdateBilling(true)
                }}
              >
                Update Billing Info
              </Button>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">Payment History</h2>
            <p className="text-sm text-muted-foreground mt-1">View and download your past invoices</p>
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Invoice</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-muted/30">
                    <TableCell className="text-foreground">{payment.date}</TableCell>
                    <TableCell className="font-semibold text-foreground">${payment.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{payment.invoice}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 bg-transparent"
                        onClick={() => handleDownloadInvoice(payment.invoice)}
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Edit Payment Method Dialog */}
        <Dialog open={showEditPayment} onOpenChange={setShowEditPayment}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Payment Method</DialogTitle>
              <DialogDescription>Enter your new card details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="card-number">Card Number</Label>
                <Input
                  id="card-number"
                  placeholder="4242 4242 4242 4242"
                  value={editPaymentInfo.cardNumber}
                  onChange={(e) => setEditPaymentInfo({ ...editPaymentInfo, cardNumber: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={editPaymentInfo.expiry}
                    onChange={(e) => setEditPaymentInfo({ ...editPaymentInfo, expiry: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input
                    id="cvc"
                    placeholder="123"
                    value={editPaymentInfo.cvc}
                    onChange={(e) => setEditPaymentInfo({ ...editPaymentInfo, cvc: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowEditPayment(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdatePayment}>Update Card</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Update Billing Info Dialog */}
        <Dialog open={showUpdateBilling} onOpenChange={setShowUpdateBilling}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Billing Information</DialogTitle>
              <DialogDescription>Update your billing details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="billing-email">Email</Label>
                <Input
                  id="billing-email"
                  type="email"
                  value={editBillingInfo.email}
                  onChange={(e) => setEditBillingInfo({ ...editBillingInfo, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="billing-company">Company</Label>
                <Input
                  id="billing-company"
                  value={editBillingInfo.company}
                  onChange={(e) => setEditBillingInfo({ ...editBillingInfo, company: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="billing-address">Address</Label>
                <Input
                  id="billing-address"
                  value={editBillingInfo.address}
                  onChange={(e) => setEditBillingInfo({ ...editBillingInfo, address: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowUpdateBilling(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateBilling}>Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upgrade Plan Dialog */}
        <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upgrade Plan</DialogTitle>
              <DialogDescription>Choose a plan that works best for you.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="p-4 border-2 border-primary rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Enterprise Plan</h3>
                    <p className="text-sm text-muted-foreground">For large scale operations</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">$299</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowUpgrade(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpgradePlan}>Upgrade Now</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Subscription Dialog */}
        <Dialog open={showCancel} onOpenChange={setShowCancel}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Subscription</DialogTitle>
              <DialogDescription>Are you sure you want to cancel your subscription?</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                You will lose access to all premium features at the end of your current billing period.
              </p>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowCancel(false)}>
                  Keep Subscription
                </Button>
                <Button variant="destructive" onClick={handleCancelSubscription}>
                  Yes, Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
