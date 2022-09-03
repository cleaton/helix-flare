import {type Request as HelixRequest} from 'graphql-helix'
export const createHelixRequest = async (request: Request): Promise<HelixRequest> => {
  const url = new URL(request.url)
  const query = Object.fromEntries(new URLSearchParams(url.search))

  console.log('getting json body', request.method)

  const body =
    request.method === 'POST' ? await request.json() : undefined

  console.log('got body')

  return {
    body: body,
    headers: request.headers,
    method: request.method,
    query,
  }
}
