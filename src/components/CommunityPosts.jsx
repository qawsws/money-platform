import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createCommunityPost, getCommunityPosts, postCommunityLike, postCommunityUnlike, postCommunityView } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import QuoteSectionHeader from './ui/QuoteSectionHeader';
import ResultToolbar from './ui/ResultToolbar';

const t = {
  title: '커뮤니티',
  description: '투자자들이 시장 의견과 정보를 나누는 공간입니다.',
  pageTitle: '커뮤니티',
  pageDescription: '시장 의견, 투자 아이디어, 질문을 자유롭게 나눠보세요.',
  views: '조회',
  likes: '좋아요',
  comments: '댓글',
  score: '점수',
  write: '글쓰기',
  login: '로그인하면 글을 작성할 수 있습니다.',
  category: '분류',
  submit: '등록',
  submitting: '등록 중...',
  placeholderTitle: '제목을 입력하세요',
  placeholderContent: '투자 아이디어나 시장 의견을 적어주세요.',
  empty: '아직 등록된 게시글이 없습니다.',
  more: '더보기',
  error: '커뮤니티 글을 불러오지 못했습니다.',
  retry: '다시 시도',
};

const token = () => localStorage.getItem('mp_token') || '';
const likedKey = () => `mp_liked_posts:${localStorage.getItem('mp_user') || 'guest'}`;
const readLiked = () => {
  try {
    return JSON.parse(localStorage.getItem(likedKey()) || '[]');
  } catch {
    return [];
  }
};
const writeLiked = (items) => localStorage.setItem(likedKey(), JSON.stringify(items));
const blankForm = { category: '자유', title: '', content: '' };
const categories = ['자유', '투자전략', '국내주식', '미국주식', '암호화폐', '질문'];
const categoryTone = {
  자유: 'bg-slate-100 text-slate-700',
  투자전략: 'bg-emerald-50 text-emerald-700',
  국내주식: 'bg-rose-50 text-rose-700',
  미국주식: 'bg-indigo-50 text-indigo-700',
  암호화폐: 'bg-sky-50 text-sky-700',
  질문: 'bg-amber-50 text-amber-700',
};

function numericValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const text = String(value ?? '').trim().toUpperCase();
  const parsed = Number(text.replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(parsed)) return 0;
  if (text.includes('M')) return parsed * 1000000;
  if (text.includes('K')) return parsed * 1000;
  return parsed;
}

function UserAvatar({ name, className = '' }) {
  const initial = String(name || '?').trim().charAt(0).toUpperCase() || '?';
  return <span className={`grid size-9 shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)] text-xs font-black text-[var(--color-primary)] ${className}`}>{initial}</span>;
}

function FieldLabel({ htmlFor, children }) {
  return <label htmlFor={htmlFor} className="mb-2 block text-sm font-bold text-[var(--color-text-primary)]">{children}</label>;
}

function StatusPanel({ message, onRetry, action }) {
  return (
    <Card hover={false} className="flex min-h-48 flex-col items-center justify-center p-6 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-[var(--color-primary-soft)] text-sm font-black text-[var(--color-primary)]">C</span>
      <p className="mt-3 text-sm font-bold text-[var(--color-text-secondary)]">{message}</p>
      {action}
      {onRetry && <button type="button" onClick={onRetry} className="mt-4 rounded-full bg-[var(--color-primary-soft)] px-4 py-2 text-sm font-bold text-[var(--color-primary)] hover:bg-emerald-100">{t.retry}</button>}
    </Card>
  );
}

function CommunitySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_0.75fr]">
      {[1, 2].map((item) => (
        <Card key={item} hover={false} className="p-5">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-24 rounded-full bg-slate-100" />
            <div className="h-8 w-3/4 rounded bg-slate-100" />
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-2/3 rounded bg-slate-100" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function StatIcon({ type }) {
  const paths = {
    views: 'M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    comments: 'M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H9l-5 4v-4.5A2.5 2.5 0 0 1 4 12.5v-7Z',
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5"><path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

function MetaItem({ icon, label, value }) {
  if (value == null || value === '') return null;
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-text-tertiary)]">{icon && <StatIcon type={icon} />}<span>{label} {value}</span></span>;
}

function CommunityItem({ post, index, liked, disabled, onOpen, onLike, compact = false }) {
  return (
    <article className="group relative border-b border-[var(--color-border)] last:border-b-0">
      <button type="button" onClick={() => onOpen(post)} aria-label={`${post.title} 상세 보기`} className="absolute inset-0 z-0 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2" />
      <div className="relative z-10 flex gap-3 px-4 py-4 pointer-events-none">
        {!compact && <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-background-soft)] text-xs font-black text-[var(--color-primary)]">{index + 1}</span>}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {post.category && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${categoryTone[post.category] || categoryTone.자유}`}>{post.category}</span>}
            {(post.authorName || post.author) && <span className="text-xs font-bold text-[var(--color-primary)]">{post.authorName || post.author}</span>}
          </div>
          <h3 className={(compact ? 'text-sm leading-5' : 'text-base leading-6') + ' mt-2 line-clamp-2 font-extrabold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]'}>{post.title}</h3>
          {!compact && post.content && <p className="mt-2 line-clamp-2 text-sm leading-5 text-[var(--color-text-secondary)]">{post.content}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <MetaItem icon="views" label={t.views} value={post.views} />
            <MetaItem icon="comments" label={t.comments} value={post.comments} />
            {post.score != null && <MetaItem label={t.score} value={post.score} />}
          </div>
        </div>
        <button type="button" disabled={disabled} aria-pressed={liked} onClick={(event) => { event.stopPropagation(); onLike(post.id); }} className={`pointer-events-auto inline-flex min-h-9 h-fit shrink-0 items-center gap-1 rounded-full border px-3 text-xs font-bold transition disabled:opacity-80 ${liked ? 'border-rose-500 bg-rose-500 text-white' : 'border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:bg-rose-100'}`}>
          {liked ? '취소' : '좋아요'} {post.likes}
        </button>
      </div>
    </article>
  );
}

function FeaturedPost({ post, onOpen }) {
  if (!post) return null;
  return (
    <Card hover={false} className="overflow-hidden p-0">
      <button type="button" onClick={() => onOpen(post)} className="group block w-full bg-white p-6 text-left transition hover:bg-[var(--color-surface-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-black text-[var(--color-primary)] shadow-sm">오늘의 인기 글</span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${categoryTone[post.category] || categoryTone.자유}`}>{post.category || '커뮤니티'}</span>
        </div>
        <h2 className="mt-4 line-clamp-2 text-2xl font-black leading-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]">{post.title}</h2>
        {post.content && <p className="mt-3 line-clamp-3 max-w-3xl text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">{post.content}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-black text-[var(--color-text-tertiary)]">
          <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1">{post.authorName || post.author || '사용자'}</span>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-600">좋아요 {post.likes}</span>
          <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1">댓글 {post.comments}</span>
        </div>
      </button>
    </Card>
  );
}

function CategoryTabs({ active, counts, onChange }) {
  return (
    <div className="sticky top-20 z-10 flex gap-2 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white/95 p-2 shadow-sm backdrop-blur" role="tablist" aria-label="커뮤니티 분류">
      {['전체', ...categories].map((category) => (
        <button key={category} type="button" role="tab" aria-selected={active === category} onClick={() => onChange(category)} className={(active === category ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-background-soft)] text-[var(--color-text-secondary)] hover:bg-emerald-50 hover:text-[var(--color-primary)]') + ' shrink-0 rounded-lg px-4 py-2 text-sm font-black transition'}>
          {category} <span className="ml-1 text-xs opacity-80">{counts[category] || 0}</span>
        </button>
      ))}
    </div>
  );
}

function CommunityStats({ posts }) {
  const totalViews = posts.reduce((sum, post) => sum + numericValue(post.views), 0);
  const totalComments = posts.reduce((sum, post) => sum + numericValue(post.comments), 0);
  const totalLikes = posts.reduce((sum, post) => sum + numericValue(post.likes), 0);
  const stats = [
    { label: '게시글', value: posts.length + '개' },
    { label: '조회', value: totalViews.toLocaleString('ko-KR') },
    { label: '댓글', value: totalComments.toLocaleString('ko-KR') },
    { label: '좋아요', value: totalLikes.toLocaleString('ko-KR') },
  ];

  return (
    <Card hover={false} className="p-5">
      <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">커뮤니티 현황</p>
      <h2 className="mt-2 text-xl font-black text-[var(--color-text-primary)]">오늘의 활동</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-[var(--color-surface-muted)] px-4 py-3">
            <p className="text-xs font-extrabold text-[var(--color-text-muted)]">{stat.label}</p>
            <p className="mt-1 text-lg font-black text-[var(--color-text-primary)]">{stat.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PopularPanel({ posts, likedPosts, disabled, onOpen, onLike }) {
  const popular = [...posts].sort((a, b) => numericValue(b.likes) - numericValue(a.likes)).slice(0, 5);
  return (
    <Card hover={false} className="p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
        <div>
          <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">인기 순위</p>
          <h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">많이 공감한 글</h2>
        </div>
        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">Top 5</span>
      </div>
      <div>
        {popular.length > 0 ? popular.map((post, index) => (
          <CommunityItem key={post.id} post={post} index={index} liked={likedPosts.includes(post.id)} disabled={disabled} onOpen={onOpen} onLike={onLike} compact />
        )) : <p className="p-5 text-sm font-bold text-[var(--color-text-secondary)]">아직 인기 글이 없습니다.</p>}
      </div>
    </Card>
  );
}

function CategoryPanel({ counts }) {
  return (
    <Card hover={false} className="p-5">
      <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">분류별 글</p>
      <h2 className="mt-2 text-xl font-black text-[var(--color-text-primary)]">어떤 이야기가 많을까요?</h2>
      <div className="mt-4 space-y-3">
        {categories.map((category) => (
          <div key={category} className="flex items-center justify-between rounded-xl bg-[var(--color-surface-muted)] px-4 py-3">
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${categoryTone[category] || categoryTone.자유}`}>{category}</span>
            <span className="text-sm font-black text-[var(--color-text-primary)]">{counts[category] || 0}개</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function GuidePanel() {
  const rows = ['투자 의견은 근거와 함께 적으면 더 도움이 됩니다.', '특정 종목 추천보다 관점과 리스크를 함께 공유해주세요.', '허위 정보, 욕설, 개인정보 노출 글은 관리자 조치 대상입니다.'];
  return (
    <Card hover={false} className="p-5">
      <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">커뮤니티 가이드</p>
      <h2 className="mt-2 text-xl font-black text-[var(--color-text-primary)]">좋은 글을 쓰는 방법</h2>
      <div className="mt-4 divide-y divide-[var(--color-border)]">
        {rows.map((row) => <p key={row} className="py-3 text-sm font-semibold leading-6 text-[var(--color-text-secondary)] first:pt-0 last:pb-0">{row}</p>)}
      </div>
    </Card>
  );
}

function Composer({ user, form, update, create, canSubmit, onCancel }) {
  return (
    <Card as="form" hover={false} onSubmit={(event) => { event.preventDefault(); if (canSubmit) create.mutate(); }} className="p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <UserAvatar name={user?.name || user?.username || 'G'} />
          <div className="min-w-0">
            <h2 className="text-xl font-black text-[var(--color-text-primary)]">{t.write}</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{user ? '투자 아이디어와 시장 의견을 간결하게 공유해보세요.' : t.login}</p>
          </div>
        </div>
        {user && <span className="max-w-full truncate rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">{user.name || user.username}</span>}
      </div>
      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
        <div>
          <FieldLabel htmlFor="community-category">{t.category}</FieldLabel>
          <select id="community-category" value={form.category} onChange={update('category')} disabled={!user} aria-label={t.category} className="h-11 w-full rounded-2xl border border-[var(--color-border)] bg-white px-3 text-sm font-semibold text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-400">
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="community-title">제목</FieldLabel>
          <input id="community-title" value={form.title} onChange={update('title')} placeholder={t.placeholderTitle} disabled={!user} className="h-11 w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-400" />
        </div>
      </div>
      <div className="mt-4">
        <FieldLabel htmlFor="community-content">본문</FieldLabel>
        <textarea id="community-content" value={form.content} onChange={update('content')} placeholder={t.placeholderContent} disabled={!user} rows={6} className="min-h-32 w-full resize-y rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-400" />
      </div>
      {create.error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{create.error.message}</p>}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white px-5 text-sm font-bold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-muted)]">닫기</button>
        <button type="submit" disabled={!canSubmit} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)] disabled:bg-slate-300">{create.isPending ? t.submitting : t.submit}</button>
      </div>
    </Card>
  );
}

export default function CommunityPosts({ onOpenDetail, limit = null, showComposer = false, showMore = false, contained = true }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const [form, setForm] = useState(blankForm);
  const [likedPosts, setLikedPosts] = useState(readLiked);
  const [activeCategory, setActiveCategory] = useState('전체');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['community', 'posts'], queryFn: getCommunityPosts });
  const refresh = () => client.invalidateQueries({ queryKey: ['community', 'posts'] });
  const view = useMutation({ mutationFn: postCommunityView, onSettled: refresh });
  const like = useMutation({ mutationFn: postCommunityLike, onSettled: refresh });
  const unlike = useMutation({ mutationFn: postCommunityUnlike, onSettled: refresh });
  const create = useMutation({
    mutationFn: () => createCommunityPost(token(), form),
    onSuccess: () => {
      setForm(blankForm);
      setIsComposerOpen(false);
      refresh();
    },
  });
  const posts = limit ? data.slice(0, limit) : data;
  const isPage = contained && !limit && !showMore;
  const canSubmit = Boolean(user) && form.title.trim().length >= 2 && form.content.trim().length >= 5 && !create.isPending;
  const update = (field) => (event) => setForm((value) => ({ ...value, [field]: event.target.value }));
  const openPost = (post) => view.mutate(post.id, {
    onSuccess: (result) => onOpenDetail?.(result.post || post),
    onError: () => onOpenDetail?.(post),
  });
  const likePost = (postId) => {
    const selected = likedPosts.includes(postId);
    const next = selected ? likedPosts.filter((id) => id !== postId) : [...likedPosts, postId];
    setLikedPosts(next);
    writeLiked(next);
    const mutation = selected ? unlike : like;
    mutation.mutate(postId, {
      onError: () => {
        setLikedPosts(likedPosts);
        writeLiked(likedPosts);
      },
    });
  };
  const counts = useMemo(() => {
    const result = { 전체: posts.length };
    categories.forEach((category) => { result[category] = posts.filter((post) => post.category === category).length; });
    return result;
  }, [posts]);
  const visiblePosts = activeCategory === '전체' ? posts : posts.filter((post) => post.category === activeCategory);
  const featured = [...posts].sort((a, b) => numericValue(b.likes) - numericValue(a.likes))[0];
  const disabledLike = like.isPending || unlike.isPending;

  const openComposerButton = showComposer && (
    <button type="button" onClick={() => setIsComposerOpen((value) => !value)} className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-xs font-black text-white transition hover:bg-[var(--color-primary-hover)]">
      {isComposerOpen ? '글쓰기 닫기' : '글쓰기'}
    </button>
  );

  const content = (
    <>
      {isPage ? <PageHeader eyebrow="커뮤니티" title={t.pageTitle} description={t.pageDescription} /> : <QuoteSectionHeader title={t.title} description={t.description} action={showMore && <Link to="/community" className="text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">{t.more}</Link>} />}
      {isPage && <ResultToolbar count={posts.length} label="게시글" />}
      {isLoading && <CommunitySkeleton />}
      {error && <StatusPanel message={t.error} onRetry={refetch} />}
      {!isLoading && !error && posts.length === 0 && !isPage && <StatusPanel message={t.empty} />}
      {!isLoading && !error && (posts.length > 0 || isPage) && (
        isPage ? (
          <div className="space-y-5">
            <FeaturedPost post={featured} onOpen={openPost} />
            <CategoryTabs active={activeCategory} counts={counts} onChange={setActiveCategory} />
            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.45fr_0.75fr]">
              <div className="space-y-5">
                <Card hover={false} className="overflow-hidden p-0">
                  <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-black text-[var(--color-text-primary)]">{activeCategory === '전체' ? '전체 게시글' : activeCategory + ' 게시글'}</h2>
                      <p className="mt-1 text-xs font-bold text-[var(--color-text-tertiary)]">읽고 의견을 남기고 싶을 때 글쓰기를 열어주세요.</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-[var(--color-background-soft)] px-3 py-1 text-xs font-black text-[var(--color-text-secondary)]">{visiblePosts.length}개</span>
                      {openComposerButton}
                    </div>
                  </div>
                  <div>
                    {visiblePosts.length > 0 ? visiblePosts.map((post, index) => (
                      <CommunityItem key={post.id} post={post} index={index} liked={likedPosts.includes(post.id)} disabled={disabledLike} onOpen={openPost} onLike={likePost} />
                    )) : (
                      <div className="flex min-h-44 flex-col items-center justify-center px-4 py-10 text-center">
                        <span className="grid size-10 place-items-center rounded-full bg-[var(--color-primary-soft)] text-sm font-black text-[var(--color-primary)]">C</span>
                        <p className="mt-3 text-sm font-bold text-[var(--color-text-secondary)]">{t.empty}</p>
                        {showComposer && <button type="button" onClick={() => setIsComposerOpen(true)} className="mt-4 rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-black text-white transition hover:bg-[var(--color-primary-hover)]">첫 글쓰기</button>}
                      </div>
                    )}
                  </div>
                </Card>
                {showComposer && isComposerOpen && <Composer user={user} form={form} update={update} create={create} canSubmit={canSubmit} onCancel={() => setIsComposerOpen(false)} />}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <CategoryPanel counts={counts} />
                  <GuidePanel />
                </div>
              </div>
              <div className="space-y-5">
                <CommunityStats posts={posts} />
                <PopularPanel posts={posts} likedPosts={likedPosts} disabled={disabledLike} onOpen={openPost} onLike={likePost} />
              </div>
            </div>
          </div>
        ) : (
          <Card hover={false} className="overflow-hidden p-0">
            <div>
              {posts.map((post, index) => <CommunityItem key={post.id} post={post} index={index} liked={likedPosts.includes(post.id)} disabled={disabledLike} onOpen={openPost} onLike={likePost} />)}
            </div>
          </Card>
        )
      )}
    </>
  );

  if (!contained) return <section id="community" className="min-w-0">{content}</section>;

  return (
    <section id="community" className="py-7">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{content}</div>
    </section>
  );
}
