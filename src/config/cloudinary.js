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

// Upload image using PHP BACKEND
export const uploadImage = async (file, folder = "users/profile-photos") => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("folder", folder);
  formData.append("upload_preset", cloudinaryConfig.uploadPreset);

  try {
    // Send to your PHP backend
    const response = await fetch("https://ecard.ccc.edu.ph/upload.php", {
      method: "POST",
      body: formData, // FormData, NOT JSON
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Upload failed");
    }

    return {
      url: data.url,
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
