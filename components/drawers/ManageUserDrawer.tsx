"use client"

import React, { useState } from "react"
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { useTranslatedText } from "@/lib/translation"

const PERMISSIONS = [
  "dashboard",
  "frontDesk",
  "channels",
  "financials",
  "reservations",
  "roomRates",
  "pos",
  "settings",
] as const

type PermKey = typeof PERMISSIONS[number]

export interface ManageUserDrawerProps {
  isOpen: boolean
  onClose: () => void
  user: {
    id: string
    name: string
    email: string
    role: string
    status: "Active" | "Inactive"
    permissions: Record<PermKey, boolean>
  }
  onChangePassword: (newPass: string) => void
  onSavePermissions: (perms: Record<PermKey, boolean>) => void
  onDelete: () => void
}

export const ManageUserDrawer: React.FC<ManageUserDrawerProps> = ({
  isOpen,
  onClose,
  user,
  onChangePassword,
  onSavePermissions,
  onDelete,
}) => {
  const tChangePass = useTranslatedText("Change Password")
  const tNewPass = useTranslatedText("New Password")
  const tConfirmPass = useTranslatedText("Confirm Password")
  const tPerms = useTranslatedText("User Permission")
  const tDelete = useTranslatedText("Delete User")
  const tSave = useTranslatedText("Save")

  const [tab, setTab] = useState<"password" | "permissions" | "delete">("permissions")
  const [newPass, setNewPass] = useState("")
  const [confirmPass, setConfirmPass] = useState("")
  const [perms, setPerms] = useState<Record<PermKey, boolean>>(user.permissions)

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass !== confirmPass) {
      alert("Passwords do not match")
      return
    }
    onChangePassword(newPass)
    onClose()
  }

  const togglePerm = (key: PermKey) =>
    setPerms((p) => ({ ...p, [key]: !p[key] }))

  const handleSave = () => {
    onSavePermissions(perms)
    onClose()
  }

  const statusBadge = user.status === "Active"
    ? "inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800"
    : "inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800"

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      {/* Outer drawer edges are square; inner items keep default rounding */}
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <div>
              <span className={statusBadge}>{user.status}</span>
              <p className="mt-1 text-sm font-medium text-gray-700">{user.role}</p>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full mt-6">
          <TabsList className="bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="password" className="flex-1">{tChangePass}</TabsTrigger>
            <TabsTrigger value="permissions" className="flex-1">{tPerms}</TabsTrigger>
            <TabsTrigger value="delete" className="flex-1 text-red-600">{tDelete}</TabsTrigger>
          </TabsList>

          <TabsContent value="password" className="mt-4 space-y-4">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-pass">{tNewPass}</Label>
                <Input
                  id="new-pass"
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pass">{tConfirmPass}</Label>
                <Input
                  id="confirm-pass"
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full mt-4">{tChangePass}</Button>
            </form>
          </TabsContent>

          <TabsContent value="permissions" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {PERMISSIONS.map((key) => (
                <label key={key} className="flex items-center space-x-2">
                  <Checkbox checked={!!perms[key]} onCheckedChange={() => togglePerm(key)} />
                  <span className="capitalize text-gray-800">{key}</span>
                </label>
              ))}
            </div>
            <Button onClick={handleSave} className="w-full mt-4">{tSave}</Button>
          </TabsContent>

          <TabsContent value="delete" className="mt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">{tDelete}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{tDelete}</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {user.name}?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { onDelete(); onClose() }}>
                    Yes
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
