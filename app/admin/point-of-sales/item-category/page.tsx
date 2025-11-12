"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/redux/store";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  fetchCategoryMas,
  selectCategoryMasItems,
  selectCategoryMasLoading,
  selectCategoryMasError,
  type CategoryMasItem,
} from "@/redux/slices/fetchCategoryMasSlice";
import {
  createCategoryMas,
  selectCreateCategoryLoading,
  selectCreateCategoryError,
  selectCreateCategorySuccess,
} from "@/redux/slices/createCategoryMasSlice";

import {
  updateCategoryMas,
  selectUpdateCategoryMasLoading,
  selectUpdateCategoryMasError,
  resetUpdateCategoryMasState,
  type CategoryMas as CategoryMasUpdateBody,
} from "@/redux/slices/updateCategoryMasSlice";

export default function ItemCategoryPage() {
  const dispatch = useDispatch<AppDispatch>();

  // fetch list state
  const loading = useSelector(selectCategoryMasLoading);
  const error = useSelector(selectCategoryMasError);
  const items = useSelector(selectCategoryMasItems);

  // create state
  const creating = useSelector(selectCreateCategoryLoading);
  const createError = useSelector(selectCreateCategoryError);
  const createSuccess = useSelector(selectCreateCategorySuccess);

  const updating = useSelector(selectUpdateCategoryMasLoading);
  const updateError = useSelector(selectUpdateCategoryMasError);
  // edit dialog state
  const editDialogRef = useRef<HTMLDialogElement | null>(null);
  const [editingRow, setEditingRow] = useState<CategoryMasItem | null>(null);
  const [editValues, setEditValues] = useState<{
    categoryCode: string;
    categoryName: string;
  }>({
    categoryCode: "",
    categoryName: "",
  });

  // 🔎 filters + pagination
  const [filterId, setFilterId] = useState("");
  const [filterCode, setFilterCode] = useState("");
  const [filterName, setFilterName] = useState("");
  const [pageIndex, setPageIndex] = useState(1); // 1-based
  const [pageSize, setPageSize] = useState(10);

  // ✍️ create form values
  const [form, setForm] = useState({ categoryCode: "", categoryName: "" });
  const onFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const canSave = form.categoryName.trim().length > 0 && !creating;

  // initial load
  useEffect(() => {
    dispatch(fetchCategoryMas());
  }, [dispatch]);

  // after successful create, refresh and clear form
  useEffect(() => {
    if (createSuccess) {
      dispatch(fetchCategoryMas());
      setForm({ categoryCode: "", categoryName: "" });
    }
  }, [createSuccess, dispatch]);

  const openEdit = (row: CategoryMasItem) => {
    setEditingRow(row);
    setEditValues({
      categoryCode: row.categoryCode ?? "",
      categoryName: row.categoryName ?? "",
    });
    dispatch(resetUpdateCategoryMasState());
    editDialogRef.current?.showModal();
  };

  const closeEdit = () => {
    editDialogRef.current?.close();
    dispatch(resetUpdateCategoryMasState());
    setEditingRow(null);
  };

  const onEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditValues((p) => ({ ...p, [name]: value }));
  };

  const saveEdit = async () => {
    if (!editingRow) return;

    // Build the PUT body. We keep existing fields and only change code/name.
    const payload: CategoryMasUpdateBody = {
      finAct: (editingRow as any).finAct ?? true,
      companyID: (editingRow as any).companyID ?? null,
      categoryID: editingRow.categoryID ?? null,
      categoryCode: editValues.categoryCode.trim(), // path param uses this
      categoryName: editValues.categoryName.trim(),
      departmentID: (editingRow as any).departmentID ?? null,
      createdOn: (editingRow as any).createdOn ?? null,
      lastModOn: new Date().toISOString(),
      lastModBy: (editingRow as any).lastModBy ?? null,
      categoryTypeID: (editingRow as any).categoryTypeID ?? null,
      d30CreditMargine: (editingRow as any).d30CreditMargine ?? null,
      d60CreditMargine: (editingRow as any).d60CreditMargine ?? null,
      pcpCode: (editingRow as any).pcpCode ?? null,
      buid: (editingRow as any).buid ?? null,
      seq: (editingRow as any).seq ?? null,
      discountID: (editingRow as any).discountID ?? null,
      colourCode: (editingRow as any).colourCode ?? null,
    };

    try {
      await dispatch(updateCategoryMas(payload)).unwrap();
      await dispatch(fetchCategoryMas());
      closeEdit();
    } catch (e) {
      // error shown in dialog; keep it open
      console.error("Update category failed:", e);
    }
  };

  const filtered: CategoryMasItem[] = useMemo(() => {
    return items.filter((r) => {
      const matchesId = filterId.trim()
        ? r.categoryID
            ?.toString()
            .toLowerCase()
            .includes(filterId.toLowerCase())
        : true;
      const matchesCode = filterCode.trim()
        ? (r.categoryCode ?? "")
            .toLowerCase()
            .includes(filterCode.toLowerCase())
        : true;
      const matchesName = filterName.trim()
        ? (r.categoryName ?? "")
            .toLowerCase()
            .includes(filterName.toLowerCase())
        : true;
      return matchesId && matchesCode && matchesName;
    });
  }, [items, filterId, filterCode, filterName]);

  useEffect(
    () => setPageIndex(1),
    [filterId, filterCode, filterName, pageSize, items.length]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const canPrev = pageIndex > 1 && !loading;
  const canNext = !loading && pageIndex < totalPages;

  const start = (pageIndex - 1) * pageSize;
  const page = useMemo(
    () => filtered.slice(start, start + pageSize),
    [filtered, start, pageSize]
  );

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await dispatch(
        createCategoryMas({
          // code can be optional per your API; sending null if empty
          categoryCode: form.categoryCode.trim() || null,
          categoryName: form.categoryName.trim(),
          // (optional metadata below if your API stores them)
          createdOn: new Date().toISOString(),
          finAct: true,
        })
      ).unwrap();
    } catch (e) {
      // keep form values; error is shown below
      console.error("Create category failed:", e);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Title */}
        <div>
          <h1 className="text-xl font-semibold text-black">Item Category</h1>
          <p className="text-sm text-gray-500 -mt-1">Manage Item Categories</p>
        </div>

        {/* ✅ Create form (top, like your screenshot) */}
        <div className="rounded-xl border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Category Code</label>
              <Input
                name="categoryCode"
                value={form.categoryCode}
                onChange={onFormChange}
                placeholder=""
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Category Name</label>
              <Input
                name="categoryName"
                value={form.categoryName}
                onChange={onFormChange}
                placeholder=""
              />
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={handleSave}
              disabled={!canSave}
              className="w-48 bg-black hover:bg-gray-800"
            >
              {creating ? "Saving…" : "Save"}
            </Button>
          </div>

          {createError && (
            <div className="mt-2 text-xs text-red-600">{createError}</div>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
          <Input
            placeholder="Category ID"
            value={filterId}
            onChange={(e) => setFilterId(e.target.value)}
            className="w-full"
          />
          <Input
            placeholder="Category Code"
            value={filterCode}
            onChange={(e) => setFilterCode(e.target.value)}
            className="w-full"
          />
          <Input
            placeholder="Category Name"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Errors */}
        {error && (
          <div className="text-red-600 text-sm border border-red-200 rounded-md p-3 bg-red-50">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px]">#</TableHead>
                <TableHead className="w-[160px]">Category ID</TableHead>
                <TableHead className="w-[340px]">Category Code</TableHead>
                <TableHead>Category Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : page.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-6 text-center text-gray-500"
                  >
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                page.map((r) => (
                  <TableRow key={`${r.categoryID}-${r.categoryCode}`}>
                    <TableCell className="text-blue-600">
                      <button
                        type="button"
                        className="hover:underline"
                        onClick={() => openEdit(r)}
                      >
                        Edit
                      </button>
                    </TableCell>
                    <TableCell className="font-mono">{r.categoryID}</TableCell>
                    <TableCell className="font-mono">
                      {r.categoryCode}
                    </TableCell>
                    <TableCell>{r.categoryName}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Category dialog (centered) */}
        <dialog
          ref={editDialogRef}
          className="rounded-lg p-0 backdrop:bg-black/30 open:fixed open:top-1/2 open:left-1/2 open:-translate-x-1/2 open:-translate-y-1/2 open:m-0"
        >
          <form method="dialog" className="w-[92vw] max-w-lg">
            <div className="border-b px-4 py-3">
              <h2 className="text-base font-semibold">Edit Category</h2>
            </div>

            <div className="px-4 py-4 space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="editCategoryCode"
                  className="text-sm text-gray-600"
                >
                  Category Code
                </label>
                <Input
                  id="editCategoryCode"
                  name="categoryCode"
                  value={editValues.categoryCode}
                  onChange={onEditChange}
                  // If changing code should be disabled in your API, uncomment:
                  // readOnly
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="editCategoryName"
                  className="text-sm text-gray-600"
                >
                  Category Name
                </label>
                <Input
                  id="editCategoryName"
                  name="categoryName"
                  value={editValues.categoryName}
                  onChange={onEditChange}
                />
              </div>

              {updateError && (
                <div className="text-xs text-red-600">{updateError}</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
              <button
                type="button"
                onClick={closeEdit}
                className="px-3 py-1.5 text-sm border rounded"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="px-3 py-1.5 text-sm rounded bg-black text-white disabled:opacity-60"
                disabled={
                  updating ||
                  !editValues.categoryName.trim() ||
                  !editValues.categoryCode.trim()
                }
              >
                {updating ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </dialog>

        {/* Pagination */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
          <div className="hidden sm:block" />
          <div className="flex justify-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => canPrev && setPageIndex((p) => p - 1)}
                disabled={!canPrev}
                className="flex items-center gap-1 text-sm text-black disabled:text-gray-400"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="px-3 py-1 rounded bg-black text-white text-sm">
                {pageIndex} / {totalPages}
              </span>
              <button
                onClick={() => canNext && setPageIndex((p) => p + 1)}
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
                onChange={(e) => {
                  const v = Number(e.target.value) || 10;
                  setPageSize(v);
                  setPageIndex(1);
                }}
                className="px-2 py-1 text-sm border rounded bg-white"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
