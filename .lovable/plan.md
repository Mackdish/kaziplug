# Fix M-Pesa STK error reporting and resilience

## Changes
- Retry temporary PayzaAPI gateway failures before returning an error.
- Return a short, safe provider-unavailable message instead of an HTML error page.
- Surface the actual payment error in task posting and bid-fee flows instead of the generic “Edge Function returned a non-2xx status code.”
- Keep failed attempts marked failed and allow users to retry.

## Validation
- Deploy only the updated payment function.
- Test invalid input and provider-failure responses without charging a real phone.
- Confirm the app still builds successfully.

## Technical details
- Handle HTTP 502/503/504 and network failures with bounded retries.
- Parse the function response attached to invocation errors on the client.
