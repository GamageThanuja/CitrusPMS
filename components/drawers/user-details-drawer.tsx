"use client"

import React, { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"

export interface UserDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  user: {
    id: string
    name: string
    email: string
    role: string
    status: string
  }
  onDelete: () => void
}

export const UserDetailsDrawer: React.FC<UserDetailsDrawerProps> = ({
  isOpen,
  onClose,
  user,
  onDelete,
}) => {
  const [canDeactivate, setCanDeactivate] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem("userRole")
    if (["Admin", "SuperAdmin", "Owner"].includes(role || "")) {
      setCanDeactivate(true)
    }
  }, [])

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
       <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl">
        <SheetHeader>
          <SheetTitle>User Details</SheetTitle>
          <SheetDescription>View or manage user information</SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>ID</Label>
            <Input value={user.id} disabled />
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={user.name} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={user.role} disabled />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Input
              value={user.status}
              className={
                user.status === "Active"
                  ? "text-green-600 font-semibold"
                  : "text-red-600 font-semibold"
              }
              disabled
            />
          </div>
        </div>

        {canDeactivate && (
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Deactivate User
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
