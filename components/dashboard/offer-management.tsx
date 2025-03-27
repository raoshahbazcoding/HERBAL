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
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { createOffer, getOffers, updateOffer, deleteOffer } from "@/lib/firebase/offers"
import { getProducts } from "@/lib/firebase/products"
import { getCategories } from "@/lib/firebase/categories"

export function OfferManagement() {
  const { toast } = useToast()
  const [offers, setOffers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discountPercentage: "",
    startDate: "",
    endDate: "",
    productIds: [] as string[],
    categoryIds: [] as string[],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [offersData, productsData, categoriesData] = await Promise.all([
          getOffers(),
          getProducts(),
          getCategories(),
        ])
        setOffers(offersData)
        setProducts(productsData)
        setCategories(categoriesData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const handleCreateOffer = async () => {
    try {
      if (!formData.name || !formData.discountPercentage || !formData.startDate || !formData.endDate) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      await createOffer({
        ...formData,
        discountPercentage: Number.parseFloat(formData.discountPercentage),
        createdAt: new Date().toISOString(),
      })

      // Refresh offer list
      const updatedOffers = await getOffers()
      setOffers(updatedOffers)

      // Reset form
      setFormData({
        name: "",
        description: "",
        discountPercentage: "",
        startDate: "",
        endDate: "",
        productIds: [],
        categoryIds: [],
      })

      setIsCreating(false)

      toast({
        title: "Success",
        description: "Offer created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create offer",
        variant: "destructive",
      })
    }
  }

  const handleEditOffer = async () => {
    try {
      if (
        !selectedOffer ||
        !formData.name ||
        !formData.discountPercentage ||
        !formData.startDate ||
        !formData.endDate
      ) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      await updateOffer(selectedOffer.id, {
        ...formData,
        discountPercentage: Number.parseFloat(formData.discountPercentage),
        updatedAt: new Date().toISOString(),
      })

      // Refresh offer list
      const updatedOffers = await getOffers()
      setOffers(updatedOffers)

      setIsEditing(false)
      setSelectedOffer(null)

      toast({
        title: "Success",
        description: "Offer updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update offer",
        variant: "destructive",
      })
    }
  }

  const handleDeleteOffer = async () => {
    try {
      if (!selectedOffer) return

      await deleteOffer(selectedOffer.id)

      // Refresh offer list
      const updatedOffers = await getOffers()
      setOffers(updatedOffers)

      setIsDeleting(false)
      setSelectedOffer(null)

      toast({
        title: "Success",
        description: "Offer deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting offer:", error)
      toast({
        title: "Error",
        description: "Failed to delete offer",
        variant: "destructive",
      })
      // Make sure we reset the state even if there's an error
      setIsDeleting(false)
      setSelectedOffer(null)
    }
  }

  const openEditDialog = (offer: any) => {
    setSelectedOffer(offer)
    setFormData({
      name: offer.name,
      description: offer.description || "",
      discountPercentage: offer.discountPercentage.toString(),
      startDate: new Date(offer.startDate).toISOString().split("T")[0],
      endDate: new Date(offer.endDate).toISOString().split("T")[0],
      productIds: offer.productIds || [],
      categoryIds: offer.categoryIds || [],
    })
    setIsEditing(true)
  }

  const openDeleteDialog = (offer: any) => {
    setSelectedOffer(offer)
    setIsDeleting(true)
  }

  const getOfferStatus = (offer: any) => {
    const now = new Date()
    const startDate = new Date(offer.startDate)
    const endDate = new Date(offer.endDate)

    if (now < startDate) {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Scheduled
        </Badge>
      )
    } else if (now > endDate) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          Expired
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
          Active
        </Badge>
      )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Offer Management</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>Add New Offer</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Offer</DialogTitle>
              <DialogDescription>
                Add a new discount offer. You can apply it to specific products or entire categories.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Offer Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                  placeholder="Summer Sale"
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
                  placeholder="Special summer discounts on selected products"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="discount" className="text-right">
                  Discount %
                </Label>
                <Input
                  id="discount"
                  type="number"
                  min="1"
                  max="99"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                  className="col-span-3"
                  placeholder="20"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endDate" className="text-right">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Products</Label>
                <div className="col-span-3 grid grid-cols-2 gap-2">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={formData.productIds.includes(product.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              productIds: [...formData.productIds, product.id],
                            })
                          } else {
                            setFormData({
                              ...formData,
                              productIds: formData.productIds.filter((id) => id !== product.id),
                            })
                          }
                        }}
                      />
                      <Label htmlFor={`product-${product.id}`} className="text-sm">
                        {product.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Categories</Label>
                <div className="col-span-3 grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={formData.categoryIds.includes(category.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              categoryIds: [...formData.categoryIds, category.id],
                            })
                          } else {
                            setFormData({
                              ...formData,
                              categoryIds: formData.categoryIds.filter((id) => id !== category.id),
                            })
                          }
                        }}
                      />
                      <Label htmlFor={`category-${category.id}`} className="text-sm">
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOffer}>Create Offer</Button>
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
                <TableHead>Discount</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : offers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    No offers found
                  </TableCell>
                </TableRow>
              ) : (
                offers.map((offer) => (
                  <TableRow key={offer.id} className="pointer-events-none">
                    <TableCell className="font-medium">
                      {offer.name}
                      {offer.description && <p className="text-xs text-muted-foreground">{offer.description}</p>}
                    </TableCell>
                    <TableCell>{offer.discountPercentage}%</TableCell>
                    <TableCell>{formatDate(offer.startDate)}</TableCell>
                    <TableCell>{formatDate(offer.endDate)}</TableCell>
                    <TableCell>{getOfferStatus(offer)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {offer.productIds?.length > 0 ? (
                          <span className="text-xs">{offer.productIds.length} products</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {offer.categoryIds?.map((categoryId: string) => {
                          const category = categories.find((c) => c.id === categoryId)
                          return category ? (
                            <Badge key={categoryId} variant="outline" className="text-xs">
                              {category.name}
                            </Badge>
                          ) : null
                        })}
                        {!offer.categoryIds?.length && <span className="text-xs text-muted-foreground">None</span>}
                      </div>
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
                          <DropdownMenuItem onClick={() => openEditDialog(offer)}>Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(offer)}>
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Offer</DialogTitle>
            <DialogDescription>Update offer details and selections.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Offer Name
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-discount" className="text-right">
                Discount %
              </Label>
              <Input
                id="edit-discount"
                type="number"
                min="1"
                max="99"
                value={formData.discountPercentage}
                onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-startDate" className="text-right">
                Start Date
              </Label>
              <Input
                id="edit-startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-endDate" className="text-right">
                End Date
              </Label>
              <Input
                id="edit-endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Products</Label>
              <div className="col-span-3 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-product-${product.id}`}
                      checked={formData.productIds.includes(product.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            productIds: [...formData.productIds, product.id],
                          })
                        } else {
                          setFormData({
                            ...formData,
                            productIds: formData.productIds.filter((id) => id !== product.id),
                          })
                        }
                      }}
                    />
                    <Label htmlFor={`edit-product-${product.id}`} className="text-sm">
                      {product.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Categories</Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-category-${category.id}`}
                      checked={formData.categoryIds.includes(category.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            categoryIds: [...formData.categoryIds, category.id],
                          })
                        } else {
                          setFormData({
                            ...formData,
                            categoryIds: formData.categoryIds.filter((id) => id !== category.id),
                          })
                        }
                      }}
                    />
                    <Label htmlFor={`edit-category-${category.id}`} className="text-sm">
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setSelectedOffer(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditOffer}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the offer "{selectedOffer?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedOffer(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOffer} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

