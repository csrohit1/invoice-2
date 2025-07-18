import crypto from 'crypto'

export function verifyCashfreeSignature(body: string, signature: string) {
  const secret = process.env.CASHFREE_SECRET_KEY!
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64')

  return computedSignature === signature
}
