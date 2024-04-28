import * as z from 'zod'

import elysia from './elysia'
import fastHono from './fast-hono'
import type { Fetch } from './framework'
import hono from './hono'

// ベンチマーク
const workers: Record<string, Fetch> = {
  elysia: elysia,
  hono: hono,
  fastHono: fastHono
}

const createFetch = (fetch: Fetch, fetched?: () => void) => async ({ method, data, url }: {
  method?: string
  data?: unknown
  url: string
}): Promise<{
  json: unknown
}> => {
  const request = new Request(`http://localhost${url}`, {
    method,
    body: data ? JSON.stringify(data) : null
  })
  const res = await fetch(request)
  const json = await res.json()

  fetched?.()
  return {
    json
  }
}
const testServer = async ({ url, method, data, vali, fetch }: {
  url: string
  method?: string
  data?: unknown
  vali: (data: unknown) => void | boolean
  fetch: ReturnType<typeof createFetch>
}) => {
  const { json } = await fetch({
    method,
    data,
    url
  })
  if (vali(json) === false) {
    throw new Error(`Error in ${method ?? 'GET'} ${url}`)
  }
}
const test = async (fetchFun: Fetch) => {
  const fetch = createFetch(fetchFun)

  await testServer({
    url: '/',
    vali(data) {
      z.object({ data: z.literal(0) }).parse(data)
    },
    fetch
  })

  const name = Math.random().toString()
  await testServer({
    url: `/user/${name}`,
    vali (data) {
      z.object({ name: z.literal(name) }).parse(data)
    },
    fetch
  })

  await testServer({
    url: '/json',
    method: 'POST',
    data: {
      hello: 'world'
    },
    vali(data) {
      z.object({ hello: z.literal('world') }).parse(data)
    },
    fetch
  })
}


const bench = async (fetchFn: Fetch, timeout: number) => {
  const started = performance.now()
  let reqested = 0
  const fetch = createFetch(fetchFn, () => {
    reqested += 1
  })
  
  while (performance.now() - started < timeout) {
    await fetch({
      url: '/'
    })
    await fetch({
      url: `/user/${Math.random().toString()}`
    })
    await fetch({
      url: '/json',
      method: 'POST',
      data: {
        hello: 'world'
      }
    })
  }

  const reqPeerSec = reqested / ((performance.now() - started) / 1000)
  return reqPeerSec
}
for (const [name, fetch] of Object.entries(workers)) {
  console.log(name)

  await test(fetch)
  console.log(`✅ bypassed test: ${name}`)

  const reqBySec = await bench(fetch, 1000)

  console.log(`${name}: ${reqBySec} req/s`)
}

export { }
