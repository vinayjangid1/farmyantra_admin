/**
 * Utility functions for image handling
 */

/**
 * Converts a File object to FormData for multipart upload
 * @param {File} file - The image file to convert
 * @param {string} fieldName - The field name for the file (default: 'file')
 * @returns {FormData} FormData object with the file
 */
export const convertImageToMultipart = (file, fieldName = 'file') => {
  if (!file || !(file instanceof File)) {
    throw new Error('Invalid file provided. Expected a File object.')
  }

  const formData = new FormData()
  formData.append(fieldName, file)
  return formData
}

/**
 * Validates image file type and size
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @param {number} options.maxSizeMB - Maximum file size in MB (default: 5)
 * @param {string[]} options.allowedTypes - Allowed MIME types (default: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
 * @returns {Object} { isValid: boolean, error?: string }
 */
export const validateImageFile = (file, options = {}) => {
  const { maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] } =
    options

  if (!file) {
    return { isValid: false, error: 'No file provided' }
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    }
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size too large. Maximum size: ${maxSizeMB}MB`,
    }
  }

  return { isValid: true }
}

/**
 * Creates a preview URL for an image file
 * @param {File} file - The image file
 * @returns {string} Object URL for preview
 */
export const createImagePreview = (file) => {
  if (!file || !file.type.startsWith('image/')) {
    return null
  }
  return URL.createObjectURL(file)
}

/**
 * Revokes an object URL to free memory
 * @param {string} url - The object URL to revoke
 */
export const revokeImagePreview = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}
