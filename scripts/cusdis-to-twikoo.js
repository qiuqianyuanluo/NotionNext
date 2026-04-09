#!/usr/bin/env node

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) {
      args[key] = true
      continue
    }
    args[key] = next
    i++
  }
  return args
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase()
}

function md5(input) {
  return crypto.createHash('md5').update(input).digest('hex')
}

function toRelativeUrl(url, fallbackPathname) {
  if (!url && fallbackPathname) return fallbackPathname
  if (!url) return '/'

  try {
    const parsed = new URL(url)
    return parsed.pathname + (parsed.search || '')
  } catch (error) {
    return url.startsWith('/') ? url : (fallbackPathname || '/')
  }
}

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function requestJson(url, headers) {
  const client = url.startsWith('https') ? https : http

  return new Promise((resolve, reject) => {
    const req = client.request(url, { method: 'GET', headers }, res => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', chunk => {
        body += chunk
      })
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(
            new Error(
              'Request failed: ' + res.statusCode + ' ' + body.slice(0, 300)
            )
          )
          return
        }

        try {
          resolve(JSON.parse(body))
        } catch (error) {
          reject(new Error('Invalid JSON response: ' + error.message))
        }
      })
    })

    req.on('error', reject)
    req.end()
  })
}

function flattenCusdisComments(records, list, parentId, rootId) {
  for (const record of records || []) {
    list.push({
      id: String(record.id),
      content: record.content || '',
      createdAt: record.createdAt,
      byEmail: record.by_email || '',
      byNickname:
        record.by_nickname ||
        (record.moderator && record.moderator.displayName) ||
        'Anonymous',
      approved: record.approved !== false,
      moderatorId: record.moderatorId || null,
      parentId: parentId || null,
      rootId: rootId || null,
      page: record.page || null
    })

    const replies = (((record || {}).replies || {}).data) || []
    if (replies.length > 0) {
      flattenCusdisComments(
        replies,
        list,
        String(record.id),
        rootId || String(record.id)
      )
    }
  }
}

function convertToTwikooBackup(flattened, options) {
  const skipped = []
  const comments = []

  for (const record of flattened) {
    if (record.approved === false && !options.includeUnapproved) {
      skipped.push({
        id: record.id,
        reason: 'unapproved'
      })
      continue
    }

    const page = record.page || {}
    const relativeUrl = toRelativeUrl(
      page.url,
      options.fallbackPath || '/'
    )
    const absoluteUrl = page.url || ((options.origin || '').replace(/\/$/, '') + relativeUrl)
    const email = normalizeEmail(record.byEmail)

    comments.push({
      _id: 'cusdis-' + record.id,
      nick: record.byNickname,
      mail: email,
      mailMd5: email ? md5(email) : '',
      isSpam: false,
      ua: '',
      ip: '',
      link: '',
      pid: record.parentId ? 'cusdis-' + record.parentId : undefined,
      rid: record.rootId ? 'cusdis-' + record.rootId : undefined,
      master: Boolean(record.moderatorId),
      comment: record.content || '',
      url: relativeUrl,
      href: absoluteUrl,
      created: new Date(record.createdAt).getTime(),
      updated: new Date(record.createdAt).getTime()
    })
  }

  return {
    comments,
    skipped
  }
}

async function fetchCusdisAdminComments(args) {
  if (!args['project-id']) {
    throw new Error('Missing --project-id')
  }

  const host = (args.host || 'https://cusdis.com').replace(/\/$/, '')
  const cookie =
    process.env.CUSDIS_COOKIE ||
    (args['cookie-file']
      ? fs.readFileSync(args['cookie-file'], 'utf8').trim()
      : '')

  if (!cookie) {
    throw new Error(
      'Missing Cusdis auth cookie. Provide CUSDIS_COOKIE or --cookie-file.'
    )
  }

  const timezoneOffset = args['timezone-offset'] || '8'
  const headers = {
    Cookie: cookie,
    'x-timezone-offset': timezoneOffset
  }

  let page = 1
  let pageCount = 1
  const rawPages = []
  const flattened = []

  while (page <= pageCount) {
    const url =
      host +
      '/api/project/' +
      encodeURIComponent(args['project-id']) +
      '/comments?page=' +
      page
    const payload = await requestJson(url, headers)
    rawPages.push(payload)

    const wrapper = (((payload || {}).data) || {})
    const records = wrapper.data || []
    pageCount = Number(wrapper.pageCount || 1)

    flattenCusdisComments(records, flattened, null, null)
    page++
  }

  return {
    rawPages,
    flattened
  }
}

function printUsage() {
  console.log(`
Usage:
  node scripts/cusdis-to-twikoo.js --input raw-cusdis.json --out twikoo-comments.json

Or fetch from Cusdis dashboard API directly:
  CUSDIS_COOKIE='next-auth.session-token=...' \\
  node scripts/cusdis-to-twikoo.js --project-id YOUR_PROJECT_ID --out twikoo-comments.json

Options:
  --input <file>            Raw Cusdis export JSON file
  --project-id <id>         Cusdis project id (fetch mode)
  --cookie-file <file>      File containing the full Cookie header value
  --host <url>              Cusdis host, defaults to https://cusdis.com
  --timezone-offset <hours> x-timezone-offset header, defaults to 8
  --origin <url>            Fallback site origin if page.url is missing
  --fallback-path <path>    Fallback relative path if page.url is missing
  --raw-out <file>          Save fetched raw Cusdis payloads
  --include-unapproved      Keep unapproved comments
  --out <file>              Output Twikoo backup JSON
`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help || args.h) {
    printUsage()
    return
  }

  if (!args.out) {
    throw new Error('Missing --out')
  }

  let flattened = []
  let rawPages = null

  if (args.input) {
    const payload = readJson(args.input)
    if (payload.flattened && Array.isArray(payload.flattened)) {
      flattened = payload.flattened
      rawPages = payload.rawPages || null
    } else if (Array.isArray(payload)) {
      flattened = payload
    } else {
      throw new Error('Unsupported input JSON format')
    }
  } else {
    const fetched = await fetchCusdisAdminComments(args)
    flattened = fetched.flattened
    rawPages = fetched.rawPages
  }

  const result = convertToTwikooBackup(flattened, {
    includeUnapproved: Boolean(args['include-unapproved']),
    origin: args.origin || '',
    fallbackPath: args['fallback-path'] || '/'
  })

  ensureDirectory(args.out)
  writeJson(args.out, result.comments)

  if (args['raw-out'] && rawPages) {
    ensureDirectory(args['raw-out'])
    writeJson(args['raw-out'], { rawPages: rawPages, flattened: flattened })
  }

  console.log(
    'Converted ' +
      result.comments.length +
      ' comments to Twikoo backup format.'
  )
  if (result.skipped.length > 0) {
    console.log('Skipped ' + result.skipped.length + ' comments.')
  }
  console.log('Output:', path.resolve(args.out))
}

main().catch(error => {
  console.error('[cusdis-to-twikoo]', error.message)
  process.exit(1)
})
