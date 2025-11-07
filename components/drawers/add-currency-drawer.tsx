"use client"

import type React from "react"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useTranslatedText } from "@/lib/translation"

interface AddCurrencyDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function AddCurrencyDrawer({ isOpen, onClose, onSubmit }: AddCurrencyDrawerProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    symbol: "",
    exchangeRate: "",
    isDefault: false,
  })

  const addCurrency = useTranslatedText("Add Currency")
  const codeLabel = useTranslatedText("Code")
  const nameLabel = useTranslatedText("Name")
  const symbolLabel = useTranslatedText("Symbol")
  const exchangeRateLabel = useTranslatedText("Exchange Rate")
  const defaultLabel = useTranslatedText("Default")
  const saveLabel = useTranslatedText("Save")
  const cancelLabel = useTranslatedText("Cancel")
  const enterCurrencyDetails = useTranslatedText("Enter the details for the new currency")
  const makeDefaultCurrency = useTranslatedText("Make this the default currency")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isDefault: checked }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      code: "",
      name: "",
      symbol: "",
      exchangeRate: "",
      isDefault: false,
    })
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl">

        <SheetHeader>
          <SheetTitle>{addCurrency}</SheetTitle>
          <SheetDescription>{enterCurrencyDetails}</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">{codeLabel}</Label>
            <Input id="code" name="code" value={formData.code} onChange={handleChange} placeholder="USD" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">{nameLabel}</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="US Dollar"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="symbol">{symbolLabel}</Label>
            <Input id="symbol" name="symbol" value={formData.symbol} onChange={handleChange} placeholder="$" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exchangeRate">{exchangeRateLabel}</Label>
            <Input
              id="exchangeRate"
              name="exchangeRate"
              type="number"
              step="0.01"
              value={formData.exchangeRate}
              onChange={handleChange}
              placeholder="1.0"
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="isDefault" checked={formData.isDefault} onCheckedChange={handleSwitchChange} />
            <Label htmlFor="isDefault">{makeDefaultCurrency}</Label>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button type="submit">{saveLabel}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

