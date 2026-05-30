import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SectionHeader from './SectionHeader';
import { getCommunityPosts, postCommunityLike, postCommunityView } from '../services/api';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorMessage from './ErrorMessage';

export default function CommunityPosts({ onOpenDetail }) {
  const queryClient = useQueryClient();
  const { data = [], isLoading, error } = useQuery({ queryKey: ['community', 'posts'], queryFn: getCommunityPosts });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
  const viewMutation = useMutation({ mutationFn: postCommunityView, onSettled: refresh });
  const likeMutation = useMutation({ mutationFn: postCommunityLike, onSettled: refresh });

  return (
    <section id="community" className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="인기 커뮤니티 글" description="투자 커뮤니티의 인기 글을 확인하세요." />
        {isLoading && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map((id) => <LoadingSkeleton key={id} className="p-5 h-36" />)}</div>}
        {error && <ErrorMessage error={error} />}
        {!isLoading && !error && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{data.map((post) => (
          <div key={post.id} onClick={() => viewMutation.mutate(post.id, { onSettled: () => onOpenDetail?.(post) })} className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-gray-600 cursor-pointer">
            <div className="flex items-center justify-between mb-4"><span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-bold">점수 {post.score}</span><span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">{post.category}</span></div>
            <h3 className="text-white font-bold mb-3 truncate">{post.title}</h3><p className="text-gray-400 text-sm mb-4">{post.author}</p>
            <div className="flex justify-between text-sm text-gray-400"><span>조회 {post.views}</span><button type="button" onClick={(event) => { event.stopPropagation(); likeMutation.mutate(post.id); }}>좋아요 {post.likes}</button><span>댓글 {post.comments}</span></div>
          </div>
        ))}</div>}
      </div>
    </section>
  );
}
