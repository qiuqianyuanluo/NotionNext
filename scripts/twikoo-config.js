#!/usr/bin/env node

const crypto = require('crypto')
const https = require('https')
const http = require('http')
const { URL } = require('url')

function md5(value) {
  return crypto.createHash('md5').update(value).digest('hex')
}

function parseArgs(argv) {
  const args = {
    url: '',
    password: '',
    values: {}
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--url') {
      args.url = argv[++i] || ''
      continue
    }
    if (arg === '--password') {
      args.password = argv[++i] || ''
      continue
    }
    if (arg === '--set') {
      const pair = argv[++i] || ''
      const [key, ...rest] = pair.split('=')
      if (key) args.values[key] = rest.join('=')
      continue
    }
    if (arg.includes('=')) {
      const [key, ...rest] = arg.split('=')
      if (key) args.values[key] = rest.join('=')
    }
  }

  return args
}

function printUsage() {
  console.log(`
Usage:
  node scripts/twikoo-config.js --url <twikoo-url> --password <admin-password> \\
    --set DISPLAYED_FIELDS=nick,mail \\
    --set REQUIRED_FIELDS=nick \\
    --set COMMENT_PLACEHOLDER="邮箱用于接收回复的邮件提醒XD，邮箱地址不公开"

Notes:
  - The script talks to a self-hosted Twikoo backend URL directly.
  - If no admin password is set yet, it will initialize one with --password.
  - You can also append KEY=VALUE pairs directly without --set.
`)
}

async function callTwikoo(url, payload) {
  const endpoint = new URL(url)
  const body = JSON.stringify(payload)
  const transport = endpoint.protocol === 'http:' ? http : https

  return new Promise((resolve, reject) => {
    const request = transport.request(
      {
        protocol: endpoint.protocol,
        hostname: endpoint.hostname,
        port: endpoint.port,
        path: endpoint.pathname + endpoint.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      response => {
        let raw = ''
        response.setEncoding('utf8')
        response.on('data', chunk => {
          raw += chunk
        })
        response.on('end', () => {
          try {
            resolve(JSON.parse(raw))
          } catch (error) {
            reject(
              new Error(`Twikoo returned a non-JSON response: ${raw}`)
            )
          }
        })
      }
    )

    request.on('error', reject)
    request.write(body)
    request.end()
  })
}

async function ensurePassword(url, passwordHash) {
  const status = await callTwikoo(url, { event: 'GET_PASSWORD_STATUS' })
  if (status && status.code && status.code !== 100) {
    throw new Error(`GET_PASSWORD_STATUS failed: ${JSON.stringify(status)}`)
  }

  if (status && status.result && status.result.status) {
    return
  }

  const register = await callTwikoo(url, {
    event: 'SET_PASSWORD',
    password: passwordHash,
    credentials: ''
  })

  if (register && register.result && register.result.code) {
    throw new Error(`SET_PASSWORD failed: ${JSON.stringify(register)}`)
  }
}

async function login(url, passwordHash) {
  const result = await callTwikoo(url, {
    event: 'LOGIN',
    password: passwordHash
  })

  if (result && result.result && result.result.message) {
    throw new Error(`LOGIN failed: ${result.result.message}`)
  }
}

async function saveConfig(url, passwordHash, values) {
  const result = await callTwikoo(url, {
    event: 'SET_CONFIG',
    accessToken: passwordHash,
    config: values
  })

  if (result && result.result && result.result.code) {
    throw new Error(`SET_CONFIG failed: ${JSON.stringify(result)}`)
  }

  return result
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.url || !args.password || !Object.keys(args.values).length) {
    printUsage()
    process.exit(1)
  }

  const url = args.url.replace(/\/$/, '')
  const passwordHash = md5(args.password)

  await ensurePassword(url, passwordHash)
  await login(url, passwordHash)
  await saveConfig(url, passwordHash, args.values)

  console.log('Twikoo config saved.')
  console.log(JSON.stringify(args.values, null, 2))
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
