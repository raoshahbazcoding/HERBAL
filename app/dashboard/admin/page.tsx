"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmployeeManagement } from "@/components/dashboard/employee-management"
import { ProductManagement } from "@/components/dashboard/product-management"
import { OrderManagement } from "@/components/dashboard/order-management"
import { CategoryManagement } from "@/components/dashboard/category-management"
import { OfferManagement } from "@/components/dashboard/offer-management"
import { PnlManagement } from "@/components/dashboard/pnl-management"
import { getEmployees } from "@/lib/firebase/employees"
import { getProducts } from "@/lib/firebase/products"
import { getOrders } from "@/lib/firebase/orders"
import { getOffers } from "@/lib/firebase/offers"
import { Users, Package, Percent, DollarSign, ArrowDownRight, RefreshCw, ShoppingBag, Store } from "lucide-react"
import { InventoryAlerts } from "@/components/dashboard/inventory-alerts"

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalProducts: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    returnedOrders: 0,
    cancelledOrders: 0,
    onlineOrders: 0,
    localOrders: 0,
    totalRevenue: 0,
    activeOffers: 0,
    recentOrders: [],
    recentEmployees: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [employees, products, orders, offers] = await Promise.all([
          getEmployees(),
          getProducts(),
          getOrders(),
          getOffers(),
        ])

        // Calculate stats for each order status
        const pendingOrders = orders.filter((order) => order.status === "pending")
        const processingOrders = orders.filter((order) => order.status === "processing")
        const shippedOrders = orders.filter((order) => order.status === "shipped")
        const deliveredOrders = orders.filter((order) => order.status === "delivered")
        const returnedOrders = orders.filter((order) => order.status === "returned")
        const cancelledOrders = orders.filter((order) => order.status === "cancelled")

        // Calculate stats for order sources
        const onlineOrders = orders.filter((order) => !order.source || order.source === "online")
        const localOrders = orders.filter((order) => order.source === "local")

        // Calculate total revenue (excluding returned and cancelled orders)
        const totalRevenue = orders
          .filter((order) => order.status !== "returned" && order.status !== "cancelled")
          .reduce((sum, order) => sum + (order.total || 0), 0)

        // Get active offers
        const now = new Date()
        const activeOffers = offers.filter((offer) => {
          const startDate = new Date(offer.startDate)
          const endDate = new Date(offer.endDate)
          return startDate <= now && endDate >= now
        })

        // Get recent orders and employees
        const recentOrders = orders.slice(0, 3)
        const recentEmployees = employees.slice(0, 3)

        setStats({
          totalEmployees: employees.length,
          totalProducts: products.length,
          pendingOrders: pendingOrders.length,
          processingOrders: processingOrders.length,
          shippedOrders: shippedOrders.length,
          deliveredOrders: deliveredOrders.length,
          returnedOrders: returnedOrders.length,
          cancelledOrders: cancelledOrders.length,
          onlineOrders: onlineOrders.length,
          localOrders: localOrders.length,
          totalRevenue,
          activeOffers: activeOffers.length,
          recentOrders,
          recentEmployees,
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const handleCardClick = (tabValue: string) => {
    setActiveTab(tabValue)
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="pnl">P&L</TabsTrigger>
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
                  onClick={() => handleCardClick("employees")}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                  </CardContent>
                </Card>
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
                <Card
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => handleCardClick("offers")}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeOffers}</div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => handleCardClick("pnl")}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">PKR {stats.totalRevenue.toFixed(2)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Source Cards */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => handleCardClick("orders")}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Online Orders</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.onlineOrders}</div>
                    <p className="text-xs text-muted-foreground">Orders placed through the website</p>
                  </CardContent>
                </Card>
                <Card
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => handleCardClick("orders")}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Local Orders</CardTitle>
                    <Store className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.localOrders}</div>
                    <p className="text-xs text-muted-foreground">Orders created manually by staff</p>
                  </CardContent>
                </Card>
              </div>

              {/* Order Status Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                <Card
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => handleCardClick("orders")}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <div className="h-4 w-4 rounded-full bg-yellow-400"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.pendingOrders}</div>
                  </CardContent>
                </Card>
                <Card
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => handleCardClick("orders")}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Processing</CardTitle>
                    <div className="h-4 w-4 rounded-full bg-blue-400"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.processingOrders}</div>
                  </CardContent>
                </Card>
                <Card
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => handleCardClick("orders")}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Shipped</CardTitle>
                    <div className="h-4 w-4 rounded-full bg-purple-400"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.shippedOrders}</div>
                  </CardContent>
                </Card>
                <Card
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => handleCardClick("orders")}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                    <div className="h-4 w-4 rounded-full bg-green-400"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.deliveredOrders}</div>
                  </CardContent>
                </Card>
                <Card
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => handleCardClick("orders")}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Returned</CardTitle>
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.returnedOrders}</div>
                  </CardContent>
                </Card>
                <Card
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => handleCardClick("orders")}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.cancelledOrders}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Inventory Alerts - Moved above recent orders/employees */}
              <InventoryAlerts />

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {stats.recentOrders.length > 0 ? (
                        stats.recentOrders.map((order) => (
                          <div
                            key={order.id}
                            className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-md"
                            onClick={() => handleCardClick("orders")}
                          >
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">Order #{order.id.substring(0, 8)}</p>
                              <p className="text-sm text-muted-foreground">Customer: {order.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Status:</span>
                                {order.status === "pending" && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800">
                                    Pending
                                  </span>
                                )}
                                {order.status === "processing" && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                                    Processing
                                  </span>
                                )}
                                {order.status === "shipped" && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                                    Shipped
                                  </span>
                                )}
                                {order.status === "delivered" && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-800">
                                    Delivered
                                  </span>
                                )}
                                {order.status === "returned" && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-800">
                                    Returned
                                  </span>
                                )}
                                {order.status === "cancelled" && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-800">
                                    Cancelled
                                  </span>
                                )}
                                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 ml-1">
                                  {order.source === "local" ? "Local" : "Online"}
                                </span>
                              </div>
                            </div>
                            <div className="ml-auto font-medium">PKR {order.total?.toFixed(2)}</div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground">No recent orders</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Recent Employees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {stats.recentEmployees.length > 0 ? (
                        stats.recentEmployees.map((employee) => (
                          <div
                            key={employee.id}
                            className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-md"
                            onClick={() => handleCardClick("employees")}
                          >
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">
                                {employee.displayName || employee.email}
                              </p>
                              <p className="text-sm text-muted-foreground">Role: {employee.role || "Employee"}</p>
                            </div>
                            <div className="ml-auto font-medium">
                              {new Date(employee.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground">No recent employees</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <EmployeeManagement />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <ProductManagement />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoryManagement />
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <OrderManagement />
        </TabsContent>

        <TabsContent value="offers" className="space-y-4">
          <OfferManagement />
        </TabsContent>

        <TabsContent value="pnl" className="space-y-4">
          <PnlManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}

