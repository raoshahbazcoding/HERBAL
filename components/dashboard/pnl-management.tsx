"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getOrders } from "@/lib/firebase/orders"
import { createExpense, getExpenses, updateExpense, deleteExpense } from "@/lib/firebase/expenses"
import { useAuth } from "@/lib/auth-provider"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// Define expense categories
const EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Salaries",
  "Inventory",
  "Marketing",
  "Insurance",
  "Maintenance",
  "Office Supplies",
  "Shipping",
  "Other",
]

// Define colors for the pie chart
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#8dd1e1",
  "#a4de6c",
  "#d0ed57",
]

export function PnlManagement() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingExpense, setIsCreatingExpense] = useState(false)
  const [isEditingExpense, setIsEditingExpense] = useState(false)
  const [isDeletingExpense, setIsDeletingExpense] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [dateFilter, setDateFilter] = useState("all")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [expenseForm, setExpenseForm] = useState({
    name: "",
    amount: "",
    category: "Other",
    date: new Date().toISOString().split("T")[0],
    description: "",
  })

  // Calculate total revenue, expenses, and profit
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
  const profit = totalRevenue - totalExpenses

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [ordersData, expensesData] = await Promise.all([getOrders(), getExpenses()])

        setOrders(ordersData)
        setExpenses(expensesData)
      } catch (error) {
        console.error("Error fetching PNL data:", error)
        toast({
          title: "Error",
          description: "Failed to fetch financial data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Filter data based on selected date range
  const getFilteredData = () => {
    let filteredOrders = [...orders]
    let filteredExpenses = [...expenses]

    const now = new Date()
    let startDate: Date | null = null

    if (dateFilter === "today") {
      startDate = new Date(now.setHours(0, 0, 0, 0))
    } else if (dateFilter === "yesterday") {
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 1)
      startDate.setHours(0, 0, 0, 0)
    } else if (dateFilter === "thisWeek") {
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - startDate.getDay())
      startDate.setHours(0, 0, 0, 0)
    } else if (dateFilter === "thisMonth") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (dateFilter === "lastMonth") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0)

      filteredOrders = filteredOrders.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= startDate! && orderDate <= endDate
      })

      filteredExpenses = filteredExpenses.filter((expense) => {
        const expenseDate = new Date(expense.date)
        return expenseDate >= startDate! && expenseDate <= endDate
      })

      return { filteredOrders, filteredExpenses }
    } else if (dateFilter === "custom" && customStartDate && customEndDate) {
      const start = new Date(customStartDate)
      const end = new Date(customEndDate)
      end.setHours(23, 59, 59, 999)

      filteredOrders = filteredOrders.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= start && orderDate <= end
      })

      filteredExpenses = filteredExpenses.filter((expense) => {
        const expenseDate = new Date(expense.date)
        return expenseDate >= start && expenseDate <= end
      })

      return { filteredOrders, filteredExpenses }
    }

    if (startDate && dateFilter !== "lastMonth") {
      const endDate = new Date()

      filteredOrders = filteredOrders.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= startDate! && orderDate <= endDate
      })

      filteredExpenses = filteredExpenses.filter((expense) => {
        const expenseDate = new Date(expense.date)
        return expenseDate >= startDate! && expenseDate <= endDate
      })
    }

    return { filteredOrders, filteredExpenses }
  }

  const { filteredOrders, filteredExpenses } = getFilteredData()

  // Calculate filtered totals
  const filteredRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0)
  const filteredExpensesTotal = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
  const filteredProfit = filteredRevenue - filteredExpensesTotal

  // Prepare data for monthly revenue chart
  const getMonthlyRevenueData = () => {
    const monthlyData: { [key: string]: { revenue: number; expenses: number; profit: number } } = {}

    // Initialize with last 6 months
    const today = new Date()
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`
      monthlyData[monthKey] = { revenue: 0, expenses: 0, profit: 0 }
    }

    // Add order data
    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt)
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`

      if (monthlyData[monthKey]) {
        monthlyData[monthKey].revenue += order.total || 0
      } else {
        monthlyData[monthKey] = {
          revenue: order.total || 0,
          expenses: 0,
          profit: 0,
        }
      }
    })

    // Add expense data
    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date)
      const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, "0")}`

      if (monthlyData[monthKey]) {
        monthlyData[monthKey].expenses += expense.amount || 0
      } else {
        monthlyData[monthKey] = {
          revenue: 0,
          expenses: expense.amount || 0,
          profit: 0,
        }
      }
    })

    // Calculate profit
    Object.keys(monthlyData).forEach((key) => {
      monthlyData[key].profit = monthlyData[key].revenue - monthlyData[key].expenses
    })

    // Convert to array for chart
    return Object.entries(monthlyData).map(([month, data]) => {
      const [year, monthNum] = month.split("-")
      const monthName = new Date(Number.parseInt(year), Number.parseInt(monthNum) - 1).toLocaleString("default", {
        month: "short",
      })

      return {
        month: `${monthName} ${year}`,
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.profit,
      }
    })
  }

  // Prepare data for expense categories pie chart
  const getExpenseCategoriesData = () => {
    const categoryData: { [key: string]: number } = {}

    filteredExpenses.forEach((expense) => {
      const category = expense.category || "Other"
      if (categoryData[category]) {
        categoryData[category] += expense.amount || 0
      } else {
        categoryData[category] = expense.amount || 0
      }
    })

    return Object.entries(categoryData).map(([name, value]) => ({ name, value }))
  }

  const handleCreateExpense = async () => {
    try {
      if (!expenseForm.name || !expenseForm.amount || !expenseForm.date) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      const newExpense = {
        ...expenseForm,
        amount: Number.parseFloat(expenseForm.amount),
        createdBy: user?.displayName || user?.email || "Unknown user",
        createdAt: new Date().toISOString(),
      }

      await createExpense(newExpense)

      // Refresh expense list
      const updatedExpenses = await getExpenses()
      setExpenses(updatedExpenses)

      // Reset form
      setExpenseForm({
        name: "",
        amount: "",
        category: "Other",
        date: new Date().toISOString().split("T")[0],
        description: "",
      })

      setIsCreatingExpense(false)

      toast({
        title: "Success",
        description: "Expense added successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      })
    }
  }

  const handleEditExpense = async () => {
    try {
      if (!selectedExpense || !expenseForm.name || !expenseForm.amount || !expenseForm.date) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      await updateExpense(selectedExpense.id, {
        ...expenseForm,
        amount: Number.parseFloat(expenseForm.amount),
        updatedBy: user?.displayName || user?.email || "Unknown user",
        updatedAt: new Date().toISOString(),
      })

      // Refresh expense list
      const updatedExpenses = await getExpenses()
      setExpenses(updatedExpenses)

      setIsEditingExpense(false)
      setSelectedExpense(null)

      toast({
        title: "Success",
        description: "Expense updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      })
    }
  }

  const handleDeleteExpense = async () => {
    try {
      if (!selectedExpense) return

      await deleteExpense(selectedExpense.id)

      // Refresh expense list
      const updatedExpenses = await getExpenses()
      setExpenses(updatedExpenses)

      setIsDeletingExpense(false)
      setSelectedExpense(null)

      toast({
        title: "Success",
        description: "Expense deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      })
    }
  }

  const openEditExpenseDialog = (expense: any) => {
    setSelectedExpense(expense)
    setExpenseForm({
      name: expense.name,
      amount: expense.amount.toString(),
      category: expense.category || "Other",
      date: new Date(expense.date).toISOString().split("T")[0],
      description: expense.description || "",
    })
    setIsEditingExpense(true)
  }

  const openDeleteExpenseDialog = (expense: any) => {
    setSelectedExpense(expense)
    setIsDeletingExpense(true)
  }

  const monthlyRevenueData = getMonthlyRevenueData()
  const expenseCategoriesData = getExpenseCategoriesData()

  // Custom tooltip formatter for charts to use PKR
  const formatTooltipValue = (value: number) => `PKR ${value.toFixed(2)}`

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Profit & Loss</h2>
        <div className="flex items-center gap-2">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {dateFilter === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-[140px]"
              />
              <span>to</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-[140px]"
              />
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">PKR {filteredRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      {dateFilter === "all" ? "All time" : "For selected period"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">PKR {filteredExpensesTotal.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      {dateFilter === "all" ? "All time" : "For selected period"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${filteredProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      PKR {filteredProfit.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dateFilter === "all" ? "All time" : "For selected period"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Financial Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyRevenueData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={formatTooltipValue} />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenue" fill="#8884d8" />
                        <Bar dataKey="expenses" name="Expenses" fill="#82ca9d" />
                        <Bar dataKey="profit" name="Profit" fill="#ffc658" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      {expenseCategoriesData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={expenseCategoriesData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {expenseCategoriesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={formatTooltipValue} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-muted-foreground">No expense data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {filteredOrders.slice(0, 3).map((order) => (
                        <div key={order.id} className="flex items-center">
                          <div className="mr-4 rounded-full bg-primary/10 p-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              className="h-4 w-4 text-primary"
                            >
                              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">Order #{order.id.substring(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="ml-auto font-medium text-green-600">+PKR {order.total?.toFixed(2)}</div>
                        </div>
                      ))}

                      {filteredExpenses.slice(0, 3).map((expense) => (
                        <div key={expense.id} className="flex items-center">
                          <div className="mr-4 rounded-full bg-destructive/10 p-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              className="h-4 w-4 text-destructive"
                            >
                              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{expense.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(expense.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="ml-auto font-medium text-red-600">-PKR {expense.amount?.toFixed(2)}</div>
                        </div>
                      ))}

                      {filteredOrders.length === 0 && filteredExpenses.length === 0 && (
                        <p className="text-center text-muted-foreground">No recent transactions</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No orders found for the selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id} className="pointer-events-none">
                        <TableCell className="font-medium">{order.id.substring(0, 8)}</TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{order.name}</TableCell>
                        <TableCell>{order.product?.name || "N/A"}</TableCell>
                        <TableCell className="text-right">PKR {order.total?.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Expense Management</h3>
            <Dialog open={isCreatingExpense} onOpenChange={setIsCreatingExpense}>
              <DialogTrigger asChild>
                <Button>Add New Expense</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                  <DialogDescription>Add a new expense to track your business costs.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expense-name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="expense-name"
                      value={expenseForm.name}
                      onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
                      className="col-span-3"
                      placeholder="Rent, Utilities, etc."
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expense-amount" className="text-right">
                      Amount
                    </Label>
                    <Input
                      id="expense-amount"
                      type="number"
                      step="0.01"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      className="col-span-3"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expense-category" className="text-right">
                      Category
                    </Label>
                    <Select
                      value={expenseForm.category}
                      onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expense-date" className="text-right">
                      Date
                    </Label>
                    <Input
                      id="expense-date"
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expense-description" className="text-right">
                      Description
                    </Label>
                    <Input
                      id="expense-description"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      className="col-span-3"
                      placeholder="Optional details about this expense"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreatingExpense(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateExpense}>Add Expense</Button>
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
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No expenses found for the selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <TableRow key={expense.id} className="pointer-events-none">
                        <TableCell className="font-medium">{expense.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{expense.category || "Other"}</Badge>
                        </TableCell>
                        <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{expense.description || "—"}</TableCell>
                        <TableCell className="text-right">PKR {expense.amount?.toFixed(2)}</TableCell>
                        <TableCell className="text-right pointer-events-auto">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditExpenseDialog(expense)}>Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => openDeleteExpenseDialog(expense)}
                              >
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
        </TabsContent>
      </Tabs>

      <Dialog open={isEditingExpense} onOpenChange={setIsEditingExpense}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update expense information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expense-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-expense-name"
                value={expenseForm.name}
                onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expense-amount" className="text-right">
                Amount
              </Label>
              <Input
                id="edit-expense-amount"
                type="number"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expense-category" className="text-right">
                Category
              </Label>
              <Select
                value={expenseForm.category}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expense-date" className="text-right">
                Date
              </Label>
              <Input
                id="edit-expense-date"
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expense-description" className="text-right">
                Description
              </Label>
              <Input
                id="edit-expense-description"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditingExpense(false)
                setSelectedExpense(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditExpense}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeletingExpense} onOpenChange={setIsDeletingExpense}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the expense "{selectedExpense?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedExpense(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

