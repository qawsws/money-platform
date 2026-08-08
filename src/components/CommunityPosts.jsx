import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createCommunityPost, getCommunityPosts, postCommunityLike, postCommunityUnlike, postCommunityView } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import QuoteSectionHeader from './ui/QuoteSectionHeader';
import ResultToolbar from './ui/ResultToolbar';

const t = {
  title: '\uC778\uAE30 \uCEE4\uBBA4\uB2C8\uD2F0',
  description: '\uD22C\uC790\uC790\uB4E4\uC774 \uC9C0\uAE08 \uC774\uC57C\uAE30\uD558\uB294 \uC8FC\uC81C\uC785\uB2C8\uB2E4.',
  pageTitle: '\uCEE4\uBBA4\uB2C8\uD2F0',
  pageDescription: '\uD22C\uC790\uC790\uB4E4\uACFC \uC2DC\uC7A5 \uC758\uACAC\uACFC \uC815\uBCF4\uB97C \uB098\uB204\uB294 \uACF5\uAC04\uC785\uB2C8\uB2E4.',
  views: '\uC870\uD68C',
  likes: '\uC88B\uC544\uC694',
  comments: '\uB313\uAE00',
  score: '\uC810\uC218',
  write: '\uAE00\uC4F0\uAE30',
  login: '\uB85C\uADF8\uC778 \uD6C4 \uAE00\uC744 \uC791\uC131\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
  category: '\uBD84\uB958',
  submit: '\uB4F1\uB85D',
  submitting: '\uB4F1\uB85D \uC911...',
  placeholderTitle: '\uC608: \uC7A5\uAE30 \uD22C\uC790 \uAD00\uC810\uC5D0\uC11C \uBCF8 \uC560\uD50C',
  placeholderContent: '\uD22C\uC790 \uC544\uC774\uB514\uC5B4\uB098 \uC758\uACAC\uC744 \uC801\uC5B4\uC8FC\uC138\uC694.',
  empty: '\uC544\uC9C1 \uB4F1\uB85D\uB41C \uAC8C\uC2DC\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.',
  more: '\uB354\uBCF4\uAE30',
  error: '\uCEE4\uBBA4\uB2C8\uD2F0 \uAE00\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.',
  retry: '\uB2E4\uC2DC \uC2DC\uB3C4',
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
const blankForm = { category: '\uC790\uC720', title: '', content: '' };
const categories = ['\uC790\uC720', '\uD22C\uC790\uC804\uB7B5', '\uAD6D\uB0B4\uC8FC\uC2DD', '\uBBF8\uAD6D\uC8FC\uC2DD', '\uC554\uD638\uD654\uD3D0', '\uC9C8\uBB38'];

function UserAvatar({ name, className = '' }) {
  const initial = String(name || '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <span className={`grid size-9 shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)] text-xs font-black text-[var(--color-primary)] ${className}`}>
      {initial}
    </span>
  );
}

function FieldLabel({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-bold text-[var(--color-text-primary)]">
      {children}
    </label>
  );
}

function StatusPanel({ message, onRetry }) {
  return (
    <Card hover={false} className="flex min-h-48 flex-col items-center justify-center p-6 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-[var(--color-primary-soft)] text-sm font-black text-[var(--color-primary)]">C</span>
      <p className="mt-3 text-sm font-bold text-[var(--color-text-secondary)]">{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="mt-4 rounded-full bg-[var(--color-primary-soft)] px-4 py-2 text-sm font-bold text-[var(--color-primary)] hover:bg-blue-100">{t.retry}</button>}
    </Card>
  );
}

function CommunitySkeleton() {
  return (
    <Card hover={false} className="p-5">
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex gap-3 animate-pulse">
            <div className="size-8 shrink-0 rounded-full bg-slate-100" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-20 rounded-full bg-slate-100" />
              <div className="mt-3 h-5 w-full rounded bg-slate-100" />
              <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function StatIcon({ type }) {
  const paths = {
    views: 'M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    comments: 'M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H9l-5 4v-4.5A2.5 2.5 0 0 1 4 12.5v-7Z',
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5">
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function MetaItem({ icon, label, value }) {
  if (value == null || value === '') return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-text-tertiary)]">
      {icon && <StatIcon type={icon} />}
      <span>{label} {value}</span>
    </span>
  );
}

function CommunityItem({ post, index, liked, disabled, onOpen, onLike }) {
  return (
    <article className="group relative rounded-2xl px-3 py-4 transition hover:bg-[var(--color-surface-muted)]">
      <button
        type="button"
        onClick={() => onOpen(post)}
        aria-label={`${post.title} \uC0C1\uC138 \uBCF4\uAE30`}
        className="absolute inset-0 z-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
      />
      <div className="relative z-10 flex gap-3 pointer-events-none">
        {index < 3 && <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)] text-xs font-black text-[var(--color-primary)]">{index + 1}</span>}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {post.category && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-[var(--color-text-secondary)]">{post.category}</span>}
            {(post.authorName || post.author) && <span className="text-xs font-medium text-[var(--color-text-tertiary)]">{post.authorName || post.author}</span>}
          </div>
          <h3 className="mt-2 line-clamp-2 text-base font-extrabold leading-6 text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]">{post.title}</h3>
          {post.content && <p className="mt-2 line-clamp-2 text-sm leading-5 text-[var(--color-text-secondary)]">{post.content}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <MetaItem icon="views" label={t.views} value={post.views} />
            <MetaItem icon="comments" label={t.comments} value={post.comments} />
            {post.score != null && <MetaItem label={t.score} value={post.score} />}
          </div>
        </div>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={liked}
          onClick={(event) => { event.stopPropagation(); onLike(post.id); }}
          className={`pointer-events-auto inline-flex min-h-9 h-fit shrink-0 items-center gap-1 rounded-full border px-3 text-xs font-bold transition disabled:opacity-80 ${liked ? 'border-rose-500 bg-rose-500 text-white' : 'border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:bg-rose-100'}`}
        >
          {liked ? '\u2665' : '\u2661'} {post.likes}
        </button>
      </div>
    </article>
  );
}

export default function CommunityPosts({ onOpenDetail, limit = null, showComposer = false, showMore = false, contained = true }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const [form, setForm] = useState(blankForm);
  const [likedPosts, setLikedPosts] = useState(readLiked);
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['community', 'posts'], queryFn: getCommunityPosts });
  const refresh = () => client.invalidateQueries({ queryKey: ['community', 'posts'] });
  const view = useMutation({ mutationFn: postCommunityView, onSettled: refresh });
  const like = useMutation({ mutationFn: postCommunityLike, onSettled: refresh });
  const unlike = useMutation({ mutationFn: postCommunityUnlike, onSettled: refresh });
  const create = useMutation({
    mutationFn: () => createCommunityPost(token(), form),
    onSuccess: () => {
      setForm(blankForm);
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

  const content = (
    <>
      {isPage ? <PageHeader eyebrow="커뮤니티" title={t.pageTitle} description={t.pageDescription} /> : <QuoteSectionHeader title={t.title} description={t.description} action={showMore && <Link to="/community" className="text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">{t.more}</Link>} />}
      {isPage && <ResultToolbar count={posts.length} label="게시글" />}
      {showComposer && (
        <Card as="form" hover={false} onSubmit={(event) => { event.preventDefault(); if (canSubmit) create.mutate(); }} className="mb-6 p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <UserAvatar name={user?.name || user?.username || 'G'} />
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold text-[var(--color-text-primary)]">{t.write}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {user ? '\uD22C\uC790 \uC544\uC774\uB514\uC5B4\uB098 \uC2DC\uC7A5 \uC758\uACAC\uC744 \uAC04\uACB0\uD558\uAC8C \uACF5\uC720\uD574\uBCF4\uC138\uC694.' : t.login}
                </p>
              </div>
            </div>
            {user && <span className="max-w-full truncate rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">{user.name || user.username}</span>}
          </div>
          <div className="grid gap-4 md:grid-cols-[180px_1fr]">
            <div>
              <FieldLabel htmlFor="community-category">{t.category}</FieldLabel>
              <select id="community-category" value={form.category} onChange={update('category')} disabled={!user} aria-label={t.category} className="h-11 w-full rounded-2xl border border-[var(--color-border)] bg-white px-3 text-sm font-semibold text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400">
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="community-title">{'\uC81C\uBAA9'}</FieldLabel>
              <input id="community-title" value={form.title} onChange={update('title')} placeholder={t.placeholderTitle} disabled={!user} className="h-11 w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400" />
            </div>
          </div>
          <div className="mt-4">
            <FieldLabel htmlFor="community-content">{'\uBCF8\uBB38'}</FieldLabel>
            <textarea id="community-content" value={form.content} onChange={update('content')} placeholder={t.placeholderContent} disabled={!user} rows={6} className="min-h-32 w-full resize-y rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400" />
          </div>
          {create.error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{create.error.message}</p>}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="submit" disabled={!canSubmit} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)] disabled:bg-slate-300">{create.isPending ? t.submitting : t.submit}</button>
          </div>
        </Card>
      )}
      {isLoading && <CommunitySkeleton />}
      {error && <StatusPanel message={t.error} onRetry={refetch} />}
      {!isLoading && !error && posts.length === 0 && <StatusPanel message={t.empty} />}
      {!isLoading && !error && posts.length > 0 && (
        <Card hover={false} className="p-2">
          <div className="divide-y divide-[var(--color-border)]">
            {posts.map((post, index) => (
              <CommunityItem
                key={post.id}
                post={post}
                index={index}
                liked={likedPosts.includes(post.id)}
                disabled={like.isPending || unlike.isPending}
                onOpen={openPost}
                onLike={likePost}
              />
            ))}
          </div>
        </Card>
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
