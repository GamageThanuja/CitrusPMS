"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { X } from "lucide-react";

export default function SubmitIdeaDrawer() {
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    // TODO: collect form data and submit to API
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          onClick={() => setOpen(true)}
          className="bg-primary text-white text-sm px-4 rounded-md"
        >
          + Submit Idea
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-screen w-full max-w-2xl ml-auto border-l bg-background">

        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <DrawerTitle className="text-lg">Submit New Idea</DrawerTitle>
            <DrawerDescription>
              Share your feature request or improvement for the property portal.
            </DrawerDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="space-y-4 p-4">
          <div>
            <Label htmlFor="idea-title">Title</Label>
            <Input id="idea-title" placeholder="Brief idea title" />
          </div>
          <div>
            <Label htmlFor="idea-status">Status</Label>
            <Select defaultValue="Feature requests">
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Feature requests">Feature requests</SelectItem>
                <SelectItem value="Planned">Planned</SelectItem>
                <SelectItem value="Work-in-Progress">Work-in-Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="idea-content">Description</Label>
            <Textarea id="idea-content" placeholder="Explain your idea..." />
          </div>
          <div>
            <Label htmlFor="idea-author">Your Name / Property</Label>
            <Input id="idea-author" placeholder="e.g. Alex - Sunrise Villas" />
          </div>
        </div>
        <DrawerFooter className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
