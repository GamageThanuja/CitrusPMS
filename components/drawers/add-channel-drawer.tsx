"use client"

import type React from "react"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslatedText } from "@/lib/translation"

interface AddChannelDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function AddChannelDrawer({ isOpen, onClose, onSubmit }: AddChannelDrawerProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    commission: "",
    status: "Connected",
  })

  const addChannel = useTranslatedText("Add Channel")
  const nameLabel = useTranslatedText("Name")
  const typeLabel = useTranslatedText("Type")
  const commissionLabel = useTranslatedText("Commission")
  const statusLabel = useTranslatedText("Status")
  const saveLabel = useTranslatedText("Save")
  const cancelLabel = useTranslatedText("Cancel")
  const enterChannelDetails = useTranslatedText("Enter the details for the new channel")

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
      type: "",
      commission: "",
      status: "Connected",
    })
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl">
        <SheetHeader>
          <SheetTitle>{addChannel}</SheetTitle>
          <SheetDescription>{enterChannelDetails}</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">{nameLabel}</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Booking.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">{typeLabel}</Label>
            <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select channel type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OTA">OTA</SelectItem>
                <SelectItem value="GDS">GDS</SelectItem>
                <SelectItem value="Direct">Direct</SelectItem>
                <SelectItem value="Wholesaler">Wholesaler</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="commission">{commissionLabel}</Label>
            <Input
              id="commission"
              name="commission"
              value={formData.commission}
              onChange={handleChange}
              placeholder="15%"
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
                <SelectItem value="Connected">Connected</SelectItem>
                <SelectItem value="Disconnected">Disconnected</SelectItem>
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

