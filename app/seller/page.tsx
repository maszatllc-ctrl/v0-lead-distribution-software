"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DollarSign, Database, Users, AlertCircle, TrendingUp, Plus, CalendarIcon } from "lucide-react"
import Link from "next/link"
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns"

const presets = [
  { label: "All Time", getValue: () => ({ from: null, to: null }) },
  { label: "Today", getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: "Yesterday", getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
  { label: "Last 7 days", getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: "Last 14 days", getValue: () => ({ from: subDays(new Date(), 13), to: new Date() }) },
  { label: "Last 30 days", getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  {
    label: "This week",
    getValue: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 0 }),
      to: endOfWeek(new Date(), { weekStartsOn: 0 }),
    }),
  },
  {
    label: "Last week",
    getValue: () => ({
      from: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 }),
      to: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 }),
    }),
  },
  { label: "This month", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  {
    label: "Last month",
    getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }),
  },
]

const recentLeads = [
  {
    timestamp: "2025-01-26 14:32",
    leadName: "John Smith",
    leadType: "Term Life",
    buyer: "ABC Insurance",
    price: 45.0,
  },
  {
    timestamp: "2025-01-26 13:15",
    leadName: "Sarah Johnson",
    leadType: "Final Expense",
    buyer: "XYZ Agency",
    price: 38.5,
  },
  {
    timestamp: "2025-01-26 11:48",
    leadName: "Michael Chen",
    leadType: "Medicare",
    buyer: "ABC Insurance",
    price: 52.0,
  },
  {
    timestamp: "2025-01-26 10:22",
    leadName: "Emily Davis",
    leadType: "Term Life",
    buyer: "Best Leads Co",
    price: 45.0,
  },
  {
    timestamp: "2025-01-26 09:15",
    leadName: "Robert Wilson",
    leadType: "Mortgage Protection",
    buyer: "XYZ Agency",
    price: 41.0,
  },
  {
    timestamp: "2025-01-25 16:44",
    leadName: "Lisa Anderson",
    leadType: "Final Expense",
    buyer: "ABC Insurance",
    price: 38.5,
  },
  {
    timestamp: "2025-01-25 15:30",
    leadName: "David Martinez",
    leadType: "Term Life",
    buyer: "Best Leads Co",
    price: 45.0,
  },
  {
    timestamp: "2025-01-25 14:12",
    leadName: "Jennifer Taylor",
    leadType: "Medicare",
    buyer: "XYZ Agency",
    price: 52.0,
  },
  {
    timestamp: "2025-01-25 12:55",
    leadName: "James Brown",
    leadType: "Term Life",
    buyer: "ABC Insurance",
    price: 45.0,
  },
  {
    timestamp: "2025-01-25 11:20",
    leadName: "Patricia Garcia",
    leadType: "Final Expense",
    buyer: "Best Leads Co",
    price: 38.5,
  },
]

export default function SellerDashboard() {
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null })
  const [selectedPreset, setSelectedPreset] = useState("All Time")
  const [isOpen, setIsOpen] = useState(false)

  const handlePresetSelect = (preset: (typeof presets)[0]) => {
    const range = preset.getValue()
    setDateRange(range)
    setSelectedPreset(preset.label)
    setIsOpen(false)
  }

  const getDisplayText = () => {
    if (!dateRange.from || !dateRange.to) return selectedPreset
    if (selectedPreset !== "All Time") return selectedPreset
    return `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
  }

  return (
    <DashboardLayout userType="seller">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Monitor your performance and manage your lead distribution.</p>
          </div>
          <div className="flex items-center gap-3">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 min-w-[160px] justify-start bg-transparent">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{getDisplayText()}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-2 space-y-1">
                  {presets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handlePresetSelect(preset)}
                      className={`w-full text-left px-3 py-2 text-[13px] rounded-md transition-colors ${
                        selectedPreset === preset.label ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Link href="/seller/buyers/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Buyer
              </Button>
            </Link>
          </div>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-3xl font-bold text-foreground">$12,430</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">12.5%</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Leads Sold</p>
                <p className="text-3xl font-bold text-foreground">1,284</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Database className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">8.2%</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Unassigned Leads</p>
                <p className="text-3xl font-bold text-foreground">37</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 h-6" />
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Active Buyers</p>
                <p className="text-3xl font-bold text-foreground">12</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 h-6" />
          </Card>
        </div>

        {/* Recent Leads Sold */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Recent Leads Sold</h2>
              <p className="text-sm text-muted-foreground mt-1">Latest 10 lead transactions</p>
            </div>
            <Link href="/seller/leads">
              <Button variant="outline" size="sm">
                View all leads
              </Button>
            </Link>
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Timestamp</TableHead>
                  <TableHead className="font-semibold">Lead Name</TableHead>
                  <TableHead className="font-semibold">Lead Type</TableHead>
                  <TableHead className="font-semibold">Buyer</TableHead>
                  <TableHead className="font-semibold text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads.map((lead, index) => (
                  <TableRow key={index} className="hover:bg-muted/30">
                    <TableCell className="text-muted-foreground">{lead.timestamp}</TableCell>
                    <TableCell className="font-medium text-foreground">{lead.leadName}</TableCell>
                    <TableCell className="text-foreground">{lead.leadType}</TableCell>
                    <TableCell className="text-foreground">{lead.buyer}</TableCell>
                    <TableCell className="text-right font-semibold text-foreground">${lead.price.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
