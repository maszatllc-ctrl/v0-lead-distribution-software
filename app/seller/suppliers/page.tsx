"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Copy, Check, Plus, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

interface Supplier {
  id: string
  name: string
  email: string
  status: "active" | "inactive"
  categories: string[]
  leadsDelivered: number
  lastDelivery: string
  apiKey: string
}

interface Field {
  name: string
  type: string
  required: boolean
  description: string
}

const categoryFields: Record<string, Field[]> = {
  "Term Life": [
    { name: "first_name", type: "TEXT", required: true, description: "The lead's first name" },
    { name: "last_name", type: "TEXT", required: true, description: "The lead's last name" },
    { name: "email", type: "EMAIL", required: true, description: "The lead's email address" },
    { name: "phone", type: "PHONE", required: true, description: "The lead's phone number" },
    { name: "state", type: "TEXT", required: true, description: "The lead's state (2-letter code)" },
    { name: "age", type: "NUMBER", required: true, description: "The lead's age" },
    { name: "coverage_amount", type: "NUMBER", required: true, description: "Desired coverage amount" },
    { name: "smoker", type: "TEXT", required: false, description: "Smoker status (yes/no)" },
  ],
  "Final Expense": [
    { name: "first_name", type: "TEXT", required: true, description: "The lead's first name" },
    { name: "last_name", type: "TEXT", required: true, description: "The lead's last name" },
    { name: "email", type: "EMAIL", required: false, description: "The lead's email address" },
    { name: "phone", type: "PHONE", required: true, description: "The lead's phone number" },
    { name: "state", type: "TEXT", required: true, description: "The lead's state (2-letter code)" },
    { name: "age", type: "NUMBER", required: true, description: "The lead's age (typically 50-85)" },
    { name: "beneficiary", type: "TEXT", required: false, description: "Beneficiary name" },
  ],
  "Mortgage Protection": [
    { name: "first_name", type: "TEXT", required: true, description: "The lead's first name" },
    { name: "last_name", type: "TEXT", required: true, description: "The lead's last name" },
    { name: "email", type: "EMAIL", required: true, description: "The lead's email address" },
    { name: "phone", type: "PHONE", required: true, description: "The lead's phone number" },
    { name: "state", type: "TEXT", required: true, description: "The lead's state (2-letter code)" },
    { name: "mortgage_amount", type: "NUMBER", required: true, description: "Mortgage balance" },
    { name: "property_address", type: "TEXT", required: false, description: "Property address" },
  ],
  IUL: [
    { name: "first_name", type: "TEXT", required: true, description: "The lead's first name" },
    { name: "last_name", type: "TEXT", required: true, description: "The lead's last name" },
    { name: "email", type: "EMAIL", required: true, description: "The lead's email address" },
    { name: "phone", type: "PHONE", required: true, description: "The lead's phone number" },
    { name: "state", type: "TEXT", required: true, description: "The lead's state (2-letter code)" },
    { name: "annual_income", type: "NUMBER", required: true, description: "Annual household income" },
    { name: "investment_goal", type: "TEXT", required: false, description: "Investment goals" },
  ],
  "Whole Life": [
    { name: "first_name", type: "TEXT", required: true, description: "The lead's first name" },
    { name: "last_name", type: "TEXT", required: true, description: "The lead's last name" },
    { name: "email", type: "EMAIL", required: true, description: "The lead's email address" },
    { name: "phone", type: "PHONE", required: true, description: "The lead's phone number" },
    { name: "state", type: "TEXT", required: true, description: "The lead's state (2-letter code)" },
    { name: "age", type: "NUMBER", required: true, description: "The lead's age" },
    { name: "coverage_amount", type: "NUMBER", required: false, description: "Desired coverage amount" },
  ],
}

const allCategories = ["Term Life", "Final Expense", "Mortgage Protection", "IUL", "Whole Life"]

const mockSuppliers: Supplier[] = [
  {
    id: "1",
    name: "Premium Leads Co",
    email: "api@premiumleads.com",
    status: "active",
    categories: ["Term Life", "Final Expense"],
    leadsDelivered: 1250,
    lastDelivery: "2025-06-05",
    apiKey: "sk_live_abc123xyz789def456",
  },
  {
    id: "2",
    name: "Lead Generator Pro",
    email: "support@leadgenpro.com",
    status: "active",
    categories: ["Mortgage Protection", "IUL"],
    leadsDelivered: 890,
    lastDelivery: "2025-06-04",
    apiKey: "sk_live_mno456pqr123stu789",
  },
  {
    id: "3",
    name: "Insurance Leads Direct",
    email: "tech@ildirect.com",
    status: "inactive",
    categories: ["Whole Life"],
    leadsDelivered: 320,
    lastDelivery: "2025-05-28",
    apiKey: "sk_live_ghi789jkl012mno345",
  },
]

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [selectedDocCategory, setSelectedDocCategory] = useState<string>("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    email: "",
    categories: [] as string[],
  })
  const [editMode, setEditMode] = useState(false)
  const [editedSupplier, setEditedSupplier] = useState<Supplier | null>(null)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleAddSupplier = () => {
    if (!newSupplier.name || !newSupplier.email) {
      toast.error("Please fill in all required fields")
      return
    }
    const supplier: Supplier = {
      id: Date.now().toString(),
      name: newSupplier.name,
      email: newSupplier.email,
      status: "active",
      categories: newSupplier.categories,
      leadsDelivered: 0,
      lastDelivery: "-",
      apiKey: `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
    }
    setSuppliers([...suppliers, supplier])
    setNewSupplier({ name: "", email: "", categories: [] })
    setShowAddDialog(false)
    toast.success("Supplier added successfully")
  }

  const handleSaveSupplier = () => {
    if (!editedSupplier) return
    setSuppliers(suppliers.map((s) => (s.id === editedSupplier.id ? editedSupplier : s)))
    setSelectedSupplier(editedSupplier)
    setEditMode(false)
    toast.success("Supplier updated successfully")
  }

  const getFieldsForCategory = (category: string) => {
    return categoryFields[category] || []
  }

  const getFieldValue = (field: Field, category: string, supplier: Supplier) => {
    // System fields that get auto-filled
    if (field.name === "category" || field.name === "lead_category") {
      return category
    }
    // Example values based on field type
    switch (field.type) {
      case "TEXT":
        if (field.name === "first_name") return "John"
        if (field.name === "last_name") return "Doe"
        if (field.name === "state") return "TX"
        if (field.name === "smoker") return "no"
        if (field.name === "beneficiary") return "Jane Doe"
        if (field.name === "property_address") return "123 Main St"
        if (field.name === "investment_goal") return "retirement"
        return "example"
      case "EMAIL":
        return "john.doe@email.com"
      case "PHONE":
        return "(555) 123-4567"
      case "NUMBER":
        if (field.name === "age") return "45"
        if (field.name === "coverage_amount") return "500000"
        if (field.name === "mortgage_amount") return "350000"
        if (field.name === "annual_income") return "85000"
        return "0"
      default:
        return ""
    }
  }

  const generateExamplePayload = (category: string, supplier: Supplier) => {
    const fields = getFieldsForCategory(category)
    const payload: Record<string, string> = {
      api_key: supplier.apiKey,
      category: category,
    }
    fields.forEach((field) => {
      payload[field.name] = getFieldValue(field, category, supplier)
    })
    return JSON.stringify(payload, null, 2)
  }

  if (selectedSupplier) {
    const currentSupplier = editMode && editedSupplier ? editedSupplier : selectedSupplier
    // Set default category for docs if not set
    if (!selectedDocCategory && currentSupplier.categories.length > 0) {
      setSelectedDocCategory(currentSupplier.categories[0])
    }

    return (
      <DashboardLayout userType="seller">
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedSupplier(null)
                setEditMode(false)
                setEditedSupplier(null)
                setSelectedDocCategory("")
                setShowApiKey(false)
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              {editMode ? (
                <Input
                  value={editedSupplier?.name || ""}
                  onChange={(e) => setEditedSupplier({ ...editedSupplier!, name: e.target.value })}
                  className="text-2xl font-bold h-auto py-1 px-2"
                />
              ) : (
                <h1 className="text-2xl font-bold">{currentSupplier.name}</h1>
              )}
              <p className="text-sm text-muted-foreground">Last Delivery: {currentSupplier.lastDelivery}</p>
            </div>
            <Badge
              variant="outline"
              className={
                currentSupplier.status === "active"
                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                  : "bg-gray-500/10 text-gray-600 border-gray-500/20"
              }
            >
              {currentSupplier.status === "active" ? "Active" : "Inactive"}
            </Badge>
            {editMode ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditMode(false)
                    setEditedSupplier(null)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveSupplier}>Save Changes</Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode(true)
                  setEditedSupplier({ ...currentSupplier })
                }}
              >
                Edit Supplier
              </Button>
            )}
          </div>

          {/* Supplier Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supplier Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  {editMode ? (
                    <Input
                      value={editedSupplier?.email || ""}
                      onChange={(e) => setEditedSupplier({ ...editedSupplier!, email: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{currentSupplier.email}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Leads Delivered</Label>
                  <p className="font-medium">{currentSupplier.leadsDelivered.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Categories</Label>
                {editMode ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allCategories.map((cat) => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={editedSupplier?.categories.includes(cat)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEditedSupplier({
                                ...editedSupplier!,
                                categories: [...editedSupplier!.categories, cat],
                              })
                            } else {
                              setEditedSupplier({
                                ...editedSupplier!,
                                categories: editedSupplier!.categories.filter((c) => c !== cat),
                              })
                            }
                          }}
                        />
                        <span className="text-sm">{cat}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {currentSupplier.categories.map((cat) => (
                      <Badge key={cat} variant="secondary">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* API Documentation */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">API Documentation</CardTitle>
              {currentSupplier.categories.length > 0 && (
                <Select value={selectedDocCategory} onValueChange={setSelectedDocCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentSupplier.categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ingestion Endpoint */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Ingestion Endpoint</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-4 py-3 rounded-lg text-sm font-mono">
                    https://api.leadflow.com/v1/ingest/{currentSupplier.id}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      copyToClipboard(`https://api.leadflow.com/v1/ingest/${currentSupplier.id}`, "endpoint")
                    }
                  >
                    {copiedField === "endpoint" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">API Key</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-4 py-3 rounded-lg text-sm font-mono">
                    {showApiKey ? currentSupplier.apiKey : "••••••••••••••••••••••••••••"}
                  </code>
                  <Button variant="outline" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(currentSupplier.apiKey, "apikey")}
                  >
                    {copiedField === "apikey" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Field Documentation */}
              {selectedDocCategory && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">POST /v1/ingest/{currentSupplier.id}</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Field Name</TableHead>
                            <TableHead className="font-semibold">Type</TableHead>
                            <TableHead className="font-semibold">Required</TableHead>
                            <TableHead className="font-semibold">Value</TableHead>
                            <TableHead className="font-semibold">Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* System fields first */}
                          <TableRow>
                            <TableCell className="font-mono text-sm text-primary">api_key</TableCell>
                            <TableCell className="text-muted-foreground">TEXT</TableCell>
                            <TableCell>
                              <span className="text-red-500 font-medium">Yes</span>
                            </TableCell>
                            <TableCell>
                              <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                                {showApiKey ? currentSupplier.apiKey : "••••••••••"}
                              </code>
                            </TableCell>
                            <TableCell className="text-muted-foreground">Your API Key</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-mono text-sm text-primary">category</TableCell>
                            <TableCell className="text-muted-foreground">TEXT</TableCell>
                            <TableCell>
                              <span className="text-red-500 font-medium">Yes</span>
                            </TableCell>
                            <TableCell>
                              <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                                {selectedDocCategory}
                              </code>
                            </TableCell>
                            <TableCell className="text-muted-foreground">Lead Category</TableCell>
                          </TableRow>
                          {getFieldsForCategory(selectedDocCategory).map((field) => (
                            <TableRow key={field.name}>
                              <TableCell className="font-mono text-sm text-primary">{field.name}</TableCell>
                              <TableCell className="text-muted-foreground">{field.type}</TableCell>
                              <TableCell>
                                <span className={field.required ? "text-red-500 font-medium" : "text-muted-foreground"}>
                                  {field.required ? "Yes" : "No"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                                  {getFieldValue(field, selectedDocCategory, currentSupplier)}
                                </code>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{field.description}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Example Request */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Example Request</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-transparent"
                        onClick={() =>
                          copyToClipboard(generateExamplePayload(selectedDocCategory, currentSupplier), "payload")
                        }
                      >
                        {copiedField === "payload" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        Copy
                      </Button>
                    </div>
                    <pre className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">
                      {generateExamplePayload(selectedDocCategory, currentSupplier)}
                    </pre>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="seller">
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Suppliers</h1>
            <p className="text-muted-foreground mt-1">Manage your lead suppliers and their API access.</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Supplier
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Leads Delivered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell className="text-muted-foreground">{supplier.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {supplier.categories.slice(0, 2).map((cat) => (
                        <Badge key={cat} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                      {supplier.categories.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{supplier.categories.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{supplier.leadsDelivered.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        supplier.status === "active"
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                      }
                    >
                      {supplier.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSupplier(supplier)
                        if (supplier.categories.length > 0) {
                          setSelectedDocCategory(supplier.categories[0])
                        }
                      }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Add Supplier Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Supplier Name</Label>
              <Input
                placeholder="Enter supplier name"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-3">
                {allCategories.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={newSupplier.categories.includes(cat)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewSupplier({ ...newSupplier, categories: [...newSupplier.categories, cat] })
                        } else {
                          setNewSupplier({
                            ...newSupplier,
                            categories: newSupplier.categories.filter((c) => c !== cat),
                          })
                        }
                      }}
                    />
                    <span className="text-sm">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSupplier}>Add Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
