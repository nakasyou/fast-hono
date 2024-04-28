import { Elysia } from 'elysia'
import { defineFramework } from './framework'

export default await defineFramework(async () => {
  const app = new Elysia({
  })
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

  app.compile()
  return app.fetch
})