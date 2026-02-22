import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function CommentSection({ postId }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data } = await api.get(`/api/posts/${postId}/comments`)
      return data
    }
  })

  const addComment = useMutation({
    mutationFn: async (text) => {
      const { data } = await api.post(`/api/posts/${postId}/comments`, { content: text })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      setContent('')
      toast.success('Comment added!')
    },
    onError: () => toast.error('Failed to add comment')
  })

  const deleteComment = useMutation({
    mutationFn: async (commentId) => {
      await api.delete(`/api/comments/${commentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      toast.success('Comment deleted')
    }
  })

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Comments ({comments.length})</h3>

      {user && (
        <form onSubmit={e => { e.preventDefault(); if (content.trim()) addComment.mutate(content) }} className="mb-6">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write a comment..."
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={3}
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!content.trim() || addComment.isPending}
            className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {addComment.isPending ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="text-gray-500 text-sm">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-gray-500 text-sm">No comments yet. Be the first!</div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{comment.authorUsername}</span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                {(user?.username === comment.authorUsername || user?.role === 'ADMIN') && (
                  <button
                    onClick={() => deleteComment.mutate(comment.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
