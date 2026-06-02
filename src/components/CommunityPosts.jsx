import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCommunityPosts, postCommunityLike, postCommunityView } from '../services/api';
import ErrorMessage from './ErrorMessage';
import LoadingSkeleton from './LoadingSkeleton';
import SectionHeader from './SectionHeader';

const t = { title: '\uCEE4\uBBA4\uB2C8\uD2F0 \uC778\uAE30\uAE00', description: '\uD22C\uC790\uC790\uB4E4\uC774 \uB9CE\uC774 \uC77D\uC740 \uC774\uC57C\uAE30\uB97C \uBAA8\uC558\uC2B5\uB2C8\uB2E4.', views: '\uC870\uD68C', likes: '\uC88B\uC544\uC694', comments: '\uB313\uAE00', score: '\uC810\uC218' };

export default function CommunityPosts({ onOpenDetail }) {
  const client = useQueryClient();
  const { data = [], isLoading, error } = useQuery({ queryKey: ['community', 'posts'], queryFn: getCommunityPosts });
  const refresh = () => client.invalidateQueries({ queryKey: ['community', 'posts'] });
  const view = useMutation({ mutationFn: postCommunityView, onSettled: refresh });
  const like = useMutation({ mutationFn: postCommunityLike, onSettled: refresh });
  return <section id="community" className="py-7"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeader title={t.title} description={t.description} />{isLoading && <div className="grid gap-3 md:grid-cols-3">{[1, 2, 3].map((id) => <LoadingSkeleton key={id} className="h-40 p-4" />)}</div>}{error && <ErrorMessage error={error} />}{!isLoading && !error && <div className="grid gap-3 md:grid-cols-3">{data.map((post) => <article key={post.id} onClick={() => view.mutate(post.id, { onSettled: () => onOpenDetail?.(post) })} className="cursor-pointer rounded-md border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm"><div className="flex items-center justify-between text-xs"><span className="font-semibold text-blue-600">{post.category}</span><span className="text-slate-400">{t.score} {post.score}</span></div><h3 className="mt-3 font-bold text-slate-900">{post.title}</h3><p className="mt-2 text-sm text-slate-500">{post.author}</p><div className="mt-5 flex justify-between border-t border-slate-100 pt-3 text-xs text-slate-400"><span>{t.views} {post.views}</span><button type="button" onClick={(event) => { event.stopPropagation(); like.mutate(post.id); }} className="hover:text-blue-600">{t.likes} {post.likes}</button><span>{t.comments} {post.comments}</span></div></article>)}</div>}</div></section>;
}
