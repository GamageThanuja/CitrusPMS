"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslatedText } from "@/lib/translation"
import { Bell, Calendar, CreditCard, Mail, MessageSquare, Settings, User } from "lucide-react"

export default function NotificationsPage() {
  // Notification preferences state
  const [preferences, setPreferences] = useState({
    email: {
      bookings: true,
      marketing: false,
      system: true,
      security: true,
    },
    push: {
      bookings: true,
      marketing: true,
      system: false,
      security: true,
    },
  })

  // Sample notification history
  const notifications = [
    {
      id: "notif-1",
      title: "New Booking",
      description: "John Smith booked Room 101 for May 15-18, 2025",
      time: "2 hours ago",
      read: false,
      icon: Calendar,
      category: "bookings",
    },
    {
      id: "notif-2",
      title: "Payment Received",
      description: "Payment of $450.00 received for booking #B-1001",
      time: "Yesterday",
      read: true,
      icon: CreditCard,
      category: "payments",
    },
    {
      id: "notif-3",
      title: "System Update",
      description: "Hotel Mate has been updated to version 2.5.0",
      time: "3 days ago",
      read: true,
      icon: Settings,
      category: "system",
    },
    {
      id: "notif-4",
      title: "New Message",
      description: "You have a new message from Sarah Johnson",
      time: "1 week ago",
      read: true,
      icon: MessageSquare,
      category: "messages",
    },
    {
      id: "notif-5",
      title: "Account Security",
      description: "Your password was changed successfully",
      time: "2 weeks ago",
      read: true,
      icon: User,
      category: "security",
    },
  ]

  // Handle preference toggle
  const handleToggle = (channel: "email" | "push", type: string, value: boolean) => {
    setPreferences({
      ...preferences,
      [channel]: {
        ...preferences[channel],
        [type]: value,
      },
    })
  }

  // Translations
  const notificationsText = useTranslatedText("Notifications")
  const preferencesText = useTranslatedText("Preferences")
  const historyText = useTranslatedText("History")
  const emailNotificationsText = useTranslatedText("Email Notifications")
  const pushNotificationsText = useTranslatedText("Push Notifications")
  const bookingsText = useTranslatedText("Bookings and Reservations")
  const marketingText = useTranslatedText("Marketing and Promotions")
  const systemText = useTranslatedText("System Updates")
  const securityText = useTranslatedText("Security Alerts")
  const markAllAsReadText = useTranslatedText("Mark All as Read")
  const clearAllText = useTranslatedText("Clear All")
  const noNotificationsText = useTranslatedText("No notifications")
  const youreAllCaughtUpText = useTranslatedText("You're all caught up!")

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{notificationsText}</h1>

        <Tabs defaultValue="preferences" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="preferences">{preferencesText}</TabsTrigger>
            <TabsTrigger value="history">{historyText}</TabsTrigger>
          </TabsList>

          <TabsContent value="preferences" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{emailNotificationsText}</CardTitle>
                <CardDescription>{useTranslatedText("Manage your email notification preferences")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="email-bookings" className="flex-1">
                      {bookingsText}
                    </Label>
                  </div>
                  <Switch
                    id="email-bookings"
                    checked={preferences.email.bookings}
                    onCheckedChange={(value) => handleToggle("email", "bookings", value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="email-marketing" className="flex-1">
                      {marketingText}
                    </Label>
                  </div>
                  <Switch
                    id="email-marketing"
                    checked={preferences.email.marketing}
                    onCheckedChange={(value) => handleToggle("email", "marketing", value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="email-system" className="flex-1">
                      {systemText}
                    </Label>
                  </div>
                  <Switch
                    id="email-system"
                    checked={preferences.email.system}
                    onCheckedChange={(value) => handleToggle("email", "system", value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="email-security" className="flex-1">
                      {securityText}
                    </Label>
                  </div>
                  <Switch
                    id="email-security"
                    checked={preferences.email.security}
                    onCheckedChange={(value) => handleToggle("email", "security", value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{pushNotificationsText}</CardTitle>
                <CardDescription>{useTranslatedText("Manage your push notification preferences")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="push-bookings" className="flex-1">
                      {bookingsText}
                    </Label>
                  </div>
                  <Switch
                    id="push-bookings"
                    checked={preferences.push.bookings}
                    onCheckedChange={(value) => handleToggle("push", "bookings", value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="push-marketing" className="flex-1">
                      {marketingText}
                    </Label>
                  </div>
                  <Switch
                    id="push-marketing"
                    checked={preferences.push.marketing}
                    onCheckedChange={(value) => handleToggle("push", "marketing", value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="push-system" className="flex-1">
                      {systemText}
                    </Label>
                  </div>
                  <Switch
                    id="push-system"
                    checked={preferences.push.system}
                    onCheckedChange={(value) => handleToggle("push", "system", value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="push-security" className="flex-1">
                      {securityText}
                    </Label>
                  </div>
                  <Switch
                    id="push-security"
                    checked={preferences.push.security}
                    onCheckedChange={(value) => handleToggle("push", "security", value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{historyText}</CardTitle>
                  <CardDescription>{useTranslatedText("Your recent notifications")}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    {markAllAsReadText}
                  </Button>
                  <Button variant="outline" size="sm">
                    {clearAllText}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex gap-4 p-4 rounded-lg ${notification.read ? "" : "bg-muted"}`}
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${notification.read ? "bg-muted" : "bg-primary/10"}`}
                        >
                          <notification.icon
                            className={`h-5 w-5 ${notification.read ? "text-muted-foreground" : "text-primary"}`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">{notification.title}</h4>
                            <span className="text-xs text-muted-foreground">{notification.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bell className="mb-2 h-10 w-10 text-muted-foreground" />
                    <p className="mb-2 text-lg font-medium">{noNotificationsText}</p>
                    <p className="text-sm text-muted-foreground">{youreAllCaughtUpText}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

