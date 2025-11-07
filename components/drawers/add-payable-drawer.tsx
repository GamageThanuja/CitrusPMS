"use client"

import type React from "react"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslatedText } from "@/lib/translation"

interface AddPayableDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function AddPayableDrawer({ isOpen, onClose, onSubmit }: AddPayableDrawerProps) {
  const [formData, setFormData] = useState({
    supplier: "",
    issueDate: "",
    dueDate: "",
    amount: "",
    status: "Pending",
  })

  const addPayable = useTranslatedText("Add Payable")
  const supplierLabel = useTranslatedText("Supplier")
  const issueDateLabel = useTranslatedText("Issue Date")
  const dueDateLabel = useTranslatedText("Due Date")
  const amountLabel = useTranslatedText("Amount")
  const statusLabel = useTranslatedText("Status")
  const saveLabel = useTranslatedText("Save")
  const cancelLabel = useTranslatedText("Cancel")
  const enterPayableDetails = useTranslatedText("Enter the details for the new payable")

  // Sample suppliers for the dropdown
  const suppliers = [
    { id: "S-001", name: "ABC Food Supplies" },
    { id: "S-002", name: "XYZ Furniture" },
    { id: "S-003", name: "Cleaning Solutions Inc." },
  ]

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
      supplier: "",
      issueDate: "",
      dueDate: "",
      amount: "",
      status: "Pending",
    })
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl">
        <SheetHeader>
          <SheetTitle>{addPayable}</SheetTitle>
          <SheetDescription>{enterPayableDetails}</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="supplier">{supplierLabel}</Label>
            <Select value={formData.supplier} onValueChange={(value) => handleSelectChange("supplier", value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.name}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">{issueDateLabel}</Label>
              <Input
                id="issueDate"
                name="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">{dueDateLabel}</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">{amountLabel}</Label>
            <Input
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="$1,250.00"
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
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
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

