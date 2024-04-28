import * as z from 'zod'

// ベンチマーク
const workers: Record<string, string> = {
  elysia: './elysia.ts',
  hono: './hono.ts',
}

const createFetchToJson = () => ({
  n: 0,
  time: 0,
  async fetchToJson ({ method, data, url, vali }: {
    method?: string
    data?: unknown
    url: string
    vali: (data: unknown) => void | boolean
  }) {
    this.n += 1
    const started = performance.now()
    const res = await fetch(`http://localhost:1234${url}`, {
      method,
      body: data ? JSON.stringify(data) : null
    }).then(res => res.text())
    const ended = performance.now()

    if (vali(JSON.parse(res)) === false) {
      throw new Error(`Error in ${method ?? 'GET'} ${url}`)
    }

    this.time += ended - started
  },
  get result (): number {
    return this.time / this.n
  }
})

const bench = async () => {
  const c = createFetchToJson()

  await c.fetchToJson({
    url: '/',
    vali(data) {
      z.object({ data: z.literal(0) }).parse(data)
    },
  })

  const name = Math.random().toString()
  await c.fetchToJson({
    url: `/user/${name}`,
    vali (data) {
      z.object({ name: z.literal(name) }).parse(data)
    }
  })

  await c.fetchToJson({
    url: '/json',
    method: 'POST',
    data: {
      hello: 'world'
    },
    vali(data) {
      z.object({ hello: z.literal('world') }).parse(data)
    },
  })

  return c.result
}

for (const [name, workerPath] of Object.entries(workers)) {
  console.log(name)

  const worker = new Worker(new URL(workerPath, import.meta.url))
  worker.onerror = (evt) => {
    console.error(evt)
  }
  let startedTime: number
  let initedTime: number
  const endPromise = new Promise((resolve) => worker.onmessage = async (evt) => {
    if (evt.data === 'inited') {
      initedTime = performance.now()
      console.log('Init:', initedTime - startedTime, 'ms')
    }
    if (evt.data === 'started') {
      const n = 2
      let time = 0
      for (let i = 0; i !== n; i++) {
        time += await bench()
      }
      console.log(`${1000 / (time / n)}req/s`)
      worker.postMessage('stop')
    }
    if (evt.data === 'stopped') {
      worker.terminate()
      resolve(null)
    }
  })
  await Bun.sleep(100)
  worker.postMessage('start')
  startedTime = performance.now()
  await endPromise
  console.log()
}

export { }
