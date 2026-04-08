import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'
import { loadExternalResource } from '@/lib/utils'
import { siteConfig } from '@/lib/config'

const CusdisComponent = ({ frontMatter }) => {
  const router = useRouter()
  const { isDarkMode, lang } = useGlobal()
  const threadRef = useRef(null)
  const src = siteConfig('COMMENT_CUSDIS_SCRIPT_SRC')
  const i18nForCusdis = siteConfig('LANG').toLowerCase().indexOf('zh') === 0 ? siteConfig('LANG').toLowerCase() : siteConfig('LANG').toLowerCase().substring(0, 2)
  const langCDN = siteConfig('COMMENT_CUSDIS_LANG_SRC', `https://cusdis.com/js/widget/lang/${i18nForCusdis}.js`)

  useEffect(() => {
    let timer = null
    let retryTimer = null

    const getMinHeight = () => (window.innerWidth <= 768 ? 576 : 720)

    const applyIframeStyles = () => {
      const iframe = threadRef.current?.querySelector('iframe')
      if (!iframe) return null

      iframe.style.display = 'block'
      iframe.style.width = '100%'
      iframe.style.border = '0'
      iframe.style.overflow = 'hidden'
      iframe.style.minHeight = `${getMinHeight()}px`
      return iframe
    }

    const handleResizeMessage = event => {
      if (event?.data?.event !== 'resize') {
        return
      }

      const iframe = applyIframeStyles()
      const offsetHeight = Number(event?.data?.offsetHeight || 0)
      if (!iframe || !offsetHeight) {
        return
      }

      iframe.style.height = `${Math.max(offsetHeight + 16, getMinHeight())}px`
    }

    const initCusdis = async () => {
      window.addEventListener('message', handleResizeMessage)
      await loadExternalResource(langCDN, 'js')
      await loadExternalResource(src, 'js')

      timer = window.setTimeout(() => {
        window?.CUSDIS?.initial?.()
        applyIframeStyles()
      }, 60)

      retryTimer = window.setTimeout(() => {
        applyIframeStyles()
      }, 60)
    }

    initCusdis()

    return () => {
      window.removeEventListener('message', handleResizeMessage)
      if (timer) {
        window.clearTimeout(timer)
      }
      if (retryTimer) {
        window.clearTimeout(retryTimer)
      }
    }
  }, [frontMatter?.id, frontMatter?.title, isDarkMode, lang, router.asPath, langCDN, src])

  return <div id="cusdis_thread"
        ref={threadRef}
        lang={lang.toLowerCase()}
        data-host={siteConfig('COMMENT_CUSDIS_HOST')}
        data-app-id={siteConfig('COMMENT_CUSDIS_APP_ID')}
        data-page-id={frontMatter.id}
        data-page-url={siteConfig('LINK') + router.asPath}
        data-page-title={frontMatter.title}
        data-theme={isDarkMode ? 'dark' : 'light'}
    ></div>
}

export default CusdisComponent
