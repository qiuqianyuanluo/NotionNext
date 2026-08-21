import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const data = await fetchGlobalAllData({ from: 'api-health' })
    const publishedPosts = data.allPages.filter(
      page => page.type === 'Post' && page.status === 'Published'
    ).length

    if (publishedPosts === 0) {
      throw new Error('No published posts found')
    }

    return res.status(200).json({
      status: 'ok',
      siteTitle: data.siteInfo.title,
      publishedPosts,
      checkedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Blog health check failed', error)
    return res.status(503).json({
      status: 'error',
      message: 'Notion site data is unavailable',
      checkedAt: new Date().toISOString()
    })
  }
}
