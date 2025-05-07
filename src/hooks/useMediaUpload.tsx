import { useState } from "react";

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  duration?: number;
  playback_url?: string;
}

interface CloudinaryDeleteResponse {
  result: string;
}

type MediaType = "image" | "video" | "raw";

export const useMedia = () => {
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_PRESET;
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;

  if (!cloudName || !uploadPreset || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary environment variables");
  }

  const deleteFromCloudinary = async (publicId: string): Promise<CloudinaryDeleteResponse> => {
    const timestamp = Date.now();
    const signature = await generateSignature(publicId, timestamp);
    
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;
    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("signature", signature);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete media: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error("Error deleting media:", err);
      throw new Error("Failed to delete old media file");
    }
  };

  const generateSignature = async (publicId: string, timestamp: number): Promise<string> => {
    // In a real app, you should generate this signature on your backend
    // This is a simplified version for demonstration
    const message = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const uploadToCloudinary = (
    file: File,
    resourceType: MediaType
  ): Promise<CloudinaryUploadResponse> => {
    return new Promise((resolve, reject) => {
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      // Only add resource_type for videos
      if (resourceType === 'video') {
        formData.append("resource_type", "video");
      }

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
            duration: response.duration,
            playback_url: response.playback_url
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

  const uploadMedia = async (
    file: File,
    oldPublicId?: string
  ): Promise<CloudinaryUploadResponse | null> => {
    setProgress(0);
    setError(null);
    setIsUploading(true);

    try {
      // Determine resource type based on file MIME type
      let resourceType: MediaType = "raw"; // Default for PDF and other files
      if (file.type.startsWith("image/")) {
        resourceType = "image";
      } else if (file.type.startsWith("video/")) {
        resourceType = "video";
      }

      // Step 1: Delete old media if exists
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId);
          console.log("Old media deleted successfully");
        } catch (deleteError) {
          console.warn("Failed to delete old media, proceeding with upload:", deleteError);
          // Continue with upload even if deletion fails
        }
      }

      // Step 2: Upload new media
      const uploadedData = await uploadToCloudinary(file, resourceType);
      setProgress(100);
      setIsUploading(false);
      return uploadedData;
    } catch (err: any) {
      setError(err.message || "An error occurred during upload.");
      setIsUploading(false);
      return null;
    }
  };

  return { uploadMedia, progress, isUploading, error };
};