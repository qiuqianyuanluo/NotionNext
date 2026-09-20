import CraftPreviewArticle from '@/components/CraftPreviewArticle'
import {
  getCraftPreviewPost,
  getCraftPreviewSlugs,
  toPageProps
} from '@/lib/craft-preview/posts'

export default function CraftPreviewPage({ post }) {
  return <CraftPreviewArticle post={post} />
}

export function getStaticPaths() {
  return {
    paths: getCraftPreviewSlugs().map(slug => ({ params: { slug } })),
    fallback: false
  }
}

export function getStaticProps({ params }) {
  const snapshot = getCraftPreviewPost(params.slug)
  if (!snapshot) {
    return { notFound: true }
  }

  return {
    props: toPageProps(snapshot)
  }
}
