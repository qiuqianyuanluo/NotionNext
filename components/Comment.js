import Tabs from '@/components/Tabs'
import { siteConfig } from '@/lib/config'
import { isBrowser, isSearchEngineBot } from '@/lib/utils'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import Artalk from './Artalk'

/**
 * 评论组件
 * 只有当前组件在浏览器可见范围内才会加载内容
 * @param {*} param0
 * @returns
 */
const Comment = ({ frontMatter, className }) => {
  const router = useRouter()
  const [shouldLoad, setShouldLoad] = useState(false)
  const commentRef = useRef(null)

  const COMMENT_ARTALK_SERVER = siteConfig('COMMENT_ARTALK_SERVER')
  const COMMENT_TWIKOO_ENV_ID = siteConfig('COMMENT_TWIKOO_ENV_ID')
  const COMMENT_WALINE_SERVER_URL = siteConfig('COMMENT_WALINE_SERVER_URL')
  const COMMENT_VALINE_APP_ID = siteConfig('COMMENT_VALINE_APP_ID')
  const COMMENT_GISCUS_REPO = siteConfig('COMMENT_GISCUS_REPO')
  const COMMENT_CUSDIS_APP_ID = siteConfig('COMMENT_CUSDIS_APP_ID')
  const COMMENT_UTTERRANCES_REPO = siteConfig('COMMENT_UTTERRANCES_REPO')
  const COMMENT_GITALK_CLIENT_ID = siteConfig('COMMENT_GITALK_CLIENT_ID')
  const COMMENT_WEBMENTION_ENABLE = siteConfig('COMMENT_WEBMENTION_ENABLE')
  const COMMENT_ACTIVE_SERVICE = String(
    siteConfig('COMMENT_ACTIVE_SERVICE') || ''
  )
    .trim()
    .toLowerCase()

  useEffect(() => {
    if (shouldLoad || !commentRef.current) {
      return
    }

    if (!window.IntersectionObserver) {
      setShouldLoad(true)
      return
    }

    // 提前一点开始加载评论，避免移动端滚动到评论区后还要再点一次才触发脚本。
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.unobserve(entry.target)
        }
      })
    }, { rootMargin: '960px 0px' })

    observer.observe(commentRef.current)

    return () => {
      if (commentRef.current) {
        observer.unobserve(commentRef.current)
      }
    }
  }, [frontMatter, shouldLoad])

  // 当连接中有特殊参数时跳转到评论区
  useEffect(() => {
    if (
      !isBrowser ||
      !('giscus' in router.query || router.query.target === 'comment')
    ) {
      return
    }

    setShouldLoad(true)
    const timer = setTimeout(() => {
      const url = router.asPath.replace('?target=comment', '')
      history.replaceState({}, '', url)
      document
        ?.getElementById('comment')
        ?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }, 1000)

    return () => clearTimeout(timer)
  }, [router.asPath, router.query])

  if (!frontMatter) {
    return null
  }

  if (isSearchEngineBot) {
    return null
  }

  // 特定文章关闭评论区
  if (frontMatter?.comment === 'Hide') {
    return null
  }

  const singleServiceItems = {
    artalk: COMMENT_ARTALK_SERVER && (
      <div key='Artalk'>
        <Artalk />
      </div>
    ),
    twikoo: COMMENT_TWIKOO_ENV_ID && (
      <div key='Twikoo'>
        <TwikooCompenent />
      </div>
    ),
    waline: COMMENT_WALINE_SERVER_URL && (
      <div key='Waline'>
        <WalineComponent />
      </div>
    ),
    valine: COMMENT_VALINE_APP_ID && (
      <div key='Valine' name='reply'>
        <ValineComponent path={frontMatter.id} />
      </div>
    ),
    giscus: COMMENT_GISCUS_REPO && (
      <div key='Giscus'>
        <GiscusComponent className='px-2' />
      </div>
    ),
    cusdis: COMMENT_CUSDIS_APP_ID && (
      <div key='Cusdis'>
        <CusdisComponent frontMatter={frontMatter} />
      </div>
    ),
    utterances: COMMENT_UTTERRANCES_REPO && (
      <div key='Utterance'>
        <UtterancesComponent
          issueTerm={frontMatter.id}
          className='px-2'
        />
      </div>
    ),
    gitalk: COMMENT_GITALK_CLIENT_ID && (
      <div key='GitTalk'>
        <GitalkComponent frontMatter={frontMatter} />
      </div>
    ),
    webmention: COMMENT_WEBMENTION_ENABLE && (
      <div key='WebMention'>
        <WebMentionComponent frontMatter={frontMatter} className='px-2' />
      </div>
    )
  }

  const forcedCommentItem =
    COMMENT_ACTIVE_SERVICE && singleServiceItems[COMMENT_ACTIVE_SERVICE]

  // 迁移完成后默认优先走 Twikoo；保留 Cusdis 作为后备，便于回滚。
  const commentItems = forcedCommentItem
    ? [forcedCommentItem]
    : COMMENT_TWIKOO_ENV_ID
    ? [
        <div key='Twikoo'>
          <TwikooCompenent />
        </div>
      ]
    : COMMENT_CUSDIS_APP_ID
    ? [
        <div key='Cusdis'>
          <CusdisComponent frontMatter={frontMatter} />
        </div>
      ]
    : [
        singleServiceItems.artalk,
        singleServiceItems.twikoo,
        singleServiceItems.waline,
        singleServiceItems.valine,
        singleServiceItems.giscus,
        singleServiceItems.utterances,
        singleServiceItems.gitalk,
        singleServiceItems.webmention
      ].filter(Boolean)

  if (commentItems.length === 0) {
    return null
  }

  return (
    <div
      key={frontMatter?.id}
      id='comment'
      ref={commentRef}
      className={`comment mt-5 text-gray-800 dark:text-gray-300 ${className || ''}`}>
      {/* 延迟加载评论区 */}
      {!shouldLoad && (
        <div className='text-center'>
          Loading...
          <i className='fas fa-spinner animate-spin text-3xl ' />
        </div>
      )}

      {shouldLoad && (
        commentItems.length === 1
          ? commentItems[0]
          : <Tabs>{commentItems}</Tabs>
      )}
    </div>
  )
}

const WalineComponent = dynamic(
  () => {
    return import('@/components/WalineComponent')
  },
  { ssr: false }
)

const CusdisComponent = dynamic(
  () => {
    return import('@/components/CusdisComponent')
  },
  { ssr: false }
)

const TwikooCompenent = dynamic(
  () => {
    return import('@/components/Twikoo')
  },
  { ssr: false }
)

const GitalkComponent = dynamic(
  () => {
    return import('@/components/Gitalk')
  },
  { ssr: false }
)
const UtterancesComponent = dynamic(
  () => {
    return import('@/components/Utterances')
  },
  { ssr: false }
)
const GiscusComponent = dynamic(
  () => {
    return import('@/components/Giscus')
  },
  { ssr: false }
)
const WebMentionComponent = dynamic(
  () => {
    return import('@/components/WebMention')
  },
  { ssr: false }
)

const ValineComponent = dynamic(() => import('@/components/ValineComponent'), {
  ssr: false
})

export default Comment
