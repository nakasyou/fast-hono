import { defineFramework } from './framework'
import { Elysia } from 'elysia'

defineFramework(async () => {
  const app = new Elysia()
    .get('/', async () => {
      return {
        data: 0
      }
    })
    .get('/user/:name', c => ({
      name: c.params.name
    }), {
      type: 'json'
    })
    .post('/json', c => c.body, {
      type: 'json'
    })

  return () => {
    const server = app.listen(1234)
    return () => {
      server.stop()
    }
  }
})