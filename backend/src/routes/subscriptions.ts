import { Router, Request, Response } from 'express'
import { query } from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'
import { inpayService } from '../services/inpay.js'

const router = Router()

// 1. GET CURRENT USER SUBSCRIPTION STATUS
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id

    const result = await query(
      `SELECT s.*, pl.name as plan_name, pl.slug as plan_slug, pl.price as plan_price, pl.interval as plan_interval, pl.features as plan_features
       FROM subscriptions s
       LEFT JOIN plans pl ON pl.id = s.plan_id
       WHERE s.user_id = $1 AND s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [userId]
    )

    const activeSubscription = result.rows[0] || null

    let daysRemaining: number | null = null
    if (activeSubscription?.expires_at) {
      const diffMs = new Date(activeSubscription.expires_at).getTime() - Date.now()
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    }

    return res.json({
      success: true,
      has_active_subscription: !!activeSubscription,
      is_premium: req.user!.role === 'admin' || !!activeSubscription,
      subscription: activeSubscription,
      days_remaining: daysRemaining,
    })
  } catch (error: any) {
    console.error('Fetch subscription error:', error)
    return res.status(500).json({ error: 'Failed to fetch subscription' })
  }
})

// Helper: Calculate Coupon Discount
async function calculateCouponDiscount(couponCode: string, plan: any) {
  if (!couponCode || !couponCode.trim()) return null
  const code = couponCode.trim().toUpperCase()
  const couponRes = await query(
    `SELECT * FROM coupons WHERE UPPER(code) = $1 AND is_active = true`,
    [code]
  )
  const coupon = couponRes.rows[0]
  if (!coupon) {
    return { valid: false, error: 'Coupon code not found or inactive' }
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, error: 'Coupon code has expired' }
  }
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return { valid: false, error: 'Coupon usage limit has been reached' }
  }

  const origUsd = plan.price / 100
  let discountUsd = 0
  if (coupon.discount_type === 'percentage') {
    discountUsd = (origUsd * Number(coupon.discount_value)) / 100
  } else if (coupon.discount_type === 'fixed_usd') {
    discountUsd = Number(coupon.discount_value)
  } else if (coupon.discount_type === 'fixed_uzs') {
    discountUsd = Number(coupon.discount_value) / 12800
  }

  discountUsd = Math.min(origUsd, Math.max(0, discountUsd))
  const finalUsd = Math.max(0, origUsd - discountUsd)
  const finalUzs = Math.max(1000, Math.round(finalUsd * 12800))
  const origUzs = Math.max(1000, Math.round(origUsd * 12800))

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
    },
    originalPriceUsd: origUsd,
    finalPriceUsd: finalUsd,
    originalPriceUzs: origUzs,
    finalPriceUzs: finalUzs,
    discountUsd,
  }
}

// 1.5. VALIDATE PROMO COUPON
router.post('/validate-coupon', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { code, planId } = req.body
    if (!code || !planId) {
      return res.status(400).json({ error: 'Coupon code and plan ID are required' })
    }

    const planRes = await query('SELECT * FROM plans WHERE id = $1', [planId])
    const plan = planRes.rows[0]
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' })
    }

    const discountInfo = await calculateCouponDiscount(code, plan)
    if (!discountInfo || !discountInfo.valid) {
      return res.status(400).json({
        valid: false,
        error: discountInfo?.error || 'Invalid or expired coupon code',
      })
    }

    return res.json({
      success: true,
      ...discountInfo,
    })
  } catch (error: any) {
    console.error('Validate coupon error:', error)
    return res.status(500).json({ error: 'Error validating coupon code' })
  }
})

// 2. CREATE INPAY V2 PAYMENT INTENT / CHECKOUT
router.post('/checkout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { planId, phone, notes, couponCode } = req.body

    const planRes = await query('SELECT * FROM plans WHERE id = $1', [planId])
    const plan = planRes.rows[0]
    if (!plan) {
      return res.status(404).json({ error: 'Selected subscription plan not found' })
    }

    const usdPrice = plan.price / 100
    // Standard exchange rate: 1 USD = 12,800 UZS (minimum 1,000 UZS)
    let uzsPrice = Math.max(1000, Math.round(usdPrice * 12800))
    let appliedCoupon: any = null

    // Check & apply promo coupon if supplied
    if (couponCode && couponCode.trim()) {
      const discountCalc = await calculateCouponDiscount(couponCode, plan)
      if (discountCalc && discountCalc.valid && discountCalc.finalPriceUzs !== undefined) {
        uzsPrice = discountCalc.finalPriceUzs
        appliedCoupon = discountCalc.coupon
        // Increment coupon used count
        await query('UPDATE coupons SET used_count = used_count + 1, updated_at = NOW() WHERE id = $1', [appliedCoupon.id])
      }
    }

    // inPAY amount is in direct UZS (integer so'm)
    const inpayAmount = Math.round(uzsPrice)

    // Fetch user details for metadata
    const userRes = await query('SELECT email FROM users WHERE id = $1', [userId])
    const userEmail = userRes.rows[0]?.email || ''

    // 1. Insert pending payment record
    const paymentRes = await query(
      `INSERT INTO payments (user_id, amount, currency, status, provider, metadata)
       VALUES ($1, $2, $3, 'pending', 'inpay', $4)
       RETURNING id, amount, currency, status, provider, created_at`,
      [
        userId,
        uzsPrice,
        'UZS',
        JSON.stringify({
          plan_id: plan.id,
          plan_slug: plan.slug,
          plan_name: plan.name,
          plan_interval: plan.interval,
          price_usd: usdPrice,
          price_uzs: uzsPrice,
          coupon_code: appliedCoupon?.code || null,
          coupon_id: appliedCoupon?.id || null,
          user_email: userEmail,
          user_phone: phone || null,
          notes: notes || null,
        }),
      ]
    )

    const payment = paymentRes.rows[0]
    const orderNumber = payment.id.substring(0, 8).toUpperCase()

    // Determine host URLs for redirect and webhook
    // FRONTEND_PUBLIC_URL takes priority, otherwise find first non-localhost URL
    const frontendBaseUrl = (() => {
      if (process.env.FRONTEND_PUBLIC_URL) return process.env.FRONTEND_PUBLIC_URL.replace(/\/$/, '')
      const urls = (process.env.FRONTEND_URL || '').split(',').map(u => u.trim())
      const prod = urls.find(u => u && !u.includes('localhost') && !u.includes('127.0.0.1'))
      return (prod || 'https://edufox.uz').replace(/\/$/, '')
    })()
    const apiBaseUrl = (
      process.env.BACKEND_PUBLIC_URL || 'https://edufox-backend.onrender.com'
    ).replace(/\/$/, '')

    // 2. Call inPAY API v2 to create payment session
    const inpayRes = await inpayService.createPayment({
      amount: inpayAmount,
      currency: 'UZS',
      description: `EduFox IELTS ${plan.name} (${orderNumber})`,
      returnUrl: `${frontendBaseUrl}/premium?success=true&order=${payment.id}`,
      webhookUrl: `${apiBaseUrl}/api/subscriptions/webhook/inpay`,
      idempotencyKey: `idem_fox_${payment.id}`,
      metadata: {
        payment_id: payment.id,
        order_number: orderNumber,
        user_id: userId,
        plan_id: plan.id,
        plan_slug: plan.slug,
      },
    })

    if (!inpayRes.success || !inpayRes.data?.checkout_url) {
      console.error('Failed to create inPAY payment intent:', inpayRes.error)
      const errorDetail = typeof inpayRes.error === 'object'
        ? ((inpayRes.error as any)?.message || JSON.stringify(inpayRes.error))
        : String(inpayRes.error || 'Failed to initiate inPAY payment gateway')

      return res.status(502).json({
        error: errorDetail,
        paymentId: payment.id,
      })
    }

    // 3. Update payment with inPAY's pay_... identifier
    await query(
      `UPDATE payments 
       SET provider_payment_id = $1, 
           metadata = metadata || $2::jsonb 
       WHERE id = $3`,
      [
        inpayRes.data.id,
        JSON.stringify({
          inpay_id: inpayRes.data.id,
          checkout_url: inpayRes.data.checkout_url,
        }),
        payment.id,
      ]
    )

    return res.json({
      success: true,
      paymentId: payment.id,
      orderNumber,
      checkoutUrl: inpayRes.data.checkout_url,
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        interval: plan.interval,
        priceUsd: usdPrice,
        priceUzs: uzsPrice,
      },
      message: 'inPAY payment session initialized',
    })
  } catch (error: any) {
    console.error('Subscription checkout error:', error)
    return res.status(500).json({ error: error.message || 'Error creating payment request' })
  }
})

// 3. INPAY WEBHOOK HANDLER (supports both v1 and v2)
router.post('/webhook/inpay', async (req: Request, res: Response) => {
  try {
    const event = req.body
    console.log('[inPAY Webhook] Received:', JSON.stringify(event))

    // Optional HMAC verification (v2 only). v1 does not send HMAC.
    const sigHeader = (req.headers['x-inpay-signature'] || req.headers['X-Inpay-Signature']) as string | undefined
    if (sigHeader) {
      const rawBody = (req as any).rawBody || JSON.stringify(req.body)
      const isValid = inpayService.verifyWebhookSignature(sigHeader, rawBody)
      if (!isValid) {
        console.warn('[inPAY Webhook] Invalid HMAC signature:', sigHeader)
        return res.status(400).json({ error: 'Invalid HMAC signature' })
      }
    }

    // Normalize event shape for both v1 and v2
    const eventType = event?.type || event?.event || event?.status || ''
    const paymentObj = event?.data?.object || event?.data || event || {}
    const inpayOrderId = paymentObj.order_id || event?.order_id   // v1 uses order_id
    const inpayPaymentId = paymentObj.id || event?.id             // v2 uses id
    const metadata = paymentObj.metadata || {}

    // Locate internal payment record — try multiple strategies
    let payment: any = null

    // Strategy 1: metadata.payment_id (v2)
    if (metadata.payment_id) {
      const r = await query('SELECT * FROM payments WHERE id = $1', [metadata.payment_id])
      payment = r.rows[0]
    }

    // Strategy 2: order_id matches our idempotency key stored in metadata (v1)
    if (!payment && inpayOrderId) {
      const r = await query(
        "SELECT * FROM payments WHERE metadata->>'inpay_id' = $1 OR provider_payment_id = $1",
        [inpayOrderId]
      )
      payment = r.rows[0]
    }

    // Strategy 3: provider_payment_id
    if (!payment && inpayPaymentId) {
      const r = await query('SELECT * FROM payments WHERE provider_payment_id = $1', [inpayPaymentId])
      payment = r.rows[0]
    }

    if (!payment) {
      console.warn('[inPAY Webhook] Payment not found:', { inpayOrderId, inpayPaymentId, metadata })
      return res.status(200).json({ received: true, warning: 'Payment not found locally' })
    }

    // Detect success status for both v1 and v2
    const isSuccess =
      eventType === 'payment.succeeded' ||
      eventType === 'succeeded' ||
      eventType === 'success' ||
      eventType === 'paid' ||
      paymentObj.status === 'succeeded' ||
      paymentObj.status === 'paid' ||
      paymentObj.status === 'success' ||
      event?.status === 'paid' ||
      event?.status === 'success'

    // Handle payment.succeeded
    if (isSuccess) {
      const payMetadata = typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : (payment.metadata || {})
      const planId = metadata.plan_id || payMetadata.plan_id

      const planRes = await query('SELECT * FROM plans WHERE id = $1', [planId])
      const plan = planRes.rows[0]

      let durationDays = 30
      if (plan?.slug === 'yearly' || plan?.interval === 'yearly') {
        durationDays = 365
      } else if (plan?.slug === 'lifetime' || plan?.interval === 'lifetime') {
        durationDays = 36500
      }

      // Mark payment as completed
      await query(
        `UPDATE payments 
         SET status = 'completed', 
             provider_payment_id = COALESCE($1, provider_payment_id), 
             updated_at = NOW() 
         WHERE id = $2`,
        [inpayPaymentId || payment.provider_payment_id, payment.id]
      )

      // Activate or extend user subscription
      const existingSubRes = await query(
        'SELECT id FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [payment.user_id]
      )

      if (existingSubRes.rows.length > 0) {
        await query(
          `UPDATE subscriptions 
           SET plan_id = $1, 
               status = 'active', 
               started_at = NOW(), 
               expires_at = NOW() + ($2 || ' days')::INTERVAL, 
               provider = 'inpay', 
               provider_subscription_id = $3,
               updated_at = NOW()
           WHERE id = $4`,
          [planId, durationDays, inpayPaymentId, existingSubRes.rows[0].id]
        )
      } else {
        await query(
          `INSERT INTO subscriptions (id, user_id, plan_id, status, started_at, expires_at, provider, provider_subscription_id)
           VALUES (gen_random_uuid(), $1, $2, 'active', NOW(), NOW() + ($3 || ' days')::INTERVAL, 'inpay', $4)`,
          [payment.user_id, planId, durationDays, inpayPaymentId]
        )
      }

      console.log(`inPAY Webhook: Subscription successfully activated for user ${payment.user_id}`)
    } else if (eventType === 'payment.failed' || paymentObj.status === 'failed') {
      await query(
        `UPDATE payments 
         SET status = 'failed', 
             updated_at = NOW() 
         WHERE id = $1`,
        [payment.id]
      )
    }

    return res.status(200).json({ received: true })
  } catch (error: any) {
    console.error('inPAY Webhook error:', error)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
})

// 4. VERIFY ORDER STATUS UPON RETURN (FOR INSTANT CLIENT ACTIVATION)
router.get('/verify-order/:orderId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { orderId } = req.params

    const payRes = await query(
      'SELECT * FROM payments WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    )
    const payment = payRes.rows[0]
    if (!payment) {
      return res.status(404).json({ error: 'Payment order not found' })
    }

    // If already marked as completed, return success
    if (payment.status === 'completed') {
      return res.json({
        success: true,
        status: 'completed',
        is_premium: true,
      })
    }

    // If still pending and has inPAY payment ID, check inPAY API directly
    if (payment.provider_payment_id) {
      const inpayCheck = await inpayService.getPayment(payment.provider_payment_id)
      if (inpayCheck.success && inpayCheck.data?.status === 'succeeded') {
        const payMetadata = typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : (payment.metadata || {})
        const planId = payMetadata.plan_id

        const planRes = await query('SELECT * FROM plans WHERE id = $1', [planId])
        const plan = planRes.rows[0]

        let durationDays = 30
        if (plan?.slug === 'yearly' || plan?.interval === 'yearly') {
          durationDays = 365
        } else if (plan?.slug === 'lifetime' || plan?.interval === 'lifetime') {
          durationDays = 36500
        }

        await query(
          `UPDATE payments SET status = 'completed', updated_at = NOW() WHERE id = $1`,
          [payment.id]
        )

        const existingSub = await query(
          'SELECT id FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
          [userId]
        )

        if (existingSub.rows.length > 0) {
          await query(
            `UPDATE subscriptions 
             SET plan_id = $1, status = 'active', started_at = NOW(), expires_at = NOW() + ($2 || ' days')::INTERVAL, provider = 'inpay', updated_at = NOW()
             WHERE id = $3`,
            [planId, durationDays, existingSub.rows[0].id]
          )
        } else {
          await query(
            `INSERT INTO subscriptions (id, user_id, plan_id, status, started_at, expires_at, provider)
             VALUES (gen_random_uuid(), $1, $2, 'active', NOW(), NOW() + ($3 || ' days')::INTERVAL, 'inpay')`,
            [userId, planId, durationDays]
          )
        }

        return res.json({
          success: true,
          status: 'completed',
          is_premium: true,
          message: 'Payment verified and Premium subscription activated!',
        })
      }
    }

    return res.json({
      success: true,
      status: payment.status,
      is_premium: false,
    })
  } catch (error: any) {
    console.error('Verify order error:', error)
    return res.status(500).json({ error: 'Failed to verify order status' })
  }
})

// 5. GET USER PAYMENT HISTORY
router.get('/payments', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const result = await query(
      `SELECT id, amount, currency, status, provider, metadata, created_at
       FROM payments
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    )

    return res.json({
      success: true,
      payments: result.rows,
    })
  } catch (error: any) {
    console.error('Fetch payments error:', error)
    return res.status(500).json({ error: 'Failed to fetch payments' })
  }
})

export default router
