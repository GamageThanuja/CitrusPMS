"use client"

import type React from "react"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslatedText } from "@/lib/translation"

interface AddTaxDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function AddTaxDrawer({ isOpen, onClose, onSubmit }: AddTaxDrawerProps) {
  const [formData, setFormData] = useState({
    name: "",
    rate: "",
    type: "Percentage",
    country: "",
    status: "Active",
  })

  const addTax = useTranslatedText("Add Tax")
  const nameLabel = useTranslatedText("Name")
  const rateLabel = useTranslatedText("Rate")
  const typeLabel = useTranslatedText("Type")
  const countryLabel = useTranslatedText("Country")
  const statusLabel = useTranslatedText("Status")
  const saveLabel = useTranslatedText("Save")
  const cancelLabel = useTranslatedText("Cancel")
  const enterTaxDetails = useTranslatedText("Enter the details for the new tax")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      name: "",
      rate: "",
      type: "Percentage",
      country: "",
      status: "Active",
    })
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl">
        <SheetHeader>
          <SheetTitle>{addTax}</SheetTitle>
          <SheetDescription>{enterTaxDetails}</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">{nameLabel}</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Value Added Tax"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">{rateLabel}</Label>
            <Input id="rate" name="rate" value={formData.rate} onChange={handleChange} placeholder="10%" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">{typeLabel}</Label>
            <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Percentage">Percentage</SelectItem>
                <SelectItem value="Fixed">Fixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">{countryLabel}</Label>
            <Input
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="United States"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">{statusLabel}</Label>
            <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
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

