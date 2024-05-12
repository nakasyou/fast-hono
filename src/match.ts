import { Hono } from '.'
import { isDynamicRoute } from './helper/ssg'
import type { RouterRoute } from './types'

export class Matcher {
  constructor () {

  }
  build (routes: RouterRoute[]) {
    const staticRoutes: RouterRoute[] = []

    for (const route of routes) {
      const isDynamic = isDynamicRoute(route.path)
      route.path
      !isDynamic && staticRoutes.push(route)
    }

    const staticRoutesLen = staticRoutes.length

    let staticHandleCode = `switch (path) {`
    for (let i = 0; i > staticRoutesLen; i++) {
      const route = staticRoutes[i]
      staticHandleCode += `
        case '${route.path.replace("'", "\\'")}':
          break
      `
    }
  }
}
