"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import {
  Plus,
  RefreshCcw,
  Search,
  Filter,
  Pencil,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"; // still used for Full Board only
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ----------------- CRUD slices ----------------- */
import {
  fetchToDoTasks,
  selectToDoList,
  selectToDoListStatus,
  setToDoListFilters,
  selectToDoListFilters,
} from "@/redux/slices/todoListSlice";
import {
  createToDoTask,
  selectToDoCreateStatus,
} from "@/redux/slices/todoCreateSlice";
import {
  updateToDoTask,
  selectToDoUpdateStatus,
} from "@/redux/slices/todoUpdateSlice";
import {
  deleteToDoTask,
  selectToDoDeleteStatus,
} from "@/redux/slices/todoDeleteSlice";

/* ------------------------------------------------------------------
   NOTIFICATION DRAWER that can render CUSTOM CHILDREN (your To-Do)
   — Full/Compact toggle + ESC + scroll-lock + SHIFT when Add Drawer opens
-------------------------------------------------------------------*/
export type NotificationItem = {
  id?: string | number;
  title?: string;
  message: string;
  createdAt?: string;
  kind?: "info" | "success" | "warning" | "error";
};

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  notifications?: NotificationItem[];
  renderItem?: (n: NotificationItem, idx: number) => React.ReactNode;
  onClearAll?: () => void;
  children?: React.ReactNode;
  title?: string;
  rightActions?: React.ReactNode;
  /** Persist the last chosen width mode (default true) */
  rememberWidthMode?: boolean;
};

export function NotificationDrawer({
  open,
  onClose,
  notifications = [],
  renderItem,
  onClearAll,
  children,
  title = "Notifications",
  rightActions,
  rememberWidthMode = true,
}: DrawerProps) {
  const STORAGE_KEY = "hm_notification_drawer_full";
  const [isFull, setIsFull] = React.useState<boolean>(() => {
    if (typeof window === "undefined" || !rememberWidthMode) return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });

  // Dynamic right inset when add drawer opens (push left)
  const [rightInsetPx, setRightInsetPx] = React.useState<number>(0);

  // Listen for Add Drawer open/close events
  React.useEffect(() => {
    function onOpen(e: Event) {
      const ce = e as CustomEvent<{ width?: number }>;
      const width = ce.detail?.width ?? 420;
      setRightInsetPx(width);
    }
    function onCloseAdd() {
      setRightInsetPx(0);
    }
    window.addEventListener("todo-add-open", onOpen as EventListener);
    window.addEventListener("todo-add-close", onCloseAdd as EventListener);
    return () => {
      window.removeEventListener("todo-add-open", onOpen as EventListener);
      window.removeEventListener("todo-add-close", onCloseAdd as EventListener);
    };
  }, []);

  // Persist mode
  React.useEffect(() => {
    if (!rememberWidthMode) return;
    try {
      localStorage.setItem(STORAGE_KEY, isFull ? "1" : "0");
    } catch {}
  }, [isFull, rememberWidthMode]);

  // ESC to close, scroll lock when full
  React.useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onEsc);
      if (isFull) document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [open, isFull, onClose]);

  if (!open) return null;

  const fallback = [
    { id: "1", message: "Reservation #10234 has been confirmed." },
    { id: "2", message: "New support ticket from guest John Doe." },
    { id: "3", message: "Night Audit completed successfully." },
  ];
  const items = notifications.length ? notifications : fallback;

  const containerBase =
    "fixed inset-y-0 z-50 h-full flex flex-col border-l bg-background shadow-lg";
  const sizeClass = isFull
    ? "w-screen left-0 right-0 animate-in fade-in duration-150"
    : "w-[480px] max-w-[90vw] right-0 animate-in slide-in-from-right duration-200";

  // We control 'right' via inline style to allow shifting left by rightInsetPx
  // When full, we still shift the panel left so the add drawer sits on top (visual hint).
  const style: React.CSSProperties = isFull
    ? { right: rightInsetPx, left: 0 }
    : { right: rightInsetPx };

  return (
    <div
      className={`${containerBase} ${sizeClass}`}
      style={style}
      role="complementary"
      aria-label="Right drawer"
    >
      <header className="flex items-center justify-between h-14 lg:h-[60px] border-b px-4">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold">{title}</span>
          <span className="text-[11px] text-muted-foreground">
            {isFull ? "Full width" : "Compact"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* {rightActions} */}

          {/* Width toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFull((v) => !v)}
            className="gap-2"
            title={isFull ? "Exit full width" : "Go full width"}
            aria-label={isFull ? "Exit full width" : "Go full width"}
          >
            {isFull ? (
              <>
                <Minimize2 className="h-4 w-4" />
                Compact
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                Full
              </>
            )}
          </Button>

          {items.length > 0 && onClearAll && !children && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-xs"
            >
              Clear all
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-2 text-sm">
        {children ? (
          children
        ) : (
          <>
            {items.map((n, idx) =>
              renderItem ? (
                <React.Fragment key={n.id ?? idx}>
                  {renderItem(n, idx)}
                </React.Fragment>
              ) : (
                <div
                  key={n.id ?? idx}
                  className="p-3 border rounded-md shadow-sm bg-muted"
                >
                  {n.title && <div className="font-medium mb-1">{n.title}</div>}
                  <div>{n.message}</div>
                  {n.createdAt && (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )
            )}
            {items.length === 0 && (
              <div className="p-3 text-muted-foreground text-center">
                You’re all caught up.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Status chip (looks like screenshot)
-------------------------------------------------------------------*/
function StatusBadge({ completed }: { completed: boolean }) {
  if (completed)
    return (
      <Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
        Active
      </Badge>
    );
  return (
    <Badge className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100">
      Pending
    </Badge>
  );
}

/* ------------------------------------------------------------------
   Add/Edit Drawer (over Notification Drawer)
-------------------------------------------------------------------*/
function AddTaskDrawer({
  open,
  mode,
  form,
  setForm,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  mode: "create" | "edit";
  form: {
    id: number;
    task: string;
    taskCategory: string;
    reservationId?: number | null;
    reservationDetailId?: number | null;
    finAct?: boolean;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      id: number;
      task: string;
      taskCategory: string;
      reservationId?: number | null;
      reservationDetailId?: number | null;
      finAct?: boolean;
    }>
  >;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  // Push NotificationDrawer when open
  useEffect(() => {
    if (open) {
      window.dispatchEvent(
        new CustomEvent("todo-add-open", { detail: { width: 420 } })
      );
      return () => {
        window.dispatchEvent(new Event("todo-add-close"));
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-y-0 right-0 w-[420px] max-w-[95vw] z-[60] bg-background border-l shadow-xl flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "Add task" : "Edit task"}
    >
      <div className="h-14 lg:h-[60px] border-b px-4 flex items-center justify-between">
        <div className="font-semibold">
          {mode === "create" ? "Add task" : "Edit task"}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close add task drawer"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Task</Label>
            <Textarea
              rows={4}
              value={form.task}
              onChange={(e) => setForm((p) => ({ ...p, task: e.target.value }))}
              placeholder="Describe the task…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={form.taskCategory}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, taskCategory: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="FrontOffice">FrontOffice</SelectItem>
                  <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Financial (finAct)</Label>
              <div className="flex items-center gap-2 p-2 border rounded-xl">
                <Switch
                  checked={!!form.finAct}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, finAct: !!v }))
                  }
                />
                <span className="text-sm">{form.finAct ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Reservation ID</Label>
              <Input
                type="number"
                value={form.reservationId ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    reservationId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                placeholder="e.g., 10025"
              />
            </div>
            <div className="grid gap-2">
              <Label>Reservation Detail ID</Label>
              <Input
                type="number"
                value={form.reservationDetailId ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    reservationDetailId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                placeholder="e.g., 501"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t px-4 py-3 flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={loading}>
          {mode === "create"
            ? loading
              ? "Creating…"
              : "Create"
            : loading
            ? "Saving…"
            : "Save"}
        </Button>
      </div>
    </div>
  );
}

type FormMode = "create" | "edit";

type EditPayload = {
  id: number;
  task: string;
  taskCategory: string;
  reservationId?: number | null;
  reservationDetailId?: number | null;
  finAct?: boolean;
  isTaskCompleted?: boolean;
};

export function ToDoDrawerContent() {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectToDoList);
  const status = useSelector(selectToDoListStatus);
  const creating = useSelector(selectToDoCreateStatus);
  const updating = useSelector(selectToDoUpdateStatus);
  const deleting = useSelector(selectToDoDeleteStatus);
  const currentFilters = useSelector(selectToDoListFilters);

  const [onlyOpen, setOnlyOpen] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [q, setQ] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const [mode, setMode] = useState<FormMode>("create");
  const [form, setForm] = useState<EditPayload>({
    id: 0,
    task: "",
    taskCategory: "General",
    finAct: false,
  });

  // Add/Edit Drawer visibility
  const [openAddDrawer, setOpenAddDrawer] = useState(false);

  // full board (like screenshot)
  const [showFullBoard, setShowFullBoard] = useState(false);

  // Optional: support external “Full Board” open via event
  useEffect(() => {
    const open = () => setShowFullBoard(true);
    window.addEventListener("open-todo-full-board", open);
    return () => window.removeEventListener("open-todo-full-board", open);
  }, []);

  useEffect(() => {
    const base: any = { isTaskCompleted: false };
    if (selectedDate) {
      // if your API supports date filter, add it here, e.g. base.date = ...
    }
    dispatch(setToDoListFilters(base));
    dispatch(fetchToDoTasks(base));
  }, [dispatch, selectedDate]);

  const filtered = useMemo(() => {
    let base = items;
    if (onlyOpen) base = base.filter((t) => !t.isTaskCompleted);
    if (categoryFilter !== "all")
      base = base.filter(
        (t) => (t.taskCategory || "General") === categoryFilter
      );
    if (q.trim()) {
      const lower = q.trim().toLowerCase();
      base = base.filter((t) =>
        [
          t.task,
          t.taskCategory?.toString(),
          String(t.reservationId ?? ""),
          String(t.reservationDetailId ?? ""),
        ].some((x) => x?.toLowerCase?.().includes(lower))
      );
    }
    // optional date client filter (if you have createdOn/updatedOn)
    if (selectedDate) {
      const d = selectedDate.toISOString().slice(0, 10);
      base = base.filter(
        (t) =>
          (t.createdOn || "").slice(0, 10) === d ||
          (t.updatedOn || "").slice(0, 10) === d
      );
    }
    return base;
  }, [items, onlyOpen, categoryFilter, q, selectedDate]);

  const categories = useMemo(() => {
    const set = new Set<string>(["General"]);
    items.forEach((t) => t.taskCategory && set.add(t.taskCategory));
    return Array.from(set);
  }, [items]);

  const resetForm = () =>
    setForm({ id: 0, task: "", taskCategory: "General", finAct: true });
  const openCreate = () => {
    setMode("create");
    resetForm();
    setOpenAddDrawer(true);
  };
  const openEdit = (row: any) => {
    setMode("edit");
    setForm({
      id: row.taskId,
      task: row.task,
      taskCategory: row.taskCategory || "General",
      reservationId: row.reservationId ?? undefined,
      reservationDetailId: row.reservationDetailId ?? undefined,
      finAct: row.finAct,
      isTaskCompleted: row.isTaskCompleted,
    });
    setOpenAddDrawer(true);
  };
  const closeAddDrawer = () => {
    setOpenAddDrawer(false);
    // fire close event to pull NotificationDrawer back
    window.dispatchEvent(new Event("todo-add-close"));
  };

  const reload = () => dispatch(fetchToDoTasks(currentFilters));

  const handleToggleComplete = async (row: any) => {
    const next = !row.isTaskCompleted;
    const res = await dispatch(
      updateToDoTask({
        id: row.taskId,
        changes: {
          isTaskCompleted: next,
          updatedBy: "System",
          completedBy: next ? "System" : undefined,
        },
      })
    );
    if (updateToDoTask.fulfilled.match(res)) {
      toast.success(next ? "Task completed" : "Task reopened");
      reload();
    } else {
      toast.error((res as any)?.payload || "Failed to update");
    }
  };
  const handleDelete = async (row: any) => {
    const res = await dispatch(deleteToDoTask(row.taskId));
    if (deleteToDoTask.fulfilled.match(res)) {
      toast.success("Deleted");
      reload();
    } else {
      toast.error((res as any)?.payload || "Failed to delete");
    }
  };

  const submitForm = async () => {
    if (!form.task?.trim()) {
      toast.error("Task description is required");
      return;
    }
    if (mode === "create") {
      const res = await dispatch(
        createToDoTask({
          task: form.task.trim(),
          taskCategory: form.taskCategory || "General",
          reservationId: form.reservationId || undefined,
          reservationDetailId: form.reservationDetailId || undefined,
          finAct: form.finAct ?? true,
          isTaskCompleted: false,
          createdBy: "System",
        })
      );
      if (createToDoTask.fulfilled.match(res)) {
        toast.success("Task created");
        closeAddDrawer();
        reload();
      } else {
        toast.error((res as any)?.payload || "Failed to create");
      }
    } else {
      const res = await dispatch(
        updateToDoTask({
          id: form.id,
          changes: {
            task: form.task.trim(),
            taskCategory: form.taskCategory || "General",
            reservationId: form.reservationId || undefined,
            reservationDetailId: form.reservationDetailId || undefined,
            finAct: form.finAct ?? true,
            updatedBy: "System",
          },
        })
      );
      if (updateToDoTask.fulfilled.match(res)) {
        toast.success("Task updated");
        closeAddDrawer();
        reload();
      } else {
        toast.error((res as any)?.payload || "Failed to update");
      }
    }
  };

  /* ---------------- COMPACT UI (drawer) ---------------- */
  const CompactToolbar = (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <Button variant="ghost" size="icon" onClick={reload} title="Refresh">
        <RefreshCcw className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2 px-3 py-2 border rounded-xl">
        <Search className="h-4 w-4" />
        <input
          className="bg-transparent outline-none text-sm w-[160px]"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            {selectedDate ? selectedDate.toLocaleDateString() : "Pick date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-2 px-3 py-2 border rounded-xl">
        <Filter className="h-4 w-4" />
        <Label htmlFor="openOnly" className="text-xs">
          Open only
        </Label>
        <Switch
          id="openOnly"
          checked={onlyOpen}
          onCheckedChange={setOnlyOpen}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button onClick={openCreate} className="gap-2" size="sm">
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>
    </div>
  );

  const CompactList = (
    <div className="space-y-2 overflow-auto">
      {filtered.map((row) => (
        <Card
          key={row.taskId}
          className="rounded-xl border shadow-[0_1px_6px_rgba(0,0,0,0.05)]"
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={row.isTaskCompleted}
                onCheckedChange={() => handleToggleComplete(row)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-medium truncate",
                      row.isTaskCompleted &&
                        "line-through text-muted-foreground"
                    )}
                  >
                    {row.task}
                  </span>
                  <Badge
                    variant="secondary"
                    className="rounded-full text-[10px]"
                  >
                    {row.taskCategory || "General"}
                  </Badge>
                  {row.reservationId ? (
                    <Badge
                      variant="outline"
                      className="rounded-full text-[10px]"
                    >
                      Res #{row.reservationId}
                    </Badge>
                  ) : null}
                  {row.reservationDetailId ? (
                    <Badge
                      variant="outline"
                      className="rounded-full text-[10px]"
                    >
                      Detail #{row.reservationDetailId}
                    </Badge>
                  ) : null}
                  <StatusBadge completed={row.isTaskCompleted} />
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {row.createdOn
                    ? new Date(row.createdOn).toLocaleString()
                    : ""}
                  {row.updatedOn
                    ? ` • Updated ${new Date(row.updatedOn).toLocaleString()}`
                    : ""}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(row)}
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(row)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {filtered.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-6">
          No tasks match your filters.
        </div>
      )}
    </div>
  );

  /* ---------------- FULL BOARD (wide table like screenshot) ---------------- */
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const FullBoard = (
    <Dialog open={showFullBoard} onOpenChange={setShowFullBoard}>
      <DialogContent className="max-w-[1100px] w-[95vw] p-0 overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold text-lg">Product</div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Showing</span>
            <Select value={String(pageSize)} onValueChange={() => {}}>
              <SelectTrigger className="w-[72px] h-8">
                <SelectValue defaultValue="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" /> Filter
            </Button>
            <Button variant="outline" size="sm">
              Export
            </Button>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Add New Task
            </Button>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search task, category, reservation…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {selectedDate
                    ? selectedDate.toLocaleDateString()
                    : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div className="ms-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullBoard(false)}
              >
                Close
              </Button>
            </div>
          </div>

          <Card className="rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.04)]">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[28%]">Task</TableHead>
                    <TableHead>Task ID</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Reservation</TableHead>
                    <TableHead>Detail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((row) => (
                    <TableRow key={row.taskId} className="hover:bg-muted/40">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={row.isTaskCompleted}
                            onCheckedChange={() => handleToggleComplete(row)}
                          />
                          <span
                            className={cn(
                              row.isTaskCompleted &&
                                "line-through text-muted-foreground"
                            )}
                          >
                            {row.task}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>#{row.taskId}</TableCell>
                      <TableCell>{row.taskCategory || "General"}</TableCell>
                      <TableCell>{row.reservationId ?? "-"}</TableCell>
                      <TableCell>{row.reservationDetailId ?? "-"}</TableCell>
                      <TableCell>
                        <StatusBadge completed={row.isTaskCompleted} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(row)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleComplete(row)}
                            >
                              {row.isTaskCompleted ? "Reopen" : "Mark Complete"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-rose-600"
                              onClick={() => handleDelete(row)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                  {pageItems.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-28 text-center text-muted-foreground"
                      >
                        No tasks
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* pagination like screenshot */}
              <div className="flex items-center justify-between p-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages })
                    .slice(0, 7)
                    .map((_, i) => {
                      const n = i + 1;
                      return (
                        <Button
                          key={n}
                          size="icon"
                          variant={n === page ? "default" : "outline"}
                          onClick={() => setPage(n)}
                          className="h-8 w-8"
                        >
                          {n}
                        </Button>
                      );
                    })}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="relative h-full w-full">
      {CompactToolbar}
      {CompactList}

      {/* Floating + in compact (drawer) mode */}
      <Button
        onClick={openCreate}
        className="fixed bottom-5 right-5 rounded-full h-12 w-12 shadow-xl"
      >
        <Plus className="h-5 w-5" />
      </Button>

      {FullBoard}

      {/* Add/Edit Drawer */}
      <AddTaskDrawer
        open={openAddDrawer}
        mode={mode}
        form={form}
        setForm={setForm as any}
        onClose={closeAddDrawer}
        onSubmit={submitForm}
        loading={creating === "loading" || updating === "loading"}
      />
    </div>
  );
}

/* ------------------------------------------------------------------
Usage inside DashboardLayout:

<NotificationDrawer
  open={showNotificationDrawer}
  onClose={() => setShowNotificationDrawer(false)}
  title="To-Do"
  rightActions={(
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.dispatchEvent(new CustomEvent("open-todo-full-board"))}
    >
      <ExternalLink className="h-4 w-4 mr-1" /> Full Board
    </Button>
  )}
>
  <ToDoDrawerContent />
</NotificationDrawer>

- Compact view shows in the drawer width with a floating “+”.
- Click “Full Board” (or the toolbar button) to open the wide table view.
- The **Add/Edit Task** is a right-side drawer; when it opens, the Notification drawer shifts left and stays visible beneath.
-------------------------------------------------------------------*/
