// types/domains/auth.ts
import { ApiResponse } from "../shared";

export interface AuthResponse {
  company_id: number
  mobile: string
  name: string
  image: string
  access_token: string
  expires_in: string
  session_id: string
  uid: number
  user_type: string
}

/** If there are specific auth endpoints returning a shaped response */
export interface AuthApiResponse extends ApiResponse<AuthResponse> {}
