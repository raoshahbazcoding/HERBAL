"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  createEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
  assignCategoriesToEmployee,
  assignProductsToEmployee,
  removeCategoriesFromEmployee,
  removeProductsFromEmployee,
  type Employee,
  type EmployeeRole,
} from "@/lib/firebase/employees"
import { getCategories } from "@/lib/firebase/categories"
import { getProducts } from "@/lib/firebase/products"
import { getOrdersByEmployee } from "@/lib/firebase/orders"
import { useAuth } from "@/lib/auth-provider"
import { User, UserPlus, Edit, Trash2, Package, Tag, ShoppingBag, Shield, UserCog, Users } from "lucide-react"

export function EmployeeManagement() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAssigningCategories, setIsAssigningCategories] = useState(false)
  const [isAssigningProducts, setIsAssigningProducts] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [employeeStats, setEmployeeStats] = useState<Record<string, { orders: number }>>({})
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    firstName: "",
    lastName: "",
    role: "staff" as EmployeeRole,
    phoneNumber: "",
    department: "",
    hireDate: new Date().toISOString().split("T")[0],
    status: "active" as "active" | "inactive",
    permissions: {
      canCreateOrders: false,
      canUpdateOrders: false,
      canViewProducts: false,
      canUpdateProducts: false,
      canManageOffers: false,
      canViewReports: false,
    },
    assignedCategories: [] as string[],
    assignedProducts: [] as string[],
  })
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [roleFilter, setRoleFilter] = useState<string>("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [employeesData, categoriesData, productsData] = await Promise.all([
          getEmployees(),
          getCategories(),
          getProducts(),
        ])

        setEmployees(employeesData)
        setCategories(categoriesData)
        setProducts(productsData)

        // Fetch order stats for each employee
        const stats: Record<string, { orders: number }> = {}

        for (const employee of employeesData) {
          try {
            const employeeOrders = await getOrdersByEmployee(employee.id)
            stats[employee.id] = { orders: employeeOrders.length }
          } catch (error) {
            console.error(`Error fetching orders for employee ${employee.id}:`, error)
            stats[employee.id] = { orders: 0 }
          }
        }

        setEmployeeStats(stats)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to fetch employee data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const handleCreateEmployee = async () => {
    try {
      if (!formData.email || !formData.password || !formData.displayName) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)

      await createEmployee({
        ...formData,
        createdBy: user?.displayName || user?.email || "Unknown user",
      })

      // Refresh employee list
      const updatedEmployees = await getEmployees()
      setEmployees(updatedEmployees)

      // Reset form
      setFormData({
        email: "",
        password: "",
        displayName: "",
        firstName: "",
        lastName: "",
        role: "staff",
        phoneNumber: "",
        department: "",
        hireDate: new Date().toISOString().split("T")[0],
        status: "active",
        permissions: {
          canCreateOrders: false,
          canUpdateOrders: false,
          canViewProducts: false,
          canUpdateProducts: false,
          canManageOffers: false,
          canViewReports: false,
        },
        assignedCategories: [],
        assignedProducts: [],
      })

      setIsCreating(false)

      toast({
        title: "Success",
        description: "Employee created successfully",
      })
    } catch (error) {
      console.error("Error creating employee:", error)
      toast({
        title: "Error",
        description: "Failed to create employee",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateEmployee = async () => {
    try {
      if (!selectedEmployee || !formData.displayName) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)

      // Don't send password if it's empty (not being updated)
      const dataToUpdate = { ...formData }
      if (!dataToUpdate.password) {
        delete dataToUpdate.password
      }

      await updateEmployee(selectedEmployee.id, {
        ...dataToUpdate,
        updatedBy: user?.displayName || user?.email || "Unknown user",
      })

      // Refresh employee list
      const updatedEmployees = await getEmployees()
      setEmployees(updatedEmployees)

      setIsEditing(false)
      setSelectedEmployee(null)

      toast({
        title: "Success",
        description: "Employee updated successfully",
      })
    } catch (error) {
      console.error("Error updating employee:", error)
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEmployee = async () => {
    try {
      if (!selectedEmployee) return

      setIsLoading(true)

      await deleteEmployee(selectedEmployee.id)

      // Refresh employee list
      const updatedEmployees = await getEmployees()
      setEmployees(updatedEmployees)

      setIsDeleting(false)
      setSelectedEmployee(null)

      toast({
        title: "Success",
        description: "Employee deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting employee:", error)
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignCategories = async () => {
    try {
      if (!selectedEmployee) return

      setIsLoading(true)

      // Find categories to add and remove
      const currentCategories = selectedEmployee.assignedCategories || []
      const categoriesToAdd = selectedCategories.filter((id) => !currentCategories.includes(id))
      const categoriesToRemove = currentCategories.filter((id) => !selectedCategories.includes(id))

      if (categoriesToAdd.length > 0) {
        await assignCategoriesToEmployee(selectedEmployee.id, categoriesToAdd)
      }

      if (categoriesToRemove.length > 0) {
        await removeCategoriesFromEmployee(selectedEmployee.id, categoriesToRemove)
      }

      // Refresh employee list
      const updatedEmployees = await getEmployees()
      setEmployees(updatedEmployees)

      // Update selected employee
      const updatedEmployee = updatedEmployees.find((e) => e.id === selectedEmployee.id)
      if (updatedEmployee) {
        setSelectedEmployee(updatedEmployee)
      }

      setIsAssigningCategories(false)

      toast({
        title: "Success",
        description: "Categories assigned successfully",
      })
    } catch (error) {
      console.error("Error assigning categories:", error)
      toast({
        title: "Error",
        description: "Failed to assign categories",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignProducts = async () => {
    try {
      if (!selectedEmployee) return

      setIsLoading(true)

      // Find products to add and remove
      const currentProducts = selectedEmployee.assignedProducts || []
      const productsToAdd = selectedProducts.filter((id) => !currentProducts.includes(id))
      const productsToRemove = currentProducts.filter((id) => !selectedProducts.includes(id))

      if (productsToAdd.length > 0) {
        await assignProductsToEmployee(selectedEmployee.id, productsToAdd)
      }

      if (productsToRemove.length > 0) {
        await removeProductsFromEmployee(selectedEmployee.id, productsToRemove)
      }

      // Refresh employee list
      const updatedEmployees = await getEmployees()
      setEmployees(updatedEmployees)

      // Update selected employee
      const updatedEmployee = updatedEmployees.find((e) => e.id === selectedEmployee.id)
      if (updatedEmployee) {
        setSelectedEmployee(updatedEmployee)
      }

      setIsAssigningProducts(false)

      toast({
        title: "Success",
        description: "Products assigned successfully",
      })
    } catch (error) {
      console.error("Error assigning products:", error)
      toast({
        title: "Error",
        description: "Failed to assign products",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee)
    setFormData({
      email: employee.email,
      password: "", // Don't set password for editing
      displayName: employee.displayName || "",
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      role: employee.role,
      phoneNumber: employee.phoneNumber || "",
      department: employee.department || "",
      hireDate: employee.hireDate || new Date().toISOString().split("T")[0],
      status: employee.status || "active",
      permissions: employee.permissions || {
        canCreateOrders: false,
        canUpdateOrders: false,
        canViewProducts: false,
        canUpdateProducts: false,
        canManageOffers: false,
        canViewReports: false,
      },
      assignedCategories: employee.assignedCategories || [],
      assignedProducts: employee.assignedProducts || [],
    })
    setIsEditing(true)
  }

  const openDeleteDialog = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsDeleting(true)
  }

  const openAssignCategoriesDialog = (employee: Employee) => {
    setSelectedEmployee(employee)
    setSelectedCategories(employee.assignedCategories || [])
    setIsAssigningCategories(true)
  }

  const openAssignProductsDialog = (employee: Employee) => {
    setSelectedEmployee(employee)
    setSelectedProducts(employee.assignedProducts || [])
    setIsAssigningProducts(true)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            Admin
          </Badge>
        )
      case "manager":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Manager
          </Badge>
        )
      case "staff":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Staff
          </Badge>
        )
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Active
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Inactive
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Filter employees based on role
  const filteredEmployees =
    activeTab === "all" ? employees : employees.filter((employee) => employee.role === activeTab)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employee Management</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add New Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Employee</DialogTitle>
              <DialogDescription>Add a new employee to the system. Fill in all the required fields.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Tabs defaultValue="basic">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                  <TabsTrigger value="assignments">Assignments</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            role: value as EmployeeRole,
                            // Set default permissions based on role
                            permissions: {
                              ...formData.permissions,
                              canCreateOrders: value === "admin" || value === "manager",
                              canUpdateOrders: value === "admin" || value === "manager",
                              canViewProducts: value === "admin" || value === "manager",
                              canUpdateProducts: value === "admin",
                              canManageOffers: value === "admin",
                              canViewReports: value === "admin" || value === "manager",
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hireDate">Hire Date</Label>
                      <Input
                        id="hireDate"
                        type="date"
                        value={formData.hireDate}
                        onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="status"
                        checked={formData.status === "active"}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, status: checked ? "active" : "inactive" })
                        }
                      />
                      <Label htmlFor="status">{formData.status === "active" ? "Active" : "Inactive"}</Label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="permissions" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Order Permissions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canCreateOrders"
                          checked={formData.permissions.canCreateOrders}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              permissions: {
                                ...formData.permissions,
                                canCreateOrders: !!checked,
                              },
                            })
                          }
                        />
                        <Label htmlFor="canCreateOrders">Can Create Orders</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canUpdateOrders"
                          checked={formData.permissions.canUpdateOrders}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              permissions: {
                                ...formData.permissions,
                                canUpdateOrders: !!checked,
                              },
                            })
                          }
                        />
                        <Label htmlFor="canUpdateOrders">Can Update Orders</Label>
                      </div>
                    </div>

                    <h3 className="text-lg font-medium">Product Permissions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canViewProducts"
                          checked={formData.permissions.canViewProducts}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              permissions: {
                                ...formData.permissions,
                                canViewProducts: !!checked,
                              },
                            })
                          }
                        />
                        <Label htmlFor="canViewProducts">Can View Products</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canUpdateProducts"
                          checked={formData.permissions.canUpdateProducts}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              permissions: {
                                ...formData.permissions,
                                canUpdateProducts: !!checked,
                              },
                            })
                          }
                        />
                        <Label htmlFor="canUpdateProducts">Can Update Products</Label>
                      </div>
                    </div>

                    <h3 className="text-lg font-medium">Other Permissions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canManageOffers"
                          checked={formData.permissions.canManageOffers}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              permissions: {
                                ...formData.permissions,
                                canManageOffers: !!checked,
                              },
                            })
                          }
                        />
                        <Label htmlFor="canManageOffers">Can Manage Offers</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canViewReports"
                          checked={formData.permissions.canViewReports}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              permissions: {
                                ...formData.permissions,
                                canViewReports: !!checked,
                              },
                            })
                          }
                        />
                        <Label htmlFor="canViewReports">Can View Reports</Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="assignments" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Assigned Categories</h3>
                    <div className="grid grid-cols-3 gap-4 max-h-40 overflow-y-auto p-2 border rounded-md">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={formData.assignedCategories.includes(category.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  assignedCategories: [...formData.assignedCategories, category.id],
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  assignedCategories: formData.assignedCategories.filter((id) => id !== category.id),
                                })
                              }
                            }}
                          />
                          <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
                        </div>
                      ))}
                    </div>

                    <h3 className="text-lg font-medium">Assigned Products</h3>
                    <div className="grid grid-cols-3 gap-4 max-h-40 overflow-y-auto p-2 border rounded-md">
                      {products.map((product) => (
                        <div key={product.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`product-${product.id}`}
                            checked={formData.assignedProducts.includes(product.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  assignedProducts: [...formData.assignedProducts, product.id],
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  assignedProducts: formData.assignedProducts.filter((id) => id !== product.id),
                                })
                              }
                            }}
                          />
                          <Label htmlFor={`product-${product.id}`}>{product.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateEmployee} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Employee"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Employees
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Admins
          </TabsTrigger>
          <TabsTrigger value="manager" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Managers
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Staff
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignments</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    <div className="flex justify-center py-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {employee.displayName || `${employee.firstName} ${employee.lastName}`.trim() || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{getRoleBadge(employee.role)}</TableCell>
                    <TableCell>{employee.department || "N/A"}</TableCell>
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{employee.assignedCategories?.length || 0} categories</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{employee.assignedProducts?.length || 0} products</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{employeeStats[employee.id]?.orders || 0} orders</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditDialog(employee)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openAssignCategoriesDialog(employee)}>
                            <Tag className="h-4 w-4 mr-2" />
                            Assign Categories
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openAssignProductsDialog(employee)}>
                            <Package className="h-4 w-4 mr-2" />
                            Assign Products
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(employee)}>
                            <Trash2 className="h-4 w-4 mr-2" />
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

      {/* Edit Employee Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee information and permissions.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input id="edit-email" type="email" value={formData.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
                    <Input
                      id="edit-password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-firstName">First Name</Label>
                    <Input
                      id="edit-firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-lastName">Last Name</Label>
                    <Input
                      id="edit-lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-displayName">Display Name *</Label>
                  <Input
                    id="edit-displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          role: value as EmployeeRole,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-department">Department</Label>
                    <Input
                      id="edit-department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                    <Input
                      id="edit-phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-hireDate">Hire Date</Label>
                    <Input
                      id="edit-hireDate"
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-status"
                      checked={formData.status === "active"}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, status: checked ? "active" : "inactive" })
                      }
                    />
                    <Label htmlFor="edit-status">{formData.status === "active" ? "Active" : "Inactive"}</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Order Permissions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-canCreateOrders"
                        checked={formData.permissions.canCreateOrders}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            permissions: {
                              ...formData.permissions,
                              canCreateOrders: !!checked,
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-canCreateOrders">Can Create Orders</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-canUpdateOrders"
                        checked={formData.permissions.canUpdateOrders}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            permissions: {
                              ...formData.permissions,
                              canUpdateOrders: !!checked,
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-canUpdateOrders">Can Update Orders</Label>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium">Product Permissions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-canViewProducts"
                        checked={formData.permissions.canViewProducts}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            permissions: {
                              ...formData.permissions,
                              canViewProducts: !!checked,
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-canViewProducts">Can View Products</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-canUpdateProducts"
                        checked={formData.permissions.canUpdateProducts}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            permissions: {
                              ...formData.permissions,
                              canUpdateProducts: !!checked,
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-canUpdateProducts">Can Update Products</Label>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium">Other Permissions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-canManageOffers"
                        checked={formData.permissions.canManageOffers}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            permissions: {
                              ...formData.permissions,
                              canManageOffers: !!checked,
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-canManageOffers">Can Manage Offers</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-canViewReports"
                        checked={formData.permissions.canViewReports}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            permissions: {
                              ...formData.permissions,
                              canViewReports: !!checked,
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-canViewReports">Can View Reports</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="assignments" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Assigned Categories</h3>
                  <div className="grid grid-cols-3 gap-4 max-h-40 overflow-y-auto p-2 border rounded-md">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-category-${category.id}`}
                          checked={formData.assignedCategories.includes(category.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                assignedCategories: [...formData.assignedCategories, category.id],
                              })
                            } else {
                              setFormData({
                                ...formData,
                                assignedCategories: formData.assignedCategories.filter((id) => id !== category.id),
                              })
                            }
                          }}
                        />
                        <Label htmlFor={`edit-category-${category.id}`}>{category.name}</Label>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-lg font-medium">Assigned Products</h3>
                  <div className="grid grid-cols-3 gap-4 max-h-40 overflow-y-auto p-2 border rounded-md">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-product-${product.id}`}
                          checked={formData.assignedProducts.includes(product.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                assignedProducts: [...formData.assignedProducts, product.id],
                              })
                            } else {
                              setFormData({
                                ...formData,
                                assignedProducts: formData.assignedProducts.filter((id) => id !== product.id),
                              })
                            }
                          }}
                        />
                        <Label htmlFor={`edit-product-${product.id}`}>{product.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setSelectedEmployee(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateEmployee} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Employee Dialog */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the employee "{selectedEmployee?.displayName || selectedEmployee?.email}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedEmployee(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Categories Dialog */}
      <Dialog open={isAssigningCategories} onOpenChange={setIsAssigningCategories}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Categories</DialogTitle>
            <DialogDescription>
              Assign categories to {selectedEmployee?.displayName || selectedEmployee?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto p-2 border rounded-md">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`assign-category-${category.id}`}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCategories([...selectedCategories, category.id])
                        } else {
                          setSelectedCategories(selectedCategories.filter((id) => id !== category.id))
                        }
                      }}
                    />
                    <Label htmlFor={`assign-category-${category.id}`}>{category.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssigningCategories(false)
                setSelectedEmployee(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignCategories} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Assignments"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Products Dialog */}
      <Dialog open={isAssigningProducts} onOpenChange={setIsAssigningProducts}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Products</DialogTitle>
            <DialogDescription>
              Assign products to {selectedEmployee?.displayName || selectedEmployee?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto p-2 border rounded-md">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`assign-product-${product.id}`}
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedProducts([...selectedProducts, product.id])
                        } else {
                          setSelectedProducts(selectedProducts.filter((id) => id !== product.id))
                        }
                      }}
                    />
                    <Label htmlFor={`assign-product-${product.id}`}>{product.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssigningProducts(false)
                setSelectedEmployee(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignProducts} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Assignments"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

