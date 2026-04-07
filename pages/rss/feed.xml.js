import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { buildRssXml } from '@/lib/utils/rss'

export async function getServerSideProps(ctx) {
  const { locale } = ctx
  const props = await fetchGlobalAllData({ from: 'rss/feed.xml', locale })
  const rssXml = await buildRssXml(props)

  ctx.res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
  ctx.res.setHeader(
    'Cache-Control',
    `public, s-maxage=${siteConfig(
      'NEXT_REVALIDATE_SECOND',
      BLOG.NEXT_REVALIDATE_SECOND,
      props.NOTION_CONFIG
    )}, stale-while-revalidate=59`
  )
  ctx.res.write(rssXml)
  ctx.res.end()

  return {
    props: {}
  }
}

export default function RSSFeed() {
  return null
}
