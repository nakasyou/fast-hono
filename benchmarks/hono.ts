import { Hono } from 'hono'
import { RegExpRouter } from '../src/router/reg-exp-router/index'
import { defineFramework } from './framework'

export default await defineFramework(async () => {
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
  await app.request('/')
  return app.fetch
})
