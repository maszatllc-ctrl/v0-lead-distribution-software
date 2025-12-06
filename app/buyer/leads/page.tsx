"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Download, Phone, Mail, MapPin, Eye } from "lucide-react"
import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DateRangePicker } from "@/components/date-range-picker"
import { toast } from "sonner"

const mockLeads = [
  {
    id: "1",
    name: "John Smith",
    category: "Term Life",
    state: "CA",
    phone: "(555) 123-4567",
    email: "john.smith@example.com",
    price: 45.0,
    purchasedDate: "2025-01-20",
    timestamp: "2025-01-20 15:32",
    age: 35,
    language: "English",
    smoker: "Non-smoker",
    coverage: "$250,000",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    category: "Final Expense",
    state: "TX",
    phone: "(555) 234-5678",
    email: "sarah.j@example.com",
    price: 52.0,
    purchasedDate: "2025-01-20",
    timestamp: "2025-01-20 14:18",
    age: 62,
    language: "English",
    smoker: "Non-smoker",
    coverage: "$15,000",
  },
  {
    id: "3",
    name: "Michael Brown",
    category: "IUL",
    state: "NY",
    phone: "(555) 345-6789",
    email: "m.brown@example.com",
    price: 68.0,
    purchasedDate: "2025-01-20",
    timestamp: "2025-01-20 11:45",
    age: 42,
    language: "English",
    smoker: "Smoker",
    coverage: "$500,000",
  },
  {
    id: "4",
    name: "Emily Davis",
    category: "Term Life",
    state: "FL",
    phone: "(555) 456-7890",
    email: "emily.davis@example.com",
    price: 45.0,
    purchasedDate: "2025-01-19",
    timestamp: "2025-01-19 16:22",
    age: 29,
    language: "Spanish",
    smoker: "Non-smoker",
    coverage: "$100,000",
  },
  {
    id: "5",
    name: "Robert Wilson",
    category: "Whole Life",
    state: "OH",
    phone: "(555) 567-8901",
    email: "r.wilson@example.com",
    price: 55.0,
    purchasedDate: "2025-01-15",
    timestamp: "2025-01-15 09:30",
    age: 50,
    language: "English",
    smoker: "Non-smoker",
    coverage: "$300,000",
  },
  {
    id: "6",
    name: "Jennifer Adams",
    category: "IUL",
    state: "WA",
    phone: "(555) 678-9012",
    email: "j.adams@example.com",
    price: 68.0,
    purchasedDate: "2025-06-05",
    timestamp: "2025-06-05 10:15",
    age: 38,
    language: "English",
    smoker: "Non-smoker",
    coverage: "$400,000",
  },
  {
    id: "7",
    name: "David Martinez",
    category: "Term Life",
    state: "AZ",
    phone: "(555) 789-0123",
    email: "d.martinez@example.com",
    price: 45.0,
    purchasedDate: "2025-06-06",
    timestamp: "2025-06-06 14:30",
    age: 45,
    language: "Spanish",
    smoker: "Non-smoker",
    coverage: "$200,000",
  },
]

type DateRange = {
  from: Date | null
  to: Date | null
}

export default function LeadsPage() {
  const [selectedLead, setSelectedLead] = useState<(typeof mockLeads)[0] | null>(null)
  const [categoryFilter, setCategoryFilter] = useState("All Categories")
  const [dateRange, setDateRange] = useState<DateRange | null>(null)

  const filteredLeads = useMemo(() => {
    return mockLeads.filter((lead) => {
      if (categoryFilter !== "All Categories" && lead.category !== categoryFilter) {
        return false
      }

      if (dateRange && dateRange.from && dateRange.to) {
        const [year, month, day] = lead.purchasedDate.split("-").map(Number)
        const leadDate = new Date(year, month - 1, day)

        const fromDate = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate())
        const toDate = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate())

        if (leadDate < fromDate || leadDate > toDate) {
          return false
        }
      }

      return true
    })
  }, [categoryFilter, dateRange])

  const handleExport = () => {
    const headers = [
      "Name",
      "Category",
      "State",
      "Phone",
      "Email",
      "Price",
      "Purchased Date",
      "Age",
      "Language",
      "Smoker",
      "Coverage",
    ]
    const csvContent = [
      headers.join(","),
      ...filteredLeads.map((lead) =>
        [
          `"${lead.name}"`,
          `"${lead.category}"`,
          `"${lead.state}"`,
          `"${lead.phone}"`,
          `"${lead.email}"`,
          lead.price.toFixed(2),
          `"${lead.purchasedDate}"`,
          lead.age,
          `"${lead.language}"`,
          `"${lead.smoker}"`,
          `"${lead.coverage}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `leads-export-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("Export complete", {
      description: `${filteredLeads.length} leads exported to CSV`,
    })
  }

  const handleDateRangeChange = (range: DateRange | null) => {
    setDateRange(range)
  }

  return (
    <DashboardLayout userType="buyer">
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1">View and manage all your purchased leads</p>
        </div>

        <Card className="p-4">
          <div className="flex flex-wrap gap-3">
            <DateRangePicker onChange={handleDateRangeChange} />
            <select
              className="h-10 px-3 rounded-md border border-input bg-background text-foreground"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option>All Categories</option>
              <option>Term Life</option>
              <option>Final Expense</option>
              <option>IUL</option>
              <option>Mortgage Protection</option>
              <option>Whole Life</option>
            </select>
            <Button onClick={handleExport} className="gap-2 ml-auto">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
          {(categoryFilter !== "All Categories" || (dateRange && dateRange.from)) && (
            <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
              Showing {filteredLeads.length} of {mockLeads.length} leads
              {categoryFilter !== "All Categories" && <span> • Category: {categoryFilter}</span>}
              {dateRange && dateRange.from && dateRange.to && (
                <span>
                  {" "}
                  • Date: {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </Card>

        <div className="grid gap-4">
          {filteredLeads.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No leads found matching your filters</p>
            </Card>
          ) : (
            filteredLeads.map((lead) => (
              <Card key={lead.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg text-foreground">{lead.name}</h3>
                      <Badge variant="secondary">{lead.category}</Badge>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{lead.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{lead.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">{lead.state}</span>
                      <span>•</span>
                      <span>{lead.timestamp}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <span className="font-semibold text-lg text-foreground">${lead.price.toFixed(2)}</span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLead(lead)}
                      className="gap-2 bg-transparent"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Lead Details</DialogTitle>
            </DialogHeader>
            {selectedLead && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-xl text-foreground">{selectedLead.name}</h3>
                  <Badge variant="secondary">{selectedLead.category}</Badge>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Phone</p>
                      <p className="font-medium text-foreground">{selectedLead.phone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Email</p>
                      <p className="font-medium text-foreground">{selectedLead.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">State</p>
                      <p className="font-medium text-foreground">{selectedLead.state}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Price</p>
                      <p className="font-semibold text-foreground">${selectedLead.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Age</p>
                      <p className="font-medium text-foreground">{selectedLead.age}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Language</p>
                      <p className="font-medium text-foreground">{selectedLead.language}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Smoker Status</p>
                      <p className="font-medium text-foreground">{selectedLead.smoker}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Coverage</p>
                      <p className="font-medium text-foreground">{selectedLead.coverage}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground mb-1">Purchased</p>
                      <p className="font-medium text-foreground">{selectedLead.timestamp}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
