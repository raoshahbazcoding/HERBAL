"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createCategory, getCategories, updateCategory, deleteCategory } from "@/lib/firebase/categories"
import { getProducts } from "@/lib/firebase/products"
import { getActiveOffers } from "@/lib/firebase/offers"
import { useAuth } from "@/lib/auth-provider"

export function CategoryManagement() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [activeOffers, setActiveOffers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, productsData, offersData] = await Promise.all([
          getCategories(),
          getProducts(),
          getActiveOffers(),
        ])
        setCategories(categoriesData)
        setProducts(productsData)
        setActiveOffers(offersData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to fetch categories",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const handleCreateCategory = async () => {
    try {
      if (!formData.name) {
        toast({
          title: "Error",
          description: "Please enter a category name",
          variant: "destructive",
        })
        return
      }

      await createCategory({
        ...formData,
        createdBy: user?.displayName || user?.email || "Unknown user",
        createdAt: new Date().toISOString(),
      })

      // Refresh category list
      const updatedCategories = await getCategories()
      setCategories(updatedCategories)

      // Reset form
      setFormData({
        name: "",
        description: "",
      })

      setIsCreating(false)

      toast({
        title: "Success",
        description: "Category created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      })
    }
  }

  const handleEditCategory = async () => {
    try {
      if (!selectedCategory || !formData.name) {
        toast({
          title: "Error",
          description: "Please enter a category name",
          variant: "destructive",
        })
        return
      }

      await updateCategory(selectedCategory.id, {
        ...formData,
        lastUpdatedBy: user?.displayName || user?.email || "Unknown user",
        updatedAt: new Date().toISOString(),
      })

      // Refresh category list
      const updatedCategories = await getCategories()
      setCategories(updatedCategories)

      setIsEditing(false)
      setSelectedCategory(null)

      toast({
        title: "Success",
        description: "Category updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async () => {
    try {
      if (!selectedCategory) return

      // Check if there are products using this category
      const productsInCategory = products.filter((product) => product.categoryId === selectedCategory.id)

      if (productsInCategory.length > 0) {
        toast({
          title: "Error",
          description: `Cannot delete category. It is being used by ${productsInCategory.length} product(s).`,
          variant: "destructive",
        })
        setIsDeleting(false)
        setSelectedCategory(null)
        return
      }

      await deleteCategory(selectedCategory.id)

      // Refresh category list
      const updatedCategories = await getCategories()
      setCategories(updatedCategories)

      setIsDeleting(false)
      setSelectedCategory(null)

      toast({
        title: "Success",
        description: "Category deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      })
      // Make sure we reset the state even if there's an error
      setIsDeleting(false)
      setSelectedCategory(null)
    }
  }

  const openEditDialog = (category: any) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
    })
    setIsEditing(true)
  }

  const openDeleteDialog = (category: any) => {
    setSelectedCategory(category)
    setIsDeleting(true)
  }

  const getProductCount = (categoryId: string) => {
    return products.filter((product) => product.categoryId === categoryId).length
  }

  const getCategoryOffers = (categoryId: string) => {
    return activeOffers.filter((offer) => offer.categoryIds?.includes(categoryId))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Category Management</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>Add New Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>Add a new product category. Categories help organize products.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCategory}>Create Category</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Active Offers</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No categories found
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id} className="pointer-events-none">
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description || "No description"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        {getProductCount(category.id)} products
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getCategoryOffers(category.id).length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {getCategoryOffers(category.id).map((offer) => (
                            <Badge key={offer.id} variant="outline" className="bg-red-100 text-red-800">
                              {offer.name}: {offer.discountPercentage}% OFF
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No active offers</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pointer-events-auto">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditDialog(category)}>Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(category)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setSelectedCategory(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditCategory}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "{selectedCategory?.name}". This action cannot be undone.
              {getProductCount(selectedCategory?.id) > 0 && (
                <p className="mt-2 text-red-600 font-semibold">
                  Warning: This category contains {getProductCount(selectedCategory?.id)} products. You cannot delete a
                  category that has products assigned to it.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCategory(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground"
              disabled={getProductCount(selectedCategory?.id) > 0}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

