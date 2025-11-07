"use client"
import React from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AllReservationsTab({ bookings, viewType, renderBookingCard, renderBookingListItem, label, description, CardContainer }: any) {
  return (
    <TabsContent value="all" className="mt-4">
      <Card><br></br>
        <CardContent>
          {bookings.length > 0 ? (
            viewType === "card" ? (
              <CardContainer>
                {bookings.map((booking: any) => renderBookingCard(booking))}
              </CardContainer>
            ) : (
              renderBookingListItem()
            )
          ) : (
            <p className="text-sm text-gray-600">No reservations found.</p>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}