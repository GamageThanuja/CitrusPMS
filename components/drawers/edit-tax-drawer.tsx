"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface EditTaxDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSave: (updatedTax: any) => void
  taxData: any
}

export function EditTaxDrawer({
  isOpen,
  onClose,
  onSave,
  taxData,
}: EditTaxDrawerProps) {
  const [name, setName] = useState("")
  const [rate, setRate] = useState("")
  const [type, setType] = useState("Percentage")
  const [country, setCountry] = useState("")
  const [status, setStatus] = useState("Active")
  const [afterServiceCharge, setAfterServiceCharge] = useState(true)

  useEffect(() => {
    if (taxData) {
      setName(taxData.name)
      setRate(taxData.rate)
      setType(taxData.type)
      setCountry(taxData.country)
      setStatus(taxData.status)
      setAfterServiceCharge(taxData.afterServiceCharge)
    }
  }, [taxData])

  const handleSubmit = () => {
    const updatedTax = {
      ...taxData,
      name,
      rate,
      type,
      country,
      status,
      afterServiceCharge,
    }
    onSave(updatedTax)
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Edit Tax</SheetTitle>
        </SheetHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="afterServiceCharge">
              Calculate tax after service charge?
            </Label>
            <Switch
              id="afterServiceCharge"
              checked={afterServiceCharge}
              onCheckedChange={setAfterServiceCharge}
            />
          </div>

          <div>
            <Label htmlFor="name">Tax Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="rate">Rate</Label>
            <Input
              id="rate"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>

          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Percentage">Percentage</SelectItem>
                <SelectItem value="Fixed">Fixed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Country</Label>
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>

          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSubmit} className="mt-4 w-full">
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
