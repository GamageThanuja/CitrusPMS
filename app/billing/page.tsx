"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslatedText } from "@/lib/translation"
import SubscriptionTab from "./subscription-tab"
import PaymentMethodsTab from "./payment-methods-tab"
import InvoicesTab from "./invoices-tab"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function BillingPage() {
  const billingText = useTranslatedText("Billing")
  const subscriptionText = useTranslatedText("Subscription")
  const paymentMethodsText = useTranslatedText("Payment Methods")
  const invoicesText = useTranslatedText("Invoices")

  const [activeTab, setActiveTab] = useState("subscription")
  const [isAuthorized, setIsAuthorized] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "Owner") {
      setIsAuthorized(false);
    }
  }, []);

  if (!isAuthorized) {
    return (
      <DashboardLayout>
        <div className="p-6 flex justify-center items-center min-h-[50vh]">
          <Card className="max-w-md w-full border border-primary">
            <CardHeader>
              <CardTitle className="text-primary">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Only property owners can manage this page. Please contact your administrator if you believe this is an error.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{billingText}</h1>

        <Tabs defaultValue="subscription" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="subscription">{subscriptionText}</TabsTrigger>
            <TabsTrigger value="payment-methods">{paymentMethodsText}</TabsTrigger>
            <TabsTrigger value="invoices">{invoicesText}</TabsTrigger>
          </TabsList>

          <TabsContent value="subscription" className="mt-4 space-y-4">
            <SubscriptionTab />
          </TabsContent>

          <TabsContent value="payment-methods" className="mt-4 space-y-4">
            <PaymentMethodsTab />
          </TabsContent>

          <TabsContent value="invoices" className="mt-4 space-y-4">
            <InvoicesTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
