"use client"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { BadgeCheck } from "lucide-react"
import { useTranslatedText } from "@/lib/translation"

// Load Stripe outside component
const stripePromise = loadStripe("pk_test_51OVSpqJHXrZG3O6fly9XGA25eCwXBWV0nvAgAvXvDZc3XQFYhE3w3UQoBZxtAhCztjNynKttyiLCVo7uP05L7H8V008j3Lp2ZE") // replace with your real key

// Card Brand Logos
function VisaLogo() {
  return <div className="flex items-center justify-center w-12 h-8"><span className="text-blue-700 font-bold text-xl">VISA</span></div>
}

function AmexLogo() {
  return <div className="flex items-center justify-center w-12 h-8"><span className="text-blue-500 font-bold text-xs">AMEX</span></div>
}

function MasterCardLogo() {
  return <div className="flex items-center justify-center w-12 h-8"><span className="text-red-600 font-bold text-base">MC</span></div>
}

function getCardLogo(type: string) {
  switch (type.toLowerCase()) {
    case "visa": return <VisaLogo />
    case "amex":
    case "american_express": return <AmexLogo />
    case "mastercard": return <MasterCardLogo />
    default: return <VisaLogo />
  }
}

// Payment Form (Cleaned + Billing Info Added)
function PaymentForm({ onCardAdded }: { onCardAdded: (card: any) => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [cardholderName, setCardholderName] = useState("")
  const [email, setEmail] = useState("")
  const [postalCode, setPostalCode] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) return

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
      billing_details: {
        name: cardholderName || undefined,
        email: email || undefined,
        address: {
          postal_code: postalCode || undefined,
        },
      },
    })

    if (error) {
      console.error(error)
      alert(error.message)
    } else {
      console.log("Stripe PaymentMethod:", paymentMethod)

      onCardAdded({
        id: paymentMethod.id,
        type: paymentMethod.card?.brand || "unknown",
        last4: paymentMethod.card?.last4 || "0000",
        expiry: paymentMethod.card
          ? `${paymentMethod.card.exp_month.toString().padStart(2, "0")}/${paymentMethod.card.exp_year
              .toString()
              .slice(-2)}`
          : "MM/YY",
        name: paymentMethod.billing_details.name || "Unknown",
        country: paymentMethod.card?.country || "Unknown",
        funding: paymentMethod.card?.funding || "credit",
        email: paymentMethod.billing_details.email || "Unknown",
        postalCode: paymentMethod.billing_details.address?.postal_code || "Unknown",
      })
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="grid gap-2">
        <Label>Card Number</Label>
        <div className="border rounded-md p-2">
          <CardElement options={{ style: { base: { fontSize: "16px" } } }} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Cardholder Name</Label>
        <Input value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} placeholder="John Doe" />
      </div>
      <div className="grid gap-2">
        <Label>Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
      </div>
      <div className="grid gap-2">
        <Label>Postal Code</Label>
        <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="10230" />
      </div>
      <Button type="submit" className="w-full mt-2" disabled={!stripe || loading}>
        {loading ? "Processing..." : "Next Step"}
      </Button>
    </form>
  )
}

// Main PaymentMethodsTab
export default function PaymentMethodsTab() {
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: "card-1",
      type: "visa",
      last4: "4242",
      expiry: "04/25",
      name: "John Doe",
      email: "john@example.com",
      postalCode: "10001",
      country: "US",
      funding: "credit",
      isDefault: true,
    },
  ])

  const managePaymentMethodsText = useTranslatedText("Manage your payment methods")
  const addPaymentMethodText = useTranslatedText("Add Payment Method")

  const handleAddCard = (newCard: any) => {
    setPaymentMethods((prev) => [...prev, { ...newCard, isDefault: false }])
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="space-y-6 px-[10px] px-[10px] p-4">
        <h2 className="text-2xl font-bold">{managePaymentMethodsText}</h2>

        {/* Saved Cards */}
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div key={method.id} className="relative bg-white border rounded-lg shadow p-4 flex items-center hover:shadow-md transition">
              {getCardLogo(method.type)}
              <div className="ml-4 flex-1">
                <p className="font-semibold">**** **** **** {method.last4}</p>
                <p className="text-sm text-muted-foreground">{method.name} ({method.email})</p>
                <p className="text-xs text-muted-foreground">Expires: {method.expiry}</p>
                <p className="text-xs text-muted-foreground">
                  Country: {method.country} • Postal: {method.postalCode} • {method.funding.charAt(0).toUpperCase() + method.funding.slice(1)} Card
                </p>
              </div>
              {method.isDefault && (
                <BadgeCheck className="text-blue-500 w-6 h-6 absolute top-2 right-2" />
              )}
            </div>
          ))}
        </div>

        {/* Add Card Form */}
        <Card className="border-2 border-dashed">
          <CardHeader>
            <CardTitle>{addPaymentMethodText}</CardTitle>
            <CardDescription>Securely add a new credit card</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentForm onCardAdded={handleAddCard} />
          </CardContent>
        </Card>
      </div>
    </Elements>
  )
}
