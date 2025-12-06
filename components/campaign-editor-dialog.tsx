"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"

interface CampaignEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: any
  onSave?: (filter: any) => void
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

const CATEGORY_PRICING: Record<string, number> = {
  "Term Life": 45.0,
  "Final Expense": 52.0,
  "Mortgage Protection": 48.0,
  IUL: 68.0,
  "Whole Life": 55.0,
}

export function CampaignEditorDialog({ open, onOpenChange, campaign, onSave }: CampaignEditorDialogProps) {
  const [isActive, setIsActive] = useState(true)
  const [selectedStates, setSelectedStates] = useState<string[]>(["CA", "TX", "NY"])
  const [filterName, setFilterName] = useState("")
  const [dailyCap, setDailyCap] = useState("")
  const [category, setCategory] = useState("Term Life")

  useEffect(() => {
    if (open) {
      if (campaign) {
        setIsActive(campaign.status === "active")
        setFilterName(campaign.name || "")
        setDailyCap(campaign.dailyCap?.toString() || "")
        setCategory(campaign.category || "Term Life")
      } else {
        setIsActive(true)
        setFilterName("")
        setDailyCap("")
        setSelectedStates(["CA", "TX", "NY"])
        setCategory("Term Life")
      }
    }
  }, [open, campaign])

  const toggleState = (state: string) => {
    setSelectedStates((prev) => (prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]))
  }

  const selectAllStates = () => {
    setSelectedStates(US_STATES)
  }

  const deselectAllStates = () => {
    setSelectedStates([])
  }

  const handleDailyCapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow empty or positive numbers only
    if (value === "" || (Number(value) > 0 && !value.includes("-"))) {
      setDailyCap(value)
    }
  }

  const handleSave = () => {
    if (onSave) {
      const statesDisplay = selectedStates.length === US_STATES.length ? "All States" : selectedStates.join(", ")
      onSave({
        name: filterName,
        dailyCap: dailyCap ? Number.parseInt(dailyCap) : null,
        status: isActive ? "active" : "paused",
        states: selectedStates,
        category: category,
        price: CATEGORY_PRICING[category],
        filters: `States: ${statesDisplay}`,
      })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? "Edit Campaign" : "Create Campaign"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="e.g. California Term Life"
            />
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Campaign Status</Label>
              <p className="text-sm text-muted-foreground">Enable or pause this campaign</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>Term Life</option>
              <option>Final Expense</option>
              <option>Mortgage Protection</option>
              <option>IUL</option>
              <option>Whole Life</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price per Lead</Label>
            <Input
              id="price"
              type="text"
              value={`$${CATEGORY_PRICING[category]?.toFixed(2) ?? "45.00"}`}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Pricing is set by the seller based on the category</p>
          </div>

          {/* Daily Cap */}
          <div className="space-y-2">
            <Label htmlFor="dailyCap">Daily Cap (optional)</Label>
            <Input
              id="dailyCap"
              type="number"
              value={dailyCap}
              onChange={handleDailyCapChange}
              placeholder="e.g. 20"
              min="1"
            />
            <p className="text-xs text-muted-foreground">Maximum leads per day (leave empty for unlimited)</p>
          </div>

          <Separator />

          {/* Filter Configuration */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Filter Configuration</h3>
              <p className="text-sm text-muted-foreground">Set criteria for the types of leads you want to receive</p>
            </div>

            {/* States Multi-Select */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>States (multi-select)</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={selectAllStates}>
                    Select All
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={deselectAllStates}>
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="border border-input rounded-md p-3 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-6 gap-2">
                  {US_STATES.map((state) => (
                    <button
                      key={state}
                      type="button"
                      onClick={() => toggleState(state)}
                      className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                        selectedStates.includes(state)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Age Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ageMin">Min Age</Label>
                <Input id="ageMin" type="number" placeholder="e.g. 25" min="1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ageMax">Max Age</Label>
                <Input id="ageMax" type="number" placeholder="e.g. 65" min="1" />
              </div>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
              >
                <option>Any</option>
                <option>English</option>
                <option>Spanish</option>
                <option>Portuguese</option>
              </select>
            </div>

            {/* Smoker Status */}
            <div className="space-y-2">
              <Label htmlFor="smoker">Smoker Status</Label>
              <select
                id="smoker"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
              >
                <option>Any</option>
                <option>Non-smoker</option>
                <option>Smoker</option>
              </select>
            </div>

            {/* Coverage Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coverageMin">Min Coverage</Label>
                <Input id="coverageMin" type="number" placeholder="e.g. 100000" min="1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverageMax">Max Coverage</Label>
                <Input id="coverageMax" type="number" placeholder="e.g. 500000" min="1" />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Campaign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
