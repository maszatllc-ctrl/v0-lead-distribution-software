"use client"

import type React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function NewBuyer() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    initialBalance: "",
    status: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log("[v0] Form submitted:", formData)
    // Redirect to buyers list
    router.push("/seller/buyers")
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <DashboardLayout userType="seller">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/seller/buyers">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Add New Buyer</h1>
              <p className="text-muted-foreground mt-1">Create a new buyer account to distribute leads to.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Buyer Information */}
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Buyer Information</h2>
              <p className="text-sm text-muted-foreground mt-1">Essential details about the buyer</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Buyer Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter buyer name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="buyer@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Account Settings */}
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Account Settings</h2>
              <p className="text-sm text-muted-foreground mt-1">Configure buyer account preferences</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="initialBalance">Initial Wallet Balance</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="initialBalance"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    value={formData.initialBalance}
                    onChange={(e) => handleChange("initialBalance", e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Set an initial balance for the buyer's wallet</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Account Status</Label>
                <div className="flex items-center gap-3 h-10">
                  <Switch
                    id="status"
                    checked={formData.status}
                    onCheckedChange={(checked) => handleChange("status", checked)}
                  />
                  <span className="text-sm text-foreground">{formData.status ? "Active" : "Paused"}</span>
                </div>
                <p className="text-xs text-muted-foreground">Enable or disable lead distribution to this buyer</p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Link href="/seller/buyers">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" className="gap-2">
              <Save className="w-4 h-4" />
              Create Buyer
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
