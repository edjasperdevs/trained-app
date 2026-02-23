import { SignJWT, importPKCS8 } from 'https://esm.sh/jose@5'

const APNS_PROD = 'https://api.push.apple.com'
const APNS_DEV = 'https://api.development.push.apple.com'

// Module-level JWT cache: warm Edge Function instances reuse across invocations
let cachedJWT: { token: string; expiresAt: number } | null = null

async function getAPNsJWT(): Promise<string> {
  // Reuse JWT for up to 50 minutes (APNs tokens valid for 60)
  if (cachedJWT && Date.now() < cachedJWT.expiresAt) {
    return cachedJWT.token
  }

  const keyId = Deno.env.get('APNS_KEY_ID')!
  const teamId = Deno.env.get('APNS_TEAM_ID')!
  // .p8 key stored as single-line secret with literal \n -- replace with actual newlines
  const p8Key = Deno.env.get('APNS_P8_KEY')!.replace(/\\n/g, '\n')

  const privateKey = await importPKCS8(p8Key, 'ES256')
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .sign(privateKey)

  // Cache with 50-minute expiry to avoid TooManyProviderTokenUpdates (429)
  cachedJWT = { token: jwt, expiresAt: Date.now() + 50 * 60 * 1000 }
  return jwt
}

export async function sendAPNs(
  deviceToken: string,
  payload: { title: string; body: string; data?: Record<string, string> }
): Promise<{ success: boolean; status: number }> {
  const jwt = await getAPNsJWT()
  const bundleId = Deno.env.get('APNS_BUNDLE_ID') || 'fitness.welltrained.app'
  const apnsHost = Deno.env.get('APNS_ENV') === 'development' ? APNS_DEV : APNS_PROD

  const response = await fetch(`${apnsHost}/3/device/${deviceToken}`, {
    method: 'POST',
    headers: {
      'authorization': `bearer ${jwt}`,
      'apns-topic': bundleId,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'apns-expiration': '0',
    },
    body: JSON.stringify({
      aps: {
        alert: { title: payload.title, body: payload.body },
        sound: 'default',
      },
      // data fields at TOP level (not inside aps) so they appear in notification.data on client
      ...(payload.data || {}),
    }),
  })

  return { success: response.ok, status: response.status }
}
