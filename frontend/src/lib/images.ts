const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const CLOUDINARY_CLOUD = "di49fhgvw";

export const getProductImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return "/placeholder.png";
  
  // Cloudinary URL ពេញ
  if (imageUrl.startsWith("http")) return imageUrl;
  
  // Cloudinary path ខ្លី
  if (imageUrl.startsWith("/uploads/products/")) {
    const publicId = imageUrl.replace("/uploads/products/", "");
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/${publicId}`;
  }
  
  // Railway local path
  if (imageUrl.startsWith("/uploads")) return `${API_BASE_URL}${imageUrl}`;
  
  return imageUrl;
};