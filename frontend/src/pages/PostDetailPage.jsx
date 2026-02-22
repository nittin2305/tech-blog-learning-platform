import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import CommentSection from '../components/CommentSection'
import toast from 'react-hot-toast'

export default function PostDetailPage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['post', slug],
    queryFn: async () => {
      const { data } = await api.get(`/api/posts/${slug}`)
      return data
    }
  })

  const likeMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/api/posts/${post.id}/like`)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['post', slug] }),
    onError: () => toast.error('Failed to like post')
  })

  const deleteMutation = useMutation({
    mutationFn: async () => { await api.delete(`/api/posts/${post.id}`) },
    onSuccess: () => { toast.success('Post deleted'); navigate('/') },
    onError: () => toast.error('Failed to delete post')
  })

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  )

  if (isError || !post) return (
    <div className="text-center py-12 text-red-600">Post not found.</div>
  )

  const canEdit = user && (user.username === post.authorUsername || user.role === 'ADMIN')

  return (
    <article className="max-w-3xl mx-auto">
      {post.coverImageUrl && (
        <img src={post.coverImageUrl} alt={post.title} className="w-full h-64 object-cover rounded-xl mb-8" />
      )}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>By <strong>{post.authorUsername}</strong></span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
          <span>·</span>
          <span>👁 {post.viewCount} views</span>
        </div>
        {post.tags && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.split(',').map(tag => (
              <span key={tag.trim()} className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-medium">
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="prose prose-gray max-w-none mb-8">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      <div className="flex items-center gap-4 py-4 border-t border-b border-gray-200 mb-8">
        <button
          onClick={() => user ? likeMutation.mutate() : navigate('/login')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            post.likedByCurrentUser ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          ❤️ {post.likeCount} {post.likedByCurrentUser ? 'Unlike' : 'Like'}
        </button>
        {canEdit && (
          <>
            <Link to={`/edit/${post.id}`} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100">
              Edit
            </Link>
            <button
              onClick={() => { if (window.confirm('Delete this post?')) deleteMutation.mutate() }}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
            >
              Delete
            </button>
          </>
        )}
      </div>

      <CommentSection postId={post.id} />
    </article>
  )
}
