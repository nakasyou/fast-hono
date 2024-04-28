import { defineFramework } from './framework'
import { Hono } from '../src/index'
import { RegExpRouter } from '../src/router/reg-exp-router/index'

defineFramework(async () => {
  const app = new Hono({
    router: new RegExpRouter()
  })
    .get('/', async (c) => {
      return c.json({
        data: 0
      })
    })
    .get('/user/:name', (c) => c.json({
      name: c.req.param('name')
    }))
    .post('/json', async c => c.json(await c.req.json()))

  return () => {
    const server = Bun.serve({
      fetch: app.fetch,
      port: 1234
    })
    return () => {
      server.stop()
    }
  }
})
