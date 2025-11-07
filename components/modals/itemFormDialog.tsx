// components/items/ItemFormDialog.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslatedText } from "@/lib/translation";
import { Category, Item, ItemForm, PosCenter } from "../itemForm";

export interface ItemFormDialogProps {
  /** controls open state from parent */
  open: boolean;
  /** close handler */
  onOpenChange: (open: boolean) => void;
  /** existing item when editing; use null for add-new */
  item: Item | null;
  /** category list for combobox */
  categories: Category[];
  /** called when manual form is submitted */
  onSaveManual: (
    item: Item,
    selectedCenters: number[],
    imageFile?: File
  ) => Promise<void> | void;
  /** optional: Excel handler (bulk import). If omitted, Excel tab stays but only logs */
  onImportExcel?: (file: File) => Promise<void> | void;
  /** optional: preloaded POS centers to avoid fetching in the form */
  posCenters?: PosCenter[];
  /** optional: label overrides */
  titleAddText?: string;
  titleEditText?: string;
}

export function ItemFormDialog({
  open,
  onOpenChange,
  item,
  categories,
  onSaveManual,
  onImportExcel,
  posCenters,
  titleAddText,
  titleEditText,
}: ItemFormDialogProps) {
  const addNewItem = useTranslatedText("Add New Item");
  const editItem = useTranslatedText("Edit Item");

  // decide title by presence of id in item
  const isAdd = !item || !item.id;
  const title = isAdd ? titleAddText ?? addNewItem : titleEditText ?? editItem;

  const [excelPreview, setExcelPreview] = React.useState<any[]>([]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual" className="mt-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="manual">Add Manual Item</TabsTrigger>
            <TabsTrigger value="excel">Import Excel</TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            {item && (
              <ItemForm
                item={item}
                categories={categories}
                posCenters={posCenters}
                onSave={onSaveManual}
                onCancel={() => onOpenChange(false)}
              />
            )}
          </TabsContent>

          <TabsContent value="excel">
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload your Excel file (.xlsx) to import categories & items.
              </p>
              <Input
                type="file"
                accept=".xlsx, .xls"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (onImportExcel) await onImportExcel(file);
                }}
              />
              {excelPreview.length > 0 && (
                <div className="overflow-auto border rounded max-h-64" />
              )}
              <Button
                variant="secondary"
                onClick={() => console.log("Import preview:", excelPreview)}
              >
                Export as JSON (check console)
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
