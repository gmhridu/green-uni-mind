// worker.js - Web Worker for handling Cloudinary video uploads in the background
// This worker handles chunked uploads to improve performance and reliability

// Configuration variables that will be set when the worker is initialized
let cloudName = '';
let uploadPreset = '';
let apiKey = '';
let chunkSize = 5 * 1024 * 1024; // 5MB chunks by default

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'INIT':
      // Initialize the worker with configuration
      cloudName = payload.cloudName;
      uploadPreset = payload.uploadPreset;
      apiKey = payload.apiKey;
      if (payload.chunkSize) {
        chunkSize = payload.chunkSize;
      }
      self.postMessage({ type: 'INITIALIZED' });
      break;

    case 'UPLOAD':
      try {
        const result = await uploadVideoWithChunks(payload.file, payload.options);
        self.postMessage({ type: 'UPLOAD_COMPLETE', result });
      } catch (error) {
        self.postMessage({ type: 'UPLOAD_ERROR', error: error.message });
      }
      break;

    default:
      self.postMessage({ type: 'ERROR', message: 'Unknown command' });
  }
});

/**
 * Upload a video file to Cloudinary using direct upload (not chunked)
 * @param {File} file - The video file to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Cloudinary response
 */
async function uploadVideoWithChunks(file, options = {}) {
  // Use the standard upload API instead of chunked upload to avoid CORS issues
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('resource_type', 'video');

  // Add adaptive streaming options
  formData.append('streaming_profile', 'hd'); // Use Cloudinary's HD streaming profile

  // Add HLS and adaptive streaming options
  if (options.adaptive) {
    // Note: both eager and eager_async are not allowed with unsigned uploads, so we've removed them
    // We'll rely on the streaming_profile parameter for adaptive streaming
  }

  // Create an XMLHttpRequest to track upload progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', url, true);

    // Set CORS headers
    xhr.withCredentials = false; // Important for CORS

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        self.postMessage({
          type: 'UPLOAD_PROGRESS',
          progress,
          bytesUploaded: event.loaded,
          totalBytes: event.total
        });
      }
    };

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        const result = JSON.parse(xhr.responseText);

        // Check if Cloudinary returned an error
        if (result.error) {
          console.error("Cloudinary error:", result.error);
          self.postMessage({
            type: 'UPLOAD_ERROR',
            error: result.error.message || 'Cloudinary upload failed'
          });
          reject(result);
          return;
        }

        // Process the result to extract different resolution URLs
        const videoResolutions = processVideoResolutions(result);

        resolve({
          ...result,
          videoResolutions
        });
      } else {
        // Try to parse the error response
        let errorMessage = `Upload failed with status ${xhr.status}`;
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          if (errorResponse.error && errorResponse.error.message) {
            errorMessage = errorResponse.error.message;
          }
          self.postMessage({ type: 'UPLOAD_ERROR', error: errorMessage });
          reject(errorResponse);
        } catch (e) {
          // If we can't parse the response, just use the status
          self.postMessage({ type: 'UPLOAD_ERROR', error: errorMessage });
          reject(new Error(errorMessage));
        }
      }
    };

    xhr.onerror = function() {
      reject(new Error('Network error during upload'));
    };

    xhr.send(formData);
  });
}

/**
 * Process Cloudinary response to extract different resolution URLs
 * @param {Object} result - Cloudinary upload response
 * @returns {Array} - Array of video resolutions
 */
function processVideoResolutions(result) {
  const resolutions = [];

  // Add the original URL
  resolutions.push({
    url: result.secure_url,
    quality: 'original',
    format: result.format
  });

  // With unsigned uploads, we can't use eager transformations
  // Instead, we'll manually create URLs for different resolutions using Cloudinary's URL transformation API

  // Extract base URL and public ID for transformations
  const baseUrlRoot = result.secure_url.split('/upload/')[0];
  const publicId = result.public_id;
  const format = result.format;

  // Add HLS URL if streaming_profile was used
  const hlsUrl = `${baseUrlRoot}/upload/sp_hd/${publicId}.m3u8`;
  resolutions.push({
    url: hlsUrl,
    quality: 'adaptive',
    format: 'hls'
  });

  // Add derived URLs for different resolutions
  // These URLs are constructed using Cloudinary's transformation parameters
  const baseUrl = `${baseUrlRoot}/upload/`;

  // Common resolutions
  const qualities = [
    { name: '1080p', height: 1080 },
    { name: '720p', height: 720 },
    { name: '480p', height: 480 },
    { name: '360p', height: 360 }
  ];

  qualities.forEach(quality => {
    resolutions.push({
      url: `${baseUrl}h_${quality.height}/${publicId}.${format}`,
      quality: quality.name,
      format
    });
  });

  return resolutions;
}
