"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Plus, Edit, Trash2, DollarSign, Package, TrendingUp, Minus } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
]

const LEAD_CATEGORIES = ["Term Life", "Final Expense", "Mortgage Protection", "IUL", "Whole Life"]

const CATEGORY_PRICES: Record<string, number> = {
  "Term Life": 45.0,
  "Final Expense": 38.5,
  "Mortgage Protection": 48.0,
  IUL: 68.0,
  "Whole Life": 55.0,
}

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: "credit" | "debit"
}

interface Campaign {
  id: string
  name: string
  status: "active" | "paused"
  category: string
  dailyCap: number | null
  states: string[]
  price: number
}

interface Lead {
  id: string
  timestamp: string
  leadName: string
  category: string
  price: number
}

const initialTransactions: Transaction[] = [
  { id: "1", date: "2025-01-26", description: "Credits Added", amount: 500.0, type: "credit" },
  { id: "2", date: "2025-01-26", description: "Lead Purchase - John Smith", amount: -45.0, type: "debit" },
  { id: "3", date: "2025-01-25", description: "Lead Purchase - Sarah Johnson", amount: -38.5, type: "debit" },
  { id: "4", date: "2025-01-25", description: "Credits Added", amount: 1000.0, type: "credit" },
  { id: "5", date: "2025-01-24", description: "Lead Purchase - Michael Chen", amount: -52.0, type: "debit" },
]

const initialLeads: Lead[] = [
  { id: "1", timestamp: "2025-01-26 14:32", leadName: "John Smith", category: "Term Life", price: 45.0 },
  { id: "2", timestamp: "2025-01-26 13:15", leadName: "Sarah Johnson", category: "Final Expense", price: 38.5 },
  { id: "3", timestamp: "2025-01-25 16:44", leadName: "Michael Chen", category: "IUL", price: 52.0 },
  { id: "4", timestamp: "2025-01-25 14:12", leadName: "Emily Davis", category: "Term Life", price: 45.0 },
]

const initialCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Term Life - Texas",
    status: "active",
    category: "Term Life",
    dailyCap: 10,
    states: ["TX"],
    price: 45.0,
  },
  {
    id: "2",
    name: "Final Expense - Florida",
    status: "paused",
    category: "Final Expense",
    dailyCap: 5,
    states: ["FL"],
    price: 38.5,
  },
  {
    id: "3",
    name: "IUL - California",
    status: "active",
    category: "IUL",
    dailyCap: 8,
    states: ["CA"],
    price: 68.0,
  },
]

export default function BuyerDetails() {
  const [isActive, setIsActive] = useState(true)
  const [walletBalance, setWalletBalance] = useState(2450.0)
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [leads] = useState<Lead[]>(initialLeads)
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)

  // Dialog states
  const [showAddCredits, setShowAddCredits] = useState(false)
  const [showDeductCredits, setShowDeductCredits] = useState(false)
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [showEditCampaign, setShowEditCampaign] = useState(false)
  const [showDeleteCampaign, setShowDeleteCampaign] = useState(false)

  // Form states
  const [creditAmount, setCreditAmount] = useState("")
  const [deductAmount, setDeductAmount] = useState("")
  const [deductReason, setDeductReason] = useState("")
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    category: "",
    dailyCap: "",
    states: [] as string[],
    status: true,
  })

  const handleAddCredits = () => {
    const amount = Number.parseFloat(creditAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      description: "Credits Added",
      amount: amount,
      type: "credit",
    }

    setTransactions([newTransaction, ...transactions])
    setWalletBalance((prev) => prev + amount)
    setCreditAmount("")
    setShowAddCredits(false)
    toast.success(`$${amount.toFixed(2)} credits added successfully`)
  }

  const handleDeductCredits = () => {
    const amount = Number.parseFloat(deductAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (amount > walletBalance) {
      toast.error("Insufficient balance")
      return
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      description: deductReason || "Balance Deduction",
      amount: -amount,
      type: "debit",
    }

    setTransactions([newTransaction, ...transactions])
    setWalletBalance((prev) => prev - amount)
    setDeductAmount("")
    setDeductReason("")
    setShowDeductCredits(false)
    toast.success(`$${amount.toFixed(2)} deducted from balance`)
  }

  const toggleCampaignStatus = (id: string) => {
    setCampaigns(
      campaigns.map((campaign) =>
        campaign.id === id ? { ...campaign, status: campaign.status === "active" ? "paused" : "active" } : campaign,
      ),
    )
    toast.success("Campaign status updated")
  }

  const openCreateCampaign = () => {
    setCampaignForm({
      name: "",
      category: "",
      dailyCap: "",
      states: [],
      status: true,
    })
    setShowCreateCampaign(true)
  }

  const openEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setCampaignForm({
      name: campaign.name,
      category: campaign.category,
      dailyCap: campaign.dailyCap?.toString() || "",
      states: [...campaign.states],
      status: campaign.status === "active",
    })
    setShowEditCampaign(true)
  }

  const openDeleteCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setShowDeleteCampaign(true)
  }

  const handleCreateCampaign = () => {
    if (!campaignForm.name || !campaignForm.category) {
      toast.error("Please fill in required fields")
      return
    }

    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: campaignForm.name,
      status: campaignForm.status ? "active" : "paused",
      category: campaignForm.category,
      dailyCap: campaignForm.dailyCap ? Number.parseInt(campaignForm.dailyCap) : null,
      states: campaignForm.states,
      price: CATEGORY_PRICES[campaignForm.category] || 45.0,
    }

    setCampaigns([...campaigns, newCampaign])
    setShowCreateCampaign(false)
    toast.success("Campaign created successfully")
  }

  const handleEditCampaign = () => {
    if (!selectedCampaign || !campaignForm.name || !campaignForm.category) {
      toast.error("Please fill in required fields")
      return
    }

    setCampaigns(
      campaigns.map((c) =>
        c.id === selectedCampaign.id
          ? {
              ...c,
              name: campaignForm.name,
              category: campaignForm.category,
              dailyCap: campaignForm.dailyCap ? Number.parseInt(campaignForm.dailyCap) : null,
              states: campaignForm.states,
              status: campaignForm.status ? "active" : "paused",
              price: CATEGORY_PRICES[campaignForm.category] || 45.0,
            }
          : c,
      ),
    )
    setShowEditCampaign(false)
    setSelectedCampaign(null)
    toast.success("Campaign updated successfully")
  }

  const handleDeleteCampaign = () => {
    if (!selectedCampaign) return

    setCampaigns(campaigns.filter((c) => c.id !== selectedCampaign.id))
    setShowDeleteCampaign(false)
    setSelectedCampaign(null)
    toast.success("Campaign deleted successfully")
  }

  const toggleState = (state: string) => {
    if (campaignForm.states.includes(state)) {
      setCampaignForm({ ...campaignForm, states: campaignForm.states.filter((s) => s !== state) })
    } else {
      setCampaignForm({ ...campaignForm, states: [...campaignForm.states, state] })
    }
  }

  const selectAllStates = () => {
    setCampaignForm({ ...campaignForm, states: [...US_STATES] })
  }

  const clearAllStates = () => {
    setCampaignForm({ ...campaignForm, states: [] })
  }

  const activeCampaignsCount = campaigns.filter((c) => c.status === "active").length

  // Campaign Form Dialog Content
  const CampaignFormContent = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
      <div className="grid gap-2">
        <Label htmlFor="campaign-name">Campaign Name *</Label>
        <Input
          id="campaign-name"
          placeholder="e.g., Term Life - Texas"
          value={campaignForm.name}
          onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label>Lead Category *</Label>
        <Select
          value={campaignForm.category}
          onValueChange={(value) => setCampaignForm({ ...campaignForm, category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {LEAD_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category} - ${CATEGORY_PRICES[category]?.toFixed(2)}/lead
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="daily-cap">Daily Cap (leave empty for unlimited)</Label>
        <Input
          id="daily-cap"
          type="number"
          placeholder="e.g., 10"
          min="1"
          value={campaignForm.dailyCap}
          onChange={(e) => setCampaignForm({ ...campaignForm, dailyCap: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>States</Label>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={selectAllStates}>
              Select All
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={clearAllStates}>
              Clear All
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-10 gap-1 p-3 border border-border rounded-lg max-h-40 overflow-y-auto">
          {US_STATES.map((state) => (
            <label
              key={state}
              className={`flex items-center justify-center p-2 rounded cursor-pointer text-xs font-medium transition-colors ${
                campaignForm.states.includes(state)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
              onClick={() => toggleState(state)}
            >
              {state}
            </label>
          ))}
        </div>
        {campaignForm.states.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {campaignForm.states.length === US_STATES.length
              ? "All States"
              : `${campaignForm.states.length} state(s) selected`}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Label>Status</Label>
        <Switch
          checked={campaignForm.status}
          onCheckedChange={(checked) => setCampaignForm({ ...campaignForm, status: checked })}
        />
        <span className="text-sm text-muted-foreground">{campaignForm.status ? "Active" : "Paused"}</span>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={() => (isEdit ? setShowEditCampaign(false) : setShowCreateCampaign(false))}>
          Cancel
        </Button>
        <Button onClick={isEdit ? handleEditCampaign : handleCreateCampaign}>
          {isEdit ? "Save Changes" : "Create Campaign"}
        </Button>
      </div>
    </div>
  )

  return (
    <DashboardLayout userType="seller">
      <div className="p-8 space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/seller/buyers">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">ABC Insurance</h1>
            <p className="text-muted-foreground mt-1">Buyer account details and management</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <span className="text-sm font-medium text-foreground">{isActive ? "Active" : "Paused"}</span>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leads">Leads Purchased</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Wallet Balance</p>
                </div>
                <p className="text-3xl font-semibold text-foreground">${walletBalance.toFixed(2)}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Leads Purchased</p>
                </div>
                <p className="text-3xl font-semibold text-foreground">{leads.length}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                </div>
                <p className="text-3xl font-semibold text-foreground">{activeCampaignsCount}</p>
              </Card>
            </div>

            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Wallet & Transactions</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage buyer credits and view transaction history
                  </p>
                </div>
                <div className="flex gap-2">
                  {/* Add Credits Dialog */}
                  <Dialog open={showAddCredits} onOpenChange={setShowAddCredits}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Credits
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Credits to Buyer</DialogTitle>
                        <DialogDescription>Add credits to the buyer's wallet balance.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="credit-amount">Amount ($)</Label>
                          <Input
                            id="credit-amount"
                            type="number"
                            placeholder="500.00"
                            min="0"
                            step="0.01"
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button variant="outline" onClick={() => setShowAddCredits(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddCredits}>Add Credits</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Deduct Credits Dialog */}
                  <Dialog open={showDeductCredits} onOpenChange={setShowDeductCredits}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2 bg-transparent">
                        <Minus className="w-4 h-4" />
                        Deduct Balance
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Deduct from Balance</DialogTitle>
                        <DialogDescription>Deduct credits from the buyer's wallet balance.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="deduct-amount">Amount ($)</Label>
                          <Input
                            id="deduct-amount"
                            type="number"
                            placeholder="100.00"
                            min="0"
                            step="0.01"
                            value={deductAmount}
                            onChange={(e) => setDeductAmount(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deduct-reason">Reason (optional)</Label>
                          <Input
                            id="deduct-reason"
                            placeholder="e.g., Refund, Adjustment"
                            value={deductReason}
                            onChange={(e) => setDeductReason(e.target.value)}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Current balance: <span className="font-semibold">${walletBalance.toFixed(2)}</span>
                        </p>
                        <div className="flex justify-end gap-3">
                          <Button variant="outline" onClick={() => setShowDeductCredits(false)}>
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={handleDeductCredits}>
                            Deduct
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="font-semibold text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id} className="hover:bg-muted/30">
                        <TableCell className="text-muted-foreground">{transaction.date}</TableCell>
                        <TableCell className="text-foreground">{transaction.description}</TableCell>
                        <TableCell
                          className={`text-right font-semibold ${transaction.type === "credit" ? "text-green-600" : "text-red-600"}`}
                        >
                          {transaction.type === "credit" ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="space-y-6">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">Leads Purchased</h2>
                <p className="text-sm text-muted-foreground mt-1">All leads purchased by this buyer</p>
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Timestamp</TableHead>
                      <TableHead className="font-semibold">Lead Name</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id} className="hover:bg-muted/30">
                        <TableCell className="text-muted-foreground">{lead.timestamp}</TableCell>
                        <TableCell className="font-medium text-foreground">{lead.leadName}</TableCell>
                        <TableCell className="text-foreground">
                          <Badge variant="outline">{lead.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          ${lead.price.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Buyer Campaigns</h2>
                  <p className="text-sm text-muted-foreground mt-1">Manage campaigns for this buyer</p>
                </div>
                <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" onClick={openCreateCampaign}>
                      <Plus className="w-4 h-4" />
                      Create Campaign
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Create Campaign</DialogTitle>
                      <DialogDescription>Create a new campaign for this buyer.</DialogDescription>
                    </DialogHeader>
                    <CampaignFormContent isEdit={false} />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Campaign Name</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Daily Cap</TableHead>
                      <TableHead className="font-semibold">States</TableHead>
                      <TableHead className="font-semibold">Price</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Switch
                            checked={campaign.status === "active"}
                            onCheckedChange={() => toggleCampaignStatus(campaign.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{campaign.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{campaign.category}</Badge>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {campaign.dailyCap ? `${campaign.dailyCap} leads/day` : "Unlimited"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {campaign.states.length === US_STATES.length
                            ? "All States"
                            : campaign.states.length > 3
                              ? `${campaign.states.slice(0, 3).join(", ")} +${campaign.states.length - 3}`
                              : campaign.states.join(", ")}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">${campaign.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 bg-transparent"
                              onClick={() => openEditCampaign(campaign)}
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 text-red-600 hover:text-red-700 bg-transparent"
                              onClick={() => openDeleteCampaign(campaign)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Edit Campaign Dialog */}
            <Dialog open={showEditCampaign} onOpenChange={setShowEditCampaign}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Edit Campaign</DialogTitle>
                  <DialogDescription>Update the campaign settings.</DialogDescription>
                </DialogHeader>
                <CampaignFormContent isEdit={true} />
              </DialogContent>
            </Dialog>

            {/* Delete Campaign Dialog */}
            <Dialog open={showDeleteCampaign} onOpenChange={setShowDeleteCampaign}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Campaign</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete "{selectedCampaign?.name}"? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowDeleteCampaign(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteCampaign}>
                    Delete
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
