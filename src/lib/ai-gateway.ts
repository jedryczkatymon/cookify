import { createGateway } from "ai"
import { Agent, fetch as undiciFetch } from "undici"

// Undici's default headersTimeout is 5 minutes; DeepSeek via AI Gateway
// intermittently exceeds that before sending response headers.
// Must use undici's own fetch with Agent — Node's global fetch rejects
// a foreign undici Agent (UND_ERR_INVALID_ARG / invalid onRequestStart).
const LONG_RUNNING_MS = 15 * 60 * 1000

const longRunningAgent = new Agent({
	headersTimeout: LONG_RUNNING_MS,
	bodyTimeout: LONG_RUNNING_MS,
})

export const gateway = createGateway({
	fetch: (url, init) =>
		undiciFetch(url as Parameters<typeof undiciFetch>[0], {
			...(init as Record<string, unknown>),
			dispatcher: longRunningAgent,
		}) as unknown as Promise<Response>,
})
