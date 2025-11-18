const secret = process.env.JWT_SECRET

if (!secret) {
  throw new Error('JWT_SECRET environment variable is not set')
}

export const jwtConstants = {
  secret,
}
