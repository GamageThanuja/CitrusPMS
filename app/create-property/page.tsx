import CreatePropertyFlow from "@/components/create-property-flow";
import { Suspense } from "react";

export default function CreatePropertyPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-600">Loading…</div>}>
      <CreatePropertyFlow />
    </Suspense>
  );
}
