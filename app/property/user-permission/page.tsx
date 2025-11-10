"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useDispatch } from "react-redux";
import { Loader2, RefreshCw, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const [filtered, setFiltered] = useState<PMSUserPermissionUI[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [permissionFilter, setPermissionFilter] = useState<string>("");
  const [editedPermissions, setEditedPermissions] = useState<Record<number, boolean>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const userID = Number(localStorage.getItem("userID") ?? 0);

  // Fetch permissions on mount
  useEffect(() => {
    if (userID > 0) dispatch(fetchPMSUserPermission(userID));
  }, [dispatch, userID]);

  // Filter and initialize editedPermissions
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
      dispatch(fetchPMSUserPermission(userID));
    } catch {}
  };

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <DashboardLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <Button
            variant="outline"
            onClick={() => dispatch(fetchPMSUserPermission(userID))}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Refresh</span>
          </Button>

          <div className="flex flex-col md:flex-row gap-2 md:ml-auto">
            <Input
              placeholder="Search by Module ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full md:w-64"
            />
            <select
              className="border rounded-md px-2 py-1"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {[...new Set(permissions.map((p) => p.category))].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              className="border rounded-md px-2 py-1"
              value={permissionFilter}
              onChange={(e) => setPermissionFilter(e.target.value)}
            >
              <option value="">All Permissions</option>
              <option value="true">Permitted</option>
              <option value="false">Not Permitted</option>
            </select>
            <Button onClick={handleUpdate} disabled={updating}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
            </Button>
          </div>
        </div>

        {/* Errors */}
        {(error || updateError) && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
            {error || updateError}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-2 border-b">#</th>
                <th className="px-4 py-2 border-b">Module ID</th>
                <th className="px-4 py-2 border-b">Category</th>
                <th className="px-4 py-2 border-b">Permitted</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: itemsPerPage }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4} className="px-4 py-2 animate-pulse bg-gray-100 dark:bg-zinc-900 h-10" />
                    </tr>
                  ))
                : currentItems.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700">
                      <td className="px-4 py-2 border-b">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td className="px-4 py-2 border-b">{p.moduleID}</td>
                      <td className="px-4 py-2 border-b">{p.category}</td>
                      <td className="px-4 py-2 border-b flex items-center gap-2">
                        <span>{editedPermissions[p.id] ? "Yes" : "No"}</span>
                        <input
                          type="checkbox"
                          checked={editedPermissions[p.id] || false}
                          onChange={(e) => handleCheckboxChange(p.id, e.target.checked)}
                        />
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {!loading && filtered.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No permissions found.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
