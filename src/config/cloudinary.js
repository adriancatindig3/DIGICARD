import { Cloudinary } from "@cloudinary/url-gen";

// Client-side Cloudinary config (only public keys)
const cloudinaryConfig = {
  cloudName: "df3fvlapt",
  uploadPreset: "chat-app",
};

// Initialize Cloudinary for URL generation
const cld = new Cloudinary({
  cloud: {
    cloudName: cloudinaryConfig.cloudName,
  },
});

// Unsigned upload straight to Cloudinary. The preset must allow unsigned uploads.
export const uploadImage = async (file, folder = "users/profile-photos") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", cloudinaryConfig.uploadPreset);
  if (folder) formData.append("folder", folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        data?.error?.message || data?.error || "Upload failed";
      throw new Error(message);
    }

    return {
      url: data.secure_url || data.url,
      publicId: data.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

// Generate optimized image URL
export const getOptimizedImage = (publicId, width = 800, quality = "auto") => {
  return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/w_${width},q_${quality}/${publicId}`;
};

export default cld;
