import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { useEffect, useState } from 'react'
import CONFIG from '../config'

const BackToTopButton = () => {
  const { locale } = useGlobal()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!siteConfig('FUKASAWA_WIDGET_TO_TOP', null, CONFIG)) {
      return
    }

    const onScroll = () => {
      setVisible(window.scrollY > 360)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  if (!siteConfig('FUKASAWA_WIDGET_TO_TOP', null, CONFIG)) {
    return null
  }

  return (
    <button
      type='button'
      aria-label={locale.POST.TOP}
      title={locale.POST.TOP}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      className={`fixed right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-black bg-white text-black shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-300 dark:bg-gray-900 dark:text-gray-100 md:right-6 ${
        visible
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0'
      }`}>
      <i className='fas fa-chevron-up text-sm' />
    </button>
  )
}

export default BackToTopButton
