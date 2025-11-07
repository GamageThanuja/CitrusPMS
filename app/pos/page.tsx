"use client";

import dynamic from "next/dynamic";

const POSPage = dynamic(() => import("../../components/pos/posPage/posPage"), {
  ssr: false,
});

export default function Page() {
  return <POSPage />;
}
