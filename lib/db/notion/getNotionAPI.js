import { NotionAPI as NotionLibrary } from 'notion-client'
import BLOG from '@/blog.config'
import path from 'path'
import { RateLimiter } from './RateLimiter'
import { getPageContentBlockIds, idToUuid } from 'notion-utils'

// 限流配置，打包编译阶段避免接口频繁，限制频率
const useRateLimiter = process.env.BUILD_MODE || process.env.EXPORT
const lockFilePath = path.resolve(process.cwd(), '.notion-api-lock')
const rateLimiter = new RateLimiter(200, lockFilePath)

const globalStore = { notion: null, inflight: new Map() }

function getRawNotion() {
  if (!globalStore.notion) {
    globalStore.notion = new NotionLibrary({
      apiBaseUrl: BLOG.API_BASE_URL || 'https://www.notion.so/api/v3',
      activeUser: BLOG.NOTION_ACTIVE_USER || null,
      authToken: BLOG.NOTION_TOKEN_V2 || null,
      userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      kyOptions: {
        mode: 'cors',
        hooks: {
          beforeRequest: [
            (request) => {
              const url = request.url.toString()
              if (url.includes('/api/v3/syncRecordValues')) {
                return new Request(
                  url.replace('/api/v3/syncRecordValues', '/api/v3/syncRecordValuesMain'),
                  request
                )
              }
              return request
            }
          ]
        }
      }
    })
  }
  return globalStore.notion
}

async function callNotion(methodName, ...args) {
  const notion = getRawNotion()
  const original = notion[methodName]
  if (typeof original !== 'function') throw new Error(`${methodName} is not a function`)

  const key = `${methodName}-${JSON.stringify(args)}`

  if (globalStore.inflight.has(key)) return globalStore.inflight.get(key)

  const execute = async () => original.apply(notion, args)
  const promise = useRateLimiter
    ? rateLimiter.enqueue(key, execute)
    : execute()

  globalStore.inflight.set(key, promise)
  promise.finally(() => globalStore.inflight.delete(key))
  return promise
}

function unwrapMapRecord(record) {
  if (!record || typeof record !== 'object') {
    return record
  }

  if (record.value?.value && !record.value?.type) {
    return {
      ...record,
      role: record.role ?? record.value.role,
      value: record.value.value
    }
  }

  return record
}

function normalizeRecordMap(recordMap) {
  if (!recordMap) {
    return recordMap
  }

  for (const key of ['block', 'collection', 'collection_view', 'notion_user']) {
    const source = recordMap[key]
    if (!source || typeof source !== 'object') {
      continue
    }

    for (const id of Object.keys(source)) {
      source[id] = unwrapMapRecord(source[id])
    }
  }

  recordMap.collection = recordMap.collection ?? {}
  recordMap.collection_view = recordMap.collection_view ?? {}
  recordMap.notion_user = recordMap.notion_user ?? {}
  recordMap.collection_query = recordMap.collection_query ?? {}
  recordMap.signed_urls = recordMap.signed_urls ?? {}

  return recordMap
}

async function hydrateMissingBlocks(recordMap, ofetchOptions) {
  while (true) {
    const pendingBlockIds = getPageContentBlockIds(recordMap).filter(
      id => !recordMap.block?.[id]
    )

    if (!pendingBlockIds.length) {
      break
    }

    const res = await callNotion('getBlocks', pendingBlockIds, ofetchOptions)
    recordMap.block = {
      ...recordMap.block,
      ...(res?.recordMap?.block || {})
    }

    normalizeRecordMap(recordMap)
  }
}

async function hydrateCollectionQueries(pageId, recordMap, options = {}) {
  const rootId = idToUuid(pageId)
  const rootBlock = recordMap?.block?.[rootId]?.value

  if (
    !rootBlock ||
    (rootBlock.type !== 'collection_view_page' &&
      rootBlock.type !== 'collection_view')
  ) {
    return
  }

  const collectionId = rootBlock.collection_id
  const viewIds = rootBlock.view_ids || []
  const spaceId = rootBlock.space_id

  if (!collectionId || viewIds.length === 0) {
    return
  }

  const hasCollectionQuery = Object.keys(recordMap.collection_query || {}).length > 0
  if (hasCollectionQuery) {
    return
  }

  for (const collectionViewId of viewIds) {
    const collectionView = recordMap.collection_view?.[collectionViewId]?.value
    const collectionData = await callNotion(
      'getCollectionData',
      collectionId,
      collectionViewId,
      collectionView,
      {
        limit: options.collectionReducerLimit ?? 999,
        spaceId,
        ofetchOptions: options.ofetchOptions
      }
    )

    recordMap.block = {
      ...recordMap.block,
      ...(collectionData?.recordMap?.block || {})
    }
    recordMap.collection = {
      ...recordMap.collection,
      ...(collectionData?.recordMap?.collection || {})
    }
    recordMap.collection_view = {
      ...recordMap.collection_view,
      ...(collectionData?.recordMap?.collection_view || {})
    }
    recordMap.notion_user = {
      ...recordMap.notion_user,
      ...(collectionData?.recordMap?.notion_user || {})
    }
    recordMap.collection_query[collectionId] = {
      ...(recordMap.collection_query[collectionId] || {}),
      [collectionViewId]: collectionData?.result?.reducerResults
    }
  }

  normalizeRecordMap(recordMap)
}

async function getPage(pageId, options = {}) {
  const recordMap = await callNotion('getPage', pageId, options)
  normalizeRecordMap(recordMap)
  await hydrateMissingBlocks(recordMap, options.ofetchOptions)
  await hydrateCollectionQueries(pageId, recordMap, options)
  await hydrateMissingBlocks(recordMap, options.ofetchOptions)
  return recordMap
}

export const notionAPI = {
  getPage,
  getBlocks: (...args) => callNotion('getBlocks', ...args),
  getUsers: (...args) => callNotion('getUsers', ...args),
  __call: callNotion
}

export default notionAPI
