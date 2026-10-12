/**
 * Formats a date to a readable string format
 * @param {Date|string|number} date - Date object, string, or timestamp
 * @param {string} format - Format type: 'short', 'long', 'dateOnly', 'timeOnly', or 'custom'
 * @param {string} customFormat - Custom format string (only used when format is 'custom')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'short', customFormat) => {
  let dateObj

  // Handle timestamp (number or numeric string)
  if (typeof date === 'number') {
    // Check if it's a timestamp in milliseconds (13 digits) or seconds (10 digits)
    if (date.toString().length === 13) {
      dateObj = new Date(date)
    } else if (date.toString().length === 10) {
      dateObj = new Date(date * 1000)
    } else {
      dateObj = new Date(date)
    }
  } else if (typeof date === 'string') {
    // Check if string is a numeric timestamp
    const numericValue = Number(date)
    if (!isNaN(numericValue) && date.trim() !== '') {
      // It's a numeric string, treat as timestamp
      if (date.length === 13) {
        dateObj = new Date(numericValue)
      } else if (date.length === 10) {
        dateObj = new Date(numericValue * 1000)
      } else {
        dateObj = new Date(date)
      }
    } else {
      // Regular date string
      dateObj = new Date(date)
    }
  } else {
    dateObj = date
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return 'Invalid Date'
  }

  const options = {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    dateOnly: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
    timeOnly: {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    },
  }

  if (format === 'custom' && customFormat) {
    // Simple custom format implementation
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    const hours = String(dateObj.getHours()).padStart(2, '0')
    const minutes = String(dateObj.getMinutes()).padStart(2, '0')
    const seconds = String(dateObj.getSeconds()).padStart(2, '0')

    return customFormat
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  }

  return new Intl.DateTimeFormat('en-US', options[format]).format(dateObj)
}

/**
 * Formats a date to relative time (e.g., "2 days ago", "in 3 hours")
 * @param {Date|string|number} date - Date object, string, or timestamp
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  let dateObj

  // Handle timestamp (number or numeric string)
  if (typeof date === 'number') {
    if (date.toString().length === 13) {
      dateObj = new Date(date)
    } else if (date.toString().length === 10) {
      dateObj = new Date(date * 1000)
    } else {
      dateObj = new Date(date)
    }
  } else if (typeof date === 'string') {
    // Check if string is a numeric timestamp
    const numericValue = Number(date)
    if (!isNaN(numericValue) && date.trim() !== '') {
      // It's a numeric string, treat as timestamp
      if (date.length === 13) {
        dateObj = new Date(numericValue)
      } else if (date.length === 10) {
        dateObj = new Date(numericValue * 1000)
      } else {
        dateObj = new Date(date)
      }
    } else {
      // Regular date string
      dateObj = new Date(date)
    }
  } else {
    dateObj = date
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return 'Invalid Date'
  }

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`
}

/**
 * Checks if a date is today
 * @param {Date|string|number} date - Date object, string, or timestamp
 * @returns {boolean} Boolean indicating if the date is today
 */
export const isToday = (date) => {
  let dateObj

  if (typeof date === 'number') {
    if (date.toString().length === 13) {
      dateObj = new Date(date)
    } else if (date.toString().length === 10) {
      dateObj = new Date(date * 1000)
    } else {
      dateObj = new Date(date)
    }
  } else if (typeof date === 'string') {
    dateObj = new Date(date)
  } else {
    dateObj = date
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return false
  }

  const today = new Date()
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  )
}

/**
 * Gets the start of day for a given date
 * @param {Date|string|number} date - Date object, string, or timestamp
 * @returns {Date} Date object set to start of day
 */
export const getStartOfDay = (date) => {
  let dateObj

  if (typeof date === 'number') {
    if (date.toString().length === 13) {
      dateObj = new Date(date)
    } else if (date.toString().length === 10) {
      dateObj = new Date(date * 1000)
    } else {
      dateObj = new Date(date)
    }
  } else if (typeof date === 'string') {
    dateObj = new Date(date)
  } else {
    dateObj = date
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return new Date()
  }

  const startOfDay = new Date(dateObj)
  startOfDay.setHours(0, 0, 0, 0)
  return startOfDay
}

/**
 * Gets the end of day for a given date
 * @param {Date|string|number} date - Date object, string, or timestamp
 * @returns {Date} Date object set to end of day
 */
export const getEndOfDay = (date) => {
  let dateObj

  if (typeof date === 'number') {
    if (date.toString().length === 13) {
      dateObj = new Date(date)
    } else if (date.toString().length === 10) {
      dateObj = new Date(date * 1000)
    } else {
      dateObj = new Date(date)
    }
  } else if (typeof date === 'string') {
    dateObj = new Date(date)
  } else {
    dateObj = date
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return new Date()
  }

  const endOfDay = new Date(dateObj)
  endOfDay.setHours(23, 59, 59, 999)
  return endOfDay
}

/**
 * Formats a duration in minutes into a human-readable string (e.g., "10d 2h 35min").
 * Shows days, hours, and remaining minutes as applicable.
 * @param {number} totalMinutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
export const formatDuration = (totalMinutes) => {
  if (totalMinutes == null || isNaN(totalMinutes)) return '—'
  const mins = Math.abs(Math.round(totalMinutes))

  if (mins < 60) return `${mins} min`

  const days = Math.floor(mins / 1440)
  const hours = Math.floor((mins % 1440) / 60)
  const remainingMins = mins % 60

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (remainingMins > 0) parts.push(`${remainingMins}min`)

  return parts.join(' ')
}
