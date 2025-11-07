// IPGTab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Button } from "../ui/button";
import { Card } from "antd";
import { CardContent, CardHeader, CardTitle } from "../ui/card";
import { Loader2 } from "lucide-react";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";

import { fetchHotelIPGsByHotel } from "@/redux/slices/fetchHotelIPGSlice";
import { createHotelIPG } from "@/redux/slices/createHotelIPGSlice";
import { updateHotelIPG } from "@/redux/slices/updateHotelIPGSlice";
import { deleteHotelIPG } from "@/redux/slices/deleteHotelIPGSlice";

const PROVIDERS = [
  { value: "CYBERSOURCE", label: "CyberSource" },
  { value: "PAYPAL", label: "PayPal" },
  { value: "SKRILL", label: "Skrill" },
  { value: "STRIPE", label: "Stripe" },
  { value: "GOOGLE_PAY", label: "Google Pay" },
  { value: "APPLE_PAY", label: "Apple Pay" },
] as const;

type ProviderValue = (typeof PROVIDERS)[number]["value"];

export function IPGTab({ hotelId }: { hotelId?: number }) {
  const [activeTab, setActiveTab] = useState<ProviderValue>("CYBERSOURCE");

  return (
    <div className="space-y-4">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as ProviderValue)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Payment Gateways</h3>
            <p className="text-xs text-muted-foreground">
              Configure your preferred Internet Payment Gateways per provider.
            </p>
          </div>
          <TabsList className="flex overflow-x-auto max-w-full">
            {PROVIDERS.map((p) => (
              <TabsTrigger
                key={p.value}
                value={p.value}
                className="whitespace-nowrap"
              >
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* CyberSource — your existing, fully wired form */}
        <TabsContent value="CYBERSOURCE">
          <CyberSourceSettings hotelId={hotelId} />
        </TabsContent>

        {/* Placeholders for other providers */}
        <TabsContent value="PAYPAL">
          <ProviderPlaceholder name="PayPal" />
        </TabsContent>
        <TabsContent value="SKRILL">
          <ProviderPlaceholder name="Skrill" />
        </TabsContent>
        <TabsContent value="STRIPE">
          <ProviderPlaceholder name="Stripe" />
        </TabsContent>
        <TabsContent value="GOOGLE_PAY">
          <ProviderPlaceholder name="Google Pay" />
        </TabsContent>
        <TabsContent value="APPLE_PAY">
          <ProviderPlaceholder name="Apple Pay" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** ------------------------ CYBERSOURCE (your current form) ------------------------ */
function CyberSourceSettings({ hotelId }: { hotelId?: number }) {
  const dispatch = useDispatch<any>();
  const rows = useSelector((s: RootState) => s.hotelIPGList.data);
  const loading = useSelector((s: RootState) => s.hotelIPGList.loading);
  const error = useSelector((s: RootState) => s.hotelIPGList.error);

  // If your API returns multiple IPGs, prefer the one with ipgName === 'CYBERSOURCE'
  const existing = useMemo(() => {
    if (!Array.isArray(rows)) return null;
    const byName = rows.find(
      (r: any) => (r.ipgName ?? "").toUpperCase() === "CYBERSOURCE"
    );
    return byName ?? (rows.length ? rows[0] : null);
  }, [rows]);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // form state mirrors API DTO
  const [form, setForm] = useState({
    isIPGActive: false,
    bankName: "",
    country: "",
    ipgName: "CYBERSOURCE",
    merchandIdUSD: "",
    profileIdUSD: "",
    accessKeyUSD: "",
    secretKey: "",
    merchandIdLKR: "",
    profileIdLKR: "",
    accessKeyLKR: "",
    secretKeyLKR: "",
    isSandBoxMode: false,
  });

  // Load list
  useEffect(() => {
    if (hotelId) dispatch(fetchHotelIPGsByHotel({ hotelId }));
    else dispatch(fetchHotelIPGsByHotel({}));
  }, [dispatch, hotelId]);

  // Hydrate form
  useEffect(() => {
    if (!existing) {
      setForm({
        isIPGActive: false,
        bankName: "",
        country: "",
        ipgName: "CYBERSOURCE",
        merchandIdUSD: "",
        profileIdUSD: "",
        accessKeyUSD: "",
        secretKey: "",
        merchandIdLKR: "",
        profileIdLKR: "",
        accessKeyLKR: "",
        secretKeyLKR: "",
        isSandBoxMode: false,
      });
      return;
    }
    setForm({
      isIPGActive: !!existing.isIPGActive,
      bankName: existing.bankName ?? "",
      country: existing.country ?? "",
      ipgName: (existing.ipgName ?? "CYBERSOURCE").toUpperCase(),
      merchandIdUSD: existing.merchandIdUSD ?? "",
      profileIdUSD: existing.profileIdUSD ?? "",
      accessKeyUSD: existing.accessKeyUSD ?? "",
      secretKey: existing.secretKey ?? "",
      merchandIdLKR: existing.merchandIdLKR ?? "",
      profileIdLKR: existing.profileIdLKR ?? "",
      accessKeyLKR: existing.accessKeyLKR ?? "",
      secretKeyLKR: existing.secretKeyLKR ?? "",
      isSandBoxMode: !!existing.isSandBoxMode,
    });
  }, [existing]);

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    if (!hotelId) return;
    if (!basicValid(form)) return;

    setSaving(true);
    try {
      if (!existing) {
        await dispatch(
          createHotelIPG({
            hotelId,
            isIPGActive: form.isIPGActive,
            bankName: form.bankName.trim(),
            country: form.country.trim(),
            ipgName: "CYBERSOURCE", // force provider name
            merchandIdUSD: form.merchandIdUSD.trim(),
            profileIdUSD: form.profileIdUSD.trim(),
            accessKeyUSD: form.accessKeyUSD.trim(),
            secretKey: form.secretKey.trim(),
            merchandIdLKR: form.merchandIdLKR?.trim() || undefined,
            profileIdLKR: form.profileIdLKR?.trim() || undefined,
            accessKeyLKR: form.accessKeyLKR?.trim() || undefined,
            secretKeyLKR: form.secretKeyLKR?.trim() || undefined,
            isSandBoxMode: form.isSandBoxMode,
          } as any)
        ).unwrap();
      } else {
        await dispatch(
          updateHotelIPG({
            id: existing.ipgId,
            payload: {
              isIPGActive: form.isIPGActive,
              bankName: form.bankName.trim(),
              country: form.country.trim(),
              ipgName: "CYBERSOURCE",
              merchandIdUSD: form.merchandIdUSD.trim(),
              profileIdUSD: form.profileIdUSD.trim(),
              accessKeyUSD: form.accessKeyUSD.trim(),
              secretKey: form.secretKey.trim(),
              merchandIdLKR: form.merchandIdLKR?.trim() || undefined,
              profileIdLKR: form.profileIdLKR?.trim() || undefined,
              accessKeyLKR: form.accessKeyLKR?.trim() || undefined,
              secretKeyLKR: form.secretKeyLKR?.trim() || undefined,
              isSandBoxMode: form.isSandBoxMode,
            },
          })
        ).unwrap();
      }
      setIsEditing(false);
      await dispatch(fetchHotelIPGsByHotel({ hotelId }));
    } catch (e) {
      console.error("Save IPG failed:", e);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!existing) return;
    if (!confirm("Delete this IPG configuration?")) return;
    setDeleting(true);
    try {
      await dispatch(deleteHotelIPG({ id: existing.ipgId })).unwrap();
      await dispatch(fetchHotelIPGsByHotel({ hotelId: hotelId! }));
      setIsEditing(false);
    } catch (e) {
      console.error("Delete IPG failed:", e);
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (checked: boolean) => {
    set("isIPGActive", checked);
    if (!existing) return; // will persist on create
    try {
      await dispatch(
        updateHotelIPG({
          id: existing.ipgId,
          payload: {
            ...existing,
            isIPGActive: checked,
          },
        })
      ).unwrap();
      await dispatch(fetchHotelIPGsByHotel({ hotelId: hotelId! }));
    } catch (e) {
      console.error("Toggle active failed:", e);
    }
  };

  // 🔧 Fixed: this was mistakenly updating isIPGActive earlier
  const toggleSandboxModeActive = async (checked: boolean) => {
    set("isSandBoxMode", checked);
    if (!existing) return;
    try {
      await dispatch(
        updateHotelIPG({
          id: existing.ipgId,
          payload: {
            ...existing,
            isSandBoxMode: checked,
          },
        })
      ).unwrap();
      await dispatch(fetchHotelIPGsByHotel({ hotelId: hotelId! }));
    } catch (e) {
      console.error("Toggle sandbox failed:", e);
    }
  };

  const disabled = !isEditing;

  return (
    <Card className="overflow-hidden dark:bg-black">
      <CardHeader className="py-4 dark:bg-black">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm dark:text-white">
            CyberSource — Payment Gateway Settings
          </CardTitle>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={loading}
              >
                Edit
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="dark:text-white"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={saving || !basicValid(form)}
                >
                  {saving ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Save…
                    </span>
                  ) : (
                    "Save"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 dark:text-white">
        {loading ? (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading IPG configuration…
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">Error: {error}</p>
        ) : null}

        {/* Toggles */}
        <div className="flex items-center gap-3">
          <Switch
            checked={form.isIPGActive}
            onCheckedChange={toggleActive}
            disabled={existing ? false : !isEditing}
          />
          <span className="text-sm">is IPG Active</span>
          <Badge variant={form.isIPGActive ? "default" : "secondary"}>
            {form.isIPGActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={form.isSandBoxMode}
            onCheckedChange={toggleSandboxModeActive}
            disabled={existing ? false : !isEditing}
          />
          <span className="text-sm">is Sandbox Active</span>
          <Badge variant={form.isSandBoxMode ? "default" : "secondary"}>
            {form.isSandBoxMode ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Form grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormRow
            label="IPG Bank Name"
            value={form.bankName}
            onChange={(v) => set("bankName", v)}
            placeholder="HNB"
            disabled={disabled}
          />
          <FormRow
            label="IPG Name"
            value={form.ipgName}
            onChange={(v) => set("ipgName", v)}
            placeholder="CYBERSOURCE"
            disabled // keep locked to the tab/provider
          />

          <FormRow
            label="Merchant Id USD"
            value={form.merchandIdUSD}
            onChange={(v) => set("merchandIdUSD", v)}
            disabled={disabled}
            mono
          />
          <FormRow
            label="Profile ID USD"
            value={form.profileIdUSD}
            onChange={(v) => set("profileIdUSD", v)}
            disabled={disabled}
            mono
          />
          <FormRow
            label="AccessKey USD"
            value={form.accessKeyUSD}
            onChange={(v) => set("accessKeyUSD", v)}
            disabled={disabled}
            mono
          />
          <FormRow
            label="SecretKey USD"
            value={form.secretKey}
            onChange={(v) => set("secretKey", v)}
            disabled={disabled}
            mono
            type="password"
          />

          {/* Optional LKR block */}
          <FormRow
            label="Merchant Id LKR"
            value={form.merchandIdLKR}
            onChange={(v) => set("merchandIdLKR", v)}
            disabled={disabled}
            mono
          />
          <FormRow
            label="Profile ID LKR"
            value={form.profileIdLKR}
            onChange={(v) => set("profileIdLKR", v)}
            disabled={disabled}
            mono
          />
          <FormRow
            label="AccessKey LKR"
            value={form.accessKeyLKR}
            onChange={(v) => set("accessKeyLKR", v)}
            disabled={disabled}
            mono
          />
          <FormRow
            label="SecretKey LKR"
            value={form.secretKeyLKR}
            onChange={(v) => set("secretKeyLKR", v)}
            disabled={disabled}
            mono
            type="password"
          />
        </div>

        {/* Danger zone */}
        {existing && (
          <div className="pt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </span>
              ) : (
                "Delete Configuration"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** ------------------------ Shared bits ------------------------ */
function ProviderPlaceholder({ name }: { name: string }) {
  return (
    <Card className="overflow-hidden dark:bg-black">
      <CardHeader className="py-4 dark:bg-black">
        <CardTitle className="text-sm dark:text-white">
          {name} — Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 dark:text-white">
        <p className="text-sm text-muted-foreground">
          {name} integration UI is not configured yet. You can keep CyberSource
          running while we wire this provider. If you want, I can scaffold the
          exact credential fields for {name}.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
          <FormRow
            label="API Key"
            value={""}
            onChange={() => {}}
            placeholder="—"
            disabled
          />
          <FormRow
            label="Secret"
            value={""}
            onChange={() => {}}
            placeholder="—"
            disabled
          />
        </div>
      </CardContent>
    </Card>
  );
}

function FormRow({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  mono,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  mono?: boolean;
  type?: "text" | "password";
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={!!disabled}
        className={mono ? "font-mono text-xs" : ""}
      />
    </div>
  );
}

function basicValid(f: {
  bankName: string;
  country: string;
  ipgName: string;
  merchandIdUSD: string;
  profileIdUSD: string;
  accessKeyUSD: string;
  secretKey: string;
}) {
  return (
    f.bankName.trim() &&
    f.ipgName.trim() &&
    f.merchandIdUSD.trim() &&
    f.profileIdUSD.trim() &&
    f.accessKeyUSD.trim() &&
    f.secretKey.trim()
  );
}
