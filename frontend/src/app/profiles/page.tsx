"use client";

import { ComingSoonView } from "@/components/ComingSoonView";

export default function ProfilesPage() {
  return (
    <ComingSoonView
      title="Route 53 Profiles"
      description="Manage DNS configurations across multiple VPCs and AWS accounts."
      breadcrumbText="Profiles"
      path="/profiles"
    />
  );
}
