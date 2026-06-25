// src/utils/imageUrl.js

export const getImageUrl = (path) => {
  if (!path) return null

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const normalizedPath = path.startsWith('/uploads/') ? path : `/uploads/${path}`
  return normalizedPath
}

export default getImageUrl