
type ParsedPath = {
  type: 'static'
  text: string
} | {
  type: 'param'
  name: Record<number, string>
  regex: string
}

const pickParamRegex = /^:(?<name>[a-zA-Z0-9]+)({(?<regex>.+)})?(?<isOpt>\?)?$/

const addSlashToParsedPathInHandleDynamic = (path: ParsedPath[], last?: ParsedPath) => {
  if (last && last.type === 'static') {
    last.text += '/'
  } else {
    path.push({ type: 'static', text: '/' })
  }
}
/**
 * Parse path
 */
const parsePath = <T extends number>(path: string, handler: T): ParsedPath[] => {
  const result: ParsedPath[] = []

  const splitedPath = path.split('/')
  const splitedPathLen = splitedPath.length
  for (let i = 0; i < splitedPathLen; i++) {
    const seq = splitedPath[i]
    if (seq === '') {
      continue
    }

    let lastRoute = result.at(-1)
    if (seq.startsWith(':')) {
      addSlashToParsedPathInHandleDynamic(result, lastRoute)
      // Dynamic param
      const matched = seq.match(pickParamRegex)?.groups
      if (matched) {
        const data = matched as {
          name: string
          regex?: string
          isOpt?: string
        }
        result.push({
          type: 'param',
          name: {
            [handler]: data.name
          },
          regex: data.regex ?? '[^\/]+?'
        })
        continue
      }
    } else if (seq === '*') {
      addSlashToParsedPathInHandleDynamic(result, lastRoute)
      result.push({
        type: 'param',
        regex: '.*?',
        name: {}
      })
      continue
    }
    // Static route
    if (!lastRoute || lastRoute.type !== 'static') {
      lastRoute = { type: 'static', text: '' }
      result.push(lastRoute)
    }
    lastRoute.text += '/' + seq
  }
  if (result.length === 0) {
    result.push({
      type: 'static',
      text: '/'
    })
  }
  return result
}

class Node<T extends number> {
  path: ParsedPath
  handlers?: T[]
  readonly children: Node<T>[] = []
  constructor (path: ParsedPath, handlers?: T[]) {
    this.handlers = handlers
    this.path = path
  }
}

export class Radix<T extends number> {
  root: Node<T>
  constructor () {
    this.root = new Node({
      type: 'static',
      text: ''
    })
  }
  add (path: string, handler: T) {
    const parsed = parsePath(path, handler)
    let parsedPathI = 0
    let node = this.root

    const insertStaticData: {
      isTargetHasChild: boolean
      sameLength: number
    } = {
      
    }
    while (true) {
      const targetSeq = parsed[parsedPathI]
      const isLastSeq = parsedPathI === parsed.length - 1
      let isInserted = false
      for (const childNode of node.children) {
        if (targetSeq.type === 'static' && childNode.path.type === 'static') {
          if (targetSeq.text === childNode.path.text) {
            // Same path text
            if (isLastSeq) {
              childNode.handlers ??= []
              childNode.handlers.push(handler)
            }
            isInserted = true
            break
          } else {
            const targetHasChild = targetSeq.text.startsWith(childNode.path.text) ? childNode.path.text.length : null
            const childHasTarget = childNode.path.text.startsWith(targetSeq.text) ? targetSeq.text.length : null
            if (targetHasChild && insertStaticData?.sameLength < targetHasChild) {
              // Has same path
              insertStaticData
              console.log(targetHasChild, childHasTarget)
            }
          }
        }
        if (targetSeq.type === 'param' && childNode.path.type === 'param' && targetSeq.regex === childNode.path.regex) {
          if (isLastSeq) {
            childNode.handlers ??= []
            isLastSeq && childNode.handlers.push(handler)
          }
          node = childNode
          isInserted = true
          break
        }
      }
      if (!isInserted) {
        if (targetSeq.type === 'static') {
          const targetNode = new Node<T>({
            type: 'static',
            text: targetSeq.text
          }, isLastSeq ? [handler] : undefined)
          node.children.push(targetNode)
          node = targetNode
        } else {
          const targetNode = new Node<T>({
            type: 'param',
            name: targetSeq.name,
            regex: targetSeq.regex
          }, isLastSeq ? [handler] : undefined)
          node.children.push(targetNode)
          node = targetNode
        }
      }

      parsedPathI++
      if (parsedPathI === parsed.length) {
        break
      }
    }
  }
}

const radix = new Radix<number>()

radix.add('/a', 0)
radix.add('/ab', 1)

await Bun.write('./src/radix.json', JSON.stringify(radix.root, null, 2))