import React from "react";

type VideoOverlayProps = {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
};

const VideoOverlay: React.FC<VideoOverlayProps> = ({
  videoUrl,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-80 flex items-center justify-center">
      <div className="relative w-[90%] max-w-4xl bg-white rounded-xl shadow-lg p-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl"
        >
          ✕
        </button>
        <div className="aspect-w-16 aspect-video w-full overflow-hidden">
          <iframe
            className="w-full h-full rounded"
            src={videoUrl}
            title="YouTube video"
            allowFullScreen
            style={{ border: "none", overflow: "hidden" }}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoOverlay;
