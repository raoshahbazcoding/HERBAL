"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { createOrder } from "@/lib/firebase/orders"
import { getProducts } from "@/lib/firebase/products"
import { getCategories } from "@/lib/firebase/categories"
import { getActiveOffers } from "@/lib/firebase/offers"

export default function ProductsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [orderForm, setOrderForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    productId: "",
    quantity: 1,
  })
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [activeOffers, setActiveOffers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData, offersData] = await Promise.all([
          getProducts(),
          getCategories(),
          getActiveOffers(),
        ])

        console.log("Products data from API:", productsData)

        // Ensure we always have products to display even if the API returns empty
        if (!productsData || productsData.length === 0) {
          const placeholderProducts = [
            {
              id: "placeholder1",
              name: "Sample Product 1",
              description: "This is a sample product. Add real products in the admin dashboard.",
              price: 19.99,
              imageUrl: "/placeholder.svg?height=300&width=300&text=Sample+Product",
              categoryId: "placeholder",
            },
            {
              id: "placeholder2",
              name: "Sample Product 2",
              description: "This is a sample product. Add real products in the admin dashboard.",
              price: 29.99,
              imageUrl: "/placeholder.svg?height=300&width=300&text=Sample+Product",
              categoryId: "placeholder",
            },
            {
              id: "placeholder3",
              name: "Sample Product 3",
              description: "This is a sample product. Add real products in the admin dashboard.",
              price: 39.99,
              imageUrl: "/placeholder.svg?height=300&width=300&text=Sample+Product",
              categoryId: "placeholder",
            },
          ]
          setProducts(placeholderProducts)
        } else {
          // Apply active offers to products
          const productsWithOffers = productsData.map((product) => {
            // Find offers that apply to this product
            const applicableOffers = offersData.filter((offer) => {
              // Check if offer applies directly to this product
              if (offer.productIds?.includes(product.id)) {
                return true
              }

              // Check if offer applies to this product's category
              if (offer.categoryIds?.includes(product.categoryId)) {
                return true
              }

              return false
            })

            // Find the best discount (highest percentage)
            let bestDiscount = 0
            let bestOffer = null

            applicableOffers.forEach((offer) => {
              if (offer.discountPercentage > bestDiscount) {
                bestDiscount = offer.discountPercentage
                bestOffer = offer
              }
            })

            // Apply the best discount if found
            if (bestOffer) {
              const originalPrice = product.price
              const discountAmount = (originalPrice * bestDiscount) / 100
              const discountedPrice = originalPrice - discountAmount

              return {
                ...product,
                originalPrice,
                discountPercentage: bestDiscount,
                price: discountedPrice,
                offerName: bestOffer.name,
              }
            }

            return product
          })

          setProducts(productsWithOffers)
        }

        setCategories(categoriesData || [])
        setActiveOffers(offersData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        // Set placeholder products even if there's an error
        const placeholderProducts = [
          {
            id: "placeholder1",
            name: "Sample Product 1",
            description: "This is a sample product. Add real products in the admin dashboard.",
            price: 19.99,
            imageUrl: "/placeholder.svg?height=300&width=300&text=Sample+Product",
            categoryId: "placeholder",
          },
          {
            id: "placeholder2",
            name: "Sample Product 2",
            description: "This is a sample product. Add real products in the admin dashboard.",
            price: 29.99,
            imageUrl: "/placeholder.svg?height=300&width=300&text=Sample+Product",
            categoryId: "placeholder",
          },
          {
            id: "placeholder3",
            name: "Sample Product 3",
            description: "This is a sample product. Add real products in the admin dashboard.",
            price: 39.99,
            imageUrl: "/placeholder.svg?height=300&width=300&text=Sample+Product",
            categoryId: "placeholder",
          },
        ]
        setProducts(placeholderProducts)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const filteredProducts =
    selectedCategory === "all" ? products : products.filter((product) => product.categoryId === selectedCategory)

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product)
    setOrderForm((prev) => ({ ...prev, productId: product.id }))

    // Scroll to the order form
    setTimeout(() => {
      const orderForm = document.getElementById("order-form")
      if (orderForm) {
        orderForm.scrollIntoView({ behavior: "smooth" })
      }
    }, 100)

    toast({
      title: "Product Selected",
      description: `${product.name} has been selected. You can now place your order.`,
    })
  }

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Please select a product first",
        variant: "destructive",
      })
      return
    }

    // Show confirmation dialog
    setShowOrderConfirmation(true)
  }

  const confirmOrder = async () => {
    setIsSubmitting(true)

    try {
      // Create order in Firebase
      const orderData = {
        ...orderForm,
        product: {
          id: selectedProduct.id,
          name: selectedProduct.name,
          price: selectedProduct.price,
          categoryId: selectedProduct.categoryId,
        },
        status: "pending",
        total: selectedProduct.price * orderForm.quantity,
        createdAt: new Date().toISOString(),
      }

      const order = await createOrder(orderData)

      // Store order data in session storage for the thank you page
      sessionStorage.setItem(
        "orderData",
        JSON.stringify({
          ...orderData,
          id: order.id,
        }),
      )

      toast({
        title: "Order Placed",
        description: "Your order has been successfully placed!",
      })

      // Redirect to thank you page
      router.push("/order-confirmation")
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "Error",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setShowOrderConfirmation(false)
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : "Uncategorized"
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <span className="font-bold text-xl">ProductHub</span>
        </Link>
      </header>
      <main className="flex-1 py-6 px-4 md:px-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-6">Our Products</h1>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeOffers.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-100">
                  <h2 className="text-lg font-bold text-red-800 mb-2">Active Offers</h2>
                  <div className="flex flex-wrap gap-2">
                    {activeOffers.map((offer) => (
                      <Badge key={offer.id} variant="outline" className="bg-red-100 text-red-800">
                        {offer.name}: {offer.discountPercentage}% OFF
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium">No products found</h3>
                  <p className="text-muted-foreground">Try selecting a different category or check back later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={product.imageUrl || "/placeholder.svg?height=200&width=200"}
                          alt={product.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <CardHeader>
                        <CardTitle>{product.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{product.description}</p>
                        <div className="mt-2">
                          {product.originalPrice ? (
                            <div>
                              <p className="font-bold text-lg text-red-600">
                                ${product.price?.toFixed(2)}
                                <span className="text-sm ml-2 line-through text-muted-foreground">
                                  ${product.originalPrice?.toFixed(2)}
                                </span>
                              </p>
                              <p className="text-xs text-red-600">
                                {product.discountPercentage}% OFF - {product.offerName}
                              </p>
                            </div>
                          ) : (
                            <p className="font-bold text-lg">${product.price?.toFixed(2) || "0.00"}</p>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Category: {getCategoryName(product.categoryId)}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button onClick={() => handleSelectProduct(product)} className="w-full">
                          Order Now
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}

              {selectedProduct && (
                <Card className="mb-10">
                  <CardHeader>
                    <CardTitle>Place Your Order</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/3">
                        <div className="aspect-square overflow-hidden rounded-md mb-4">
                          <img
                            src={selectedProduct.imageUrl || "/placeholder.svg"}
                            alt={selectedProduct.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <h3 className="font-bold text-lg">{selectedProduct.name}</h3>
                        <p className="text-muted-foreground">{selectedProduct.description}</p>
                        {selectedProduct.originalPrice ? (
                          <div className="mt-2">
                            <p className="font-bold text-lg text-red-600">
                              ${selectedProduct.price?.toFixed(2)}
                              <span className="text-sm ml-2 line-through text-muted-foreground">
                                ${selectedProduct.originalPrice?.toFixed(2)}
                              </span>
                            </p>
                            <p className="text-xs text-red-600">
                              {selectedProduct.discountPercentage}% OFF - {selectedProduct.offerName}
                            </p>
                          </div>
                        ) : (
                          <p className="font-bold text-lg mt-2">${selectedProduct.price?.toFixed(2) || "0.00"}</p>
                        )}
                      </div>
                      <div className="md:w-2/3">
                        <form id="order-form" onSubmit={handleOrderSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="name">Full Name</Label>
                              <Input
                                id="name"
                                value={orderForm.name}
                                onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                type="email"
                                value={orderForm.email}
                                onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="phone">Phone Number</Label>
                              <Input
                                id="phone"
                                value={orderForm.phone}
                                onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="quantity">Quantity</Label>
                              <Input
                                id="quantity"
                                type="number"
                                min="1"
                                value={orderForm.quantity}
                                onChange={(e) =>
                                  setOrderForm({ ...orderForm, quantity: Number.parseInt(e.target.value) })
                                }
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="address">Delivery Address</Label>
                            <Input
                              id="address"
                              value={orderForm.address}
                              onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                              required
                            />
                          </div>
                          <div className="pt-4">
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                              {isSubmitting ? "Processing..." : "Place Order"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">© 2024 ProductHub. All rights reserved.</p>
      </footer>

      <AlertDialog open={showOrderConfirmation} onOpenChange={setShowOrderConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Order</AlertDialogTitle>
            <AlertDialogDescription>
              Please review your order details before confirming.
              <div className="mt-4 space-y-2">
                <p>
                  <strong>Product:</strong> {selectedProduct?.name}
                </p>
                <p>
                  <strong>Price:</strong> ${selectedProduct?.price?.toFixed(2)}
                </p>
                <p>
                  <strong>Quantity:</strong> {orderForm.quantity}
                </p>
                <p>
                  <strong>Total:</strong> ${(selectedProduct?.price * orderForm.quantity).toFixed(2)}
                </p>
                <p>
                  <strong>Delivery Address:</strong> {orderForm.address}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOrder} disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Confirm Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

