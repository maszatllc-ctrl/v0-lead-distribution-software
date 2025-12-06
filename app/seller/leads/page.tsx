"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Trash2, Filter, Settings2, Download, GripVertical } from "lucide-react"
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
    timestamp: "2025-06-05 14:32",
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
    timestamp: "2025-06-04 13:15",
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
    timestamp: "2025-06-03 11:48",
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
    timestamp: "2025-06-01 10:22",
    age: 35,
    coverage: "$750,000",
    smoker: "No",
    language: "English",
  },
]

interface ColumnDef {
  key: string
  label: string
  visible: boolean
}

const defaultColumns: ColumnDef[] = [
  { key: "status", label: "Status", visible: true },
  { key: "category", label: "Lead Category", visible: true },
  { key: "name", label: "Lead Name", visible: true },
  { key: "phone", label: "Phone", visible: true },
  { key: "email", label: "Email", visible: true },
  { key: "state", label: "State", visible: true },
  { key: "buyer", label: "Assigned Buyer", visible: true },
  { key: "price", label: "Price", visible: true },
]

export default function SellerLeads() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [filterCategory, setFilterCategory] = useState("all")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [leads, setLeads] = useState<Lead[]>(mockLeads)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [columns, setColumns] = useState<ColumnDef[]>(defaultColumns)
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (filterCategory !== "all") {
        const categoryMap: Record<string, string> = {
          term: "Term Life",
          final: "Final Expense",
          medicare: "Medicare",
          mortgage: "Mortgage Protection",
        }
        if (lead.category !== categoryMap[filterCategory]) return false
      }

      if (dateRange.from || dateRange.to) {
        const leadDate = new Date(lead.timestamp.split(" ")[0])
        if (dateRange.from && leadDate < dateRange.from) return false
        if (dateRange.to && leadDate > dateRange.to) return false
      }

      return true
    })
  }, [leads, filterCategory, dateRange])

  const openLeadDetails = (lead: Lead) => {
    setSelectedLead(lead)
    setSheetOpen(true)
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(filteredLeads.map((l) => l.id))
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
    setColumns(columns.map((col) => (col.key === columnKey ? { ...col, visible: !col.visible } : col)))
  }

  const handleDragStart = (columnKey: string) => {
    setDraggedColumn(columnKey)
  }

  const handleDragOver = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault()
    if (!draggedColumn || draggedColumn === targetKey) return

    const draggedIndex = columns.findIndex((col) => col.key === draggedColumn)
    const targetIndex = columns.findIndex((col) => col.key === targetKey)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newColumns = [...columns]
    const [draggedItem] = newColumns.splice(draggedIndex, 1)
    newColumns.splice(targetIndex, 0, draggedItem)
    setColumns(newColumns)
  }

  const handleDragEnd = () => {
    setDraggedColumn(null)
  }

  const handleExportCSV = () => {
    const leadsToExport =
      selectedLeadIds.length > 0 ? filteredLeads.filter((l) => selectedLeadIds.includes(l.id)) : filteredLeads

    const visibleCols = columns.filter((col) => col.visible)
    const headers = visibleCols.map((col) => col.label)
    const rows = leadsToExport.map((lead) =>
      visibleCols.map((col) => {
        const value = lead[col.key as keyof Lead]
        if (col.key === "price") return `$${(value as number).toFixed(2)}`
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

  const visibleColumns = columns.filter((col) => col.visible)

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
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Date picker on the left */}
                <DateRangePicker onChange={(range) => setDateRange(range || {})} />

                {/* Category filter next to date picker */}
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
              </div>

              <div className="flex items-center gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-transparent">
                      <Settings2 className="w-4 h-4" />
                      Columns
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="end">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground mb-3">Drag to reorder columns</p>
                      {columns.map((column) => (
                        <div
                          key={column.key}
                          draggable
                          onDragStart={() => handleDragStart(column.key)}
                          onDragOver={(e) => handleDragOver(e, column.key)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center gap-2 p-2 rounded-md cursor-move hover:bg-muted ${
                            draggedColumn === column.key ? "opacity-50 bg-muted" : ""
                          }`}
                        >
                          <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <Checkbox checked={column.visible} onCheckedChange={() => toggleColumn(column.key)} />
                          <span className="text-sm flex-1">{column.label}</span>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {selectedLeadIds.length > 0 && (
                  <Button variant="outline" className="gap-2 bg-transparent" onClick={handleExportCSV}>
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                )}
              </div>
            </div>

            {selectedLeadIds.length > 0 && (
              <div>
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete {selectedLeadIds.length} selected
                </Button>
              </div>
            )}
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  {visibleColumns.map((column) => (
                    <TableHead key={column.key} className="font-semibold">
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
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
                    {visibleColumns.map((column) => (
                      <TableCell key={column.key}>
                        {column.key === "status" ? (
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
                        ) : column.key === "price" ? (
                          <span className="font-semibold">${lead.price.toFixed(2)}</span>
                        ) : column.key === "category" ? (
                          <span className="font-medium">{lead[column.key as keyof Lead]}</span>
                        ) : (
                          <span
                            className={column.key === "phone" || column.key === "email" ? "text-muted-foreground" : ""}
                          >
                            {lead[column.key as keyof Lead]}
                          </span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto px-6">
          <SheetHeader>
            <SheetTitle>Lead Details</SheetTitle>
          </SheetHeader>
          {selectedLead && (
            <div className="space-y-6 mt-6">
              {/* Lead Info Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
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
                  <Badge variant="outline">{selectedLead.category}</Badge>
                </div>

                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Name</Label>
                      <p className="text-foreground font-medium mt-1">{selectedLead.name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Age</Label>
                      <p className="text-foreground font-medium mt-1">{selectedLead.age}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Phone</Label>
                    <p className="text-foreground font-medium mt-1">{selectedLead.phone}</p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
                    <p className="text-foreground font-medium mt-1">{selectedLead.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">State</Label>
                      <p className="text-foreground font-medium mt-1">{selectedLead.state}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Coverage</Label>
                      <p className="text-foreground font-medium mt-1">{selectedLead.coverage}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Smoker</Label>
                      <p className="text-foreground font-medium mt-1">{selectedLead.smoker}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Language</Label>
                      <p className="text-foreground font-medium mt-1">{selectedLead.language}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Price</Label>
                      <p className="text-foreground font-semibold mt-1">${selectedLead.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Assigned Buyer</Label>
                      <p className="text-foreground font-medium mt-1">{selectedLead.buyer}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Log Section */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Delivery Log</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    <div>
                      <p className="text-sm text-foreground">Lead created</p>
                      <p className="text-xs text-muted-foreground">{selectedLead.timestamp}</p>
                    </div>
                  </div>
                  {selectedLead.status === "delivered" && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                      <div>
                        <p className="text-sm text-foreground">Delivered to {selectedLead.buyer}</p>
                        <p className="text-xs text-muted-foreground">{selectedLead.timestamp}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}
