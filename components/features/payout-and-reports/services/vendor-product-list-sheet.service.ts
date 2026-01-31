import { get } from "@/lib/api/client"

type GenerateVendorProductListSheetResponse = {
  message?: string
  errors?: string[]
  url?: string
  status_code?: number
}

export async function generateVendorProductListSheet(): Promise<{
  url: string | null
  error: string | null
}> {
  try {
    const res = await get<GenerateVendorProductListSheetResponse>(
      "/generate_vendor_product_list_sheet"
    )

    if ((res.status_code === 200 || res.status_code === undefined) && res.url) {
      return { url: res.url, error: null }
    }

    const err =
      res.message ||
      (Array.isArray(res.errors) && res.errors.length ? res.errors[0] : null) ||
      "Failed to generate product list sheet"
    return { url: null, error: err }
  } catch (e: any) {
    return { url: null, error: e?.message || "Failed to generate product list sheet" }
  }
}


