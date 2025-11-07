"use client";

import { useState } from "react";
import { Edit, Filter, Globe, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslatedText } from "@/lib/translation";
import { AddChannelDrawer } from "@/components/drawers/add-channel-drawer";

export default function ChannelManagerTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  const channelsText = useTranslatedText("Channels");
  const addChannelText = useTranslatedText("Add Channel");
  const searchText = useTranslatedText("Search");
  const filterText = useTranslatedText("Filter");
  const noChannelsText = useTranslatedText("No channels found");
  const idText = useTranslatedText("ID");
  const nameText = useTranslatedText("Name");
  const typeText = useTranslatedText("Type");
  const commissionText = useTranslatedText("Commission");
  const lastSyncText = useTranslatedText("Last Sync");
  const statusText = useTranslatedText("Status");
  const actionsText = useTranslatedText("Actions");
  const connectChannelText = useTranslatedText("Connect a channel to get started");

  const [channelsData, setChannelsData] = useState([
    {
      id: "C-001",
      name: "Booking.com",
      type: "OTA",
      commission: "15%",
      status: "Connected",
      lastSync: "2023-04-14 10:30 AM",
    },
    {
      id: "C-002",
      name: "Expedia",
      type: "OTA",
      commission: "18%",
      status: "Connected",
      lastSync: "2023-04-14 09:45 AM",
    },
    {
      id: "C-003",
      name: "Airbnb",
      type: "OTA",
      commission: "12%",
      status: "Disconnected",
      lastSync: "2023-04-10 02:15 PM",
    },
  ]);

  const handleAddChannel = (data: any) => {
    const newChannel = {
      id: `C-${String(channelsData.length + 1).padStart(3, "0")}`,
      name: data.name,
      type: data.type,
      commission: data.commission,
      status: data.status,
      lastSync: "Just now",
    };
    setChannelsData([...channelsData, newChannel]);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{channelsText}</CardTitle>
        <Button onClick={() => setIsAddDrawerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {addChannelText}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`${searchText}...`}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            {filterText}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{channelsText}</CardTitle>
          </CardHeader>
          <CardContent>
            {channelsData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{idText}</TableHead>
                    <TableHead>{nameText}</TableHead>
                    <TableHead>{typeText}</TableHead>
                    <TableHead>{commissionText}</TableHead>
                    <TableHead>{lastSyncText}</TableHead>
                    <TableHead>{statusText}</TableHead>
                    <TableHead>{actionsText}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channelsData.map((channel) => (
                    <TableRow key={channel.id}>
                      <TableCell className="font-medium">{channel.id}</TableCell>
                      <TableCell>{channel.name}</TableCell>
                      <TableCell>{channel.type}</TableCell>
                      <TableCell>{channel.commission}</TableCell>
                      <TableCell>{channel.lastSync}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            channel.status === "Connected" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {channel.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Globe className="mb-2 h-10 w-10 text-muted-foreground" />
                <p className="mb-2 text-lg font-medium">{noChannelsText}</p>
                <p className="text-sm text-muted-foreground">{connectChannelText}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <AddChannelDrawer
          isOpen={isAddDrawerOpen}
          onClose={() => setIsAddDrawerOpen(false)}
          onSubmit={handleAddChannel}
        />
      </CardContent>
    </Card>
  );
}
