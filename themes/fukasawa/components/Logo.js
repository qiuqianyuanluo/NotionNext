import { siteConfig } from '@/lib/config'
import SmartLink from '@/components/SmartLink'

const Logo = props => {
  const previewClassName = props.isCraftPreview
    ? 'border-0 px-0 py-0 hover:bg-transparent hover:text-black dark:hover:text-gray-300'
    : 'hover:bg-black hover:text-white border-black border-2 px-4 py-2 dark:border-gray-300'

  return (
    <section className='flex'>
      <SmartLink
        href='/'
        className={`logo duration-500 cursor-pointer dark:text-gray-300 font-black ${previewClassName}`}
      >
        {siteConfig('TITLE')}
      </SmartLink>
    </section>
  )
}

export default Logo
