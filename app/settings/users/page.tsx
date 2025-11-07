"use client";

import React, { useState, useEffect } from "react";
import { Filter, Search, UserCog, UserPlus } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useTranslatedText } from "@/lib/translation";
import { UserDetailsDrawer } from "@/components/drawers/user-details-drawer";
import { AddUserDrawer } from "@/components/drawers/add-user-drawer";
import { getUsersByHotel } from "@/controllers/usersByHotelController";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  registeredDate: string;
  lastActive: string;
  permissions?: Record<string, boolean>;
}

export default function UsersPage() {
  const t = {
    users: useTranslatedText("Users"),
    addUser: useTranslatedText("Add User"),
    search: useTranslatedText("Search"),
    filter: useTranslatedText("Filter"),
    noUsers: useTranslatedText("No users found"),
    addFirst: useTranslatedText("Add a user to get started"),
    id: useTranslatedText("ID"),
    name: useTranslatedText("Name"),
    email: useTranslatedText("Email"),
    role: useTranslatedText("Role"),
    status: useTranslatedText("Status"),
    actions: useTranslatedText("Actions"),
    manage: useTranslatedText("Manage"),
    registeredDate: useTranslatedText("Registered"),
    lastActive: useTranslatedText("Last Active"),
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setShowAccessDenied(role !== "Owner");
  }, []);

  // useEffect(() => {
  //   const fetchUsers = async () => {
  //     try {
  //       const tokenString = localStorage.getItem("hotelmateTokens")
  //       const hotelString = localStorage.getItem("selectedProperty")

  //       if (!tokenString || !hotelString) return

  //       const { accessToken } = JSON.parse(tokenString)
  //       const { id: hotelId } = JSON.parse(hotelString)

  //         headers: {
  //           Authorization: `Bearer ${accessToken}`,
  //         },
  //       })

  //       if (!res.ok) throw new Error("Failed to fetch users")
  //       const data = await res.json()

  //       const parsed = data.map((user: any, idx: number) => ({
  //         id: user.id || `U-${(idx + 1).toString().padStart(3, "0")}`,
  //         name: user.fullName || user.userName || "Unknown",
  //         email: user.email || "N/A",
  //         role: user.roles && user.roles.length > 0 ? user.roles.join(", ") : "N/A",
  //         status: user.status === 0 ? "Active" : "Inactive",
  //         registeredDate: user.registeredDate
  //           ? new Date(user.registeredDate).toLocaleDateString()
  //           : "N/A",
  //         lastActive: user.lastActive
  //           ? new Date(user.lastActive).toLocaleDateString()
  //           : "N/A",
  //         permissions: user.permissions || {},
  //       }))

  //       setUsers(parsed)
  //     } catch (err) {
  //       console.error("Error fetching users:", err)
  //     }
  //   }

  //   fetchUsers()
  // }, [])

  // Access denied card now handled below, not here.

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const tokenString = localStorage.getItem("hotelmateTokens");
        const hotelString = localStorage.getItem("selectedProperty");

        if (!tokenString || !hotelString) return;

        const { accessToken } = JSON.parse(tokenString);
        const { id: hotelId } = JSON.parse(hotelString);

        const data = await getUsersByHotel({
          token: accessToken,
          hotelId,
        });
        console.log("data user page: ", data);

        const parsed = data.map((user, idx) => ({
          id: user.id || `U-${(idx + 1).toString().padStart(3, "0")}`,
          name: user.fullName || "Unknown",
          email: user.email || "N/A",
          role:
            user.roles && user.roles.length > 0 ? user.roles.join(", ") : "N/A",
          status: user.status === 0 ? "Active" : "Pending",
          registeredDate: user.registeredDate
            ? new Date(user.registeredDate).toLocaleDateString()
            : "N/A",
          lastActive: user.lastActive
            ? new Date(user.lastActive).toLocaleDateString()
            : "N/A",
        }));

        setUsers(parsed);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, []);

  const openManage = (user: User) => {
    setSelected(user);
    setIsManageOpen(true);
  };

  const handleDelete = () => {
    if (!selected) return;
    setUsers((prev) => prev.filter((u) => u.id !== selected.id));
    setIsManageOpen(false);
  };

  const handleAddUser = (data: any) => {
    setUsers((prev) => [
      ...prev,
      {
        id: data.id || `U-00${prev.length + 1}`,
        name: data.name,
        email: data.email,
        role: data.role,
        status: "Active",
        registeredDate: "N/A",
        lastActive: "N/A",
        permissions: data.permissions || {},
      },
    ]);
    setIsAddOpen(false);
  };

  return (
    <DashboardLayout>
      {showAccessDenied ? (
        <div className="p-6 flex justify-center items-center min-h-[50vh]">
          <Card className="max-w-md w-full border border-primary">
            <CardHeader>
              <CardTitle className="text-primary">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Only property owners can manage this page. Please contact your
                administrator if you believe this is an error.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Add User Drawer */}
          <AddUserDrawer
            key={isAddOpen ? "open" : "closed"}
            isOpen={isAddOpen}
            onClose={() => setIsAddOpen(false)}
          />

          {/* Manage Drawer */}
          {selected && (
            <UserDetailsDrawer
              isOpen={isManageOpen}
              onClose={() => setIsManageOpen(false)}
              user={selected}
              onDelete={handleDelete}
            />
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{t.users}</h1>
            <Button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" /> {t.addUser}
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`${t.search}...`}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" /> {t.filter}
            </Button>
          </div>

          {/* User Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t.users}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-auto">
              {users.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {/* <TableHead>{t.id}</TableHead> */}
                      <TableHead>{t.name}</TableHead>
                      <TableHead>{t.email}</TableHead>
                      <TableHead>{t.role}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      <TableHead>{t.registeredDate || "Registered"}</TableHead>
                      <TableHead>{t.lastActive || "Last Active"}</TableHead>
                      <TableHead>{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users
                      .filter((u) =>
                        u.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((user) => (
                        <TableRow key={user.id} className="hover:bg-gray-600">
                          {/* <TableCell className="font-medium">
                            {user.id}
                          </TableCell> */}
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                user.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {user.status}
                            </span>
                          </TableCell>
                          <TableCell>{user.registeredDate}</TableCell>
                          <TableCell>{user.lastActive}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1"
                              onClick={() => openManage(user)}
                            >
                              <UserCog className="h-3.5 w-3.5" /> {t.manage}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <UserCog className="mb-2 h-10 w-10 text-muted-foreground" />
                  <p className="mb-2 text-lg font-medium">{t.noUsers}</p>
                  <p className="text-sm text-muted-foreground">{t.addFirst}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
