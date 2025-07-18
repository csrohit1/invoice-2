import dayjs from 'dayjs'
import { cashfreeClient, cashfreeRedirectBase } from '../config/cashfree'
import prisma from '../config/db'
import { ApiError } from '../utils/apiError'
import { ApiResponse } from '../utils/apiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import { verifyCashfreeSignature } from '../utils/verifyCashfreeSignature'
import bcrypt from 'bcrypt'

export const fetchTenantOnboardingSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params

  if (!sessionId) {
    throw new ApiError({ status: 400, message: 'Session ID is required' })
  }

  const session = await prisma.tenantOnboardingSession.findUnique({
    where: { id: sessionId },
  })

  if (!session) {
    throw new ApiError({ status: 404, message: 'Session not found' })
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        session,
        'Tenant onboarding session fetched successfully'
      )
    )
})

export const proceedTenantPayment = asyncHandler(async (req, res) => {
  const { email, planId } = req.body

  if (!email) {
    throw new ApiError({ status: 400, message: 'Email is required' })
  }

  if (!planId) {
    throw new ApiError({ status: 400, message: 'Plan ID is required' })
  }

  const session = await prisma.tenantOnboardingSession.findFirst({
    where: {
      email,
      isEmailVerified: true,
      status: 'PENDING',
    },
  })

  if (!session) {
    throw new ApiError({
      status: 404,
      message: 'No verified onboarding session found',
    })
  }

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  })

  if (!plan) {
    throw new ApiError({
      status: 404,
      message: 'Plan not found',
    })
  }

  // 2. Create Cashfree order
  const returnUrl = `${process.env.CLIENT_URI}/onboarding/success?order_id=${session.cashfreeOrderId}`

  const cashfreePayload = {
    order_id: session.cashfreeOrderId,
    order_amount: plan.price,
    order_currency: 'INR',
    customer_details: {
      customer_id: `user_${Buffer.from(session.email).toString('hex')}`,
      customer_email: session.email,
      customer_phone: session.phone,
    },
    order_meta: {
      return_url: returnUrl,
    },
  }

  const cashfreeRes = await cashfreeClient.PGCreateOrder(cashfreePayload)

  if (!cashfreeRes.data?.payment_session_id) {
    throw new ApiError({
      status: 500,
      message: 'Failed to initiate Cashfree payment',
    })
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        paymentSessionId: cashfreeRes.data.payment_session_id,
        cashfreeOrderId: session.cashfreeOrderId,
        redirectUrl: `${cashfreeRedirectBase}/${cashfreeRes.data.payment_session_id}`,
        company: session.company,
        email: session.email,
        amount: plan.price,
      },
      'Cashfree payment session created successfully'
    )
  )
})

export const handleCashfreeWebhook = asyncHandler(async (req, res) => {
  const { orderId } = req.body
  if (!orderId) {
    throw new ApiError({ status: 400, message: 'Order ID is required' })
  }

  const tenantSession = await prisma.tenantOnboardingSession.findUnique({
    where: { cashfreeOrderId: orderId },
  })

  if (!tenantSession) {
    throw new ApiError({
      status: 404,
      message: 'Onboarding session not found',
    })
  }

  // Creating the real tenant from the session
  const { tenant } = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: tenantSession.company,
        slug: tenantSession.company.toLowerCase().replace(/\s+/g, '-'),
        gstNumber: tenantSession.gstNumber,
        email: tenantSession.email,
        phone: tenantSession.phone,
        website: tenantSession.website,
        supportEmail: tenantSession.supportEmail,
        contactPersonName: tenantSession.contactPersonName,
        addressLine1: tenantSession.addressLine1,
        addressLine2: tenantSession.addressLine2,
        city: tenantSession.city,
        state: tenantSession.state,
        pincode: tenantSession.pincode,
        country: tenantSession.country,
      },
    })

    await tx.tenantCounter.create({
      data: {
        tenantId: tenant.id,
        nextInvoiceNumber: 1,
        nextOrderNumber: 1,
      },
    })

    // Create Auth record for the tenant admin
    const hashedPassword = await bcrypt.hash(tenantSession.password, 10)

    let auth = await tx.auth.findUnique({
      where: { email: tenantSession.email },
    })

    if (!auth) {
      auth = await tx.auth.create({
        data: {
          email: tenantSession.email,
          password: hashedPassword,
          isVerified: true, // Since they completed payment, we can mark as verified
        },
      })
    }

    // Create UserProfile for the tenant admin
    await tx.userProfile.create({
      data: {
        firstName: tenantSession.contactPersonName?.split(' ')[0] || 'Admin',
        lastName:
          tenantSession.contactPersonName?.split(' ').slice(1).join(' ') ||
          'User',
        phone: tenantSession.phone,
        role: 'ADMIN',
        authId: auth.id,
        tenantId: tenant.id,
      },
    })

    // Update onboarding session status to SUCCESS
    await tx.tenantOnboardingSession.update({
      where: { id: tenantSession.id },
      data: { status: 'SUCCESS' },
    })

    return { tenant }
  })

  if (!tenant) {
    throw new ApiError({ status: 500, message: 'Failed to create tenant' })
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        message: 'Tenant created successfully',
        tenantId: tenant.id,
      },
      'Tenant onboarding completed successfully'
    )
  )
})
