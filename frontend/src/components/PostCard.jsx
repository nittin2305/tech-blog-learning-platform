import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'

export default function PostCard({ post }) {
  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {post.coverImageUrl && (
        <img src={post.coverImageUrl} alt={post.title} className="w-full h-48 object-cover" />
      )}
      <div className="p-6">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 flex-wrap">
          <span>By {post.authorUsername}</span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
          {post.tags && post.tags.split(',').slice(0, 3).map(tag => (
            <span key={tag.trim()} className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
              {tag.trim()}
            </span>
          ))}
        </div>
        <Link to={`/posts/${post.slug}`}>
          <h2 className="text-xl font-semibold text-gray-900 mb-2 hover:text-indigo-600 transition-colors line-clamp-2">
            {post.title}
          </h2>
        </Link>
        {post.excerpt && (
          <p className="text-gray-600 text-sm line-clamp-3 mb-4">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>👁 {post.viewCount}</span>
          <span>❤️ {post.likeCount}</span>
          <Link to={`/posts/${post.slug}`} className="ml-auto text-indigo-600 hover:text-indigo-700 font-medium">
            Read more →
          </Link>
        </div>
      </div>
    </article>
  )
}
