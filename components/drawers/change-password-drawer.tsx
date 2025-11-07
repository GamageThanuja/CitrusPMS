import { useDispatch, useSelector } from "react-redux";
import {
  updatePassword,
  resetUpdatePasswordState,
  selectUpdatePasswordLoading,
  selectUpdatePasswordError,
  selectUpdatePasswordSuccess,
} from "@/redux/slices/updatePasswordSlice";
import { Eye, EyeOff, KeyRound, Shield } from "lucide-react";
// shadcn ui
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

export function ChangePasswordDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const dispatch = useDispatch<any>();

  // Prefill email from localStorage (fallback blank)
  const defaultEmail =
    (typeof window !== "undefined" && localStorage.getItem("email")) || "";

  const loading = useSelector(selectUpdatePasswordLoading);
  const error = useSelector(selectUpdatePasswordError);
  const success = useSelector(selectUpdatePasswordSuccess);

  const [email, setEmail] = useState<string>(defaultEmail ?? "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (!open) {
      // reset form & slice when drawer closes
      setEmail(defaultEmail ?? "");
      setOldPassword("");
      setNewPassword("");
      dispatch(resetUpdatePasswordState());
      setShowOld(false);
      setShowNew(false);
    }
  }, [open]);

  // simple strength hint
  const strength = (() => {
    let s = 0;
    if (newPassword.length >= 8) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[a-z]/.test(newPassword)) s++;
    if (/\d/.test(newPassword)) s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    return s;
  })();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await dispatch(
      updatePassword({ email, oldPassword, newPassword })
    );
    if (updatePassword.fulfilled.match(res)) {
      // small delay so user can see “success”
      setTimeout(() => onOpenChange(false), 600);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <SheetTitle>Change Password</SheetTitle>
          </div>
          <SheetDescription>
            Update your account password. Make sure to use a strong, unique one.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cp-email">Email</Label>
            <Input
              id="cp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cp-old">Current password</Label>
            <div className="relative">
              <Input
                id="cp-old"
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.currentTarget.value)}
                required
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
                onClick={() => setShowOld((s) => !s)}
                aria-label={
                  showOld ? "Hide current password" : "Show current password"
                }
              >
                {showOld ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cp-new">New password</Label>
            <div className="relative">
              <Input
                id="cp-new"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.currentTarget.value)}
                required
                placeholder="At least 8 characters"
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
                onClick={() => setShowNew((s) => !s)}
                aria-label={showNew ? "Hide new password" : "Show new password"}
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* strength meter */}
            <div className="h-1 w-full rounded bg-muted overflow-hidden">
              <div
                className={`h-full transition-all`}
                style={{
                  width: `${(strength / 5) * 100}%`,
                  background:
                    strength <= 2
                      ? "var(--red-500, #ef4444)"
                      : strength === 3
                      ? "var(--amber-500, #f59e0b)"
                      : "var(--green-500, #22c55e)",
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Use 8+ chars with upper & lower case, numbers, and symbols.
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Password updated successfully.
            </div>
          )}

          <SheetFooter className="pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
