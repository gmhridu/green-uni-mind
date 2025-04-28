// src/utils/cloudinaryUpload.ts

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

export const uploadVideo = (): Promise<CloudinaryUploadResponse> => {
  return new Promise((resolve, reject) => {
    // Check if the Cloudinary widget is loaded
    if (!window.cloudinary) {
      reject(new Error("Cloudinary widget is not loaded"));
      return;
    }

    // Get environment variables
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_PRESET;

    if (!cloudName || !uploadPreset) {
      reject(new Error("Cloudinary environment variables are missing"));
      return;
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        resourceType: "video",
        sources: ["local", "url", "camera"],
        chunkSize: 6 * 1024 * 1024, // 6MB per chunk
        eager: [{ width: 640, height: 360, crop: "limit", quality: "auto" }],
        multiple: false, // Allow only 1 video upload at a time
        maxFileSize: 500 * 1024 * 1024, // 500MB (optional)
      },
      (error: any, result: any) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          reject(error);
          return;
        }

        if (result.event === "success") {
          console.log("Upload Success:", result.info);
          resolve({
            secure_url: result.info.secure_url,
            public_id: result.info.public_id,
          });
        }
      }
    );

    widget.open();
  });
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};
