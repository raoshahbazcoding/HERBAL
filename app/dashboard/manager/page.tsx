"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ShoppingBag,
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { getOrders } from "@/lib/firebase/orders";
import { getProducts } from "@/lib/firebase/products";

// Define TypeScript interfaces for data
interface Order {
  id: string;
  product?: { id: string; categoryId: string; name: string };
  status: "pending" | "processing" | "shipped" | "delivered" | "returned" | "cancelled";
  createdAt: string;
  customerName: string;
}

interface Product {
  id: string;
  name: string;
  inventory: number;
  categoryId: string;
}

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  returnedOrders: number;
  cancelledOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  recentOrders: Order[];
}

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<DashboardStats>({
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
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [orders, products] = await Promise.all([getOrders(), getProducts()]);

        // Filter orders based on user permissions
        let filteredOrders = orders as Order[];
        if (user?.assignedCategories?.length) {
          filteredOrders = filteredOrders.filter((order) =>
            user.assignedCategories.includes(order.product?.categoryId || "")
          );
        }
        if (user?.assignedProducts?.length) {
          filteredOrders = filteredOrders.filter((order) =>
            user.assignedProducts.includes(order.product?.id || "")
          );
        }

        // Calculate stats for each order status
        const pendingOrders = filteredOrders.filter((order) => order.status === "pending");
        const processingOrders = filteredOrders.filter((order) => order.status === "processing");
        const shippedOrders = filteredOrders.filter((order) => order.status === "shipped");
        const deliveredOrders = filteredOrders.filter((order) => order.status === "delivered");
        const returnedOrders = filteredOrders.filter((order) => order.status === "returned");
        const cancelledOrders = filteredOrders.filter((order) => order.status === "cancelled");

        // Calculate low stock products
        const lowStockProducts = (products as Product[]).filter(
          (product) => (product.inventory || 0) <= 10
        );

        // Get recent orders (sorted by createdAt, descending)
        const recentOrders = filteredOrders
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

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
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to fetch dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleCardClick = (tabValue: string) => {
    setActiveTab(tabValue);
  };

  // Check permissions
  const canViewProducts = user?.permissions?.canViewProducts || false;
  const canViewOrders = user?.permissions?.canViewOrders || true;
  const canViewProfile = user?.permissions?.canViewProfile || true;

  // Status icons for recent orders
  const statusIcons = {
    pending: <Clock className="h-4 w-4 text-yellow-500" />,
    processing: <Package className="h-4 w-4 text-blue-500" />,
    shipped: <Truck className="h-4 w-4 text-purple-500" />,
    delivered: <CheckCircle className="h-4 w-4 text-green-500" />,
    returned: <RotateCcw className="h-4 w-4 text-orange-500" />,
    cancelled: <XCircle className="h-4 w-4 text-red-500" />,
  };

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Manager Dashboard</h2>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          className={`grid w-full ${
            canViewProducts && canViewOrders && canViewProfile
              ? "grid-cols-4"
              : canViewOrders && canViewProfile
              ? "grid-cols-3"
              : "grid-cols-2"
          } sm:grid-cols-4`}
        >
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {canViewOrders && <TabsTrigger value="orders">Orders</TabsTrigger>}
          {canViewProducts && <TabsTrigger value="products">Products</TabsTrigger>}
          {canViewProfile && <TabsTrigger value="profile">Profile</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {canViewOrders && (
                  <Card
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => handleCardClick("orders")}
                    role="button"
                    aria-label="View Orders"
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalOrders}</div>
                    </CardContent>
                  </Card>
                )}
                {canViewOrders && (
                  <Card
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => handleCardClick("orders")}
                    role="button"
                    aria-label="View Pending Orders"
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                      <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.pendingOrders}</div>
                    </CardContent>
                  </Card>
                )}
                {canViewProducts && (
                  <Card
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => handleCardClick("products")}
                    role="button"
                    aria-label="View Products"
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
                    role="button"
                    aria-label="View Low Stock Products"
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Low Stock Products</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.lowStockProducts}</div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {canViewOrders && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.recentOrders.length === 0 ? (
                      <p className="text-muted-foreground">No recent orders.</p>
                    ) : (
                      <div className="space-y-4">
                        {stats.recentOrders.map((order) => (
                          <div
                            key={order.id}
                            className="flex items-center justify-between border-b py-2"
                          >
                            <div>
                              <p className="font-medium">{order.customerName}</p>
                              <p className="text-sm text-muted-foreground">
                                {order.product?.name || "Unknown Product"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  order.status === "delivered"
                                    ? "default"
                                    : order.status === "cancelled"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {statusIcons[order.status]}
                                <span className="ml-1 capitalize">{order.status}</span>
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Manage all orders here. View, update, or cancel orders based on their status.
              </p>
              {/* Add order management UI (e.g., table or list) here */}
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Total Orders: {stats.totalOrders}
                </p>
                <p className="text-sm text-muted-foreground">
                  Pending: {stats.pendingOrders} | Processing: {stats.processingOrders} | Shipped:{" "}
                  {stats.shippedOrders} | Delivered: {stats.deliveredOrders}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Manage your product inventory. View stock levels and update product details.
              </p>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Total Products: {stats.totalProducts}
                </p>
                <p className="text-sm text-muted-foreground">
                  Low Stock: {stats.lowStockProducts}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                View and update your profile information, including permissions and assigned categories.
              </p>
              <div className="mt-4">
                <p className="text-sm font-medium">User: {user?.email || "N/A"}</p>
                <p className="text-sm text-muted-foreground">
                  Assigned Categories: {user?.assignedCategories?.join(", ") || "None"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Assigned Products: {user?.assignedProducts?.join(", ") || "None"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}