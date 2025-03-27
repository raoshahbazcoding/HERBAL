"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { updateOrder } from "@/lib/firebase/orders"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-provider"

interface OrderDetailsProps {
  order: any
  onClose: () => void
  onStatusChange: (orderId: string, status: string) => Promise<void>
  onRefresh: () => Promise<void>
}

export function OrderDetails({ order, onClose, onStatusChange, onRefresh }: OrderDetailsProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [notes, setNotes] = useState(order.notes || "")
  const [isSaving, setIsSaving] = useState(false)

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

  const handleSaveNotes = async () => {
    try {
      setIsSaving(true)
      await updateOrder(order.id, {
        notes,
        lastUpdatedBy: user?.displayName || user?.email || "Unknown user",
        lastUpdatedAt: new Date().toISOString(),
      })

      toast({
        title: "Success",
        description: "Order notes updated successfully",
      })

      // Refresh order data
      await onRefresh()
    } catch (error) {
      console.error("Error updating order notes:", error)
      toast({
        title: "Error",
        description: "Failed to update order notes",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <DialogHeader className="p-6 pb-0">
        <DialogTitle>Order Details</DialogTitle>
        <DialogDescription>
          Order #{order.id.substring(0, 8)} - Created on {new Date(order.createdAt).toLocaleDateString()}
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="font-medium">Name</div>
              <div>{order.name}</div>
            </div>
            <div>
              <div className="font-medium">Email</div>
              <div>{order.email || "N/A"}</div>
            </div>
            <div>
              <div className="font-medium">Phone</div>
              <div>{order.phone || "N/A"}</div>
            </div>
            <div>
              <div className="font-medium">Address</div>
              <div>{order.address || "N/A"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="font-medium">Status</div>
              <div className="mt-1">{getStatusBadge(order.status)}</div>
            </div>
            <div>
              <div className="font-medium">Source</div>
              <div className="mt-1">{getSourceBadge(order.source || "online")}</div>
            </div>
            <div>
              <div className="font-medium">Created By</div>
              <div>{order.createdBy || "System"}</div>
            </div>
            <div>
              <div className="font-medium">Last Updated</div>
              <div>
                {order.lastUpdatedAt
                  ? `${new Date(order.lastUpdatedAt).toLocaleString()} by ${order.lastUpdatedBy || "Unknown"}`
                  : "Not updated yet"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-md overflow-hidden">
                    <img
                      src={order.product?.imageUrl || "/placeholder.svg?height=64&width=64"}
                      alt={order.product?.name || "Product"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{order.product?.name || "Unknown Product"}</div>
                    <div className="text-sm text-muted-foreground">
                      Quantity: {order.quantity || 1} × PKR {order.product?.price?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                </div>
                <div className="font-medium">PKR {order.total?.toFixed(2) || "0.00"}</div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="font-medium">Subtotal</div>
                <div>PKR {order.total?.toFixed(2) || "0.00"}</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="font-medium">Shipping</div>
                <div>PKR {order.shipping?.toFixed(2) || "0.00"}</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="font-medium">Tax</div>
                <div>PKR {order.tax?.toFixed(2) || "0.00"}</div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="text-lg font-bold">Total</div>
                <div className="text-lg font-bold">
                  PKR {((order.total || 0) + (order.shipping || 0) + (order.tax || 0)).toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Notes</CardTitle>
            <CardDescription>Add or update notes for this order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this order"
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <div className="flex gap-2">
              <Button onClick={handleSaveNotes} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}

