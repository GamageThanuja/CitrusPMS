"use client"
import React from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TentativeTab({ bookings, viewType, renderBookingCard, renderBookingListItem, label, description, CardContainer }: any) {
  return (
    <TabsContent value="tentative" className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle>{label}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length > 0 ? (
            viewType === "card" ? (
              <CardContainer>
                {bookings.map((booking: any) => renderBookingCard(booking))}
              </CardContainer>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking: any) => renderBookingListItem(booking))}
              </div>
            )
          ) : (
            <p className="text-sm text-gray-600">No tentative bookings found.</p>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}
