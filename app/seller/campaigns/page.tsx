"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Filter, X } from "lucide-react"
import { toast } from "sonner"

interface Condition {
  id: string
  property: string
  operator: string
  value: string
}

interface ConditionGroup {
  id: string
  conditions: Condition[]
}

interface Campaign {
  id: string
  name: string
  category: string
  status: "active" | "paused"
  states: string[]
  conditionGroups: ConditionGroup[]
  leadsDelivered: number
  createdAt: string
}

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

const CATEGORIES = ["Term Life", "Final Expense", "Mortgage Protection", "IUL", "Whole Life"]

const PROPERTIES = ["first_name", "last_name", "email", "phone", "address", "city", "state", "zip"]

const OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Not Contains" },
  { value: "is_empty", label: "Is Empty" },
  { value: "not_empty", label: "Not Empty" },
]

const initialCampaigns: Campaign[] = [
  {
    id: "1",
    name: "California Term Life",
    category: "Term Life",
    status: "active",
    states: ["CA"],
    conditionGroups: [
      {
        id: "g1",
        conditions: [{ id: "c1", property: "state", operator: "equals", value: "CA" }],
      },
    ],
    leadsDelivered: 1234,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Florida Final Expense",
    category: "Final Expense",
    status: "active",
    states: ["FL"],
    conditionGroups: [
      {
        id: "g1",
        conditions: [{ id: "c1", property: "state", operator: "equals", value: "FL" }],
      },
    ],
    leadsDelivered: 856,
    createdAt: "2024-01-20",
  },
  {
    id: "3",
    name: "Texas Mortgage Protection",
    category: "Mortgage Protection",
    status: "paused",
    states: ["TX"],
    conditionGroups: [
      {
        id: "g1",
        conditions: [{ id: "c1", property: "state", operator: "equals", value: "TX" }],
      },
    ],
    leadsDelivered: 432,
    createdAt: "2024-02-01",
  },
]

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [newCampaign, setNewCampaign] = useState<Omit<Campaign, "id" | "leadsDelivered" | "createdAt">>({
    name: "",
    category: "",
    status: "active",
    states: [],
    conditionGroups: [
      {
        id: "g1",
        conditions: [{ id: "c1", property: "", operator: "equals", value: "" }],
      },
    ],
  })

  const resetNewCampaign = () => {
    setNewCampaign({
      name: "",
      category: "",
      status: "active",
      states: [],
      conditionGroups: [
        {
          id: "g1",
          conditions: [{ id: "c1", property: "", operator: "equals", value: "" }],
        },
      ],
    })
  }

  const handleCreateCampaign = () => {
    if (!newCampaign.name.trim()) {
      toast.error("Campaign name is required")
      return
    }
    if (!newCampaign.category) {
      toast.error("Lead category is required")
      return
    }

    const campaign: Campaign = {
      id: Date.now().toString(),
      ...newCampaign,
      leadsDelivered: 0,
      createdAt: new Date().toISOString().split("T")[0],
    }

    setCampaigns([...campaigns, campaign])
    setShowCreateDialog(false)
    resetNewCampaign()
    toast.success("Campaign created successfully")
  }

  const handleUpdateCampaign = () => {
    if (!editingCampaign) return
    if (!editingCampaign.name.trim()) {
      toast.error("Campaign name is required")
      return
    }

    setCampaigns(campaigns.map((c) => (c.id === editingCampaign.id ? editingCampaign : c)))
    setShowEditDialog(false)
    setEditingCampaign(null)
    toast.success("Campaign updated successfully")
  }

  const handleDeleteCampaign = (id: string) => {
    setCampaigns(campaigns.filter((c) => c.id !== id))
    toast.success("Campaign deleted successfully")
  }

  const toggleCampaignStatus = (id: string) => {
    setCampaigns(
      campaigns.map((c) => (c.id === id ? { ...c, status: c.status === "active" ? "paused" : "active" } : c)),
    )
    const campaign = campaigns.find((c) => c.id === id)
    toast.success(`Campaign ${campaign?.status === "active" ? "paused" : "activated"} successfully`)
  }

  const openEditDialog = (campaign: Campaign) => {
    setEditingCampaign({ ...campaign })
    setShowEditDialog(true)
  }

  // Condition group handlers for new campaign
  const addConditionGroup = () => {
    setNewCampaign({
      ...newCampaign,
      conditionGroups: [
        ...newCampaign.conditionGroups,
        {
          id: `g${Date.now()}`,
          conditions: [{ id: `c${Date.now()}`, property: "", operator: "equals", value: "" }],
        },
      ],
    })
  }

  const removeConditionGroup = (groupId: string) => {
    setNewCampaign({
      ...newCampaign,
      conditionGroups: newCampaign.conditionGroups.filter((g) => g.id !== groupId),
    })
  }

  const addCondition = (groupId: string) => {
    setNewCampaign({
      ...newCampaign,
      conditionGroups: newCampaign.conditionGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: [...g.conditions, { id: `c${Date.now()}`, property: "", operator: "equals", value: "" }],
            }
          : g,
      ),
    })
  }

  const removeCondition = (groupId: string, conditionId: string) => {
    setNewCampaign({
      ...newCampaign,
      conditionGroups: newCampaign.conditionGroups.map((g) =>
        g.id === groupId ? { ...g, conditions: g.conditions.filter((c) => c.id !== conditionId) } : g,
      ),
    })
  }

  const updateCondition = (groupId: string, conditionId: string, field: keyof Condition, value: string) => {
    setNewCampaign({
      ...newCampaign,
      conditionGroups: newCampaign.conditionGroups.map((g) =>
        g.id === groupId
          ? { ...g, conditions: g.conditions.map((c) => (c.id === conditionId ? { ...c, [field]: value } : c)) }
          : g,
      ),
    })
  }

  // Condition group handlers for editing campaign
  const addConditionGroupEdit = () => {
    if (!editingCampaign) return
    setEditingCampaign({
      ...editingCampaign,
      conditionGroups: [
        ...editingCampaign.conditionGroups,
        {
          id: `g${Date.now()}`,
          conditions: [{ id: `c${Date.now()}`, property: "", operator: "equals", value: "" }],
        },
      ],
    })
  }

  const removeConditionGroupEdit = (groupId: string) => {
    if (!editingCampaign) return
    setEditingCampaign({
      ...editingCampaign,
      conditionGroups: editingCampaign.conditionGroups.filter((g) => g.id !== groupId),
    })
  }

  const addConditionEdit = (groupId: string) => {
    if (!editingCampaign) return
    setEditingCampaign({
      ...editingCampaign,
      conditionGroups: editingCampaign.conditionGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: [...g.conditions, { id: `c${Date.now()}`, property: "", operator: "equals", value: "" }],
            }
          : g,
      ),
    })
  }

  const removeConditionEdit = (groupId: string, conditionId: string) => {
    if (!editingCampaign) return
    setEditingCampaign({
      ...editingCampaign,
      conditionGroups: editingCampaign.conditionGroups.map((g) =>
        g.id === groupId ? { ...g, conditions: g.conditions.filter((c) => c.id !== conditionId) } : g,
      ),
    })
  }

  const updateConditionEdit = (groupId: string, conditionId: string, field: keyof Condition, value: string) => {
    if (!editingCampaign) return
    setEditingCampaign({
      ...editingCampaign,
      conditionGroups: editingCampaign.conditionGroups.map((g) =>
        g.id === groupId
          ? { ...g, conditions: g.conditions.map((c) => (c.id === conditionId ? { ...c, [field]: value } : c)) }
          : g,
      ),
    })
  }

  const toggleState = (state: string, isEdit = false) => {
    if (isEdit && editingCampaign) {
      setEditingCampaign({
        ...editingCampaign,
        states: editingCampaign.states.includes(state)
          ? editingCampaign.states.filter((s) => s !== state)
          : [...editingCampaign.states, state],
      })
    } else {
      setNewCampaign({
        ...newCampaign,
        states: newCampaign.states.includes(state)
          ? newCampaign.states.filter((s) => s !== state)
          : [...newCampaign.states, state],
      })
    }
  }

  const selectAllStates = (isEdit = false) => {
    if (isEdit && editingCampaign) {
      setEditingCampaign({ ...editingCampaign, states: [...US_STATES] })
    } else {
      setNewCampaign({ ...newCampaign, states: [...US_STATES] })
    }
  }

  const clearAllStates = (isEdit = false) => {
    if (isEdit && editingCampaign) {
      setEditingCampaign({ ...editingCampaign, states: [] })
    } else {
      setNewCampaign({ ...newCampaign, states: [] })
    }
  }

  const renderConditionGroups = (conditionGroups: ConditionGroup[], isEdit = false) => (
    <div className="space-y-4">
      {conditionGroups.map((group, groupIndex) => (
        <div key={group.id} className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Condition {groupIndex + 1}</h4>
            {conditionGroups.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (isEdit ? removeConditionGroupEdit(group.id) : removeConditionGroup(group.id))}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {group.conditions.map((condition, condIndex) => (
            <div key={condition.id} className="flex items-center gap-2">
              <Select
                value={condition.property}
                onValueChange={(v) =>
                  isEdit
                    ? updateConditionEdit(group.id, condition.id, "property", v)
                    : updateCondition(group.id, condition.id, "property", v)
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Property" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTIES.map((prop) => (
                    <SelectItem key={prop} value={prop}>
                      {prop}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={condition.operator}
                onValueChange={(v) =>
                  isEdit
                    ? updateConditionEdit(group.id, condition.id, "operator", v)
                    : updateCondition(group.id, condition.id, "operator", v)
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!["is_empty", "not_empty"].includes(condition.operator) && (
                <Input
                  placeholder="Value"
                  value={condition.value}
                  onChange={(e) =>
                    isEdit
                      ? updateConditionEdit(group.id, condition.id, "value", e.target.value)
                      : updateCondition(group.id, condition.id, "value", e.target.value)
                  }
                  className="flex-1"
                />
              )}

              {group.conditions.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    isEdit ? removeConditionEdit(group.id, condition.id) : removeCondition(group.id, condition.id)
                  }
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => (isEdit ? addConditionEdit(group.id) : addCondition(group.id))}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add "AND" Condition
          </Button>
        </div>
      ))}

      <Button variant="outline" onClick={() => (isEdit ? addConditionGroupEdit() : addConditionGroup())}>
        <Plus className="w-4 h-4 mr-2" />
        Add "OR" Group
      </Button>
    </div>
  )

  const renderStatesGrid = (selectedStates: string[], isEdit = false) => (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => selectAllStates(isEdit)}>
          Select All
        </Button>
        <Button variant="outline" size="sm" onClick={() => clearAllStates(isEdit)}>
          Clear All
        </Button>
      </div>
      <div className="grid grid-cols-10 gap-1 max-h-48 overflow-y-auto p-2 border border-border rounded-lg">
        {US_STATES.map((state) => (
          <button
            key={state}
            onClick={() => toggleState(state, isEdit)}
            className={`p-1 text-xs font-medium rounded transition-colors ${
              selectedStates.includes(state)
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-foreground"
            }`}
          >
            {state}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {selectedStates.length === US_STATES.length
          ? "All States"
          : `${selectedStates.length} state${selectedStates.length !== 1 ? "s" : ""} selected`}
      </p>
    </div>
  )

  return (
    <DashboardLayout userType="seller">
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
            <p className="text-muted-foreground mt-1">Create and manage your lead distribution campaigns.</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Campaign</DialogTitle>
                <DialogDescription>Set up a new lead distribution campaign.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="grid gap-2">
                  <Label>Campaign Name *</Label>
                  <Input
                    placeholder="e.g., California Term Life"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Lead Category *</Label>
                  <Select
                    value={newCampaign.category}
                    onValueChange={(v) => setNewCampaign({ ...newCampaign, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Campaign Status</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newCampaign.status === "active"}
                      onCheckedChange={(checked) =>
                        setNewCampaign({ ...newCampaign, status: checked ? "active" : "paused" })
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      {newCampaign.status === "active" ? "Active" : "Paused"}
                    </span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>States</Label>
                  {renderStatesGrid(newCampaign.states)}
                </div>

                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Conditions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Define conditions that a lead must meet. Conditions within a group use AND logic, groups use OR
                    logic.
                  </p>
                  {renderConditionGroups(newCampaign.conditionGroups)}
                </div>

                <Button onClick={handleCreateCampaign} className="w-full">
                  Create Campaign
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-6">
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">States</TableHead>
                  <TableHead className="font-semibold">Leads Delivered</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
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
                        className="data-[state=checked]:bg-green-500"
                      />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{campaign.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{campaign.category}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {campaign.states.length === US_STATES.length
                        ? "All States"
                        : campaign.states.length > 3
                          ? `${campaign.states.slice(0, 3).join(", ")} +${campaign.states.length - 3}`
                          : campaign.states.join(", ")}
                    </TableCell>
                    <TableCell className="text-foreground">{campaign.leadsDelivered.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{campaign.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(campaign)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteCampaign(campaign.id)}
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
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Campaign</DialogTitle>
              <DialogDescription>Update your campaign settings.</DialogDescription>
            </DialogHeader>
            {editingCampaign && (
              <div className="space-y-6 pt-4">
                <div className="grid gap-2">
                  <Label>Campaign Name *</Label>
                  <Input
                    value={editingCampaign.name}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, name: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Lead Category *</Label>
                  <Select
                    value={editingCampaign.category}
                    onValueChange={(v) => setEditingCampaign({ ...editingCampaign, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Campaign Status</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingCampaign.status === "active"}
                      onCheckedChange={(checked) =>
                        setEditingCampaign({ ...editingCampaign, status: checked ? "active" : "paused" })
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      {editingCampaign.status === "active" ? "Active" : "Paused"}
                    </span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>States</Label>
                  {renderStatesGrid(editingCampaign.states, true)}
                </div>

                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Conditions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Define conditions that a lead must meet. Conditions within a group use AND logic, groups use OR
                    logic.
                  </p>
                  {renderConditionGroups(editingCampaign.conditionGroups, true)}
                </div>

                <Button onClick={handleUpdateCampaign} className="w-full">
                  Save Changes
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
