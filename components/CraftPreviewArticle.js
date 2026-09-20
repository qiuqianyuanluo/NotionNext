import Comment from '@/components/Comment'
import {
  ArticleHeartButton,
  ArticleHeartProvider
} from '@/components/ArticleHeart'
import { AdSlot } from '@/components/GoogleAdsense'
import LazyImage from '@/components/LazyImage'
import ShareBar from '@/components/ShareBar'
import SmartLink from '@/components/SmartLink'
import WWAds from '@/components/WWAds'
import { useGlobal } from '@/lib/global'
import { formatDateFmt } from '@/lib/utils/formatDate'
import TagItemMini from '@/themes/fukasawa/components/TagItemMini'

function Block({ block }) {
  switch (block.type) {
    case 'heading': {
      const Heading = block.level === 3 ? 'h3' : 'h2'
      return (
        <Heading className={`notion-h notion-h${block.level || 2}`}>
          {block.text}
        </Heading>
      )
    }
    case 'lead':
      return <p className='notion-text craft-lead'>{block.text}</p>
    case 'paragraph':
      return <p className='notion-text'>{block.text}</p>
    case 'quote':
      return <blockquote className='notion-quote'>{block.text}</blockquote>
    case 'list': {
      const List = block.style === 'ordered' ? 'ol' : 'ul'
      const listClass =
        block.style === 'ordered' ? 'notion-list-numbered' : 'notion-list-disc'
      return (
        <List className={`notion-list ${listClass}`}>
          {block.items.map((item, index) => (
            <li key={`${index}-${item}`}>{item}</li>
          ))}
        </List>
      )
    }
    case 'image':
      return (
        <figure className='notion-asset-wrapper notion-asset-wrapper-image'>
          <LazyImage src={block.src} alt={block.alt || ''} />
          {block.caption && (
            <figcaption className='notion-asset-caption'>
              {block.caption}
            </figcaption>
          )}
        </figure>
      )
    case 'code':
      return (
        <pre className='notion-code'>
          <code>{block.text}</code>
        </pre>
      )
    default:
      return null
  }
}

export default function CraftPreviewArticle({ post }) {
  const { locale, fullWidth } = useGlobal()

  return (
    <ArticleHeartProvider post={post}>
      <div
        id='container'
        className={`${fullWidth ? 'px-10' : 'max-w-5xl '} overflow-x-auto flex-grow mx-auto w-screen md:w-full craft-preview-page`}
      >
        {post.pageCover && (
          <div className='w-full relative md:flex-shrink-0 overflow-hidden'>
            <LazyImage
              alt={post.cover?.alt || post.title}
              src={post.pageCover}
              className='object-cover max-h-[60vh] w-full'
            />
          </div>
        )}

        <article className='subpixel-antialiased overflow-y-hidden py-10 px-5 lg:pt-24 md:px-32 dark:border-gray-700 bg-white dark:bg-hexo-black-gray'>
          <div className='mb-8 flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-gray-200 pb-3 text-xs text-gray-400 dark:border-gray-700'>
            <span>Craft 测试预览</span>
            <span>不会进入首页、RSS 或正式站点地图</span>
          </div>

          <header>
            <h1 className='font-bold text-4xl text-black dark:text-white'>
              {post.title}
            </h1>

            <section className='flex-wrap flex mt-2 text-gray-400 dark:text-gray-400 font-light leading-8'>
              <div className='w-full'>
                {post.category && (
                  <>
                    <SmartLink
                      href={`/category/${post.category}`}
                      passHref
                      className='cursor-pointer text-md mr-2 hover:text-black dark:hover:text-white border-b dark:border-gray-500 border-dashed'
                    >
                      <i className='mr-1 fas fa-folder-open' />
                      {post.category}
                    </SmartLink>
                    <span className='mr-2'>|</span>
                  </>
                )}

                <SmartLink
                  href={`/archive#${formatDateFmt(post.publishDate, 'yyyy-MM')}`}
                  passHref
                  className='pl-1 mr-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 border-b dark:border-gray-500 border-dashed'
                >
                  {post.publishDay}
                </SmartLink>
                <span className='mr-2'>|</span>
                <span className='mx-2 text-gray-400 dark:text-gray-500'>
                  {locale.COMMON.LAST_EDITED_TIME}: {post.lastEditedDay}
                </span>

                <div className='my-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                  <div className='flex justify-start'>
                    <ArticleHeartButton variant='top' />
                  </div>
                  {post.tagItems?.length > 0 && (
                    <div className='flex flex-nowrap overflow-x-auto md:justify-end'>
                      {post.tagItems.map(tag => (
                        <TagItemMini key={tag.name} tag={tag} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <WWAds className='w-full' orientation='horizontal' />
          </header>

          <section id='article-wrapper'>
            <div id='notion-article' className='mx-auto overflow-hidden'>
              <main className='notion light-mode notion-page craft-preview-body'>
                {post.blocks.map((block, index) => (
                  <Block key={`${block.type}-${index}`} block={block} />
                ))}
              </main>
            </div>
          </section>

          <section>
            <AdSlot type='in-article' />
            <ShareBar
              post={post}
              leftContent={<ArticleHeartButton variant='bottom' />}
              stackOnMobile
            />
          </section>
        </article>

        <div className='duration-200 shadow py-6 px-12 w-screen md:w-full overflow-x-auto dark:border-gray-700 bg-white dark:bg-hexo-black-gray'>
          <Comment frontMatter={post} />
        </div>

        <style jsx global>{`
          .craft-preview-body {
            width: 100%;
            padding: 0;
          }

          .craft-preview-body .notion-text,
          .craft-preview-body .notion-list,
          .craft-preview-body .notion-quote,
          .craft-preview-body .notion-asset-wrapper,
          .craft-preview-body .notion-code {
            margin-top: 1rem;
            margin-bottom: 1rem;
          }

          .craft-preview-body .craft-lead {
            color: #6b7280;
            font-size: 1.08rem;
          }

          .craft-preview-body .notion-h {
            margin-top: 2.4rem;
            margin-bottom: 0.8rem;
            font-weight: 700;
          }

          .craft-preview-body h2 {
            font-size: 1.5rem;
          }

          .craft-preview-body h3 {
            font-size: 1.25rem;
          }

          .craft-preview-body .notion-asset-wrapper img {
            width: 100%;
            height: auto;
          }

          .craft-preview-body .notion-code {
            overflow-x: auto;
            padding: 1rem;
            background: #f5f5f5;
            white-space: pre-wrap;
          }

          .dark .craft-preview-body .notion-code {
            background: #202020;
          }
        `}</style>
      </div>
    </ArticleHeartProvider>
  )
}
