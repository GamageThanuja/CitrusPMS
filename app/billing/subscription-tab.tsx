"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BadgeCheck } from "lucide-react"
import { useTranslatedText } from "@/lib/translation"

export default function SubscriptionTab() {
  const subscriptionPlans = [
    {
      id: "start-up",
      name: "Start-Up",
      price: "USD 30",
      period: "/Month",
      description: "",
      features: ["Reservation", "Front Desk", "Room & Rates", "Finance", "Dashboard"],
      disabledFeatures: ["Channel Manager", "Point Of Sales (POS)"],
      isCurrent: false,
    },
    {
      id: "premium",
      name: "Premium",
      price: "USD 49",
      period: "/Month",
      description: "Everything you need to run your hotel",
      features: [
        "Reservation Management",
        "Front Desk",
        "Internet Booking Engine",
        "Room & Rates",
        "Channel Manager",
        "Point Of Sales (POS)",
        "Finance",
        "Reports & Dashboard",
        "Automated Emails/ Notifications",
        "Whatsapp Support",
        "Mobile Apps",
        "Web Access",
      ],
      disabledFeatures: [],
      isCurrent: true,
    },
    {
      id: "growing",
      name: "Growing",
      price: "USD 39",
      period: "/Month",
      description: "",
      features: ["Reservation", "Front Desk", "Room & Rates", "Point Of Sales (POS)", "Finance", "Dashboard"],
      disabledFeatures: ["Channel Manager"],
      isCurrent: false,
    },
  ]

  const currentPlanText = useTranslatedText("Current Plan")
  const upgradeText = useTranslatedText("Upgrade")
  const cancelSubscriptionText = useTranslatedText("Cancel Subscription")
  const currentPlan = subscriptionPlans.find((plan) => plan.isCurrent)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{currentPlanText}</CardTitle>
        <CardDescription>
          {useTranslatedText("You are currently on the")} {currentPlan?.name} {useTranslatedText("plan")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          {subscriptionPlans.map((plan) => (
            <Card key={plan.id} className={`flex flex-col ${plan.isCurrent ? "border-primary" : ""}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {plan.isCurrent && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {useTranslatedText("Current")}
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  <span className="ml-1 text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <ul className="space-y-2 text-sm mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <BadgeCheck className="mr-2 h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                  {plan.disabledFeatures?.map((feature, index) => (
                    <li key={`disabled-${index}`} className="flex items-center text-muted-foreground line-through">
                      <BadgeCheck className="mr-2 h-4 w-4 text-muted-foreground opacity-50" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button
                  variant={plan.isCurrent ? "outline" : "default"}
                  className={`w-full ${plan.isCurrent ? "text-destructive" : ""}`}
                >
                  {plan.isCurrent ? cancelSubscriptionText : upgradeText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
