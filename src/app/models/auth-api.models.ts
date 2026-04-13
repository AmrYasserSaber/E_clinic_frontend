/** Shapes returned by Django / DRF auth endpoints. */

export interface UserMeApi {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  groups: string[];
}

/** GET/PATCH /api/patients/me/ (PatientMeReadSerializer). */
export interface PatientProfileApi {
  emergency_contact_name: string;
  emergency_contact_phone: string;
  address: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface PatientMeApi extends UserMeApi {
  profile: PatientProfileApi | null;
}

export interface LoginApiResponse {
  user: UserMeApi;
  access_token: string;
  refresh_token: string;
}

export interface TokenRefreshApiResponse {
  access: string;
  refresh?: string;
}

export interface SignupPendingApiResponse {
  user: UserMeApi;
  detail: string;
  is_approved: false;
}

export interface SignupWithTokensApiResponse {
  user: UserMeApi;
  access_token: string;
  refresh_token: string;
}

export type SignupApiResponse = SignupPendingApiResponse | SignupWithTokensApiResponse;

export function isSignupWithTokens(
  response: SignupApiResponse,
): response is SignupWithTokensApiResponse {
  return 'access_token' in response && Boolean(response.access_token);
}
