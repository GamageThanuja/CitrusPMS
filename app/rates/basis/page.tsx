"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DashboardLayout } from "@/components/dashboard-layout";
import { fetchBasisMas } from "@/redux/slices/fetchBasisMasSlice";
import type { RootState } from "@/redux/store";
import AddBasisDrawer from "@/components/drawers/add-basis-drawer";
import EditBasisDrawer, {
  type BasisMasItem as EditBasisItem,
} from "@/components/drawers/edit-basis-drawer";
import { CirclePlus, EllipsisVertical } from "lucide-react";

export default function RoomBasisPage() {
  const dispatch = useDispatch<any>();
  const { items, loading, error } = useSelector(
    (s: RootState) => s.fetchBasisMas
  );

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<EditBasisItem | null>(
    null
  );

  // search & filter
  const [searchBasis, setSearchBasis] = useState("");
  const [filterID, setFilterID] = useState("");
  const [filterDescription, setFilterDescription] = useState("");

  // initial load
  useEffect(() => {
    dispatch(fetchBasisMas());
  }, [dispatch]);

  const filteredItems = useMemo(() => {
    const q = searchBasis.trim().toLowerCase();
    const id = filterID.trim();
    const desc = filterDescription.trim().toLowerCase();
    return items.filter((row) => {
      if (q && !(row.basis || "").toLowerCase().includes(q)) return false;
      if (id && !String(row.basisID ?? "").includes(id)) return false;
      if (desc && !(row.description || "").toLowerCase().includes(desc))
        return false;
      return true;
    });
  }, [items, searchBasis, filterID, filterDescription]);

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Room Basis</h1>
          <div
            onClick={() => setDrawerOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setDrawerOpen(true);
            }}
            className="rounded-full p-3 group hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
            aria-label="Add Basis"
          >
            <CirclePlus
              size={25}
              className=" group-hover:text-black transition-colors duration-150"
            />
          </div>
        </div>

        {/* Search & Filter */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Search by Basis</label>
            <input
              type="text"
              value={searchBasis}
              onChange={(e) => setSearchBasis(e.target.value)}
              placeholder="e.g., BB, HB, FB"
              className="px-3 py-2 border rounded text-sm bg-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Filter by ID</label>
            <input
              type="text"
              inputMode="numeric"
              value={filterID}
              onChange={(e) => setFilterID(e.target.value)}
              placeholder="e.g., 3"
              className="px-3 py-2 border rounded text-sm bg-white"
            />
          </div>
                  <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Filter by Description</label>
          <input
            type="text"
            value={filterDescription}
            onChange={(e) => setFilterDescription(e.target.value)}
            placeholder="e.g., Meal plan description"
            className="px-3 py-2 border rounded text-sm bg-white"
          />
        </div>
        </div>
        {loading && <p>Loading…</p>}
        {error && <p className="text-red-600">Error: {error}</p>}

        {!loading && !error && (
          <div className="overflow-auto border rounded">
            <table className="min-w-full text-sm table-auto border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left  font-medium text-gray-700 whitespace-nowrap">
                    ID
                  </th>
                  <th className="px-4 py-2 text-left  font-medium text-gray-700 whitespace-nowrap">
                    Basis
                  </th>
                  <th className="px-4 py-2 text-left  font-medium text-gray-700 whitespace-nowrap">
                    CM Rate ID
                  </th>
                  <th className="px-4 py-2 text-left  font-medium text-gray-700 whitespace-nowrap">
                    Show on IBE
                  </th>
                  <th className="px-4 py-2 text-left  font-medium text-gray-700 whitespace-nowrap">
                    Description
                  </th>
                  {/* center + fixed width for action column */}
                  <th className="px-2 py-2 text-center font-medium text-gray-700 whitespace-nowrap w-12">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 align-middle" colSpan={6}>
                      No data
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((row) => (
                    <tr key={row.basisID} className="border-t">
                      <td className="px-4 py-2 align-middle whitespace-nowrap">
                        {row.basisID}
                      </td>
                      <td className="px-4 py-2 align-middle whitespace-nowrap">
                        {row.basis}
                      </td>
                      <td className="px-4 py-2 align-middle whitespace-nowrap">
                        {row.cmRateID}
                      </td>
                      <td className="px-4 py-2 align-middle whitespace-nowrap">
                        {String(row.showOnIBE)}
                      </td>
                      <td className="px-4 py-2 align-middle whitespace-nowrap">
                        {row.descOnIBE}
                      </td>
                      <td className="px-2 py-2 text-center align-middle w-12">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                          aria-label={`Actions for ${row.basis}`}
                          onClick={() => {
                            setSelectedRecord(row as any);
                            setEditOpen(true);
                          }}
                        >
                          <EllipsisVertical className="h-5 w-5 text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer Component */}
      <AddBasisDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <EditBasisDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        record={selectedRecord}
      />
    </DashboardLayout>
  );
}
