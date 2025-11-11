import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  // ...
  // Note: if you want to override the automatic SDK initialization, you can pass `autoSessionTracking: false` and handle createOptions, beforeSend, integrations etc. yourself.
  replaysSessionSampleRate: 0.1, // If the entire session is not sampled, use the below sample rate to sample replays when sampling starts
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling starts due to a crash

  // Ignore certain errors
  ignoreErrors: [
    // Random plugins/extensions
    'top.GLOBALS',
    // See http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    // Facebook errors
    'fb_xd_fragment',
  ],
})
