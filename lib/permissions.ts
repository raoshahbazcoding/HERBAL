// Define permission types
export type Permission = "create" | "read" | "update" | "delete" | "assign" | "manage"
export type Resource = "products" | "categories" | "employees" | "orders" | "offers" | "expenses" | "calls"

// Define role-based permissions
const rolePermissions = {
  admin: {
    products: ["create", "read", "update", "delete", "assign"],
    categories: ["create", "read", "update", "delete"],
    employees: ["create", "read", "update", "delete", "assign"],
    orders: ["create", "read", "update", "delete", "assign"],
    offers: ["create", "read", "update", "delete"],
    expenses: ["create", "read", "update", "delete"],
    calls: ["create", "read", "update", "delete"],
  },
  manager: {
    products: ["read", "update"],
    categories: ["read"],
    employees: ["read"],
    orders: ["create", "read", "update"],
    offers: ["read"],
    expenses: ["read"],
    calls: ["create", "read", "update"],
  },
  staff: {
    products: [],
    categories: ["read"],
    employees: [],
    orders: [],
    offers: ["read"],
    expenses: [],
    calls: [],
  },
}

// Check if a user has permission to perform an action on a resource
export function hasPermission(
  userRole: string | undefined,
  resource: Resource,
  permission: Permission,
  userPermissions?: Record<string, string[]>,
): boolean {
  // If no role, no permissions
  if (!userRole) return false

  // Admin has all permissions
  if (userRole === "admin") return true

  // Check user-specific permissions first (these override role-based permissions)
  if (userPermissions && userPermissions[resource]) {
    return userPermissions[resource].includes(permission)
  }

  // Check role-based permissions
  const role = userRole.toLowerCase()
  if (rolePermissions[role as keyof typeof rolePermissions]) {
    const permissions =
      rolePermissions[role as keyof typeof rolePermissions][
        resource as keyof (typeof rolePermissions)[keyof typeof rolePermissions]
      ]
    return permissions ? permissions.includes(permission) : false
  }

  return false
}

// Check if a user has access to a specific product or category
export function hasResourceAccess(
  userId: string,
  resourceId: string,
  resourceType: "product" | "category",
  assignedResources?: Record<string, string[]>,
): boolean {
  // If no assigned resources, no access
  if (!assignedResources) return false

  // Check if the user has access to the specific resource
  const key = resourceType === "product" ? "assignedProducts" : "assignedCategories"
  return assignedResources[key]?.includes(resourceId) || false
}

