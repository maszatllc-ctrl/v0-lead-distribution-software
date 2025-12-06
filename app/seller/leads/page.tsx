"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Trash2, Filter, Settings2, Download } from "lucide-react"
import { DateRangePicker } from "@/components/date-range-picker"
import { toast } from "sonner"

interface Lead {
  id: string
  category: string
  name: string
  phone: string
  email: string
  state: string
  buyer: string
  price: number
  status: "delivered" | "unassigned"
  timestamp: string
  age?: number
  coverage?: string
  smoker?: string
  language?: string
}

const mockLeads: Lead[] = [
  {
    id: "1",
    category: "Term Life",
    name: "John Smith",
    phone: "(555) 123-4567",
    email: "john.smith@email.com",
    state: "TX",
    buyer: "ABC Insurance",
    price: 45.0,
    status: "delivered",
    timestamp: "2025-01-26 14:32",
    age: 42,
    coverage: "$500,000",
    smoker: "No",
    language: "English",
  },
  {
    id: "2",
    category: "Final Expense",
    name: "Sarah Johnson",
    phone: "(555) 234-5678",
    email: "sarah.j@email.com",
    state: "FL",
    buyer: "XYZ Agency",
    price: 38.5,
    status: "delivered",
    timestamp: "2025-01-26 13:15",
    age: 68,
    coverage: "$15,000",
    smoker: "No",
    language: "English",
  },
  {
    id: "3",
    category: "Medicare",
    name: "Michael Chen",
    phone: "(555) 345-6789",
    email: "mchen@email.com",
    state: "CA",
    buyer: "Unassigned",
    price: 52.0,
    status: "unassigned",
    timestamp: "2025-01-26 11:48",
    age: 66,
    coverage: "N/A",
    smoker: "No",
    language: "English",
  },
  {
    id: "4",
    category: "Term Life",
    name: "Emily Davis",
    phone: "(555) 456-7890",
    email: "emily.davis@email.com",
    state: "NY",
    buyer: "Best Leads Co",
    price: 45.0,
    status: "delivered",
    timestamp: "2025-01-26 10:22",
    age: 35,
    coverage: "$750,000",
    smoker: "No",
    language: "English",
  },
]

const allColumns = [
  { key: "category", label: "Lead Category" },
  { key: "name", label: "Lead Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "state", label: "State" },
  { key: "buyer", label: "Assigned Buyer" },
  { key: "price", label: "Price" },
  { key: "status", label: "Status" },
]

export default function SellerLeads() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [filterCategory, setFilterCategory] = useState("all")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [leads, setLeads] = useState<Lead[]>(mockLeads)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "status",
    "category",
    "name",
    "phone",
    "email",
    "state",
    "buyer",
    "price",
  ])

  const openLeadDetails = (lead: Lead) => {
    setSelectedLead(lead)
    setSheetOpen(true)
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(leads.map((l) => l.id))
    } else {
      setSelectedLeadIds([])
    }
  }

  const toggleSelectLead = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedLeadIds([...selectedLeadIds, id])
    } else {
      setSelectedLeadIds(selectedLeadIds.filter((leadId) => leadId !== id))
    }
  }

  const handleDeleteSelected = () => {
    setLeads(leads.filter((lead) => !selectedLeadIds.includes(lead.id)))
    toast.success(`Deleted ${selectedLeadIds.length} lead(s)`)
    setSelectedLeadIds([])
  }

  const toggleColumn = (columnKey: string) => {
    if (visibleColumns.includes(columnKey)) {
      setVisibleColumns(visibleColumns.filter((c) => c !== columnKey))
    } else {
      setVisibleColumns([...visibleColumns, columnKey])
    }
  }

  const handleExportCSV = () => {
    const leadsToExport = selectedLeadIds.length > 0 ? leads.filter((l) => selectedLeadIds.includes(l.id)) : leads

    const headers = visibleColumns.map((key) => allColumns.find((c) => c.key === key)?.label || key)
    const rows = leadsToExport.map((lead) =>
      visibleColumns.map((key) => {
        const value = lead[key as keyof Lead]
        if (key === "price") return `$${(value as number).toFixed(2)}`
        return value
      }),
    )

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Leads exported successfully")
  }

  const handleSaveChanges = () => {
    setSheetOpen(false)
    toast.success("Lead updated successfully")
  }

  return (
    <DashboardLayout userType="seller">
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1">
            Master list of all leads with filtering and assignment management.
          </p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {selectedLeadIds.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete {selectedLeadIds.length} {selectedLeadIds.length === 1 ? "lead" : "leads"}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <Settings2 className="w-4 h-4" />
                    Columns
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground mb-3">Visible Columns</p>
                    {allColumns.map((column) => (
                      <label key={column.key} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={visibleColumns.includes(column.key)}
                          onCheckedChange={() => toggleColumn(column.key)}
                        />
                        <span className="text-sm">{column.label}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px] gap-2">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="term">Term Life</SelectItem>
                  <SelectItem value="final">Final Expense</SelectItem>
                  <SelectItem value="medicare">Medicare</SelectItem>
                  <SelectItem value="mortgage">Mortgage Protection</SelectItem>
                </SelectContent>
              </Select>

              <DateRangePicker onChange={(range) => setDateRange(range || {})} />

              {selectedLeadIds.length > 0 && (
                <Button variant="outline" className="gap-2 bg-transparent" onClick={handleExportCSV}>
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              )}
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLeadIds.length === leads.length && leads.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  {visibleColumns.includes("status") && <TableHead className="font-semibold">Status</TableHead>}
                  {visibleColumns
                    .filter((c) => c !== "status")
                    .map((columnKey) => {
                      const column = allColumns.find((c) => c.key === columnKey)
                      return column ? (
                        <TableHead key={columnKey} className="font-semibold">
                          {column.label}
                        </TableHead>
                      ) : null
                    })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => openLeadDetails(lead)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedLeadIds.includes(lead.id)}
                        onCheckedChange={(checked) => toggleSelectLead(lead.id, checked as boolean)}
                      />
                    </TableCell>
                    {visibleColumns.includes("status") && (
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            lead.status === "delivered"
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                          }
                        >
                          {lead.status === "delivered" ? "Delivered" : "Unassigned"}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.includes("category") && (
                      <TableCell className="font-medium text-foreground">{lead.category}</TableCell>
                    )}
                    {visibleColumns.includes("name") && <TableCell className="text-foreground">{lead.name}</TableCell>}
                    {visibleColumns.includes("phone") && (
                      <TableCell className="text-muted-foreground">{lead.phone}</TableCell>
                    )}
                    {visibleColumns.includes("email") && (
                      <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                    )}
                    {visibleColumns.includes("state") && (
                      <TableCell className="text-foreground">{lead.state}</TableCell>
                    )}
                    {visibleColumns.includes("buyer") && (
                      <TableCell className="text-foreground">{lead.buyer}</TableCell>
                    )}
                    {visibleColumns.includes("price") && (
                      <TableCell className="font-semibold text-foreground">${lead.price.toFixed(2)}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Lead Details</SheetTitle>
            <SheetDescription>View and edit full lead information</SheetDescription>
          </SheetHeader>
          {selectedLead && (
            <div className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Lead Name</Label>
                  <Input value={selectedLead.name} readOnly />
                </div>

                <div className="grid gap-2">
                  <Label>Lead Category</Label>
                  <Input value={selectedLead.category} readOnly />
                </div>

                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input value={selectedLead.phone} readOnly />
                </div>

                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input value={selectedLead.email} readOnly />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>State</Label>
                    <Input value={selectedLead.state} readOnly />
                  </div>

                  <div className="grid gap-2">
                    <Label>Age</Label>
                    <Input value={selectedLead.age} readOnly />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Coverage Amount</Label>
                  <Input value={selectedLead.coverage} readOnly />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Smoker</Label>
                    <Input value={selectedLead.smoker} readOnly />
                  </div>

                  <div className="grid gap-2">
                    <Label>Language</Label>
                    <Input value={selectedLead.language} readOnly />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Assigned Buyer</Label>
                  <Select defaultValue={selectedLead.buyer.toLowerCase().replace(" ", "-")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      <SelectItem value="abc-insurance">ABC Insurance</SelectItem>
                      <SelectItem value="xyz-agency">XYZ Agency</SelectItem>
                      <SelectItem value="best-leads-co">Best Leads Co</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Price</Label>
                    <Input value={`$${selectedLead.price.toFixed(2)}`} readOnly />
                  </div>

                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Badge
                      variant="outline"
                      className={
                        selectedLead.status === "delivered"
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                      }
                    >
                      {selectedLead.status === "delivered" ? "Delivered" : "Unassigned"}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Delivery Log</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Lead created: {selectedLead.timestamp}</p>
                    {selectedLead.status === "delivered" && (
                      <p>
                        Delivered to {selectedLead.buyer}: {selectedLead.timestamp}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1" onClick={handleSaveChanges}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setSheetOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}
