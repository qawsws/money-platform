import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';
import { deleteAccount, deleteCommunityComment, deleteCommunityPost, deleteSavedNews, getDashboard, updatePassword, updateProfile } from '../services/api';

const token = () => localStorage.getItem('mp_token') || '';

const text = {
  title: '마이페이지',
  guest: '로그인하면 계정 정보와 활동 내역을 관리할 수 있습니다.',
  profile: '프로필 요약',
  activity: '내 활동',
  account: '회원정보 수정',
  password: '비밀번호 변경',
  danger: '회원 탈퇴',
  posts: '내가 쓴 게시글',
  comments: '내가 쓴 댓글',
  notes: '종목 메모',
  news: '저장한 뉴스',
  empty: '아직 표시할 내용이 없습니다.',
  save: '저장',
  saving: '저장 중...',
  saved: '저장되었습니다.',
  remove: '삭제',
  leave: '탈퇴하기',
  logout: '로그아웃',
  portfolio: '포트폴리오',
  favorites: '관심 자산',
  confirmPost: '이 게시글을 삭제할까요?',
  confirmComment: '이 댓글을 삭제할까요?',
  confirmNews: '저장한 뉴스에서 삭제할까요?',
  confirmAccount: '정말 회원 탈퇴할까요? 저장된 계정 데이터가 삭제됩니다.',
  retry: '다시 시도',
};

function UserAvatar({ user }) {
  const initial = String(user?.name || user?.username || user?.email || '?').trim().charAt(0).toUpperCase() || '?';

  return <span className="grid size-16 shrink-0 place-items-center rounded-3xl bg-[var(--color-primary-soft)] text-xl font-black text-[var(--color-primary)] sm:size-20">{initial}</span>;
}

function StatusCard({ title, description, action }) {
  return (
    <Card hover={false} className="grid min-h-56 place-items-center p-8 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--color-primary-soft)] text-sm font-black text-[var(--color-primary)]">M</span>
        <h2 className="mt-4 text-lg font-extrabold text-[var(--color-text-primary)]">{title}</h2>
        {description && <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </Card>
  );
}

function MyPageSkeleton() {
  return (
    <div className="space-y-6">
      <Card hover={false} className="p-6">
        <div className="flex animate-pulse gap-4">
          <div className="size-16 rounded-3xl bg-slate-100" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-40 rounded bg-slate-100" />
            <div className="h-4 w-64 max-w-full rounded bg-slate-100" />
            <div className="h-4 w-32 rounded bg-slate-100" />
          </div>
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-[var(--radius-card)] bg-slate-200" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-[var(--radius-card)] bg-slate-200" />
        <div className="h-72 animate-pulse rounded-[var(--radius-card)] bg-slate-200" />
      </div>
    </div>
  );
}

function ProfileSummary({ user }) {
  const role = user.isAdmin ? '관리자' : '일반 사용자';

  return (
    <Card hover={false} className="p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <UserAvatar user={user} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-extrabold text-[var(--color-primary)]">{role}</span>
              {user.createdAt && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-[var(--color-text-secondary)]">가입일 {user.createdAt}</span>}
            </div>
            <h1 className="mt-3 truncate text-2xl font-black tracking-tight text-[var(--color-text-primary)] sm:text-3xl">{user.name || user.username}</h1>
            <p className="mt-1 break-words text-sm text-[var(--color-text-secondary)]">{user.email}</p>
            <p className="mt-1 truncate text-sm font-semibold text-[var(--color-text-tertiary)]">@{user.username}</p>
          </div>
        </div>
        <a href="#profile-form" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)]">프로필 수정</a>
      </div>
    </Card>
  );
}

function ShortcutCard({ to, label, value, description }) {
  return (
    <Card as={Link} to={to} className="group min-h-32 p-5 hover:border-[var(--color-border-strong)]">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-sm font-black text-[var(--color-primary)]">{label.charAt(0)}</span>
        <span className="text-lg font-black text-[var(--color-text-tertiary)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-primary)]">›</span>
      </div>
      <p className="mt-4 text-sm font-bold text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[var(--color-text-primary)]">{value}</p>
      {description && <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">{description}</p>}
    </Card>
  );
}

function MetricCard({ label, value }) {
  return (
    <Card hover={false} className="min-h-28 p-5">
      <p className="text-sm font-bold text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-3 text-3xl font-black text-[var(--color-text-primary)]">{value ?? 0}</p>
    </Card>
  );
}

function Field({ id, label, helper, ...props }) {
  return (
    <label htmlFor={id} className="block text-sm font-bold text-[var(--color-text-primary)]">
      {label}
      <input id={id} {...props} className="mt-2 h-11 w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400" />
      {helper && <span className="mt-2 block text-xs font-medium text-[var(--color-text-tertiary)]">{helper}</span>}
    </label>
  );
}

function SectionTitle({ title, description }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-black tracking-tight text-[var(--color-text-primary)]">{title}</h2>
      {description && <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>}
    </div>
  );
}

function ManageSection({ title, empty, children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];

  return (
    <Card hover={false} className="overflow-hidden">
      <div className="border-b border-[var(--color-border)] bg-slate-50 px-5 py-4">
        <h2 className="font-extrabold text-[var(--color-text-primary)]">{title}</h2>
      </div>
      {items.length === 0 ? (
        <div className="p-5">
          <p className="rounded-2xl border border-dashed border-[var(--color-border)] bg-slate-50 p-5 text-sm font-semibold text-[var(--color-text-secondary)]">{empty}</p>
        </div>
      ) : <div className="divide-y divide-[var(--color-border)]">{items}</div>}
    </Card>
  );
}

function ManageItem({ title, meta, onOpen, onRemove }) {
  const content = (
    <div className="min-w-0 flex-1">
      <b className="line-clamp-1 text-sm text-[var(--color-text-primary)]">{title || '-'}</b>
      {meta && <p className="mt-1 line-clamp-2 text-sm leading-5 text-[var(--color-text-secondary)]">{meta}</p>}
    </div>
  );

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50">
      {onOpen ? <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2">{content}</button> : content}
      {onRemove && <button type="button" onClick={onRemove} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-red-200 px-3 text-sm font-bold text-red-500 hover:bg-red-50">{text.remove}</button>}
    </div>
  );
}

export default function MyPage() {
  const { user, logout, replaceSession } = useAuth();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [profile, setProfile] = useState(() => ({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', birthDate: user?.birthDate || '' }));
  const [passwords, setPasswords] = useState({ currentPassword: '', nextPassword: '', confirmPassword: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: () => getDashboard(token()), enabled: Boolean(user) });
  const data = dashboard.data?.dashboard;
  const refresh = () => {
    client.invalidateQueries({ queryKey: ['dashboard'] });
    client.invalidateQueries({ queryKey: ['community', 'posts'] });
    client.invalidateQueries({ queryKey: ['saved-news'] });
  };

  const profileSave = useMutation({ mutationFn: () => updateProfile(token(), profile), onSuccess: (res) => replaceSession(res) });
  const passwordSave = useMutation({
    mutationFn: () => {
      if (passwords.nextPassword !== passwords.confirmPassword) throw new Error('새 비밀번호가 일치하지 않습니다.');
      return updatePassword(token(), { currentPassword: passwords.currentPassword, nextPassword: passwords.nextPassword });
    },
    onSuccess: () => setPasswords({ currentPassword: '', nextPassword: '', confirmPassword: '' }),
  });
  const accountRemove = useMutation({ mutationFn: () => deleteAccount(token(), deletePassword), onSuccess: () => { logout(); navigate('/'); } });
  const removePost = useMutation({ mutationFn: (id) => deleteCommunityPost(token(), id), onSuccess: refresh });
  const removeComment = useMutation({ mutationFn: (id) => deleteCommunityComment(token(), id), onSuccess: refresh });
  const removeNews = useMutation({ mutationFn: (newsKey) => deleteSavedNews(token(), newsKey), onSuccess: refresh });

  if (!user) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Account" title={text.title} description={text.guest} />
        <StatusCard title="로그인이 필요합니다" description="마이페이지는 로그인한 사용자에게만 표시됩니다." action={<Link to="/" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)]">메인으로 이동</Link>} />
      </main>
    );
  }

  const updateProfileField = (field) => (event) => setProfile((value) => ({ ...value, [field]: event.target.value }));
  const updatePasswordField = (field) => (event) => setPasswords((value) => ({ ...value, [field]: event.target.value }));
  const counts = data?.counts || {};

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader eyebrow="Account" title={text.title} description={`${user.name || user.username}님의 계정 정보와 활동 내역을 관리합니다.`} />
      {dashboard.isLoading && <MyPageSkeleton />}
      {dashboard.error && <StatusCard title="사용자 정보를 불러오지 못했습니다" description="잠시 후 다시 시도해주세요." action={<button type="button" onClick={() => dashboard.refetch()} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)]">{text.retry}</button>} />}
      {data && (
        <div className="space-y-8">
          <ProfileSummary user={user} />

          <section>
            <SectionTitle title={text.activity} description="내가 만든 콘텐츠와 저장한 항목으로 빠르게 이동할 수 있습니다." />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ShortcutCard to="/portfolio" label={text.portfolio} value={counts.holdings ?? 0} description="보유 자산" />
              <ShortcutCard to="/favorites" label={text.favorites} value={counts.favorites ?? 0} description="관심 등록" />
              <MetricCard label="작성 게시글" value={counts.posts} />
              <MetricCard label="작성 댓글" value={counts.comments} />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <ManageSection title={text.posts} empty="아직 작성한 게시글이 없습니다.">
              {data.posts.map((post) => <ManageItem key={post.id} title={post.title} meta={`${post.category} / 조회 ${post.views} / 좋아요 ${post.likes}`} onOpen={() => navigate(`/detail/community/${post.id}`, { state: { item: post } })} onRemove={() => { if (window.confirm(text.confirmPost)) removePost.mutate(post.id); }} />)}
            </ManageSection>

            <ManageSection title={text.comments} empty="아직 작성한 댓글이 없습니다.">
              {data.comments.map((comment) => <ManageItem key={comment.id} title={comment.content} meta={`글 번호 ${comment.postId} / ${comment.createdAt}`} onOpen={() => navigate(`/detail/community/${comment.postId}`)} onRemove={() => { if (window.confirm(text.confirmComment)) removeComment.mutate(comment.id); }} />)}
            </ManageSection>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <ManageSection title={text.notes} empty={text.empty}>
              {data.notes.map((note) => <ManageItem key={note.itemKey} title={note.itemKey} meta={note.note} onOpen={() => navigate(`/detail/${note.itemKey.replace(':', '/')}`)} />)}
            </ManageSection>

            <ManageSection title={text.news} empty={text.empty}>
              {data.news.map((news) => <ManageItem key={news.newsKey} title={news.title} meta={news.category || news.summary} onOpen={() => navigate(`/detail/news/${encodeURIComponent(news.newsKey)}`, { state: { item: news } })} onRemove={() => { if (window.confirm(text.confirmNews)) removeNews.mutate(news.newsKey); }} />)}
            </ManageSection>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
            <Card as="form" hover={false} id="profile-form" onSubmit={(event) => { event.preventDefault(); profileSave.mutate(); }} className="p-5 sm:p-6">
              <SectionTitle title={text.account} description="닉네임과 연락처 등 기본 정보를 수정합니다." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="profile-name" label="닉네임" value={profile.name} onChange={updateProfileField('name')} required />
                <Field id="profile-phone" label="전화번호" value={profile.phone} onChange={updateProfileField('phone')} required />
                <Field id="profile-email" label="이메일" value={profile.email} onChange={updateProfileField('email')} type="email" required />
                <Field id="profile-birth-date" label="생년월일" value={profile.birthDate} onChange={updateProfileField('birthDate')} type="date" />
              </div>
              {profileSave.error && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{profileSave.error.message}</p>}
              {profileSave.isSuccess && <p className="mt-4 text-sm font-semibold text-emerald-600">{text.saved}</p>}
              <div className="mt-5 flex justify-end">
                <button type="submit" disabled={profileSave.isPending} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)] disabled:bg-slate-300">{profileSave.isPending ? text.saving : text.save}</button>
              </div>
            </Card>

            <Card as="form" hover={false} onSubmit={(event) => { event.preventDefault(); passwordSave.mutate(); }} className="p-5 sm:p-6">
              <SectionTitle title={text.password} description="현재 비밀번호 확인 후 새 비밀번호로 변경합니다." />
              <div className="space-y-4">
                <Field id="current-password" label="현재 비밀번호" value={passwords.currentPassword} onChange={updatePasswordField('currentPassword')} type="password" autoComplete="current-password" required />
                <Field id="next-password" label="새 비밀번호" value={passwords.nextPassword} onChange={updatePasswordField('nextPassword')} type="password" autoComplete="new-password" minLength={8} required />
                <Field id="confirm-password" label="새 비밀번호 확인" value={passwords.confirmPassword} onChange={updatePasswordField('confirmPassword')} type="password" autoComplete="new-password" minLength={8} required />
              </div>
              {passwordSave.error && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{passwordSave.error.message}</p>}
              {passwordSave.isSuccess && <p className="mt-4 text-sm font-semibold text-emerald-600">{text.saved}</p>}
              <div className="mt-5 flex justify-end">
                <button type="submit" disabled={passwordSave.isPending} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)] disabled:bg-slate-300">{passwordSave.isPending ? text.saving : text.save}</button>
              </div>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card hover={false} className="p-5 sm:p-6">
              <SectionTitle title={text.logout} description="현재 기기에서 로그아웃합니다." />
              <button type="button" onClick={() => { logout(); navigate('/'); }} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[var(--color-border)] px-5 text-sm font-bold text-[var(--color-text-secondary)] hover:bg-slate-50">{text.logout}</button>
            </Card>

            <Card hover={false} className="border-red-200 bg-red-50/60 p-5 sm:p-6">
              <SectionTitle title={text.danger} description="탈퇴하려면 현재 비밀번호를 입력해야 합니다." />
              <div className="flex flex-col gap-3 sm:flex-row">
                <label htmlFor="delete-password" className="sr-only">현재 비밀번호</label>
                <input id="delete-password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} type="password" placeholder="현재 비밀번호" autoComplete="current-password" className="h-11 rounded-2xl border border-red-200 bg-white px-4 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100 sm:min-w-0 sm:flex-1" />
                <button type="button" disabled={!deletePassword || accountRemove.isPending} onClick={() => { if (window.confirm(text.confirmAccount)) accountRemove.mutate(); }} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:bg-slate-300">{text.leave}</button>
              </div>
              {accountRemove.error && <p className="mt-4 rounded-2xl border border-red-200 bg-white p-4 text-sm font-semibold text-red-700">{accountRemove.error.message}</p>}
            </Card>
          </section>
        </div>
      )}
    </main>
  );
}
