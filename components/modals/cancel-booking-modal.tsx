// "use client"

// import { useEffect, useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import { Input } from "@/components/ui/input"

// interface CancelBookingModalProps {
//   open: boolean
//   onClose: () => void
//   booking: {
//     reservationDetailID: number
//     reservationNo?: string
//   } | null
//   onConfirm: (reason: string) => void
// }

// export function CancelBookingModal({ open, onClose, booking, onConfirm }: CancelBookingModalProps) {
//   const [reason, setReason] = useState("")

//   useEffect(() => {
//     if (open) setReason("")
//   }, [open])

//   if (!open || !booking) return null

//   return (
//     <></>
//   )
// }