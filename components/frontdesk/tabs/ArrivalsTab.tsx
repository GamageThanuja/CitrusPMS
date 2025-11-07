"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";

export default function ArrivalsTab({
  viewType,
  renderBookingCard,
  renderBookingListItem,
  label,
  description,
  CardContainer,
  bookings, // <-- pre-filtered list from parent
}: any) {
  const hasItems = Array.isArray(bookings) && bookings.length > 0;

  return (
    <TabsContent value="arrival" className="mt-4">
      <Card>
        <CardContent className="pt-4">
          {hasItems ? (
            viewType === "card" ? (
              <CardContainer>
                {bookings.map((booking: any) => renderBookingCard(booking))}
              </CardContainer>
            ) : (
              <div className="space-y-4">{renderBookingListItem(bookings)}</div>
            )
          ) : (
            <p className="text-sm text-gray-600">No arrivals found.</p>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
