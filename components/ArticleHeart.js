import { createContext, useContext, useEffect, useState } from 'react'

const ArticleHeartContext = createContext(null)

const VISITOR_STORAGE_KEY = 'article-heart-visitor-id'

function createVisitorId() {
  if (typeof window === 'undefined') {
    return ''
  }

  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID().replace(/-/g, '_')
  }

  return `visitor_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

function getVisitorId() {
  if (typeof window === 'undefined') {
    return ''
  }

  const existingVisitorId = window.localStorage.getItem(VISITOR_STORAGE_KEY)
  if (existingVisitorId) {
    return existingVisitorId
  }

  const nextVisitorId = createVisitorId()
  window.localStorage.setItem(VISITOR_STORAGE_KEY, nextVisitorId)
  return nextVisitorId
}

async function requestReactionState(postId, visitorId, method = 'GET') {
  if (method === 'GET') {
    const params = new URLSearchParams({ postId, visitorId })
    const response = await fetch(`/api/reactions/heart?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error('Failed to fetch heart state')
    }

    return response.json()
  }

  const response = await fetch('/api/reactions/heart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      postId,
      visitorId
    })
  })

  if (!response.ok) {
    throw new Error('Failed to update heart state')
  }

  return response.json()
}

export function ArticleHeartProvider({ post, children }) {
  const [state, setState] = useState({
    count: 0,
    liked: false,
    loading: true,
    unavailable: false
  })

  const [visitorId, setVisitorId] = useState('')
  const postId = post?.id || ''

  useEffect(() => {
    if (!postId || typeof window === 'undefined') {
      return
    }

    const nextVisitorId = getVisitorId()
    setVisitorId(nextVisitorId)

    let cancelled = false

    requestReactionState(postId, nextVisitorId)
      .then(data => {
        if (cancelled) return
        setState({
          count: Number(data?.count || 0),
          liked: Boolean(data?.liked),
          loading: false,
          unavailable: false
        })
      })
      .catch(() => {
        if (cancelled) return
        setState(currentState => ({
          ...currentState,
          loading: false,
          unavailable: true
        }))
      })

    return () => {
      cancelled = true
    }
  }, [postId])

  const toggle = async () => {
    if (!postId || !visitorId || state.loading) {
      return
    }

    const previousState = state
    const optimisticLiked = !state.liked
    const optimisticCount = Math.max(
      0,
      state.count + (optimisticLiked ? 1 : -1)
    )

    setState({
      count: optimisticCount,
      liked: optimisticLiked,
      loading: true,
      unavailable: false
    })

    try {
      const data = await requestReactionState(postId, visitorId, 'POST')
      setState({
        count: Number(data?.count || 0),
        liked: Boolean(data?.liked),
        loading: false,
        unavailable: false
      })
    } catch (error) {
      setState({
        ...previousState,
        loading: false
      })
    }
  }

  return (
    <ArticleHeartContext.Provider value={{ ...state, toggle }}>
      {children}
    </ArticleHeartContext.Provider>
  )
}

export function useArticleHeart() {
  return useContext(ArticleHeartContext)
}

function ArticleHeartButtonInner({ variant = 'bottom', className = '' }) {
  const heart = useArticleHeart()

  if (!heart || heart.unavailable) {
    return null
  }

  const { count, liked, loading, toggle } = heart
  const baseClasses =
    'inline-flex items-center rounded-2xl border transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60'

  const variantClasses = {
    top: liked
      ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300 px-3 py-1.5 text-sm'
      : 'border-gray-200 bg-white text-gray-500 hover:border-rose-200 hover:text-rose-500 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:border-rose-500/40 dark:hover:text-rose-300 px-3 py-1.5 text-sm',
    bottom: liked
      ? 'border-rose-200 bg-rose-50 text-rose-600 shadow-sm dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300 px-4 py-2 text-base'
      : 'border-gray-200 bg-white text-gray-500 hover:border-rose-200 hover:text-rose-500 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:border-rose-500/40 dark:hover:text-rose-300 px-4 py-2 text-base'
  }

  return (
    <button
      type='button'
      aria-pressed={liked}
      aria-label='为这篇文章点红心'
      onClick={toggle}
      disabled={loading}
      className={`article-heart-button ${baseClasses} ${
        variantClasses[variant] || variantClasses.bottom
      } ${className}`.trim()}>
      <span
        className={`mr-2 leading-none ${
          liked ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'
        }`}>
        {liked ? '❤' : '♡'}
      </span>
      <span className='tabular-nums'>{count}</span>
    </button>
  )
}

export function ArticleHeartButton(props) {
  return <ArticleHeartButtonInner {...props} />
}
