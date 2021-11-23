import {
  getGraphQLParameters,
  getMultipartResponse,
  processRequest,
  renderGraphiQL,
  shouldRenderGraphiQL,
} from 'graphql-helix'
import { applyMiddleware } from 'graphql-middleware'
import type { GraphQLSchema } from 'graphql'
import type { IMiddleware } from 'graphql-middleware'

import { createAccessHeaders } from './utils/createAccessHeaders'
import type { CreateAccessHeadersOptions } from './utils/createAccessHeaders'
import { createHelixRequest } from './utils/createHelixRequest'
import type { ProcessRequestOptions } from 'graphql-helix'
import getPushResponseSSE from './sse/getPushResponseSSE'
import getResponse from './utils/getResponse'

type Options<TContext> = {
  access?: CreateAccessHeadersOptions
  middlewares?: IMiddleware[]
  contextFactory?: ProcessRequestOptions<TContext, {}>['contextFactory']
}

const helixFlare = async <TContext>(
  request: Request,
  schema: GraphQLSchema,
  { middlewares = [], access, contextFactory }: Options<TContext> = {},
) => {
  const cors = createAccessHeaders(access)
  const { isPreflight, headers } = cors(request)

  if (isPreflight) {
    return new Response(null, { status: 204, headers })
  }

  const helixRequest = await createHelixRequest(request)

  if (shouldRenderGraphiQL(helixRequest)) {
    return new Response(renderGraphiQL(), {
      headers: { 'Content-Type': 'text/html' },
    })
  } else {
    const { operationName, query, variables } =
      getGraphQLParameters(helixRequest)

    const result = await processRequest({
      operationName,
      query,
      variables,
      request: helixRequest,
      schema: applyMiddleware(schema, ...middlewares),
      contextFactory,
    })

    switch (result.type) {
      case 'RESPONSE':
        return getResponse(result, headers)
      case 'PUSH':
        // @todo cors headers
        return getPushResponseSSE(result, request)
      case 'MULTIPART_RESPONSE':
        return getMultipartResponse(result, Response, ReadableStream as any)
      default:
        return new Response('Not supported.', { status: 405 })
    }
  }
}

export default helixFlare
