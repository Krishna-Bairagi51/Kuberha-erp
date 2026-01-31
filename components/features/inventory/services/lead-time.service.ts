import { get, post, del } from '@/lib/api/client'
import { ensureAuthSession } from '@/lib/api/helpers/auth'
import { wrapAndThrow } from '@/lib/api/error'

export interface LeadTimeTemplateApi {
  id: number
  name: string
  manufacture_lead_time: Array<{
    start_qty: number
    end_qty: number
    lead_time: number
    lead_time_unit: string
  }>
}

export interface LeadTimeTemplateResponse {
  status_code: number
  record: LeadTimeTemplateApi[]
}

export async function getLeadTimeTemplates(): Promise<LeadTimeTemplateResponse> {
  try {
    ensureAuthSession()
    return await get<LeadTimeTemplateResponse>(
      '/get_lead_template',
      undefined,
      { cookieSession: true }
    )
  } catch (err) {
    wrapAndThrow(err)
  }
}

export async function deleteLeadTimeTemplate(id: string | number): Promise<any> {
  try {
    ensureAuthSession()
    return await del<any>(
      '/delete_lead_template',
      { id },
      { cookieSession: true }
    )
  } catch (err) {
    wrapAndThrow(err)
  }
}

export async function createLeadTimeTemplate(payload: {
  name: string
  manufacture_lead_time: Array<{
    start_qty: number
    end_qty: number
    lead_time: number
    lead_time_unit: string
  }>
}): Promise<any> {
  try {
    ensureAuthSession()
    return await post<any>(
      '/create_lead_template',
      payload,
      { cookieSession: true }
    )
  } catch (err) {
    wrapAndThrow(err)
  }
}

export const leadTimeService = {
  getLeadTimeTemplates,
  deleteLeadTimeTemplate,
  createLeadTimeTemplate,
}

