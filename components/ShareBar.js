import { siteConfig } from '@/lib/config'
import dynamic from 'next/dynamic'

const ShareButtons = dynamic(() => import('@/components/ShareButtons'), {
  ssr: false
})

/**
 * 分享栏
 * @param {} param0
 * @returns
 */
const ShareBar = ({ post, leftContent = null, stackOnMobile = false }) => {
  if (
    !JSON.parse(siteConfig('POST_SHARE_BAR_ENABLE')) ||
    !post ||
    post?.type !== 'Post'
  ) {
    return <></>
  }

  return (
    <div className='m-1 overflow-x-auto'>
      <div
        className={`flex w-full ${
          leftContent
            ? stackOnMobile
              ? 'flex-col gap-4 md:flex-row md:items-center md:justify-between'
              : 'items-center justify-between'
            : 'md:justify-end'
        }`}>
        {leftContent && <div className='flex justify-start'>{leftContent}</div>}
        <div className='flex w-full justify-start md:w-auto md:justify-end'>
          <ShareButtons post={post} />
        </div>
      </div>
    </div>
  )
}
export default ShareBar
