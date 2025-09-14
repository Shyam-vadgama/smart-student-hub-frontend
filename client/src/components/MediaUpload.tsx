import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface MediaUploadProps {
  onMediaChange: (files: File[]) => void;
  maxFiles?: number;
}

export default function MediaUpload({ onMediaChange, maxFiles = 5 }: MediaUploadProps) {
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const updatedFiles = [...mediaFiles, ...newFiles].slice(0, maxFiles);
      setMediaFiles(updatedFiles);
      onMediaChange(updatedFiles);
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = [...mediaFiles];
    updatedFiles.splice(index, 1);
    setMediaFiles(updatedFiles);
    onMediaChange(updatedFiles);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Media (Images/Videos)</label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={triggerFileInput}
          className="w-full"
        >
          Upload Media (Images/Videos)
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          Max {maxFiles} files. Supports JPG, PNG, GIF, MP4, MOV, AVI.
        </p>
      </div>

      {mediaFiles.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-medium mb-2">Selected Media:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {mediaFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-gray-500">Video</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
                <p className="text-xs text-gray-500 truncate mt-1">
                  {file.name.length > 15 ? `${file.name.substring(0, 15)}...` : file.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}