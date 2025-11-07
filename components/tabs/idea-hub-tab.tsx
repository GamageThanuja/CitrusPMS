"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SubmitIdeaDrawer from "@/components/drawers/submit-idea";
import { Badge } from "@/components/ui/badge";

export default function IdeaHubTab() {
  const ideaHubData = [
    // your idea hub entries
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary">Idea Hub</h2>
          <p className="text-sm text-muted-foreground">Feature requests</p>
        </div>
        <SubmitIdeaDrawer />
      </CardHeader>
      <CardContent>
        {/* idea hub cards */}
      </CardContent>
    </Card>
  );
}
