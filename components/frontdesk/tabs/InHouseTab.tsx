"use client"
import React from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function InHouseTab({ bookings, viewType, renderBookingCard, renderBookingListItem, label, description, CardContainer }: any) {
  return (
    <TabsContent value="in-house" className="mt-4">
      <Card><br></br>
        <CardContent>
          {bookings.length > 0 ? (
            viewType === "card" ? (
              <CardContainer>
                {bookings.map((booking: any) => renderBookingCard(booking))}
              </CardContainer>
            ) : (
              <div className="space-y-4">
                {renderBookingListItem(
                  bookings.map((booking: any) => ({
                    ...booking,
                    name: booking.bookerFullName,
                    room: booking.roomType,
                    roomNumber: booking.roomNumber,
                    checkIn: booking.checkIN,
                    checkOut: booking.checkOUT
                  }))
                )}
              </div>
            )
          ) : (
            <p className="text-sm text-gray-600">No in-house guests found.</p>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}
