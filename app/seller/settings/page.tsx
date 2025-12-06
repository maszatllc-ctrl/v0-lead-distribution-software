"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Eye, EyeOff, Pencil, Trash2, Plus, CreditCard, CheckCircle2, Download } from "lucide-react"
import { toast } from "sonner"

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  status: "active" | "pending"
}

interface PaymentMethod {
  id: string
  type: string
  last4: string
  expiry: string
  isPrimary: boolean
}

const initialTeam: TeamMember[] = [
  { id: "1", name: "John Smith", email: "john@leadflow.com", role: "Admin", status: "active" },
  { id: "2", name: "Sarah Johnson", email: "sarah@leadflow.com", role: "Manager", status: "active" },
  { id: "3", name: "Mike Wilson", email: "mike@leadflow.com", role: "Member", status: "pending" },
]

const initialPaymentHistory = [
  { id: "1", date: "2025-01-01", amount: 99.0, status: "paid", invoice: "INV-2025-001" },
  { id: "2", date: "2024-12-01", amount: 99.0, status: "paid", invoice: "INV-2024-012" },
  { id: "3", date: "2024-11-01", amount: 99.0, status: "paid", invoice: "INV-2024-011" },
  { id: "4", date: "2024-10-01", amount: 99.0, status: "paid", invoice: "INV-2024-010" },
]

export default function SellerSettings() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile")

  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [profile, setProfile] = useState({
    name: "Seller Account",
    email: "seller@leadflow.com",
  })

  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [integrations, setIntegrations] = useState({
    stripe: false,
    twilio: false,
    sendgrid: false,
  })

  const [team, setTeam] = useState<TeamMember[]>(initialTeam)
  const [showAddMember, setShowAddMember] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "Member" })

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: "1", type: "Visa", last4: "4242", expiry: "12/2026", isPrimary: true },
  ])
  const [paymentHistory] = useState(initialPaymentHistory)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [showEditPayment, setShowEditPayment] = useState(false)
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null)
  const [newPaymentInfo, setNewPaymentInfo] = useState({ cardNumber: "", expiry: "", cvc: "" })
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [billingInfo, setBillingInfo] = useState({
    email: "seller@leadflow.com",
    company: "LeadFlow Inc.",
    address: "123 Main St, Austin, TX 78701",
  })
  const [showUpdateBilling, setShowUpdateBilling] = useState(false)
  const [editBillingInfo, setEditBillingInfo] = useState({ ...billingInfo })

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = () => {
    toast.success("Profile saved successfully")
  }

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    setShowPasswordChange(false)
    setNewPassword("")
    setConfirmPassword("")
    toast.success("Password changed successfully")
  }

  const handleToggleIntegration = (key: keyof typeof integrations) => {
    setIntegrations((prev) => ({ ...prev, [key]: !prev[key] }))
    toast.success(
      `${key.charAt(0).toUpperCase() + key.slice(1)} ${integrations[key] ? "disconnected" : "connected"} successfully`,
    )
  }

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email) {
      toast.error("Please fill in all fields")
      return
    }
    setTeam([
      ...team,
      {
        id: Date.now().toString(),
        ...newMember,
        status: "pending",
      },
    ])
    setNewMember({ name: "", email: "", role: "Member" })
    setShowAddMember(false)
    toast.success("Team member invited successfully")
  }

  const handleEditMember = () => {
    if (!editingMember) return
    setTeam(team.map((m) => (m.id === editingMember.id ? editingMember : m)))
    setEditingMember(null)
    toast.success("Team member updated successfully")
  }

  const handleRemoveMember = (id: string) => {
    setTeam(team.filter((m) => m.id !== id))
    toast.success("Team member removed successfully")
  }

  const handleAddPaymentMethod = () => {
    if (!newPaymentInfo.cardNumber || !newPaymentInfo.expiry || !newPaymentInfo.cvc) {
      toast.error("Please fill in all card details")
      return
    }
    const isFirst = paymentMethods.length === 0
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: "Visa",
      last4: newPaymentInfo.cardNumber.slice(-4),
      expiry: newPaymentInfo.expiry,
      isPrimary: isFirst,
    }
    setPaymentMethods([...paymentMethods, newMethod])
    setNewPaymentInfo({ cardNumber: "", expiry: "", cvc: "" })
    setShowAddPayment(false)
    toast.success("Payment method added successfully")
  }

  const handleSetPrimaryPayment = (id: string) => {
    setPaymentMethods(
      paymentMethods.map((pm) => ({
        ...pm,
        isPrimary: pm.id === id,
      })),
    )
    toast.success("Primary payment method updated")
  }

  const handleDeletePaymentMethod = (id: string) => {
    const methodToDelete = paymentMethods.find((pm) => pm.id === id)
    const remaining = paymentMethods.filter((pm) => pm.id !== id)

    if (methodToDelete?.isPrimary && remaining.length > 0) {
      remaining[0].isPrimary = true
    }

    setPaymentMethods(remaining)
    toast.success("Payment method removed")
  }

  const handleUpdatePayment = () => {
    if (!editingPayment) return
    setPaymentMethods(
      paymentMethods.map((pm) =>
        pm.id === editingPayment.id
          ? {
              ...pm,
              last4: newPaymentInfo.cardNumber.slice(-4) || pm.last4,
              expiry: newPaymentInfo.expiry || pm.expiry,
            }
          : pm,
      ),
    )
    setShowEditPayment(false)
    setEditingPayment(null)
    setNewPaymentInfo({ cardNumber: "", expiry: "", cvc: "" })
    toast.success("Payment method updated successfully")
  }

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

  const handleUpdateBilling = () => {
    setBillingInfo({ ...editBillingInfo })
    setShowUpdateBilling(false)
    toast.success("Billing information updated successfully")
  }

  return (
    <DashboardLayout userType="seller" profileImage={profileImage}>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Profile Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">Update your profile information</p>
              </div>

              <Separator />

              {/* Profile Image */}
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profileImage || undefined} />
                  <AvatarFallback className="text-xl">SE</AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                      <Camera className="w-4 h-4" />
                      <span className="text-sm">Change Photo</span>
                    </div>
                  </Label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile}>Save Changes</Button>

              <Separator />

              {/* Password Change */}
              <div className="space-y-4">
                {!showPasswordChange ? (
                  <Button variant="outline" onClick={() => setShowPasswordChange(true)}>
                    Change Password
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleChangePassword}>Update Password</Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowPasswordChange(false)
                          setNewPassword("")
                          setConfirmPassword("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Integrations</h2>
                <p className="text-sm text-muted-foreground mt-1">Connect third-party services</p>
              </div>

              <Separator />

              <div className="space-y-4">
                {/* Stripe */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#635BFF] rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">S</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Stripe</h3>
                      <p className="text-sm text-muted-foreground">Payment processing</p>
                    </div>
                  </div>
                  <Switch checked={integrations.stripe} onCheckedChange={() => handleToggleIntegration("stripe")} />
                </div>

                {/* Twilio */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#F22F46] rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">T</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Twilio</h3>
                      <p className="text-sm text-muted-foreground">SMS notifications</p>
                    </div>
                  </div>
                  <Switch checked={integrations.twilio} onCheckedChange={() => handleToggleIntegration("twilio")} />
                </div>

                {/* SendGrid */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#1A82E2] rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">SG</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">SendGrid</h3>
                      <p className="text-sm text-muted-foreground">Email notifications</p>
                    </div>
                  </div>
                  <Switch checked={integrations.sendgrid} onCheckedChange={() => handleToggleIntegration("sendgrid")} />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
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
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Payment Methods</h2>
                    <p className="text-sm text-muted-foreground mt-1">Manage your payment details</p>
                  </div>
                  <Button size="sm" onClick={() => setShowAddPayment(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>

                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="p-4 border border-border rounded-lg flex items-center gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <CreditCard className="w-6 h-6 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {method.type} ending in {method.last4}
                          </p>
                          {method.isPrimary && (
                            <Badge variant="outline" className="text-xs">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Expires {method.expiry}</p>
                      </div>
                      <div className="flex gap-2">
                        {!method.isPrimary && (
                          <Button size="sm" variant="outline" onClick={() => handleSetPrimaryPayment(method.id)}>
                            Set Primary
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingPayment(method)
                            setShowEditPayment(true)
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeletePaymentMethod(method.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-4">
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
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Team Members</h2>
                  <p className="text-sm text-muted-foreground mt-1">Manage your team access</p>
                </div>
                <Button onClick={() => setShowAddMember(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Member
                </Button>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Role</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.map((member) => (
                      <TableRow key={member.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-foreground">{member.name}</TableCell>
                        <TableCell className="text-muted-foreground">{member.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              member.status === "active"
                                ? "bg-green-500/10 text-green-600 border-green-500/20"
                                : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                            }
                          >
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setEditingMember(member)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleRemoveMember(member.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Member Dialog */}
        <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>Invite a new member to your team.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="member-name">Name</Label>
                <Input
                  id="member-name"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-email">Email</Label>
                <Input
                  id="member-email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-role">Role</Label>
                <Select value={newMember.role} onValueChange={(v) => setNewMember({ ...newMember, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowAddMember(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMember}>Send Invite</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Member Dialog */}
        <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>Update team member details.</DialogDescription>
            </DialogHeader>
            {editingMember && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingMember.email}
                    onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={editingMember.role}
                    onValueChange={(v) => setEditingMember({ ...editingMember, role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setEditingMember(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditMember}>Save Changes</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Payment Method Dialog */}
        <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>Enter your card details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="add-card-number">Card Number</Label>
                <Input
                  id="add-card-number"
                  placeholder="4242 4242 4242 4242"
                  value={newPaymentInfo.cardNumber}
                  onChange={(e) => setNewPaymentInfo({ ...newPaymentInfo, cardNumber: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="add-expiry">Expiry Date</Label>
                  <Input
                    id="add-expiry"
                    placeholder="MM/YY"
                    value={newPaymentInfo.expiry}
                    onChange={(e) => setNewPaymentInfo({ ...newPaymentInfo, expiry: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-cvc">CVC</Label>
                  <Input
                    id="add-cvc"
                    placeholder="123"
                    value={newPaymentInfo.cvc}
                    onChange={(e) => setNewPaymentInfo({ ...newPaymentInfo, cvc: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowAddPayment(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPaymentMethod}>Add Card</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Payment Method Dialog */}
        <Dialog open={showEditPayment} onOpenChange={setShowEditPayment}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Payment Method</DialogTitle>
              <DialogDescription>Enter your new card details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-card-number">Card Number</Label>
                <Input
                  id="edit-card-number"
                  placeholder="4242 4242 4242 4242"
                  value={newPaymentInfo.cardNumber}
                  onChange={(e) => setNewPaymentInfo({ ...newPaymentInfo, cardNumber: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-expiry">Expiry Date</Label>
                  <Input
                    id="edit-expiry"
                    placeholder="MM/YY"
                    value={newPaymentInfo.expiry}
                    onChange={(e) => setNewPaymentInfo({ ...newPaymentInfo, expiry: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-cvc">CVC</Label>
                  <Input
                    id="edit-cvc"
                    placeholder="123"
                    value={newPaymentInfo.cvc}
                    onChange={(e) => setNewPaymentInfo({ ...newPaymentInfo, cvc: e.target.value })}
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
      </div>
    </DashboardLayout>
  )
}
