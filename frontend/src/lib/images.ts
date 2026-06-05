const API_BASE_URL = "http://localhost:8080";

export const getProductImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return "/placeholder.png";

  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/uploads")) {
    return `${API_BASE_URL}${imageUrl}`;
  }

  return imageUrl;
};
