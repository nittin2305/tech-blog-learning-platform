import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function EditPostPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const { data: post } = useQuery({
    queryKey: ['post-edit', postId],
    queryFn: async () => {
      // Fetch post by ID via search through list (no direct by-ID endpoint for published posts)
      const { data } = await api.get(`/api/posts?page=0&size=100`)
      const found = data.content.find(p => p.id === Number(postId))
      if (!found) throw new Error('Post not found')
      return found
    }
  })

  useEffect(() => {
    if (post && !form) {
      setForm({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || '',
        tags: post.tags || '',
        coverImageUrl: post.coverImageUrl || '',
        status: post.status
      })
    }
  }, [post, form])

  const updatePost = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(`/api/posts/${postId}`, form)
      return data
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post', updated.slug] })
      toast.success('Post updated!')
      navigate(`/posts/${updated.slug}`)
    },
    onError: () => toast.error('Failed to update post')
  })

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    setUploading(true)
    try {
      const { data } = await api.post('/api/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(f => ({ ...f, coverImageUrl: data.url }))
      toast.success('Image uploaded!')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (!form) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Post</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required maxLength={200}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
          <input type="text" value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} maxLength={500}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
          <div className="flex items-center gap-3">
            <input type="text" value={form.coverImageUrl} onChange={e => setForm(f => ({ ...f, coverImageUrl: e.target.value }))}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50">
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content * (Markdown)</label>
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required rows={15}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono resize-vertical" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => updatePost.mutate()} disabled={!form.title || !form.content || updatePost.isPending}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {updatePost.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
