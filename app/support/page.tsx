"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SupportTicketsTab from "../../components/support-tabs/supportTicketsTab";
import {DashboardLayout} from "@/components/dashboard-layout";
import SupportChatTab from "../../components/support-tabs/supportChatTab";

export default function SupportPage() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-8xl mx-auto px-6 py-6">
          <Tabs defaultValue="support">
            <TabsList>
              <TabsTrigger value="chat">Support</TabsTrigger>
              <TabsTrigger value="support">Tickets</TabsTrigger>
            </TabsList>
               <TabsContent value="chat">
               <SupportChatTab />
            </TabsContent>
            <TabsContent value="support">
              <SupportTicketsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}