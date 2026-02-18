import { GoogleAuth } from 'google-auth-library'

export async function getAuthClient() {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  return auth.getClient()
}

export async function getAccessToken(): Promise<string> {
  const client = await getAuthClient()
  const tokenResp = await client.getAccessToken()
  if (!tokenResp.token) throw new Error('No access token')
  return tokenResp.token
}
