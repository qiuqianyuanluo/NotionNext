import fs from 'fs'
import path from 'path'

const CONTENT_DIR = path.join(process.cwd(), 'content', 'craft-preview')

function previewIsEnabled() {
  return (
    process.env.VERCEL_ENV !== 'production' ||
    process.env.ENABLE_CRAFT_PREVIEW === 'true'
  )
}

export function getCraftPreviewSlugs() {
  if (!previewIsEnabled()) {
    return []
  }

  return fs
    .readdirSync(CONTENT_DIR)
    .filter(fileName => fileName.endsWith('.json'))
    .map(fileName => fileName.replace(/\.json$/, ''))
}

export function getCraftPreviewPost(slug) {
  if (!previewIsEnabled() || !/^[a-z0-9-]+$/.test(slug)) {
    return null
  }

  const filePath = path.join(CONTENT_DIR, `${slug}.json`)
  if (!fs.existsSync(filePath)) {
    return null
  }

  const post = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  if (post.slug !== slug || !post.title || !Array.isArray(post.blocks)) {
    throw new Error(`Invalid Craft preview snapshot: ${filePath}`)
  }

  return post
}

export function toPageProps(snapshot) {
  const tagItems = snapshot.tags.map(name => ({ name, count: 1 }))
  const postId = String(snapshot.id || snapshot.source?.documentId || '')
    .toLowerCase()
    .replace(/[^a-f0-9-]/g, '')

  return {
    noIndex: true,
    isCraftPreview: true,
    siteInfo: {
      title: 'Kylinbag',
      description: 'Miona 的地图',
      pageCover: snapshot.cover.src,
      icon: '/avatar.png'
    },
    post: {
      ...snapshot,
      id: postId,
      type: 'Post',
      pageCover: snapshot.cover.src,
      pageCoverThumbnail: snapshot.cover.src,
      publishDay: snapshot.publishDate,
      lastEditedDay: snapshot.publishDate,
      tagItems,
      fullWidth: false
    },
    categoryOptions: [{ name: snapshot.category, count: 1 }],
    tagOptions: tagItems,
    customMenu: [
      { name: '返回正式博客', href: '/', show: true },
      {
        name: 'Craft 流程测试',
        href: `/craft-preview/${snapshot.slug}`,
        show: true
      }
    ],
    customNav: [],
    notice: null
  }
}
