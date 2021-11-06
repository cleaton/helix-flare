export type CreateAccessHeadersOptions = {
  origins?: Array<string | RegExp | ((request: Request) => boolean)>
  credentials?: boolean
  methods?: string[]
  maxAge?: number
  headers?: string[]
}

export const createAccessHeaders = ({
  origins = ['*'],
  credentials = true,
  methods = ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  headers = ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'],
  maxAge = 7200,
}: CreateAccessHeadersOptions = {}) => {
  return (request: Request) => {
    const isPreflight = request.method === 'OPTIONS'
    const origin = (request.headers.get('origin') || '').toLowerCase().trim()

    const responseHeaders = new Headers()
    if (!origins.includes('*')) {
      responseHeaders.set('Vary', 'Origin')
    }
    if (credentials) {
      responseHeaders.set('Access-Control-Allow-Credentials', 'true')
    }

    if (isPreflight) {
      responseHeaders.set(
        'Access-Control-Allow-Origin',
        origins?.includes('*')
          ? '*'
          : origins.some((allowedOrigin) =>
              typeof allowedOrigin === 'function'
                ? allowedOrigin(request)
                : allowedOrigin instanceof RegExp
                ? allowedOrigin.test(origin)
                : allowedOrigin === origin,
            )
          ? origin
          : '',
      )
      if (maxAge !== undefined) {
        responseHeaders.set('Access-Control-Max-Age', String(maxAge))
      }
      if (methods.length) {
        responseHeaders.set('Access-Control-Allow-Methods', methods.join(', '))
      }
      if (headers.length) {
        responseHeaders.set('Access-Control-Allow-Headers', headers.join(', '))
      }
    }

    return {
      headers: Object.fromEntries(responseHeaders.entries()),
      isPreflight,
    }
  }
}
