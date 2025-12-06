"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Copy, Code, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

interface Field {
  name: string
  type: string
  required: boolean
  description: string
}

interface Supplier {
  id: string
  name: string
  email: string
  apiKey: string
  apiEndpoint: string
  leadCategories: string[]
  leadsReceived: number
  lastDelivery: string
  status: "active" | "inactive"
}

const defaultFields: Field[] = [
  { name: "api_key", type: "STRING", required: true, description: "Your API Key" },
  { name: "category", type: "STRING", required: true, description: "Lead Category ID" },
  { name: "first_name", type: "TEXT", required: true, description: "The lead's first name" },
  { name: "last_name", type: "TEXT", required: false, description: "The lead's last name" },
  { name: "email", type: "EMAIL", required: false, description: "The lead's email address" },
  { name: "phone", type: "PHONE", required: true, description: "The lead's phone number" },
  { name: "address", type: "TEXT", required: false, description: "The lead's address" },
  { name: "city", type: "TEXT", required: false, description: "The lead's city" },
  { name: "state", type: "TEXT", required: true, description: "The lead's state" },
  { name: "zip", type: "TEXT", required: false, description: "The lead's zip code" },
]

const mockSuppliers: Supplier[] = [
  {
    id: "1",
    name: "Lead Gen Pro",
    email: "contact@leadgenpro.com",
    apiKey: "sk_live_abc123xyz789def456",
    apiEndpoint: "https://api.leadflow.com/v1/ingest/s1",
    leadCategories: ["Term Life", "Final Expense"],
    leadsReceived: 1250,
    lastDelivery: "2024-01-15",
    status: "active",
  },
  {
    id: "2",
    name: "Insurance Leads Direct",
    email: "sales@insuranceleads.com",
    apiKey: "sk_live_def456abc789xyz123",
    apiEndpoint: "https://api.leadflow.com/v1/ingest/s2",
    leadCategories: ["Mortgage Protection"],
    leadsReceived: 890,
    lastDelivery: "2024-01-14",
    status: "active",
  },
  {
    id: "3",
    name: "Quality Leads Inc",
    email: "info@qualityleads.com",
    apiKey: "sk_live_xyz789def456abc123",
    apiEndpoint: "https://api.leadflow.com/v1/ingest/s3",
    leadCategories: ["Term Life"],
    leadsReceived: 320,
    lastDelivery: "2024-01-10",
    status: "inactive",
  },
]

const leadCategoryOptions = ["Term Life", "Final Expense", "Mortgage Protection", "IUL", "Whole Life"]

export default function SellersSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", email: "", leadCategories: [] as string[] })

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    email: "",
    leadCategories: [] as string[],
  })

  const handleAddSupplier = () => {
    const newId = Date.now().toString()
    const supplier: Supplier = {
      id: newId,
      name: newSupplier.name,
      email: newSupplier.email,
      apiKey: `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      apiEndpoint: `https://api.leadflow.com/v1/ingest/s${newId}`,
      leadCategories: newSupplier.leadCategories,
      leadsReceived: 0,
      lastDelivery: "-",
      status: "active",
    }
    setSuppliers([...suppliers, supplier])
    setNewSupplier({ name: "", email: "", leadCategories: [] })
    setShowAddDialog(false)
    toast.success("Supplier added successfully")
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const openSupplierDetails = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setEditForm({
      name: supplier.name,
      email: supplier.email,
      leadCategories: [...supplier.leadCategories],
    })
    setIsEditing(false)
  }

  const handleSaveEdit = () => {
    if (selectedSupplier) {
      setSuppliers(
        suppliers.map((s) =>
          s.id === selectedSupplier.id
            ? { ...s, name: editForm.name, email: editForm.email, leadCategories: editForm.leadCategories }
            : s,
        ),
      )
      setSelectedSupplier({
        ...selectedSupplier,
        name: editForm.name,
        email: editForm.email,
        leadCategories: editForm.leadCategories,
      })
      setIsEditing(false)
      toast.success("Supplier updated successfully")
    }
  }

  const generateExamplePayload = (supplier: Supplier) => {
    return JSON.stringify(
      {
        api_key: supplier.apiKey,
        category: supplier.leadCategories[0]?.toLowerCase().replace(" ", "_") || "term_life",
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        phone: "555-123-4567",
        address: "123 Main St",
        city: "Austin",
        state: "TX",
        zip: "78701",
      },
      null,
      2,
    )
  }

  return (
    <DashboardLayout userType="seller">
      <div className="p-8 space-y-8">
        {/* Main suppliers list view */}
        {!selectedSupplier && (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Suppliers</h1>
                <p className="text-muted-foreground mt-1">Manage your lead suppliers and their API integrations.</p>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add Supplier</DialogTitle>
                    <DialogDescription>Add a new lead supplier to receive leads from.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="supplier-name">Supplier Name</Label>
                      <Input
                        id="supplier-name"
                        placeholder="e.g., Lead Gen Pro"
                        value={newSupplier.name}
                        onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="supplier-email">Email</Label>
                      <Input
                        id="supplier-email"
                        type="email"
                        placeholder="contact@supplier.com"
                        value={newSupplier.email}
                        onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Lead Categories</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {leadCategoryOptions.map((category) => (
                          <label key={category} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={newSupplier.leadCategories.includes(category)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewSupplier({
                                    ...newSupplier,
                                    leadCategories: [...newSupplier.leadCategories, category],
                                  })
                                } else {
                                  setNewSupplier({
                                    ...newSupplier,
                                    leadCategories: newSupplier.leadCategories.filter((c) => c !== category),
                                  })
                                }
                              }}
                            />
                            <span className="text-sm">{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddSupplier}>Add Supplier</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="p-6">
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Lead Categories</TableHead>
                      <TableHead className="font-semibold">Leads Received</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow key={supplier.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-foreground">{supplier.name}</TableCell>
                        <TableCell className="text-muted-foreground">{supplier.email}</TableCell>
                        <TableCell className="text-foreground">
                          <div className="flex flex-wrap gap-1">
                            {supplier.leadCategories.map((category) => (
                              <Badge key={category} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {supplier.leadsReceived.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              supplier.status === "active"
                                ? "bg-green-500/10 text-green-600 border-green-500/20"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {supplier.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 bg-transparent"
                            onClick={() => openSupplierDetails(supplier)}
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </>
        )}

        {/* Supplier Documentation Page with Edit Capability */}
        {selectedSupplier && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setSelectedSupplier(null)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Suppliers
              </Button>
            </div>

            <div className="grid grid-cols-12 gap-6">
              {/* Supplier Info Card with Edit */}
              <div className="col-span-4">
                <Card className="p-6 space-y-4">
                  {!isEditing ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-foreground">{selectedSupplier.name}</h2>
                        <Badge
                          variant="outline"
                          className={
                            selectedSupplier.status === "active"
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {selectedSupplier.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="text-foreground">{selectedSupplier.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="text-foreground">API</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Delivery:</span>
                          <span className="text-foreground">{selectedSupplier.lastDelivery}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Leads Received:</span>
                          <span className="text-foreground font-semibold">
                            {selectedSupplier.leadsReceived.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                          Lead Categories
                        </Label>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedSupplier.leadCategories.map((category) => (
                            <Badge key={category} variant="outline" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full mt-4 bg-transparent"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Supplier
                      </Button>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold text-foreground">Edit Supplier</h2>
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-name">Name</Label>
                          <Input
                            id="edit-name"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-email">Email</Label>
                          <Input
                            id="edit-email"
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Lead Categories</Label>
                          <div className="space-y-2">
                            {leadCategoryOptions.map((category) => (
                              <label key={category} className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={editForm.leadCategories.includes(category)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setEditForm({
                                        ...editForm,
                                        leadCategories: [...editForm.leadCategories, category],
                                      })
                                    } else {
                                      setEditForm({
                                        ...editForm,
                                        leadCategories: editForm.leadCategories.filter((c) => c !== category),
                                      })
                                    }
                                  }}
                                />
                                <span className="text-sm">{category}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            className="flex-1 bg-transparent"
                            onClick={() => setIsEditing(false)}
                          >
                            Cancel
                          </Button>
                          <Button className="flex-1" onClick={handleSaveEdit}>
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              </div>

              {/* API Documentation */}
              <div className="col-span-8 space-y-6">
                {/* Ingestion Endpoint */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Code className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Ingestion Endpoint</h3>
                  </div>
                  <div className="flex gap-2">
                    <Input value={selectedSupplier.apiEndpoint} readOnly className="bg-muted font-mono text-sm" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(selectedSupplier.apiEndpoint, "Endpoint URL")}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>

                {/* Authentication */}
                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">Authentication</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">API Key</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={selectedSupplier.apiKey} readOnly className="bg-muted font-mono text-sm" />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(selectedSupplier.apiKey, "API Key")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* API Documentation Table */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">API Documentation</h3>
                  </div>
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <span className="text-sm font-semibold text-foreground">POST</span>
                    <span className="text-sm text-muted-foreground ml-2 font-mono">
                      /v1/ingest/{selectedSupplier.id}
                    </span>
                  </div>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold text-xs uppercase">Field Name</TableHead>
                          <TableHead className="font-semibold text-xs uppercase">Type</TableHead>
                          <TableHead className="font-semibold text-xs uppercase">Required</TableHead>
                          <TableHead className="font-semibold text-xs uppercase">Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {defaultFields.map((field) => (
                          <TableRow key={field.name}>
                            <TableCell className="font-mono text-sm text-primary">{field.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{field.type}</TableCell>
                            <TableCell>
                              <span className={field.required ? "text-red-500 font-medium" : "text-muted-foreground"}>
                                {field.required ? "Yes" : "No"}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{field.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>

                {/* Example Payload */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Example Request Payload</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-transparent"
                      onClick={() => copyToClipboard(generateExamplePayload(selectedSupplier), "Example payload")}
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </Button>
                  </div>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono text-foreground">
                    {generateExamplePayload(selectedSupplier)}
                  </pre>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
