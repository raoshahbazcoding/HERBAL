"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { sendNotification } from "@/components/notification-provider"

export default function OrderConfirmationPage() {
  const [orderData, setOrderData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get order data from session storage
    const storedOrderData = sessionStorage.getItem("orderData")
    if (storedOrderData) {
      const parsedData = JSON.parse(storedOrderData)
      setOrderData(parsedData)

      // Send notification for successful order
      sendNotification(
        "Order Placed Successfully",
        `Thank you for your order #${parsedData.id?.substring(0, 8) || "N/A"}`,
        "success",
      )
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Order Information Not Found</CardTitle>
            <CardDescription className="text-center">
              We couldn't find your order information. Please return to the products page.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/products" className="w-full">
              <Button className="w-full">Browse Products</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Thank You for Your Order!</CardTitle>
          <CardDescription>
            Your order has been successfully placed. We'll process it as soon as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Order Details</h3>
              <div className="mt-2 rounded-lg border p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                    <p>{orderData.id?.substring(0, 8) || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Order Date</p>
                    <p>{new Date(orderData.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p className="capitalize">{orderData.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                    <p className="font-bold">${orderData.total?.toFixed(2) || "0.00"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-medium">Customer Information</h3>
                <div className="mt-2 rounded-lg border p-4">
                  <p>
                    <span className="font-medium">Name:</span> {orderData.name}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {orderData.email}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span> {orderData.phone}
                  </p>
                  <p>
                    <span className="font-medium">Address:</span> {orderData.address}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">Product Information</h3>
                <div className="mt-2 rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                      <img
                        src="/placeholder.svg?height=64&width=64"
                        alt={orderData.product?.name || "Product"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{orderData.product?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ${orderData.product?.price?.toFixed(2)} x {orderData.quantity}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-center text-sm text-muted-foreground">
            A confirmation email has been sent to {orderData.email}
          </p>
          <div className="flex w-full justify-center space-x-4">
            <Link href="/">
              <Button variant="outline">Return to Home</Button>
            </Link>
            <Link href="/products">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

