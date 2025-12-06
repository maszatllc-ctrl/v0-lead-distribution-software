"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Pencil, Trash2, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const initialCampaigns = [
  {
    id: "1",
    name: "California Term Life - High Priority",
    status: "active",
    price: 45.0,
    dailyCap: 20,
    category: "Term Life",
    states: ["CA"],
  },
  {
    id: "2",
    name: "Texas Final Expense",
    status: "active",
    price: 52.0,
    dailyCap: 15,
    category: "Final Expense",
    states: ["TX"],
  },
  {
    id: "3",
    name: "IUL - Multiple States",
    status: "paused",
    price: 68.0,
    dailyCap: 10,
    category: "IUL",
    states: ["NY", "FL", "CA"],
  },
]

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
]

const CATEGORY_PRICING: Record<string, number> = {
  "Term Life": 45.0,
  "Final Expense": 52.0,
  "Mortgage Protection": 48.0,
  IUL: 68.0,
  "Whole Life": 55.0,
}

const CATEGORIES = Object.keys(CATEGORY_PRICING)

export default function BuyLeadsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<(typeof initialCampaigns)[0] | null>(null)
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [campaignStatus, setCampaignStatus] = useState<Record<string, boolean>>({
    "1": true,
    "2": true,
    "3": false,
  })

  // Campaign form state
  const [formStatus, setFormStatus] = useState(true)
  const [formCategory, setFormCategory] = useState("Term Life")
  const [formDailyCap, setFormDailyCap] = useState("")
  const [formStates, setFormStates] = useState<string[]>([])

  useEffect(() => {
    const storedFilters = sessionStorage.getItem("leadFilters")
    if (storedFilters) {
      const parsedFilters = JSON.parse(storedFilters)
      if (parsedFilters.length > 0) {
        setCampaigns((prev) => [...prev, ...parsedFilters])
        const newStatuses: Record<string, boolean> = {}
        parsedFilters.forEach((filter: any) => {
          newStatuses[filter.id] = filter.status === "active"
        })
        setCampaignStatus((prev) => ({ ...prev, ...newStatuses }))
        sessionStorage.removeItem("leadFilters")
      }
    }
  }, [])

  const handleEdit = (campaign: (typeof initialCampaigns)[0]) => {
    setEditingCampaign(campaign)
    setFormStatus(campaignStatus[campaign.id] ?? campaign.status === "active")
    setFormCategory(campaign.category)
    setFormDailyCap(campaign.dailyCap?.toString() || "")
    setFormStates(campaign.states || [])
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingCampaign(null)
    setFormStatus(true)
    setFormCategory("Term Life")
    setFormDailyCap("")
    setFormStates([])
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id))
    toast.success("Campaign deleted")
  }

  const handleStatusToggle = (id: string, checked: boolean) => {
    setCampaignStatus((prev) => ({ ...prev, [id]: checked }))
    toast.success(checked ? "Campaign enabled" : "Campaign paused")
  }

  const handleSave = () => {
    if (formStates.length === 0) {
      toast.error("Please select at least one state")
      return
    }

    const price = CATEGORY_PRICING[formCategory] || 45.0
    const campaignName = `${formCategory} - ${formStates.length === 50 ? "All States" : formStates.join(", ")}`

    if (editingCampaign) {
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === editingCampaign.id
            ? {
                ...c,
                name: campaignName,
                category: formCategory,
                price,
                dailyCap: formDailyCap ? Number.parseInt(formDailyCap) : undefined,
                states: formStates,
              }
            : c,
        ),
      )
      setCampaignStatus((prev) => ({ ...prev, [editingCampaign.id]: formStatus }))
      toast.success("Campaign updated successfully")
    } else {
      const newId = String(Date.now())
      setCampaigns((prev) => [
        ...prev,
        {
          id: newId,
          name: campaignName,
          status: formStatus ? "active" : "paused",
          price,
          dailyCap: formDailyCap ? Number.parseInt(formDailyCap) : 20,
          category: formCategory,
          states: formStates,
        },
      ])
      setCampaignStatus((prev) => ({ ...prev, [newId]: formStatus }))
      toast.success("Campaign created successfully")
    }

    setIsDialogOpen(false)
  }

  const toggleState = (stateCode: string) => {
    setFormStates((prev) => (prev.includes(stateCode) ? prev.filter((s) => s !== stateCode) : [...prev, stateCode]))
  }

  const selectAllStates = () => {
    setFormStates(US_STATES.map((s) => s.code))
  }

  const clearAllStates = () => {
    setFormStates([])
  }

  const handleDailyCapChange = (value: string) => {
    if (value === "" || (Number(value) > 0 && !value.includes("-"))) {
      setFormDailyCap(value)
    }
  }

  return (
    <DashboardLayout userType="buyer">
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Buy Leads</h1>
            <p className="text-muted-foreground mt-1">Manage your lead acquisition campaigns</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Buy Leads
          </Button>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Name</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Category</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Price</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Daily Cap</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">States</th>
                  <th className="text-right p-4 text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <p className="font-medium text-foreground">{campaign.name}</p>
                    </td>
                    <td className="p-4">
                      <Switch
                        checked={campaignStatus[campaign.id] ?? campaign.status === "active"}
                        onCheckedChange={(checked) => handleStatusToggle(campaign.id, checked)}
                      />
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{campaign.category}</Badge>
                    </td>
                    <td className="p-4">
                      <p className="text-foreground">${campaign.price.toFixed(2)} / lead</p>
                    </td>
                    <td className="p-4">
                      <p className="text-foreground">
                        {campaign.dailyCap ? `${campaign.dailyCap} leads/day` : "Unlimited"}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-foreground text-sm">
                        {campaign.states?.length === 50
                          ? "All States"
                          : campaign.states?.slice(0, 5).join(", ") +
                            (campaign.states && campaign.states.length > 5
                              ? ` +${campaign.states.length - 5} more`
                              : "")}
                      </p>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(campaign.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(campaign)} className="gap-2">
                          <Pencil className="w-4 h-4" />
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCampaign ? "Edit Campaign" : "Buy Leads"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Campaign Status */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Campaign Status</Label>
                  <p className="text-sm text-muted-foreground">Enable or pause this campaign</p>
                </div>
                <Switch checked={formStatus} onCheckedChange={setFormStatus} />
              </div>

              <div className="h-px bg-border" />

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price per Lead */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Price per Lead</Label>
                <Input
                  value={`$${CATEGORY_PRICING[formCategory]?.toFixed(2) || "45.00"}`}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">Pricing is set by the seller based on the category</p>
              </div>

              {/* Daily Cap */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Daily Cap (optional)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 20"
                  value={formDailyCap}
                  onChange={(e) => handleDailyCapChange(e.target.value)}
                  min="1"
                  className="bg-background"
                />
                <p className="text-sm text-muted-foreground">Maximum leads per day (leave empty for unlimited)</p>
              </div>

              <div className="h-px bg-border" />

              {/* State Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Select States</Label>
                    <p className="text-sm text-muted-foreground">
                      {formStates.length === 0
                        ? "No states selected"
                        : formStates.length === 50
                          ? "All states selected"
                          : `${formStates.length} state${formStates.length > 1 ? "s" : ""} selected`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={selectAllStates}>
                      Select All
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={clearAllStates}>
                      Clear All
                    </Button>
                  </div>
                </div>

                {/* State Grid */}
                <div className="border border-border rounded-lg p-4 bg-muted/30">
                  <div className="grid grid-cols-10 gap-1.5">
                    {US_STATES.map((state) => {
                      const isSelected = formStates.includes(state.code)
                      return (
                        <button
                          key={state.code}
                          type="button"
                          onClick={() => toggleState(state.code)}
                          className={`
                            p-2 text-xs font-medium rounded-md transition-all duration-150
                            ${
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-background hover:bg-muted text-foreground border border-border"
                            }
                          `}
                          title={state.name}
                        >
                          {state.code}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Campaign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
