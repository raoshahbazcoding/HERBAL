"use client"

import { Checkbox } from "@/components/ui/checkbox"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import {
  createOrder,
  getOrders,
  updateOrder,
  deleteOrder,
  addCallLogToOrder,
  assignOrderToEmployee,
  type Order,
  type OrderStatus,
  type CallLog,
} from "@/lib/firebase/orders"
import { getCategories } from "@/lib/firebase/categories"
import { getProducts, updateProduct } from "@/lib/firebase/products"
import { getEmployees } from "@/lib/firebase/employees"
import { useAuth } from "@/lib/auth-provider"
import { Phone, PlusCircle, CheckCircle, TruckIcon, RefreshCw, User, Calendar, ArrowUpDown, Search } from "lucide-react"

interface OrderManagementProps {
  userRole?: string
}

export function OrderManagement({ userRole = "admin" }: OrderManagementProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isViewingDetails, setIsViewingDetails] = useState(false)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [isAddingCallLog, setIsAddingCallLog] = useState(false)
  const [isAssigningEmployee, setIsAssigningEmployee] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [sortField, setSortField] = useState<string>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isProcessingAction, setIsProcessingAction] = useState(false)
  const [newOrderForm, setNewOrderForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    productId: "",
    quantity: "1",
    notes: "",
  })
  const [callLogForm, setCallLogForm] = useState({
    notes: "",
    outcome: "successful" as "successful" | "unsuccessful" | "voicemail" | "no-answer",
    followUpRequired: false,
    followUpDate: "",
  })
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [ordersData, categoriesData, productsData, employeesData] = await Promise.all([
          getOrders(),
          getCategories(),
          getProducts(),
          getEmployees(),
        ])

        setOrders(ordersData)
        setCategories(categoriesData)
        setProducts(productsData)
        setEmployees(employeesData)
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

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      setIsProcessingAction(true)

      // Add tracking information about who made the change
      const updateData = {
        status,
        lastUpdatedBy: user?.displayName || user?.email || "Unknown user",
        lastUpdatedAt: new Date().toISOString(),
      }

      await updateOrder(orderId, updateData)

      // Refresh order list
      const updatedOrders = await getOrders()
      setOrders(updatedOrders)

      if (selectedOrder && selectedOrder.id === orderId) {
        const updatedOrder = updatedOrders.find((o) => o.id === orderId)
        if (updatedOrder) {
          setSelectedOrder(updatedOrder)
        }
      }

      toast({
        title: "Success",
        description: "Order status updated successfully",
      })
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setIsProcessingAction(false)
    }
  }

  const handleDeleteOrder = async () => {
    try {
      if (!selectedOrder) return

      setIsProcessingAction(true)

      await deleteOrder(selectedOrder.id)

      // Refresh order list
      const updatedOrders = await getOrders()
      setOrders(updatedOrders)
      setIsDeleting(false)
      setSelectedOrder(null)

      toast({
        title: "Success",
        description: "Order deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting order:", error)
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      })
      // Make sure we reset the state even if there's an error
      setIsDeleting(false)
      setSelectedOrder(null)
    } finally {
      setIsProcessingAction(false)
    }
  }

  const handleCreateOrder = async () => {
    try {
      setIsProcessingAction(true)

      // Validate form
      if (!newOrderForm.name || !newOrderForm.productId || !newOrderForm.quantity) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      // Get product details
      const product = products.find((p) => p.id === newOrderForm.productId)
      if (!product) {
        toast({
          title: "Error",
          description: "Selected product not found",
          variant: "destructive",
        })
        return
      }

      // Calculate total
      const quantity = Number.parseInt(newOrderForm.quantity)
      const total = product.price * quantity

      // Create order data
      const orderData = {
        name: newOrderForm.name,
        email: newOrderForm.email,
        phone: newOrderForm.phone,
        address: newOrderForm.address,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          categoryId: product.categoryId,
        },
        quantity: quantity,
        total: total,
        status: "pending" as OrderStatus,
        source: "local", // Mark as local order
        notes: newOrderForm.notes,
        createdBy: user?.displayName || user?.email || "Unknown user",
        createdAt: new Date().toISOString(),
      }

      // Create the order
      await createOrder(orderData)

      // Update product inventory
      try {
        const currentInventory = product.inventory || 0
        const newInventory = Math.max(0, currentInventory - quantity)

        await updateProduct(product.id, {
          inventory: newInventory,
          updatedAt: new Date().toISOString(),
          lastUpdatedBy: user?.displayName || user?.email || "Unknown user",
        })
      } catch (error) {
        console.error("Error updating product inventory:", error)
        // Continue with order creation even if inventory update fails
      }

      // Reset form
      setNewOrderForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        productId: "",
        quantity: "1",
        notes: "",
      })

      // Close dialog
      setIsCreatingOrder(false)

      // Refresh orders
      const updatedOrders = await getOrders()
      setOrders(updatedOrders)

      toast({
        title: "Success",
        description: "Order created successfully",
      })
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      })
    } finally {
      setIsProcessingAction(false)
    }
  }

  const handleAddCallLog = async () => {
    try {
      if (!selectedOrder) return

      setIsProcessingAction(true)

      if (!callLogForm.notes) {
        toast({
          title: "Error",
          description: "Please enter call notes",
          variant: "destructive",
        })
        return
      }

      const callLog = {
        date: new Date().toISOString(),
        employeeId: user?.id || "unknown",
        employeeName: user?.displayName || user?.email || "Unknown user",
        notes: callLogForm.notes,
        outcome: callLogForm.outcome,
        followUpRequired: callLogForm.followUpRequired,
        followUpDate: callLogForm.followUpRequired ? callLogForm.followUpDate : undefined,
      }

      await addCallLogToOrder(selectedOrder.id, callLog)

      // Refresh order data
      const updatedOrders = await getOrders()
      setOrders(updatedOrders)

      // Update selected order
      const updatedOrder = updatedOrders.find((o) => o.id === selectedOrder.id)
      if (updatedOrder) {
        setSelectedOrder(updatedOrder)
      }

      // Reset form
      setCallLogForm({
        notes: "",
        outcome: "successful",
        followUpRequired: false,
        followUpDate: "",
      })

      setIsAddingCallLog(false)

      toast({
        title: "Success",
        description: "Call log added successfully",
      })
    } catch (error) {
      console.error("Error adding call log:", error)
      toast({
        title: "Error",
        description: "Failed to add call log",
        variant: "destructive",
      })
    } finally {
      setIsProcessingAction(false)
    }
  }

  const handleAssignEmployee = async () => {
    try {
      if (!selectedOrder || !selectedEmployeeId) {
        toast({
          title: "Error",
          description: "Please select an employee",
          variant: "destructive",
        })
        return
      }

      setIsProcessingAction(true)

      const employee = employees.find((e) => e.id === selectedEmployeeId)
      if (!employee) {
        toast({
          title: "Error",
          description: "Selected employee not found",
          variant: "destructive",
        })
        return
      }

      await assignOrderToEmployee(selectedOrder.id, selectedEmployeeId, employee.displayName || employee.email)

      // Refresh order data
      const updatedOrders = await getOrders()
      setOrders(updatedOrders)

      // Update selected order
      const updatedOrder = updatedOrders.find((o) => o.id === selectedOrder.id)
      if (updatedOrder) {
        setSelectedOrder(updatedOrder)
      }

      setIsAssigningEmployee(false)
      setSelectedEmployeeId("")

      toast({
        title: "Success",
        description: `Order assigned to ${employee.displayName || employee.email}`,
      })
    } catch (error) {
      console.error("Error assigning employee:", error)
      toast({
        title: "Error",
        description: "Failed to assign employee",
        variant: "destructive",
      })
    } finally {
      setIsProcessingAction(false)
    }
  }

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsViewingDetails(true)
  }

  const openDeleteDialog = (order: Order) => {
    setSelectedOrder(order)
    setIsDeleting(true)
  }

  const openAddCallLogDialog = (order: Order) => {
    setSelectedOrder(order)
    setIsAddingCallLog(true)
  }

  const openAssignEmployeeDialog = (order: Order) => {
    setSelectedOrder(order)
    setIsAssigningEmployee(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Processing
          </Badge>
        )
      case "shipped":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            Shipped
          </Badge>
        )
      case "delivered":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            Delivered
          </Badge>
        )
      case "returned":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            Returned
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSourceBadge = (source: string) => {
    if (source === "local") {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800">
          Local
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          Online
        </Badge>
      )
    }
  }

  const getCallOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case "successful":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Successful
          </Badge>
        )
      case "unsuccessful":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Unsuccessful
          </Badge>
        )
      case "voicemail":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Voicemail
          </Badge>
        )
      case "no-answer":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            No Answer
          </Badge>
        )
      default:
        return <Badge variant="outline">{outcome}</Badge>
    }
  }

  // Filter and sort orders
  let filteredOrders = [...orders]

  // Apply status filter
  if (statusFilter !== "all") {
    filteredOrders = filteredOrders.filter((order) => order.status === statusFilter)
  }

  // Apply source filter
  if (sourceFilter !== "all") {
    filteredOrders = filteredOrders.filter((order) =>
      sourceFilter === "local" ? order.source === "local" : order.source !== "local",
    )
  }

  // Apply assignee filter
  if (assigneeFilter !== "all") {
    if (assigneeFilter === "unassigned") {
      filteredOrders = filteredOrders.filter((order) => !order.assignedTo)
    } else {
      filteredOrders = filteredOrders.filter((order) => order.assignedTo === assigneeFilter)
    }
  }

  // Apply search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filteredOrders = filteredOrders.filter(
      (order) =>
        order.name.toLowerCase().includes(query) ||
        order.email.toLowerCase().includes(query) ||
        order.phone.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query) ||
        order.product?.name.toLowerCase().includes(query),
    )
  }

  // Sort orders
  filteredOrders.sort((a, b) => {
    let valueA, valueB

    switch (sortField) {
      case "createdAt":
        valueA = new Date(a.createdAt).getTime()
        valueB = new Date(b.createdAt).getTime()
        break
      case "status":
        valueA = a.status
        valueB = b.status
        break
      case "customer":
        valueA = a.name
        valueB = b.name
        break
      case "total":
        valueA = a.total
        valueB = b.total
        break
      default:
        valueA = new Date(a.createdAt).getTime()
        valueB = new Date(b.createdAt).getTime()
    }

    if (sortDirection === "asc") {
      return valueA > valueB ? 1 : -1
    } else {
      return valueA < valueB ? 1 : -1
    }
  })

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <div className="flex items-center gap-2">
          {/* Only show Create Order button for users with permission */}
          {(userRole === "admin" || user?.permissions?.canCreateOrders) && (
            <Dialog open={isCreatingOrder} onOpenChange={setIsCreatingOrder}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Create Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Order</DialogTitle>
                  <DialogDescription>Add a new order manually. This will be marked as a local order.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Customer Name *</Label>
                      <Input
                        id="name"
                        value={newOrderForm.name}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, name: e.target.value })}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newOrderForm.email}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newOrderForm.phone}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={newOrderForm.quantity}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, quantity: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Delivery Address</Label>
                    <Input
                      id="address"
                      value={newOrderForm.address}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, address: e.target.value })}
                      placeholder="123 Main St, City, Country"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product">Product *</Label>
                    <Select
                      value={newOrderForm.productId}
                      onValueChange={(value) => setNewOrderForm({ ...newOrderForm, productId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - PKR {product.price.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Order Notes</Label>
                    <Textarea
                      id="notes"
                      value={newOrderForm.notes}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, notes: e.target.value })}
                      placeholder="Any special instructions or notes about this order"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreatingOrder(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateOrder} disabled={isProcessingAction}>
                    {isProcessingAction ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent"></div>
                        Creating...
                      </>
                    ) : (
                      "Create Order"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="statusFilter">Filter by Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="statusFilter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sourceFilter">Filter by Source</Label>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger id="sourceFilter">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="local">Local</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assigneeFilter">Filter by Assignee</Label>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger id="assigneeFilter">
              <SelectValue placeholder="Filter by assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.displayName || employee.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders by customer, email, phone, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("createdAt")}>
                  <div className="flex items-center gap-1">
                    Date
                    {sortField === "createdAt" && (
                      <ArrowUpDown className={`h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("customer")}>
                  <div className="flex items-center gap-1">
                    Customer
                    {sortField === "customer" && (
                      <ArrowUpDown className={`h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("total")}>
                  <div className="flex items-center gap-1">
                    Total
                    {sortField === "total" && (
                      <ArrowUpDown className={`h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>
                  <div className="flex items-center gap-1">
                    Status
                    {sortField === "status" && (
                      <ArrowUpDown className={`h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    <div className="flex justify-center py-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => viewOrderDetails(order)}
                  >
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">#{order.id.substring(0, 8)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{order.name}</span>
                        <span className="text-xs text-muted-foreground">{order.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{order.product?.name || "N/A"}</TableCell>
                    <TableCell>PKR {order.total?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{getSourceBadge(order.source || "online")}</TableCell>
                    <TableCell>
                      {order.assignedToName ? (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span>{order.assignedToName}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => viewOrderDetails(order)}>View Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                          {(userRole === "admin" || user?.permissions?.canUpdateOrders) && (
                            <>
                              <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, "pending")}>
                                Set as Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, "processing")}>
                                Set as Processing
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, "shipped")}>
                                Set as Shipped
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, "delivered")}>
                                Set as Delivered
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, "returned")}>
                                Set as Returned
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, "cancelled")}>
                                Set as Cancelled
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openAddCallLogDialog(order)}>
                            <Phone className="h-4 w-4 mr-2" />
                            Add Call Log
                          </DropdownMenuItem>
                          {userRole === "admin" && (
                            <>
                              <DropdownMenuItem onClick={() => openAssignEmployeeDialog(order)}>
                                <User className="h-4 w-4 mr-2" />
                                Assign Employee
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(order)}>
                                Delete Order
                              </DropdownMenuItem>
                            </>
                          )}
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

      {/* Order Details Dialog */}
      <Dialog open={isViewingDetails} onOpenChange={setIsViewingDetails}>
        <DialogContent className="sm:max-w-[800px]">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
                <DialogDescription>
                  Order #{selectedOrder.id.substring(0, 8)} - Created on{" "}
                  {new Date(selectedOrder.createdAt).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Customer Information</h3>
                    <div className="bg-muted/50 p-3 rounded-md">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-sm font-medium">Name</div>
                          <div>{selectedOrder.name}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Email</div>
                          <div>{selectedOrder.email || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Phone</div>
                          <div>{selectedOrder.phone || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Address</div>
                          <div>{selectedOrder.address || "N/A"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Order Information</h3>
                    <div className="bg-muted/50 p-3 rounded-md">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-sm font-medium">Status</div>
                          <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Source</div>
                          <div className="mt-1">{getSourceBadge(selectedOrder.source || "online")}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Created By</div>
                          <div>{selectedOrder.createdBy || "System"}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Last Updated</div>
                          <div>
                            {selectedOrder.lastUpdatedAt
                              ? `${new Date(selectedOrder.lastUpdatedAt).toLocaleString()} by ${selectedOrder.lastUpdatedBy || "Unknown"}`
                              : "Not updated yet"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Assignment</h3>
                    <div className="bg-muted/50 p-3 rounded-md">
                      {selectedOrder.assignedTo ? (
                        <div>
                          <div className="text-sm font-medium">Assigned To</div>
                          <div className="flex items-center gap-2 mt-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedOrder.assignedToName}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">Not assigned to any employee</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Product Details</h3>
                    <div className="bg-muted/50 p-3 rounded-md">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-md overflow-hidden">
                          <img
                            src={selectedOrder.product?.imageUrl || "/placeholder.svg?height=64&width=64"}
                            alt={selectedOrder.product?.name || "Product"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{selectedOrder.product?.name || "Unknown Product"}</div>
                          <div className="text-sm text-muted-foreground">
                            Quantity: {selectedOrder.quantity || 1} × PKR{" "}
                            {selectedOrder.product?.price?.toFixed(2) || "0.00"}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>PKR {selectedOrder.total?.toFixed(2) || "0.00"}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>Shipping</span>
                          <span>PKR {selectedOrder.shipping?.toFixed(2) || "0.00"}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>Tax</span>
                          <span>PKR {selectedOrder.tax?.toFixed(2) || "0.00"}</span>
                        </div>
                        <div className="flex justify-between mt-2 pt-2 border-t border-border font-bold">
                          <span>Total</span>
                          <span>
                            PKR{" "}
                            {(
                              (selectedOrder.total || 0) +
                              (selectedOrder.shipping || 0) +
                              (selectedOrder.tax || 0)
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Notes</h3>
                    <div className="bg-muted/50 p-3 rounded-md min-h-[80px]">
                      {selectedOrder.notes ? (
                        <p>{selectedOrder.notes}</p>
                      ) : (
                        <p className="text-muted-foreground">No notes for this order</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Call Logs</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openAddCallLogDialog(selectedOrder)
                        }}
                        className="flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        Add Call Log
                      </Button>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-md max-h-[200px] overflow-y-auto">
                      {selectedOrder.callLogs && selectedOrder.callLogs.length > 0 ? (
                        <div className="space-y-3">
                          {selectedOrder.callLogs.map((log: CallLog) => (
                            <div key={log.id} className="border-b border-border pb-2 last:border-0 last:pb-0">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="font-medium">{log.employeeName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(log.date).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-sm">Outcome:</span>
                                {getCallOutcomeBadge(log.outcome)}
                              </div>
                              <p className="mt-1 text-sm">{log.notes}</p>
                              {log.followUpRequired && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  Follow-up required by: {new Date(log.followUpDate || "").toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No call logs for this order</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {(userRole === "admin" || user?.permissions?.canUpdateOrders) && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, "processing")}
                        className="flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Processing
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, "shipped")}
                        className="flex items-center gap-1"
                      >
                        <TruckIcon className="h-3 w-3" />
                        Shipped
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, "delivered")}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Delivered
                      </Button>
                    </>
                  )}
                </div>
                <Button variant="outline" onClick={() => setIsViewingDetails(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Call Log Dialog */}
      <Dialog open={isAddingCallLog} onOpenChange={setIsAddingCallLog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Call Log</DialogTitle>
            <DialogDescription>
              Record details about a customer call for order #{selectedOrder?.id.substring(0, 8)}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="call-notes">Call Notes *</Label>
              <Textarea
                id="call-notes"
                value={callLogForm.notes}
                onChange={(e) => setCallLogForm({ ...callLogForm, notes: e.target.value })}
                placeholder="Enter details about the call..."
                className="min-h-[100px]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Call Outcome</Label>
              <RadioGroup
                value={callLogForm.outcome}
                onValueChange={(value) =>
                  setCallLogForm({
                    ...callLogForm,
                    outcome: value as "successful" | "unsuccessful" | "voicemail" | "no-answer",
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="successful" id="successful" />
                  <Label htmlFor="successful">Successful</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unsuccessful" id="unsuccessful" />
                  <Label htmlFor="unsuccessful">Unsuccessful</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="voicemail" id="voicemail" />
                  <Label htmlFor="voicemail">Left Voicemail</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no-answer" id="no-answer" />
                  <Label htmlFor="no-answer">No Answer</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="follow-up"
                  checked={callLogForm.followUpRequired}
                  onCheckedChange={(checked) => setCallLogForm({ ...callLogForm, followUpRequired: !!checked })}
                />
                <Label htmlFor="follow-up">Follow-up Required</Label>
              </div>
              {callLogForm.followUpRequired && (
                <div className="pt-2">
                  <Label htmlFor="follow-up-date">Follow-up Date</Label>
                  <Input
                    id="follow-up-date"
                    type="date"
                    value={callLogForm.followUpDate}
                    onChange={(e) => setCallLogForm({ ...callLogForm, followUpDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingCallLog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCallLog} disabled={isProcessingAction}>
              {isProcessingAction ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                "Save Call Log"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Employee Dialog */}
      <Dialog open={isAssigningEmployee} onOpenChange={setIsAssigningEmployee}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Employee</DialogTitle>
            <DialogDescription>
              Assign an employee to handle order #{selectedOrder?.id.substring(0, 8)}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Select Employee</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.displayName || employee.email} ({employee.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssigningEmployee(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignEmployee} disabled={isProcessingAction}>
              {isProcessingAction ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent"></div>
                  Assigning...
                </>
              ) : (
                "Assign Employee"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Order Dialog */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete order #{selectedOrder?.id.substring(0, 8)}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedOrder(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive text-destructive-foreground">
              {isProcessingAction ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent"></div>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

