import { siteConfig } from '@/lib/config'
import { loadExternalResource } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

const Twikoo = () => {
  const envId = siteConfig('COMMENT_TWIKOO_ENV_ID')
  const el = siteConfig('COMMENT_TWIKOO_ELEMENT_ID', '#twikoo')
  const twikooCDNURL = siteConfig('COMMENT_TWIKOO_CDN_URL')
  const placeholder = siteConfig('COMMENT_TWIKOO_PLACEHOLDER')
  const lang = siteConfig('LANG')
  const [isReady, setIsReady] = useState(false)
  const initializedRef = useRef(false)
  const readyTimerRef = useRef(null)
  const observerRef = useRef(null)

  const clearReadyTimer = () => {
    if (readyTimerRef.current) {
      clearTimeout(readyTimerRef.current)
      readyTimerRef.current = null
    }
  }

  const preconnect = urlLike => {
    if (typeof document === 'undefined' || !urlLike) return

    try {
      const origin = new URL(urlLike).origin
      const rels = ['dns-prefetch', 'preconnect']

      rels.forEach(rel => {
        const selector = `link[rel="${rel}"][href="${origin}"]`
        if (document.head.querySelector(selector)) return
        const link = document.createElement('link')
        link.rel = rel
        link.href = origin
        if (rel === 'preconnect') link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
      })
    } catch (error) {
      console.warn('twikoo preconnect failed', error)
    }
  }

  const markReadySoon = () => {
    clearReadyTimer()
    readyTimerRef.current = setTimeout(() => {
      setIsReady(true)
    }, 180)
  }

  const watchRender = () => {
    if (typeof document === 'undefined') return () => {}

    const host = document.querySelector(el)
    if (!host) return () => {}

    const hasRenderableContent = () => {
      return Boolean(
        host.querySelector('textarea') ||
          host.querySelector('.tk-meta-input') ||
          host.querySelector('.tk-submit') ||
          host.querySelector('.tk-comments') ||
          host.textContent?.trim()
      )
    }

    if (hasRenderableContent()) {
      markReadySoon()
    }

    observerRef.current?.disconnect()
    observerRef.current = new MutationObserver(() => {
      if (hasRenderableContent()) {
        markReadySoon()
      }
    })

    observerRef.current.observe(host, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    })

    const fallback = setTimeout(() => {
      if (hasRenderableContent()) {
        setIsReady(true)
      }
    }, 2500)

    return () => {
      clearTimeout(fallback)
      observerRef.current?.disconnect()
      observerRef.current = null
      clearReadyTimer()
    }
  }

  useEffect(() => {
    let disposed = false
    let cleanupObserver = () => {}

    const initTwikoo = async () => {
      if (!envId || !twikooCDNURL || initializedRef.current) return

      try {
        preconnect(envId)
        preconnect(twikooCDNURL)
        cleanupObserver = watchRender()
        await loadExternalResource(twikooCDNURL, 'js')
        if (disposed || initializedRef.current) return

        const twikoo = window?.twikoo
        if (typeof twikoo?.init !== 'function') {
          throw new Error('twikoo.init is not available')
        }

        initializedRef.current = true
        twikoo.init({
          envId,
          el,
          lang,
          placeholder: placeholder || undefined,
          path: location.pathname
        })
      } catch (error) {
        console.error('twikoo 加载失败', error)
      }
    }

    setIsReady(false)
    initializedRef.current = false
    initTwikoo()

    return () => {
      disposed = true
      cleanupObserver()
      initializedRef.current = false
    }
  }, [el, envId, lang, placeholder, twikooCDNURL])

  return (
    <div className='relative min-h-[12rem]'>
      {!isReady && (
        <div className='rounded-md border border-gray-200 bg-white/70 p-4 text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-500'>
          评论加载中...
        </div>
      )}
      <div
        id='twikoo'
        style={{ visibility: isReady ? 'visible' : 'hidden' }}
        className={isReady ? '' : 'absolute inset-0'}
      />
    </div>
  )
}

export default Twikoo
