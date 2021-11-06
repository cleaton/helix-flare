import { writeToStream } from './writeToStream'
import { Push } from 'graphql-helix/dist-esm/types'

const getPushResponseSSE = (result: Push<any, any>, request: Request) => {
  const { readable, writable } = new TransformStream()
  const stream = writable.getWriter()

  const intervalId = setInterval(() => {
    writeToStream(stream, ':\n\n')
  }, 15000)

  ;(request.signal as any)?.addEventListener('abort', () => {
    clearInterval(intervalId)
    stream.close()
  })

  result
    .subscribe((data) => {
      writeToStream(stream, {
        event: 'next',
        data: JSON.stringify(data),
      })
    })
    .then(() => {
      clearInterval(intervalId)
      writeToStream(stream, { event: 'complete' })
    })

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'Origin, X-Requested-With, Content-Type, Accept',
    },
  })
}

export default getPushResponseSSE