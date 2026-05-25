// CommunityPosts 컴포넌트 - 인기 커뮤니티 글 표시
// 사용자들이 공유하는 인기 있는 투자 정보와 팁을 보여줍니다

// CommunityPosts는 API 호출로 데이터를 받아오도록 수정했습니다.
import SectionHeader from './SectionHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCommunityPosts, postCommunityLike, postCommunityView } from '../services/api';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorMessage from './ErrorMessage';

export default function CommunityPosts({ onOpenDetail }) {
  // API에서 인기 커뮤니티 글을 가져옵니다.
  const queryClient = useQueryClient();
  const { data = [], isLoading: loading, error } = useQuery(['community', 'posts'], getCommunityPosts);

  const viewMutation = useMutation((id) => postCommunityView(id), {
    onSettled: () => queryClient.invalidateQueries(['community', 'posts']),
  });

  const likeMutation = useMutation((id) => postCommunityLike(id), {
    onSettled: () => queryClient.invalidateQueries(['community', 'posts']),
  });

  const handleOpen = (post) => {
    viewMutation.mutate(post.id, {
      onSettled: () => onOpenDetail?.(post),
    });
  };

  const handleLike = (id) => {
    likeMutation.mutate(id);
  };

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="💬 인기 커뮤니티 글" description="투자 커뮤니티의 핫한 글들을 확인하세요" />

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <LoadingSkeleton className="p-5 h-36" />
            <LoadingSkeleton className="p-5 h-36" />
            <LoadingSkeleton className="p-5 h-36" />
          </div>
        )}

        {error && <ErrorMessage error={error} />}

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((post) => (
              <div
                key={post.id}
                onClick={() => handleOpen(post)}
                className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-gray-600 hover:shadow-lg transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-bold">⭐ {post.score}점</span>
                  <span className="inline-flex items-center px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">{post.category}</span>
                </div>

                <h3 className="text-white font-bold text-base mb-3 truncate group-hover:text-blue-400 transition-colors">{post.title}</h3>

                <div className="flex items-center space-x-2 mb-4 pb-4 border-b border-gray-700">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-blue-400 text-xs font-bold">{post.author.charAt(0)}</span>
                  </div>
                  <span className="text-gray-400 text-sm">{post.author}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1 text-gray-400"><span>👁️</span><span>{post.views}</span></div>
                  <div className="flex items-center space-x-1 text-gray-400">
                    <button onClick={(event) => { event.stopPropagation(); handleLike(post.id); }} className="inline-flex items-center space-x-1">
                      <span>❤️</span>
                      <span>{post.likes}</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-400"><span>💬</span><span>{post.comments}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => data?.[0] && onOpenDetail?.(data[0])}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            커뮤니티 더 보기
          </button>
        </div>
      </div>
    </section>
  );
}
