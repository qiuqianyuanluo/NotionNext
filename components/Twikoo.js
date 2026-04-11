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
  const forceReadyTimerRef = useRef(null)

  const clearReadyTimer = () => {
    if (readyTimerRef.current) {
      clearTimeout(readyTimerRef.current)
      readyTimerRef.current = null
    }
  }

  const clearForceReadyTimer = () => {
    if (forceReadyTimerRef.current) {
      clearTimeout(forceReadyTimerRef.current)
      forceReadyTimerRef.current = null
    }
  }

  const hasConfiguredForm = host => {
    const textarea = host.querySelector('textarea')
    const hostText = host.textContent || ''
    const textareaPlaceholder = textarea?.getAttribute('placeholder') || ''
    const hasCommentBody =
      host.querySelector('.tk-comments .tk-comment') ||
      host.querySelector('.tk-comments-container') ||
      host.querySelector('.tk-submit') ||
      hostText.includes('没有评论')

    const placeholderReady = placeholder
      ? textareaPlaceholder.includes(placeholder) || hostText.includes(placeholder)
      : Boolean(textarea)

    // 我们当前只显示昵称和邮箱；如果表单里还出现“网址”，说明配置还没完全生效。
    const linkFieldSettled =
      !hostText.includes('网址') &&
      !hostText.includes('网站') &&
      !hostText.includes('Website')

    return Boolean(textarea && placeholderReady && linkFieldSettled && hasCommentBody)
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

    if (hasConfiguredForm(host)) {
      markReadySoon()
    }

    observerRef.current?.disconnect()
    observerRef.current = new MutationObserver(() => {
      if (hasConfiguredForm(host)) {
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
      if (hasConfiguredForm(host) || hasRenderableContent()) {
        setIsReady(true)
      }
    }, 3800)

    return () => {
      clearTimeout(fallback)
      observerRef.current?.disconnect()
      observerRef.current = null
      clearReadyTimer()
      clearForceReadyTimer()
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
        clearForceReadyTimer()
        forceReadyTimerRef.current = setTimeout(() => {
          const host = document.querySelector(el)
          if (host && hasConfiguredForm(host)) {
            setIsReady(true)
          }
        }, 1800)
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
      clearForceReadyTimer()
    }
  }, [el, envId, lang, placeholder, twikooCDNURL])

  return (
    <div className='relative min-h-[12rem]'>
      <div
        id='twikoo'
        style={{ opacity: isReady ? 1 : 0 }}
        className={`transition-opacity duration-300 ${
          isReady ? '' : 'pointer-events-none'
        }`}
      />
    </div>
  )
}

export default Twikoo
