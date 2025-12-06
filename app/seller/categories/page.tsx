"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Field {
  id: string
  title: string
  type: "text" | "number" | "email" | "phone"
  description: string
  required: boolean
}

interface Category {
  id: string
  name: string
  fields: Field[]
}

const defaultFields: Field[] = [
  {
    id: "1",
    title: "first_name",
    type: "text",
    description: "The lead's first name",
    required: true,
  },
  {
    id: "2",
    title: "last_name",
    type: "text",
    description: "The lead's last name",
    required: false,
  },
  {
    id: "3",
    title: "email",
    type: "email",
    description: "The lead's email address",
    required: false,
  },
  { id: "4", title: "phone", type: "phone", description: "The lead's phone number", required: true },
  { id: "5", title: "address", type: "text", description: "The lead's address", required: false },
  { id: "6", title: "city", type: "text", description: "The lead's city", required: false },
  { id: "7", title: "state", type: "text", description: "The lead's state", required: true },
  { id: "8", title: "zip", type: "text", description: "The lead's zip code", required: false },
]

const initialCategories: Category[] = [
  {
    id: "1",
    name: "Term Life",
    fields: [...defaultFields],
  },
  {
    id: "2",
    name: "Final Expense",
    fields: [...defaultFields],
  },
  {
    id: "3",
    name: "Mortgage Protection",
    fields: [...defaultFields],
  },
  {
    id: "4",
    name: "IUL",
    fields: [...defaultFields],
  },
  {
    id: "5",
    name: "Whole Life",
    fields: [...defaultFields],
  },
]

export default function CategoriesAndFields() {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(categories[0] || null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddField, setShowAddField] = useState(false)
  const [showEditField, setShowEditField] = useState(false)
  const [editingField, setEditingField] = useState<Field | null>(null)
  const [newCategory, setNewCategory] = useState({ name: "" })
  const [newField, setNewField] = useState<Omit<Field, "id">>({
    title: "",
    type: "text",
    description: "",
    required: false,
  })

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast.error("Category name is required")
      return
    }
    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name,
      fields: [...defaultFields],
    }
    setCategories([...categories, category])
    setSelectedCategory(category)
    setShowAddCategory(false)
    setNewCategory({ name: "" })
    toast.success("Category created successfully")
  }

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id))
    if (selectedCategory?.id === id) {
      setSelectedCategory(categories.find((c) => c.id !== id) || null)
    }
    toast.success("Category deleted successfully")
  }

  const handleAddField = () => {
    if (!newField.title.trim()) {
      toast.error("Field title is required")
      return
    }
    if (!selectedCategory) return

    const field: Field = {
      id: Date.now().toString(),
      ...newField,
    }
    const updatedCategory = {
      ...selectedCategory,
      fields: [...selectedCategory.fields, field],
    }
    setCategories(categories.map((c) => (c.id === selectedCategory.id ? updatedCategory : c)))
    setSelectedCategory(updatedCategory)
    setShowAddField(false)
    setNewField({
      title: "",
      type: "text",
      description: "",
      required: false,
    })
    toast.success("Field added successfully")
  }

  const handleUpdateField = () => {
    if (!editingField || !selectedCategory) return

    const updatedCategory = {
      ...selectedCategory,
      fields: selectedCategory.fields.map((f) => (f.id === editingField.id ? editingField : f)),
    }
    setCategories(categories.map((c) => (c.id === selectedCategory.id ? updatedCategory : c)))
    setSelectedCategory(updatedCategory)
    setShowEditField(false)
    setEditingField(null)
    toast.success("Field updated successfully")
  }

  const handleDeleteField = (fieldId: string) => {
    if (!selectedCategory) return

    const updatedCategory = {
      ...selectedCategory,
      fields: selectedCategory.fields.filter((f) => f.id !== fieldId),
    }
    setCategories(categories.map((c) => (c.id === selectedCategory.id ? updatedCategory : c)))
    setSelectedCategory(updatedCategory)
    toast.success("Field deleted successfully")
  }

  const toggleFieldRequired = (fieldId: string) => {
    if (!selectedCategory) return

    const updatedCategory = {
      ...selectedCategory,
      fields: selectedCategory.fields.map((f) => (f.id === fieldId ? { ...f, required: !f.required } : f)),
    }
    setCategories(categories.map((c) => (c.id === selectedCategory.id ? updatedCategory : c)))
    setSelectedCategory(updatedCategory)
  }

  const openEditField = (field: Field) => {
    setEditingField({ ...field })
    setShowEditField(true)
  }

  return (
    <DashboardLayout userType="seller">
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories & Fields</h1>
          <p className="text-muted-foreground mt-1">Manage lead categories and their custom fields.</p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Categories Sidebar */}
          <div className="col-span-3">
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Categories</h2>
                <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Category</DialogTitle>
                      <DialogDescription>Create a new lead category.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="grid gap-2">
                        <Label>Category Name *</Label>
                        <Input
                          placeholder="e.g., Term Life"
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        />
                      </div>
                      <Button onClick={handleAddCategory} className="w-full">
                        Add Category
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-1">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      selectedCategory?.id === category.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-foreground"
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <span className="text-sm font-medium">{category.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCategory(category.id)
                      }}
                      className={`p-1 rounded hover:bg-red-500/20 ${
                        selectedCategory?.id === category.id ? "text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Fields Table */}
          <div className="col-span-9">
            <Card className="p-6 space-y-4">
              {selectedCategory ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{selectedCategory.name}</h2>
                    </div>
                    <Dialog open={showAddField} onOpenChange={setShowAddField}>
                      <DialogTrigger asChild>
                        <Button className="bg-[#0072d4] hover:bg-[#005bb0]">
                          <Plus className="w-4 h-4 mr-2" />
                          New field
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Field</DialogTitle>
                          <DialogDescription>Add a new custom field to {selectedCategory.name}.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="grid gap-2">
                            <Label>Title *</Label>
                            <Input
                              placeholder="e.g., coverage_amount"
                              value={newField.title}
                              onChange={(e) => setNewField({ ...newField, title: e.target.value })}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Type</Label>
                            <Select
                              value={newField.type}
                              onValueChange={(v) => setNewField({ ...newField, type: v as Field["type"] })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="phone">Phone Number</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label>Description</Label>
                            <Input
                              placeholder="Field description"
                              value={newField.description}
                              onChange={(e) => setNewField({ ...newField, description: e.target.value })}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Required</Label>
                            <Switch
                              checked={newField.required}
                              onCheckedChange={(checked) => setNewField({ ...newField, required: checked })}
                            />
                          </div>
                          <Button onClick={handleAddField} className="w-full">
                            Add Field
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Title</TableHead>
                          <TableHead className="font-semibold">Type</TableHead>
                          <TableHead className="font-semibold">Description</TableHead>
                          <TableHead className="font-semibold text-center">Required</TableHead>
                          <TableHead className="font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCategory.fields.map((field) => (
                          <TableRow key={field.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium text-foreground">{field.title}</TableCell>
                            <TableCell className="text-foreground capitalize">{field.type}</TableCell>
                            <TableCell className="text-muted-foreground">{field.description}</TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={field.required}
                                onCheckedChange={() => toggleFieldRequired(field.id)}
                                className="data-[state=checked]:bg-[#0072d4]"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => openEditField(field)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-600"
                                  onClick={() => handleDeleteField(field.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">Select a category to manage its fields</div>
              )}
            </Card>
          </div>
        </div>

        {/* Edit Field Dialog - Removed deliverable switch */}
        <Dialog open={showEditField} onOpenChange={setShowEditField}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Field</DialogTitle>
              <DialogDescription>Update the field details.</DialogDescription>
            </DialogHeader>
            {editingField && (
              <div className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <Label>Title *</Label>
                  <Input
                    value={editingField.title}
                    onChange={(e) => setEditingField({ ...editingField, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select
                    value={editingField.type}
                    onValueChange={(v) => setEditingField({ ...editingField, type: v as Field["type"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Input
                    value={editingField.description}
                    onChange={(e) => setEditingField({ ...editingField, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Required</Label>
                  <Switch
                    checked={editingField.required}
                    onCheckedChange={(checked) => setEditingField({ ...editingField, required: checked })}
                  />
                </div>
                <Button onClick={handleUpdateField} className="w-full">
                  Save Changes
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
