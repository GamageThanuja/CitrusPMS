"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslatedText } from "@/lib/translation";
import { getUserNavigationsByHotelId } from "@/controllers/userNavigationsController";
import { inviteUser } from "@/controllers/userController";

interface Permission {
  moduleID: number;
  moduleName: string;
}

interface AddUserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddUserDrawer: React.FC<AddUserDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const tInvite = useTranslatedText("Invite User");
  const tName = useTranslatedText("Name");
  const tEmail = useTranslatedText("Email");
  const tRole = useTranslatedText("Role");
  const tPerms = useTranslatedText("User Permission");
  const tSend = useTranslatedText("Send Invitation");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [propertySelected, setPropertySelected] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role?.toLowerCase() !== "owner") {
      setHasAccess(false);
      return;
    } else {
      setHasAccess(true);
    }

    const fetchPermissions = async () => {
      try {
        const tokensString = localStorage.getItem("hotelmateTokens");
        const selectedPropertyString = localStorage.getItem("selectedProperty");

        if (!tokensString || !selectedPropertyString) {
          throw new Error("Missing tokens or selected property");
        }

        const tokens = JSON.parse(tokensString);
        const selectedProperty = JSON.parse(selectedPropertyString);

        if (!selectedProperty.id) {
          setPropertySelected(false);
          return;
        }

        const accessToken = tokens.accessToken;
        const hotelId = selectedProperty.id;

        const data = await getUserNavigationsByHotelId({
          token: accessToken,
          hotelId,
        });

        console.log("Raw module data:", data); // for debugging

        // 🚀 NO FILTERING. Show all modules received
        setPermissionsList(data);

        const defaultPerms = Object.fromEntries(
          data.map((p: Permission) => [p.moduleName, false])
        );
        setPerms(defaultPerms);
      } catch (error) {
        console.error(error);
        setPermissionsList([]);
      }
    };

    if (isOpen) {
      fetchPermissions();
    }
  }, [isOpen]);

  const togglePerm = (key: string) => {
    setPerms((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const tokensString = localStorage.getItem("hotelmateTokens");
      const selectedPropertyString = localStorage.getItem("selectedProperty");

      if (!tokensString || !selectedPropertyString) {
        alert("Missing authentication information. Please login again.");
        return;
      }

      const tokens = JSON.parse(tokensString);
      const selectedProperty = JSON.parse(selectedPropertyString);

      const accessToken = tokens.accessToken;
      const hotelId = selectedProperty.id;

      const selectedModules = permissionsList
        .filter((p) => perms[p.moduleName])
        .map((p) => p.moduleID);

      const payload = {
        fullName: name,
        email,
        password: "HOTELmate123$",
        role,
        hotelId,
        modules: selectedModules.length ? selectedModules : [],
      };

      setIsSubmitting(true);
      console.log("payload invite : ", payload);

      await inviteUser({
        token: accessToken,
        payload,
      });

      // Reset form
      setName("");
      setEmail("");
      setRole("");
      setPerms({});
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error occurred while sending invitation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return hasAccess ? (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader>
          <SheetTitle>{tInvite}</SheetTitle>
        </SheetHeader>
        {propertySelected ? (
          <form onSubmit={handleSubmit} className="space-y-6 px-[10px] mt-4">
            <div>
              <Label htmlFor="name">{tName}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">{tEmail}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="role">{tRole}</Label>
              <Select
                value={role}
                onValueChange={(val) => setRole(val)}
                required
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder={tRole} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block mb-2">{tPerms}</Label>
              <div className="grid grid-cols-2 gap-4">
                {permissionsList.map((perm) => (
                  <label
                    key={perm.moduleID}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      checked={!!perms[perm.moduleName]}
                      onCheckedChange={() => togglePerm(perm.moduleName)}
                    />
                    <span>{perm.moduleName}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : tSend}
            </Button>
          </form>
        ) : (
          <div className="text-center mt-10 text-gray-500">
            Please select a property first to assign permissions.
          </div>
        )}
      </SheetContent>
    </Sheet>
  ) : null;
};
