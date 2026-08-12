import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { getFinancialClearance } from '@/lib/fees/clearance-service'

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_placeholder'

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

    // 1. Idempotency Check
    const { error: eventErr } = await supabase.from('payment_events').insert({
      school_id: '11111111-1111-4111-8111-111111111111',
      event_type: eventType,
      external_event_id: eventId,
      payload: event,
    })

    if (eventErr && eventErr.code === '23505') {
      // Duplicate event processed safely
      return NextResponse.json({ status: 'already_processed', message: 'Event ignored due to idempotency' })
    }

    // 2. Handle Payment Event
    if (['payment.captured', 'payment.authorized'].includes(eventType)) {
      const paymentEntity = event.payload?.payment?.entity
      const orderId = paymentEntity?.order_id
      const paymentId = paymentEntity?.id

      if (orderId) {
        const { data: payment } = await supabase
          .from('payments')
          .select('*')
          .eq('razorpay_order_id', orderId)
          .single()

        if (payment && payment.status !== 'successful') {
          await supabase
            .from('payments')
            .update({
              status: 'successful',
              razorpay_payment_id: paymentId,
              verified_at: new Date().toISOString(),
            })
            .eq('id', payment.id)

          // Recalculate clearance
          await getFinancialClearance(payment.student_id, payment.academic_session_id)
        }
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Webhook error' }, { status: 500 })
  }
}
