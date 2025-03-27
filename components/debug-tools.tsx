"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getProducts } from "@/lib/firebase/products"
import { getCategories } from "@/lib/firebase/categories"
import { getOrders } from "@/lib/firebase/orders"
import { getActiveOffers } from "@/lib/firebase/offers"

export function DebugTools() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchDebugInfo = async () => {
    setIsLoading(true)
    try {
      const [products, categories, orders, offers] = await Promise.all([
        getProducts(),
        getCategories(),
        getOrders(),
        getActiveOffers(),
      ])

      setDebugInfo({
        products,
        categories,
        orders,
        offers,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error fetching debug info:", error)
      setDebugInfo({ error: String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Debug Tools</CardTitle>
        <CardDescription>Use these tools to diagnose issues with your application</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={fetchDebugInfo} disabled={isLoading} className="mb-4">
          {isLoading ? "Loading..." : "Fetch Database Info"}
        </Button>

        {debugInfo && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="products">
              <AccordionTrigger>Products ({debugInfo.products?.length || 0})</AccordionTrigger>
              <AccordionContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs">
                  {JSON.stringify(debugInfo.products, null, 2)}
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="categories">
              <AccordionTrigger>Categories ({debugInfo.categories?.length || 0})</AccordionTrigger>
              <AccordionContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs">
                  {JSON.stringify(debugInfo.categories, null, 2)}
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="orders">
              <AccordionTrigger>Orders ({debugInfo.orders?.length || 0})</AccordionTrigger>
              <AccordionContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs">
                  {JSON.stringify(debugInfo.orders, null, 2)}
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="offers">
              <AccordionTrigger>Offers ({debugInfo.offers?.length || 0})</AccordionTrigger>
              <AccordionContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs">
                  {JSON.stringify(debugInfo.offers, null, 2)}
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Last updated: {debugInfo?.timestamp ? new Date(debugInfo.timestamp).toLocaleString() : "Never"}
      </CardFooter>
    </Card>
  )
}

