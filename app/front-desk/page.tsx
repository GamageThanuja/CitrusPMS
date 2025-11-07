"use client";

import dynamic from "next/dynamic";

const FrontDeskPage = dynamic(
  () => import("../../components/frontdesk/page/frontdeskPage"),
  { ssr: false }
);

export default function Page() {
  return <FrontDeskPage />;
}
