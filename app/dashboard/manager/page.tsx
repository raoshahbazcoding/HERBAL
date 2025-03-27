"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getOrders } from "@/lib/firebase/orders"
import { getProducts } from "@/lib/firebase/products"
import { ShoppingBag, Package } from "lucide-react"
import { useAuth } from "@/lib/auth-provider"

export default function ManagerDashboardPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    returnedOrders: 0,
    cancelledOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    recentOrders: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const [orders, products] = await Promise.all([
          getOrders(),
          getProducts(),
        ])

        // Filter orders if the user has assigned categories
        let filteredOrders = orders
        if (user?.assignedCategories?.length) {
          filteredOrders = orders.filter(order => 
            user.assignedCategories.includes(order.product?.categoryId)
          )
        }

        // Filter orders if the user has assigned products
        if (user?.assignedProducts?.length) {
          filteredOrders = filteredOrders.filter(order => 
            user.assignedProducts.includes(order.product?.id)
          )
        }

        // Calculate stats for each order status
        const pendingOrders = filteredOrders.filter((order) => order.status === "pending")
        const processingOrders = filteredOrders.filter((order) => order.status === "processing")
        const shippedOrders = filteredOrders.filter((order) => order.status === "shipped")
        const deliveredOrders = filteredOrders.filter((order) => order.status === "delivered")
        const returnedOrders = filteredOrders.filter((order) => order.status === "returned")
        const cancelledOrders = filteredOrders.filter((order) => order.status === "cancelled")

        // Calculate low stock products
        const lowStockProducts = products.filter((product) => {
          const inventory = product.inventory || 0
          return inventory <= 10
        })

        // Get recent orders
        const recentOrders = filteredOrders.slice(0, 5)

        setStats({
          totalOrders: filteredOrders.length,
          pendingOrders: pendingOrders.length,
          processingOrders: processingOrders.length,
          shippedOrders: shippedOrders.length,
          deliveredOrders: deliveredOrders.length,
          returnedOrders: returnedOrders.length,
          cancelledOrders: cancelledOrders.length,
          totalProducts: products.length,
          lowStockProducts: lowStockProducts.length,
          recentOrders,
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  const handleCardClick = (tabValue: string) => {
    setActiveTab(tabValue);
  }

  // Check if user has permission to view products
  const canViewProducts = user?.permissions?.canViewProducts || false

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Manager Dashboard</h2>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${canViewProducts ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          {canViewProducts && <TabsTrigger value="products">Products</TabsTrigger>}
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card 
                  className="cursor-pointer transition-all hover:shadow-md" 
                  onClick={() => handleCardClick("orders")}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  </CardContent>
                </Card>
                {canViewProducts && (
                  <Card 
                    className="cursor-pointer transition-all hover:shadow-md" 
                    onClick={() => handleCardClick("products")}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalProducts}</div>
                    </CardContent>
                  </Card>
                )}
                {canViewProducts && (
                  <Card 
                    className="cursor-pointer transition-all hover:shadow-md" 
                    onClick={() => handleCardClick("products")}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">\

