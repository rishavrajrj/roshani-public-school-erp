import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { getFinancialClearance } from '@/lib/fees/clearance-service'

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_placeholder'

    // Fail closed in production
    if (process.env.NODE_ENV === 'production' && webhookSecret === 'rzp_webhook_secret_placeholder') {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    // Verify HMAC SHA256 Webhook Signature
    if (signature && webhookSecret !== 'rzp_webhook_secret_placeholder') {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex')

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
      }
    }

    const event = JSON.parse(rawBody)
    const eventId = event.event_id || event.payload?.payment?.entity?.id || `evt_${Date.now()}`
    const eventType = event.event || 'payment.captured'

    const supabase = (await createClient()) as any

    // FIX #5: Derive school_id from the payment/order record, not hardcoded
    const paymentEntity = event.payload?.payment?.entity
    const orderId = paymentEntity?.order_id
    const razorpayPaymentId = paymentEntity?.id

    // Lookup the payment to derive school_id
    let derivedSchoolId: string | null = null
    let matchedPayment: any = null

    if (orderId) {
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', orderId)
        .single()

      if (payment) {
        derivedSchoolId = payment.school_id
        matchedPayment = payment
      }
    }

    // If we can't derive school_id, we can't process securely
    if (!derivedSchoolId) {
      // B4 Fix: Store unmatched event in isolated table (not financial tables)
      await supabase.from('unmatched_webhook_events').insert({
        provider: 'razorpay',
        external_event_id: eventId,
        event_type: eventType,
        payload: event,
        signature_verified: !!signature,
        processing_status: 'unmatched',
        failure_reason: 'No matching payment found for webhook order_id',
      })
      return NextResponse.json({ status: 'unmatched', message: 'No matching payment found for this webhook event' })
    }

    // 1. Idempotency Check
    const { error: eventErr } = await supabase.from('payment_events').insert({
      school_id: derivedSchoolId,
      event_type: eventType,
      external_event_id: eventId,
      payload: event,
    })

    if (eventErr && eventErr.code === '23505') {
      return NextResponse.json({ status: 'already_processed', message: 'Event ignored due to idempotency' })
    }

    // 2. Handle Payment Event
    if (['payment.captured', 'payment.authorized'].includes(eventType) && matchedPayment) {
      if (matchedPayment.status !== 'successful') {
        await supabase
          .from('payments')
          .update({
            status: 'successful',
            razorpay_payment_id: razorpayPaymentId,
            verified_at: new Date().toISOString(),
          })
          .eq('id', matchedPayment.id)

        // Audit log for webhook payment
        await supabase.from('audit_logs').insert({
          school_id: derivedSchoolId,
          actor_profile_id: null,
          action: 'WEBHOOK_PAYMENT_CONFIRMED',
          entity_type: 'payment',
          entity_id: matchedPayment.id,
          new_data: { razorpayPaymentId, eventType, eventId },
        })

        // Recalculate clearance
        await getFinancialClearance(matchedPayment.student_id, matchedPayment.academic_session_id)
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Webhook error' }, { status: 500 })
  }
}
