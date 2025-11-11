import { NextRequest, NextResponse } from 'next/server'
import { logRequest, logResponse, logError } from './logger'

/**
 * API logging middleware
 * Logs all API requests and responses
 */
export async function withLogging(
  handler: (req: NextRequest) => Promise<Response>,
  context?: { params?: Record<string, string> }
) {
  return async (req: NextRequest) => {
    const startTime = Date.now()
    const method = req.method
    const path = req.nextUrl.pathname

    try {
      // Log incoming request
      logRequest(method, path, {
        query: Object.fromEntries(req.nextUrl.searchParams),
        headers: Object.fromEntries(req.headers),
      })

      // Execute the handler
      const response = await handler(req)
      const duration = Date.now() - startTime

      // Log successful response
      logResponse(method, path, response.status, duration)

      // Add timing header
      const newResponse = new NextResponse(response.body, response)
      newResponse.headers.set('X-Response-Time', `${duration}ms`)

      return newResponse
    } catch (error) {
      const duration = Date.now() - startTime
      const err = error instanceof Error ? error : new Error(String(error))

      // Log error
      logError(method, path, err, 500)

      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: err.message,
        },
        { status: 500 }
      )
    }
  }
}
