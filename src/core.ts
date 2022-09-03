import {
  getGraphQLParameters,
  getMultipartResponse,
  processRequest,
  type ProcessRequestOptions,
} from 'graphql-helix'

import {
  createAccessHeaders,
  type CreateAccessHeadersOptions,
} from './utils/createAccessHeaders'
import { createHelixRequest } from './utils/createHelixRequest'
import getPushResponseSSE from './sse/getPushResponseSSE'
import getResponse from './utils/getResponse'

export type SharedOptions = {
  access?: CreateAccessHeadersOptions
}

type Options = SharedOptions & {
  request: Request
} & Pick<
    ProcessRequestOptions<any, any>,
    'parse' | 'validate' | 'contextFactory' | 'execute' | 'schema'
  >

const core = async <TContext>({
  request,
  schema,
  parse,
  validate,
  execute,
  contextFactory,
  access,
}: Options) => {
  const cors = createAccessHeaders(access)
  const { isPreflight, headers } = cors(request)
  console.log("preparing")

  if (isPreflight) {
    return new Response(null, { status: 204, headers })
  }

  const helixRequest = await createHelixRequest(request)

  const { operationName, query, variables } = getGraphQLParameters(helixRequest)
  console.log("got parameters")
  const result = await processRequest({
    operationName,
    query,
    variables,
    request: helixRequest,
    schema,
    parse,
    validate,
    execute,
    contextFactory,
  })
  console.log("got process result")

  switch (result.type) {
    case 'RESPONSE':
      console.log("response")
      return getResponse(result, headers)
    case 'PUSH':
      // @todo cors headers
      console.log("push")
      return getPushResponseSSE(result, request)
    case 'MULTIPART_RESPONSE':
      console.log("multipart")
      return getMultipartResponse(result, Response, ReadableStream as any)
    default:
      return new Response('Not supported.', { status: 405 })
  }
}

export default core
