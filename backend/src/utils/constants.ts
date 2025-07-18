export const accessTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 90000, // 15 mins
  domain:
    process.env.NODE_ENV === 'production'
      ? (process.env.CLIENT_URI as string)
      : 'localhost',
}

export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth/refresh-token',
  maxAge: 604800000, // 7 days
  domain:
    process.env.NODE_ENV === 'production'
      ? (process.env.CLIENT_URI as string)
      : 'localhost',
}
