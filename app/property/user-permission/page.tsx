"use client";

import React, { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useDispatch } from "react-redux";
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useAppSelector } from "@/redux/hooks";

import {
  fetchPMSUserPermission,
  selectPMSUserPermissionData,
  selectPMSUserPermissionLoading,
  selectPMSUserPermissionError,
} from "@/redux/slices/fetchPMSUserPermissionSlice";

import {
  updatePMSUserPermission,
  selectUpdatePMSUserPermissionLoading,
  selectUpdatePMSUserPermissionError,
} from "@/redux/slices/updatePMSUserPermissionSlice";

import {
  fetchUserMas,
  selectUserMasData,
  selectUserMasLoading,
  selectUserMasError,
} from "@/redux/slices/fetchUserMasSlice";

interface PMSUserPermissionUI {
  id: number;
  userID: number;
  moduleID: number;
  category: string;
  isPermitted: boolean;
}

export default function UserPermissionPage() {
  const dispatch = useDispatch<any>();

  const permissions = useAppSelector(selectPMSUserPermissionData);
  const loading = useAppSelector(selectPMSUserPermissionLoading);
  const error = useAppSelector(selectPMSUserPermissionError);

  const updating = useAppSelector(selectUpdatePMSUserPermissionLoading);
  const updateError = useAppSelector(selectUpdatePMSUserPermissionError);

  // User master data
  const users = useAppSelector(selectUserMasData);
  const usersLoading = useAppSelector(selectUserMasLoading);
  const usersError = useAppSelector(selectUserMasError);

  const [filtered, setFiltered] = useState<PMSUserPermissionUI[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [permissionFilter, setPermissionFilter] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [editedPermissions, setEditedPermissions] = useState<Record<number, boolean>>({});

  // Pagination
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch users on component mount
  useEffect(() => {
    dispatch(fetchUserMas());
  }, [dispatch]);

  // Set default selected user to current user on initial load
  useEffect(() => {
    const currentUserId = Number(localStorage.getItem("userID") ?? 0);
    if (currentUserId > 0) {
      setSelectedUserId(currentUserId);
    }
  }, []);

  // Fetch permissions when selected user changes
  useEffect(() => {
    if (selectedUserId > 0) {
      dispatch(fetchPMSUserPermission(selectedUserId));
    }
  }, [dispatch, selectedUserId]);

  // Filter + init
  useEffect(() => {
    const q = query.toLowerCase().trim();
    const filteredList = permissions.filter(
      (p) =>
        (p.moduleID?.toString() ?? "").includes(q) &&
        (categoryFilter ? p.category === categoryFilter : true) &&
        (permissionFilter
          ? permissionFilter === "true"
            ? p.isPermitted === true
            : p.isPermitted === false
          : true)
    );
    setFiltered(filteredList);

    const initialEdits: Record<number, boolean> = {};
    permissions.forEach((p) => (initialEdits[p.id] = p.isPermitted));
    setEditedPermissions(initialEdits);
  }, [permissions, query, categoryFilter, permissionFilter]);

  const handleCheckboxChange = (id: number, value: boolean) => {
    setEditedPermissions((prev) => ({ ...prev, [id]: value }));
  };

  const handleUpdate = async () => {
    try {
      for (const id in editedPermissions) {
        const permission = permissions.find((p) => p.id === Number(id));
        if (permission && permission.isPermitted !== editedPermissions[Number(id)]) {
          await dispatch(
            updatePMSUserPermission({
              id: permission.id,
              isPermitted: editedPermissions[Number(id)],
            })
          );
        }
      }
      if (selectedUserId > 0) {
        dispatch(fetchPMSUserPermission(selectedUserId));
      }
    } catch {}
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = Number(e.target.value);
    setSelectedUserId(userId);
    setPageIndex(1); // Reset to first page when user changes
  };

  // Get current selected user name for display
  const selectedUserName = useMemo(() => {
    if (selectedUserId === 0) return "Select a user";
    const user = users.find(u => u.userID === selectedUserId);
    return user ? `${user.name} (${user.userName})` : `User ID: ${selectedUserId}`;
  }, [users, selectedUserId]);

  // pagination logic
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const canPrev = pageIndex > 1 && !loading;
  const canNext = !loading && pageIndex < totalPages;

  const handlePrev = () => canPrev && setPageIndex((p) => p - 1);
  const handleNext = () => canNext && setPageIndex((p) => p + 1);
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value) || 10);
    setPageIndex(1);
  };

  const paginated = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, pageIndex, pageSize]);

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-xl font-semibold">User Permissions</h1>
          
          {/* User Selection */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2 min-w-[300px]">
              <label htmlFor="user-select" className="text-sm font-medium whitespace-nowrap">
                Select User:
              </label>
              <select
                id="user-select"
                value={selectedUserId}
                onChange={handleUserChange}
                className="flex-1 border rounded-md px-3 py-2 text-sm bg-white"
                disabled={usersLoading}
              >
                <option value={0}>Select a user...</option>
                {users.map((user) => (
                  <option key={user.userID} value={user.userID}>
                    {user.name} ({user.userName}) - {user.userID}
                  </option>
                ))}
              </select>
              {usersLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            
            {selectedUserId > 0 && (
              <div className="text-sm text-gray-600">
                Viewing permissions for: <span className="font-medium">{selectedUserName}</span>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search by Module ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-56"
              disabled={!selectedUserId}
            />
            <select
              className="border rounded-md px-2 py-1 text-sm bg-white"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              disabled={!selectedUserId}
            >
              <option value="">All Categories</option>
              {[...new Set(permissions.map((p) => p.category))].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              className="border rounded-md px-2 py-1 text-sm bg-white"
              value={permissionFilter}
              onChange={(e) => setPermissionFilter(e.target.value)}
              disabled={!selectedUserId}
            >
              <option value="">All Permissions</option>
              <option value="true">Permitted</option>
              <option value="false">Not Permitted</option>
            </select>
            <Button
              variant="outline"
              onClick={() => selectedUserId > 0 && dispatch(fetchPMSUserPermission(selectedUserId))}
              disabled={loading || !selectedUserId}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={updating || !selectedUserId}
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
            </Button>
          </div>
        </div>

        {/* Errors */}
        {(usersError || error || updateError) && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
            {usersError || error || updateError}
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">#</TableHead>
                <TableHead>Module ID</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-[150px]">Permitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!selectedUserId ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                    Please select a user to view permissions
                  </TableCell>
                </TableRow>
              ) : loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center">
                    Loading permissions…
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((p, idx) => (
                  <TableRow key={p.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {(pageIndex - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell>{p.moduleID}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {editedPermissions[p.id] ? "Yes" : "No"}
                        </span>
                        <input
                          type="checkbox"
                          checked={editedPermissions[p.id] || false}
                          onChange={(e) => handleCheckboxChange(p.id, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {selectedUserId && !loading && filtered.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No permissions found for the selected user.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {selectedUserId && filtered.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
            <div className="hidden sm:block" />
            <div className="flex justify-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrev}
                  disabled={!canPrev}
                  className="flex items-center gap-1 text-sm text-black disabled:text-gray-400"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="px-3 py-1 rounded bg-black text-white text-sm">
                  {pageIndex} / {totalPages}
                </span>
                <button
                  onClick={handleNext}
                  disabled={!canNext}
                  className="flex items-center gap-1 text-sm text-black disabled:text-gray-400"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="flex items-center gap-2">
                <label htmlFor="pageSize" className="text-sm text-gray-600">
                  Rows per page:
                </label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="px-2 py-1 text-sm border rounded bg-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}