"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useTranslatedText } from "@/lib/translation"

export default function InvoicesTab() {
  const invoices = [
    {
      id: "INV-001",
      date: "May 1, 2025",
      amount: "$ 49.00",
      status: "Paid",
      description: "Premium Plan - Monthly Subscription",
    },
    {
      id: "INV-002",
      date: "April 1, 2025",
      amount: "$ 49.00",
      status: "Paid",
      description: "Premium Plan - Monthly Subscription",
    },
  ]

  const downloadText = useTranslatedText("Download")

  return (
    <Card>
      <CardHeader>
        <CardTitle>{useTranslatedText("Invoices")}</CardTitle>
        <CardDescription>{useTranslatedText("View and download your invoices")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{invoice.description}</p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{invoice.id}</span>
                  <span>{invoice.date}</span>
                  <span className="font-medium text-foreground">{invoice.amount}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  {invoice.status}
                </span>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  {downloadText}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
