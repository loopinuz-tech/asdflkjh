import crypto from 'crypto'

export interface InpayCreatePaymentOptions {
  amount: number // in minor units (tiyin: e.g. 50,000 UZS = 5,000,000)
  currency?: string // default UZS
  description?: string
  customer?: string
  returnUrl?: string
  webhookUrl?: string
  metadata?: Record<string, any>
  idempotencyKey?: string
}

export interface InpayPaymentData {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled' | string
  checkout_url?: string
  description?: string
  metadata?: Record<string, any>
  created_at?: string
}

export interface InpayPaymentResult {
  success: boolean
  data?: InpayPaymentData
  error?: string
}

export class InpayService {
  private baseUrl: string
  private baseUrlV1: string
  private merchantId: string
  private merchantToken: string
  private testSecretKey: string
  private liveSecretKey: string
  private env: 'test' | 'live'

  constructor() {
    this.baseUrl = process.env.INPAY_BASE_URL || 'https://inpay.uz/api/v2'
    this.merchantId = process.env.INPAY_MERCHANT_ID || ''
    this.merchantToken = process.env.INPAY_MERCHANT_TOKEN || ''
    this.testSecretKey = process.env.INPAY_TEST_SECRET_KEY || ''
    this.liveSecretKey = process.env.INPAY_LIVE_SECRET_KEY || ''
    this.env = (process.env.INPAY_ENV === 'live' || (process.env.NODE_ENV === 'production' && process.env.INPAY_ENV !== 'test'))
      ? 'live'
      : 'test'
    // v1 fallback URL
    this.baseUrlV1 = process.env.INPAY_BASE_URL_V1 || 'https://inpay.uz/api/v1'
  }

  getSecretKey(): string {
    return this.env === 'live' ? this.liveSecretKey : this.testSecretKey
  }

  getMerchantId(): string {
    return this.merchantId
  }

  getMerchantToken(): string {
    return this.merchantToken
  }

  isLive(): boolean {
    return this.env === 'live'
  }

  /**
   * Create a payment intent in inPAY v2 (Stripe-style)
   * Returns checkout_url where customer completes the transaction
   */
  async createPayment(options: InpayCreatePaymentOptions): Promise<InpayPaymentResult> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/payments/`
    const idempotencyKey = options.idempotencyKey || `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const activeKey = this.getSecretKey()

    const payload: Record<string, any> = {
      amount: Math.round(options.amount),
      currency: options.currency || 'UZS',
      description: options.description || 'EduFox IELTS Subscription',
    }

    if (options.customer) payload.customer = options.customer
    if (options.returnUrl) payload.return_url = options.returnUrl
    if (options.webhookUrl) payload.webhook_url = options.webhookUrl
    if (options.metadata) payload.metadata = options.metadata

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      })

      const json: any = await response.json().catch(() => null)

      if (response.ok && json?.success && json?.data) {
        return {
          success: true,
          data: json.data,
        }
      }

      console.error('inPAY v2 Create Payment error response:', json)
      const errMsg = json?.error?.message 
        || (typeof json?.error === 'string' ? json.error : null) 
        || json?.message 
        || (json?.error ? JSON.stringify(json.error) : `inPAY request failed with HTTP ${response.status}`)

      // ── Check if v2 is in maintenance — try v1 as fallback ──────────────
      const isMaintenanceErr = errMsg?.toLowerCase().includes('maintenance')
        || errMsg?.toLowerCase().includes('to\'xtatilgan')
        || errMsg?.toLowerCase().includes('texnik xizmat')
        || response.status === 503
        || response.status === 502

      if (isMaintenanceErr) {
        console.warn('[inPAY] v2 in maintenance, trying v1 fallback...')
        return await this.createPaymentV1(options)
      }

      return {
        success: false,
        error: errMsg,
      }
    } catch (err: any) {
      console.error('inPAY v2 network error during createPayment:', err)
      // On network error also try v1
      console.warn('[inPAY] v2 network error, trying v1 fallback...')
      return await this.createPaymentV1(options)
    }
  }

  /**
   * Fallback: Create payment using inPAY API v1
   * Flow: 1) GET /authorization → bearer token  2) POST /create → pay_url
   */
  private async createPaymentV1(options: InpayCreatePaymentOptions): Promise<InpayPaymentResult> {
    if (!this.merchantId || !this.merchantToken) {
      return {
        success: false,
        error: 'InPay API v2 texnik xizmat rejimida. Merchant credentials (INPAY_MERCHANT_ID, INPAY_MERCHANT_TOKEN) sozlanmagan.',
      }
    }

    const baseV1 = this.baseUrlV1.replace(/\/$/, '')

    // ── Step 1: Get bearer token ─────────────────────────────────────────────
    let bearerToken = ''
    try {
      const authUrl = `${baseV1}/authorization/?merchant_id=${encodeURIComponent(this.merchantId)}&merchant_token=${encodeURIComponent(this.merchantToken)}`
      const authRes = await fetch(authUrl, { method: 'GET' })
      const authJson: any = await authRes.json().catch(() => null)
      console.log('[inPAY v1] auth response:', JSON.stringify(authJson))

      // Try all possible response shapes
      bearerToken =
        authJson?.bearer_token ||
        authJson?.data?.token ||
        authJson?.data?.access_token ||
        authJson?.token ||
        authJson?.access_token ||
        authJson?.bearer ||
        (typeof authJson?.data === 'string' ? authJson.data : '') ||
        ''

      if (!bearerToken) {
        const authErr = authJson?.message || authJson?.error || JSON.stringify(authJson)
        return { success: false, error: `inPAY v1 auth xatosi: ${authErr}` }
      }
    } catch (err: any) {
      return { success: false, error: `inPAY v1 auth tarmoq xatosi: ${err.message}` }
    }

    // ── Step 2: Create payment ────────────────────────────────────────────────
    try {
      const idempotencyKey = options.idempotencyKey || `fox_${Date.now()}`
      const payload: Record<string, any> = {
        merchant_id: Number(this.merchantId),
        token: this.merchantToken,
        amount: Math.round(options.amount),
        description: options.description || 'EduFox IELTS Subscription',
      }
      if (options.returnUrl) payload.callback_url = options.returnUrl
      if (options.metadata?.user_phone) payload.phone = options.metadata.user_phone

      const createRes = await fetch(`${baseV1}/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const createJson: any = await createRes.json().catch(() => null)
      console.log('[inPAY v1] create response:', createJson)

      const payUrl =
        createJson?.data?.pay_url ||
        createJson?.data?.payment_url ||
        createJson?.data?.checkout_url ||
        createJson?.pay_url ||
        createJson?.payment_url ||
        createJson?.checkout_url

      const orderId =
        createJson?.data?.order_id ||
        createJson?.order_id ||
        idempotencyKey

      if (createRes.ok && payUrl) {
        return {
          success: true,
          data: {
            id: orderId,
            amount: Math.round(options.amount),
            currency: options.currency || 'UZS',
            status: 'pending',
            checkout_url: payUrl,
          },
        }
      }

      const errMsg = createJson?.message || createJson?.error || `inPAY v1 create HTTP ${createRes.status}`
      return { success: false, error: errMsg }
    } catch (err: any) {
      return {
        success: false,
        error: `inPAY v1 network error: ${err.message}`,
      }
    }
  }

  /**
   * Retrieve payment status by ID (e.g. pay_...)
   */
  async getPayment(paymentId: string): Promise<InpayPaymentResult> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/payments/?id=${encodeURIComponent(paymentId)}`
    const activeKey = this.getSecretKey()

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${activeKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json: any = await response.json().catch(() => null)

      if (response.ok && json?.success && json?.data) {
        return {
          success: true,
          data: json.data,
        }
      }

      const errDetail = json?.error?.message 
        || (typeof json?.error === 'string' ? json.error : null) 
        || json?.message 
        || (json?.error ? JSON.stringify(json.error) : 'Failed to retrieve payment')

      return {
        success: false,
        error: errDetail,
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network communication error with inPAY',
      }
    }
  }

  /**
   * Verify HMAC-SHA256 signature for incoming webhooks
   * Header format: X-Inpay-Signature: t=1727438400,v1=a1b2c3...
   */
  verifyWebhookSignature(signatureHeader: string | undefined, rawBody: string | Buffer): boolean {
    if (!signatureHeader) return false

    const match = signatureHeader.match(/t=(\d+),v1=([a-f0-9]+)/i)
    if (!match) return false

    const timestamp = match[1]
    const expectedSig = match[2].toLowerCase()
    const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8')

    // Try verifying against merchant token, live key and test key
    const candidateSecrets = [
      this.merchantToken,
      this.liveSecretKey,
      this.testSecretKey,
    ].filter(Boolean)

    for (const secret of candidateSecrets) {
      const calculated = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${bodyStr}`)
        .digest('hex')
        .toLowerCase()

      try {
        if (crypto.timingSafeEqual(Buffer.from(calculated, 'utf8'), Buffer.from(expectedSig, 'utf8'))) {
          return true
        }
      } catch {
        // Buffer length mismatch
      }
    }

    return false
  }
}

export const inpayService = new InpayService()
