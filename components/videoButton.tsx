import React from "react";
import { Button } from "@/components/ui/button";
import { Youtube } from "lucide-react";

type VideoButtonProps = {
  onClick: () => void;
  label: string;
};

const VideoButton: React.FC<VideoButtonProps> = ({ onClick, label }) => {
  return (
    <div className="relative w-10 h-10 ">
      <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping"></span>
      <Button
        variant="ghost"
        onClick={onClick}
        className="p-0 w-10 h-10 relative z-10 hover:bg-inherit"
      >
        <Youtube className="w-6 h-6 object-contain dark:invert" />
      </Button>
    </div>
  );
};

export default VideoButton;
