import { useState } from "react";

// Cloudinary upload response interface
export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

export const useVideoUpload = () => {
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const uploadVideoToCloudinary = (file: File): Promise<CloudinaryUploadResponse> => {
    return new Promise((resolve, reject) => {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_PRESET;

      if (!cloudName || !uploadPreset) {
        reject(new Error("Missing Cloudinary env variables"));
        return;
      }

      const url = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(percent);
        }
      });

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve({
            secure_url: response.secure_url,
            public_id: response.public_id,
          });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during upload"));
      };

      xhr.send(formData);
    });
  };

  const uploadVideo = async (file: File): Promise<CloudinaryUploadResponse | null> => {
    setProgress(0);
    setError(null);
    setIsUploading(true);

    if (!file.type.startsWith("video/")) {
      setError("Invalid file type. Please upload a video.");
      setIsUploading(false);
      return null;
    }

    try {
      // Step 1: Upload video to Cloudinary
      const uploadedData = await uploadVideoToCloudinary(file);
      setProgress(100);
      setIsUploading(false);
      return uploadedData;
    } catch (err: any) {
      setError(err.message || "An error occurred during upload.");
      setIsUploading(false);
      return null;
    }
  };

  return { uploadVideo, progress, isUploading, error };
};
