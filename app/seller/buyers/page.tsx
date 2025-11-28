"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2 } from "lucide-react"
import Link from "next/link"

interface Buyer {
  id: string
  name: string
  walletBalance: number
  status: "active" | "paused"
  leadsPurchased: number
}

const mockBuyers: Buyer[] = [
  { id: "1", name: "ABC Insurance", walletBalance: 2450.0, status: "active", leadsPurchased: 324 },
  { id: "2", name: "XYZ Agency", walletBalance: 1820.5, status: "active", leadsPurchased: 198 },
  { id: "3", name: "Best Leads Co", walletBalance: 450.0, status: "paused", leadsPurchased: 87 },
  { id: "4", name: "Premium Insurance", walletBalance: 3200.0, status: "active", leadsPurchased: 412 },
  { id: "5", name: "Quick Quote LLC", walletBalance: 0.0, status: "paused", leadsPurchased: 0 },
]

export default function SellerBuyers() {
  const [buyers, setBuyers] = useState<Buyer[]>(mockBuyers)
  const [selectedBuyerIds, setSelectedBuyerIds] = useState<string[]>([])

  const toggleStatus = (id: string) => {
    setBuyers(
      buyers.map((buyer) =>
        buyer.id === id ? { ...buyer, status: buyer.status === "active" ? "paused" : "active" } : buyer,
      ),
    )
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBuyerIds(buyers.map((b) => b.id))
    } else {
      setSelectedBuyerIds([])
    }
  }

  const toggleSelectBuyer = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedBuyerIds([...selectedBuyerIds, id])
    } else {
      setSelectedBuyerIds(selectedBuyerIds.filter((buyerId) => buyerId !== id))
    }
  }

  const handleDeleteSelected = () => {
    setBuyers(buyers.filter((buyer) => !selectedBuyerIds.includes(buyer.id)))
    setSelectedBuyerIds([])
  }

  return (
    <DashboardLayout userType="seller">
      <div className="p-8 space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Buyers</h1>
            <p className="text-muted-foreground mt-1">Manage your buyers and their accounts.</p>
          </div>
          <Link href="/seller/buyers/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Buyer
            </Button>
          </Link>
        </div>

        <Card className="p-6">
          {selectedBuyerIds.length > 0 && (
            <div className="mb-4 flex items-center gap-3">
              <Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="gap-2">
                <Trash2 className="w-4 h-4" />
                Delete {selectedBuyerIds.length} {selectedBuyerIds.length === 1 ? "buyer" : "buyers"}
              </Button>
            </div>
          )}

          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedBuyerIds.length === buyers.length && buyers.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-semibold">Buyer Name</TableHead>
                  <TableHead className="font-semibold">Wallet Balance</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Leads Purchased</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buyers.map((buyer) => (
                  <TableRow key={buyer.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Checkbox
                        checked={selectedBuyerIds.includes(buyer.id)}
                        onCheckedChange={(checked) => toggleSelectBuyer(buyer.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{buyer.name}</TableCell>
                    <TableCell className="font-semibold text-foreground">${buyer.walletBalance.toFixed(2)}</TableCell>
                    <TableCell>
                      <Switch checked={buyer.status === "active"} onCheckedChange={() => toggleStatus(buyer.id)} />
                    </TableCell>
                    <TableCell className="text-foreground">{buyer.leadsPurchased}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/seller/buyers/${buyer.id}`}>
                          <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
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
