"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Package, ExternalLink } from "lucide-react"
import { getProducts } from "@/lib/firebase/products"
import { useToast } from "@/hooks/use-toast"

export function InventoryAlerts() {
  const { toast } = useToast()
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        const productsData = await getProducts()

        // Filter products with low inventory
        const lowStockProducts = productsData
          .filter((product) => {
            const inventory = product.inventory || 0
            return inventory <= 10
          })
          .sort((a, b) => (a.inventory || 0) - (b.inventory || 0))

        setProducts(lowStockProducts)
      } catch (error) {
        console.error("Error fetching products:", error)
        toast({
          title: "Error",
          description: "Failed to fetch inventory data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [toast])

  const getInventoryStatus = (inventory: number) => {
    if (inventory <= 0) {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800">
          Out of Stock
        </Badge>
      )
    } else if (inventory <= 5) {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800">
          Critical Stock
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          Low Stock
        </Badge>
      )
    }
  }

  const navigateToProducts = () => {
    // For admin dashboard
    if (window.location.pathname.includes("/admin")) {
      window.location.href = "/dashboard/admin?tab=products"
    }
    // For manager dashboard
    else if (window.location.pathname.includes("/manager")) {
      window.location.href = "/dashboard/manager?tab=products"
    }
  }

  return (
    <Card className="border-amber-200 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-amber-50">
        <CardTitle className="text-md font-medium">
          <div className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
            Inventory Alerts
          </div>
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={navigateToProducts}
          className="flex items-center gap-1 hover:bg-amber-100"
        >
          View All Products
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-20">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-20 text-center p-4">
            <Package className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No low stock products</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Inventory</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className="cursor-pointer hover:bg-amber-50">
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <div className="w-8 h-8 mr-2 rounded overflow-hidden">
                        <img
                          src={product.imageUrl || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span>{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{product.inventory || 0}</TableCell>
                  <TableCell>{getInventoryStatus(product.inventory || 0)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={navigateToProducts} className="hover:bg-amber-100">
                      Update
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

