"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, Database, Users, AlertCircle, TrendingUp, Plus } from "lucide-react"
import Link from "next/link"

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
  return (
    <DashboardLayout userType="seller">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Monitor your performance and manage your lead distribution.</p>
          </div>
          <Link href="/seller/buyers/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Buyer
            </Button>
          </Link>
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
