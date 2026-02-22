import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import PostCard from '../components/PostCard'

export default function HomePage() {
  const [page, setPage] = useState(0)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['posts', page],
    queryFn: async () => {
      const { data } = await api.get(`/api/posts?page=${page}&size=9`)
      return data
    }
  })

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  )

  if (isError) return (
    <div className="text-center py-12 text-red-600">Failed to load posts. Please try again.</div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Latest Posts</h1>
        <p className="text-gray-600 mt-1">Discover the latest in tech</p>
      </div>

      {!data?.content?.length ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No posts yet. Be the first to write one!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.content.map(post => <PostCard key={post.id} post={post} />)}
          </div>
          {data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">Page {page + 1} of {data.totalPages}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.totalPages - 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
