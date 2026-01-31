/**
 * Indian number/currency formatters
 */

/**
 * Formats a number according to Indian numbering system
 * Examples:
 * 1234 -> 1,234
 * 12345 -> 12,345
 * 123456 -> 1,23,456
 * 1234567 -> 12,34,567
 * 12345678 -> 1,23,45,678
 */
export function formatIndianNumber(num: number | string): string {
  if (num === null || num === undefined || num === "") return "0"

  const numStr = typeof num === "number" ? num.toString() : num.toString()
  const [integerPart, decimalPart] = numStr.split(".")

  // Handle the integer part with Indian comma system
  let formattedInteger = ""
  const reversedInteger = integerPart.split("").reverse().join("")

  for (let i = 0; i < reversedInteger.length; i++) {
    if (i === 3) {
      // Add comma after first 3 digits (thousands)
      formattedInteger = "," + formattedInteger
    } else if (i > 3 && (i - 3) % 2 === 0) {
      // Add comma every 2 digits after the first 3
      formattedInteger = "," + formattedInteger
    }
    formattedInteger = reversedInteger[i] + formattedInteger
  }

  // Combine with decimal part if exists
  if (decimalPart) {
    return formattedInteger + "." + decimalPart
  }

  return formattedInteger
}

/**
 * Formats currency in Indian format with ₹ symbol
 */
export function formatIndianCurrency(amount: number | string): string {
  if (amount === null || amount === undefined || amount === "") return "₹0"

  const formattedNumber = formatIndianNumber(amount)
  return `₹${formattedNumber}`
}

/**
 * Formats large numbers with Indian units (Lakh, Crore)
 */
export function formatIndianNumberWithUnits(num: number): string {
  if (num === null || num === undefined) return "₹0"

  const absNum = Math.abs(num)

  if (absNum >= 10000000) {
    // 1 Crore
    const crores = (num / 10000000).toFixed(2)
    return `₹${formatIndianNumber(crores)} Cr`
  } else if (absNum >= 100000) {
    // 1 Lakh
    const lakhs = (num / 100000).toFixed(2)
    return `₹${formatIndianNumber(lakhs)} L`
  } else if (absNum >= 1000) {
    // 1 Thousand
    const thousands = (num / 1000).toFixed(1)
    return `₹${formatIndianNumber(thousands)} K`
  } else {
    return formatIndianCurrency(num)
  }
}

/**
 * Formats count numbers in Indian format (without currency symbol)
 */
export function formatIndianCount(count: number | string): string {
  if (count === null || count === undefined || count === "") return "0"
  return formatIndianNumber(count)
}
