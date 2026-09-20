import LazyImage from '@/components/LazyImage'

function Block({ block }) {
  switch (block.type) {
    case 'heading': {
      const Heading = block.level === 3 ? 'h3' : 'h2'
      return <Heading>{block.text}</Heading>
    }
    case 'lead':
      return <p className='craft-lead'>{block.text}</p>
    case 'paragraph':
      return <p>{block.text}</p>
    case 'quote':
      return <blockquote>{block.text}</blockquote>
    case 'list': {
      const List = block.style === 'ordered' ? 'ol' : 'ul'
      return (
        <List>
          {block.items.map(item => (
            <li key={item}>{item}</li>
          ))}
        </List>
      )
    }
    case 'image':
      return (
        <figure>
          <LazyImage src={block.src} alt={block.alt || ''} />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      )
    case 'code':
      return (
        <pre>
          <code>{block.text}</code>
        </pre>
      )
    default:
      return null
  }
}

export default function CraftPreviewArticle({ post }) {
  return (
    <div
      id='container'
      className='max-w-5xl overflow-x-auto flex-grow mx-auto w-screen md:w-full'>
      <div className='craft-cover'>
        <LazyImage
          alt={post.cover.alt || post.title}
          src={post.cover.src}
          className='object-cover max-h-[60vh] w-full'
        />
        <div className='craft-cover-credit'>{post.cover.credit}</div>
      </div>

      <article className='craft-preview-article subpixel-antialiased overflow-y-hidden px-5 py-10 md:px-32 lg:pt-24 bg-white dark:bg-hexo-black-gray'>
        <div className='craft-preview-label'>
          <span>CRAFT PREVIEW</span>
          <span>不会进入正式博客</span>
        </div>

        <header>
          <h1>{post.title}</h1>
          <div className='craft-meta'>
            <span>{post.publishDate}</span>
            <span>{post.category}</span>
            <span>{post.tags.join(' · ')}</span>
          </div>
        </header>

        <section className='craft-body'>
          {post.blocks.map((block, index) => (
            <Block key={`${block.type}-${index}`} block={block} />
          ))}
        </section>

        <footer className='craft-pipeline'>
          <div>
            <strong>内容快照</strong>
            <span>{post.source.revision}</span>
          </div>
          <div>
            <strong>长毛象</strong>
            <span>{post.mastodon.mode === 'dry-run' ? '仅预演，不会发送' : post.mastodon.mode}</span>
          </div>
        </footer>
      </article>

      <style jsx global>{`
        .craft-cover {
          position: relative;
          background: #d9d5cc;
          overflow: hidden;
        }

        .craft-cover-credit {
          position: absolute;
          right: 1rem;
          bottom: 1rem;
          max-width: min(28rem, calc(100% - 2rem));
          padding: 0.45rem 0.7rem;
          color: rgba(255, 255, 255, 0.92);
          background: rgba(20, 20, 18, 0.62);
          backdrop-filter: blur(8px);
          font-size: 0.7rem;
          line-height: 1.35;
        }

        .craft-preview-article {
          color: #272724;
        }

        .dark .craft-preview-article {
          color: #deddd7;
        }

        .craft-preview-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 2.5rem;
          padding-bottom: 0.8rem;
          border-bottom: 1px solid #d6d1c7;
          color: #776f61;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.12em;
        }

        .craft-preview-article h1 {
          margin: 0;
          color: #171714;
          font-family: Baskerville, 'Songti SC', 'Noto Serif SC', serif;
          font-size: clamp(2.35rem, 8vw, 4.4rem);
          font-weight: 600;
          letter-spacing: -0.035em;
          line-height: 1.07;
        }

        .dark .craft-preview-article h1,
        .dark .craft-body h2,
        .dark .craft-body h3 {
          color: #f2f0e8;
        }

        .craft-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem 1.4rem;
          margin-top: 1.4rem;
          color: #8b8376;
          font-size: 0.78rem;
          letter-spacing: 0.04em;
        }

        .craft-body {
          max-width: 42rem;
          margin: 4.5rem auto 0;
          font-family: 'Songti SC', 'Noto Serif SC', Georgia, serif;
          font-size: 1.08rem;
          line-height: 2;
        }

        .craft-body p,
        .craft-body ul,
        .craft-body ol,
        .craft-body blockquote,
        .craft-body figure,
        .craft-body pre {
          margin: 1.7rem 0;
        }

        .craft-body .craft-lead {
          margin-bottom: 3rem;
          color: #4d4a43;
          font-size: 1.28rem;
          line-height: 1.8;
        }

        .dark .craft-body .craft-lead {
          color: #c8c4ba;
        }

        .craft-body h2,
        .craft-body h3 {
          margin: 4rem 0 1.2rem;
          color: #25231f;
          font-family: Baskerville, 'Songti SC', 'Noto Serif SC', serif;
          font-weight: 600;
          line-height: 1.35;
        }

        .craft-body h2 {
          font-size: 1.75rem;
        }

        .craft-body h3 {
          font-size: 1.35rem;
        }

        .craft-body ul,
        .craft-body ol {
          padding-left: 1.4rem;
        }

        .craft-body li {
          margin: 0.55rem 0;
          padding-left: 0.35rem;
        }

        .craft-body blockquote {
          padding: 1rem 0 1rem 1.5rem;
          border-left: 3px solid #a49a88;
          color: #5f594f;
          font-size: 1.18rem;
          font-style: italic;
        }

        .dark .craft-body blockquote {
          color: #bbb5a9;
        }

        .craft-body figure {
          margin-right: -2.5rem;
          margin-left: -2.5rem;
        }

        .craft-body figure img {
          width: 100%;
          max-height: 34rem;
          object-fit: cover;
        }

        .craft-body figcaption {
          margin-top: 0.7rem;
          color: #8a8377;
          font-family: sans-serif;
          font-size: 0.75rem;
          line-height: 1.6;
          text-align: center;
        }

        .craft-body pre {
          overflow-x: auto;
          padding: 1.2rem 1.4rem;
          border: 1px solid #dfdbd2;
          border-radius: 0;
          background: #f4f1ea;
          color: #49443b;
          font-size: 0.78rem;
          line-height: 1.7;
          white-space: pre-wrap;
        }

        .dark .craft-body pre {
          border-color: #44413c;
          background: #22211f;
          color: #d5d0c5;
        }

        .craft-pipeline {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1px;
          margin-top: 5rem;
          border: 1px solid #ded9cf;
          background: #ded9cf;
        }

        .craft-pipeline div {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          padding: 1rem 1.2rem;
          background: #f7f5ef;
        }

        .dark .craft-pipeline div {
          background: #22211f;
        }

        .craft-pipeline strong {
          font-size: 0.75rem;
        }

        .craft-pipeline span {
          color: #847d70;
          font-size: 0.7rem;
        }

        @media (max-width: 640px) {
          .craft-preview-article {
            padding-top: 3.5rem;
          }

          .craft-preview-label {
            align-items: flex-start;
            flex-direction: column;
            gap: 0.25rem;
          }

          .craft-body {
            margin-top: 3.5rem;
            font-size: 1.02rem;
            line-height: 1.95;
          }

          .craft-body figure {
            margin-right: -1.25rem;
            margin-left: -1.25rem;
          }

          .craft-pipeline {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
