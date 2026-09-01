import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSkeleton from '../components/LoadingSkeleton';
import SectionHeader from '../components/SectionHeader';
import { useAuth } from '../context/AuthContext';
import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  deleteAdminCommunityComment,
  deleteAdminCommunityPost,
  deleteAdminReport,
  deleteAdminUser,
  getAdminDashboard,
  getMarketStatus,
  saveAdminUserNote,
  updateAdminAnnouncement,
  updateAdminAnnouncementVisibility,
  updateAdminCommunityPostVisibility,
  updateAdminReportStatus,
  updateAdminUserRole,
} from '../services/api';

const token = () => localStorage.getItem('mp_token') || '';
const blankNotice = { priority: 'normal', title: '', content: '' };
const displayName = (entry) => entry?.name || entry?.authorName || entry?.reporterName || entry?.username || entry?.author || entry?.reporter || '-';

export default function AdminPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [noticeForm, setNoticeForm] = useState(blankNotice);
  const [editingNoticeId, setEditingNoticeId] = useState(null);

  const dashboard = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: () => getAdminDashboard(token()), enabled: Boolean(user?.isAdmin) });
  const status = useQuery({ queryKey: ['market', 'status'], queryFn: getMarketStatus, enabled: Boolean(user?.isAdmin) });
  const data = dashboard.data?.dashboard;

  const filtered = useMemo(() => {
    if (!data) return { users: [], posts: [], comments: [], notices: [], reports: [] };
    const term = keyword.trim().toLowerCase();
    if (!term) return { users: data.users, posts: data.posts, comments: data.comments, notices: data.notices || [], reports: data.reports || [] };
    const includes = (...values) => values.some((value) => String(value || '').toLowerCase().includes(term));
    return {
      users: data.users.filter((entry) => includes(entry.username, entry.name, entry.email, entry.phone, entry.adminNote)),
      posts: data.posts.filter((post) => includes(post.title, post.content, post.author, post.authorName, post.category)),
      comments: data.comments.filter((comment) => includes(comment.content, comment.author, comment.authorName, comment.postId)),
      notices: (data.notices || []).filter((notice) => includes(notice.title, notice.content, notice.priority)),
      reports: (data.reports || []).filter((report) => includes(report.reporter, report.reporterName, report.reason, report.status, report.targetTitle, report.targetContent)),
    };
  }, [data, keyword]);

  const selectedUser = useMemo(() => data?.users.find((entry) => entry.id === selectedUserId) || null, [data, selectedUserId]);
  const selectedNote = selectedUser ? noteDrafts[selectedUser.id] ?? selectedUser.adminNote ?? '' : '';
  const recent = useMemo(() => {
    if (!data) return [];
    return [
      ...data.users.map((entry) => ({ id: `user-${entry.id}`, label: '회원 가입', title: `${displayName(entry)} (@${entry.username})`, at: entry.createdAt })),
      ...data.posts.map((post) => ({ id: `post-${post.id}`, label: '커뮤니티 글', title: post.title, at: post.createdAt })),
      ...data.comments.map((comment) => ({ id: `comment-${comment.id}`, label: '댓글', title: comment.content, at: comment.createdAt })),
    ].filter((entry) => entry.at).sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 6);
  }, [data]);

  const refresh = () => client.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  const refreshAdminAndNotices = () => { refresh(); client.invalidateQueries({ queryKey: ['announcements'] }); };
  const removeUser = useMutation({ mutationFn: (id) => deleteAdminUser(token(), id), onSuccess: refresh });
  const updateRole = useMutation({ mutationFn: ({ id, isAdmin }) => updateAdminUserRole(token(), id, isAdmin), onSuccess: refresh });
  const saveNote = useMutation({ mutationFn: ({ id, note }) => saveAdminUserNote(token(), id, note), onSuccess: refresh });
  const updatePostVisibility = useMutation({ mutationFn: ({ id, isHidden }) => updateAdminCommunityPostVisibility(token(), id, isHidden), onSuccess: refresh });
  const removePost = useMutation({ mutationFn: (id) => deleteAdminCommunityPost(token(), id), onSuccess: refresh });
  const removeComment = useMutation({ mutationFn: (id) => deleteAdminCommunityComment(token(), id), onSuccess: refresh });
  const updateReport = useMutation({ mutationFn: ({ id, status }) => updateAdminReportStatus(token(), id, status), onSuccess: refresh });
  const removeReport = useMutation({ mutationFn: (id) => deleteAdminReport(token(), id), onSuccess: refresh });
  const createNotice = useMutation({ mutationFn: () => createAdminAnnouncement(token(), noticeForm), onSuccess: () => { setNoticeForm(blankNotice); refreshAdminAndNotices(); } });
  const updateNotice = useMutation({ mutationFn: () => updateAdminAnnouncement(token(), { id: editingNoticeId, ...noticeForm }), onSuccess: () => { setEditingNoticeId(null); setNoticeForm(blankNotice); refreshAdminAndNotices(); } });
  const updateNoticeVisibility = useMutation({ mutationFn: ({ id, isHidden }) => updateAdminAnnouncementVisibility(token(), id, isHidden), onSuccess: refreshAdminAndNotices });
  const removeNotice = useMutation({ mutationFn: (id) => deleteAdminAnnouncement(token(), id), onSuccess: refreshAdminAndNotices });

  if (!user?.isAdmin) {
    return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><SectionHeader title="관리자 페이지" description="관리자 권한이 있는 계정만 접근할 수 있습니다." /></main>;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader title="관리자 페이지" description="회원, 공지, 신고, 커뮤니티 글과 댓글을 한곳에서 관리합니다." />
      {dashboard.isLoading && <LoadingSkeleton className="h-60 p-5" />}
      {dashboard.error && <ErrorMessage error={dashboard.error} />}
      {data && (
        <>
          <section className="mb-5">
            <h2 className="mb-3 font-bold text-slate-950">서비스 요약</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
              <Metric label="회원" value={data.counts.users} />
              <Metric label="글" value={data.counts.posts} />
              <Metric label="댓글" value={data.counts.comments} />
              <Metric label="공지" value={data.counts.notices || 0} />
              <Metric label="신고" value={data.counts.reports || 0} />
              <Metric label="보유 자산" value={data.counts.holdings} />
              <Metric label="관심 자산" value={data.counts.favorites} />
              <Metric label="저장 뉴스" value={data.counts.savedNews} />
            </div>
          </section>

          <section className="mb-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <StatusSection status={status} />
            <ActivitySection items={recent} />
          </section>

          <section className="mb-5 rounded-md border border-slate-200 bg-white p-4">
            <label className="text-sm font-bold text-slate-700" htmlFor="admin-search">관리 데이터 검색</label>
            <input id="admin-search" value={keyword} onChange={(event) => setKeyword(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-blue-500" placeholder="회원, 닉네임, 이메일, 글 제목, 댓글 내용 검색" />
            <p className="mt-2 text-xs text-slate-500">검색 결과 회원 {filtered.users.length}명 / 공지 {filtered.notices.length}개 / 신고 {filtered.reports.length}개 / 글 {filtered.posts.length}개 / 댓글 {filtered.comments.length}개</p>
          </section>

          <AnnouncementAdmin
            form={noticeForm}
            editing={Boolean(editingNoticeId)}
            notices={filtered.notices}
            saving={createNotice.isPending || updateNotice.isPending}
            updating={updateNoticeVisibility.isPending}
            removing={removeNotice.isPending}
            error={createNotice.error || updateNotice.error}
            onChange={(field, value) => setNoticeForm((current) => ({ ...current, [field]: value }))}
            onCreate={(event) => { event.preventDefault(); if (editingNoticeId) updateNotice.mutate(); else createNotice.mutate(); }}
            onCancelEdit={() => { setEditingNoticeId(null); setNoticeForm(blankNotice); }}
            onEdit={(notice) => { setEditingNoticeId(notice.id); setNoticeForm({ priority: notice.priority, title: notice.title, content: notice.content }); }}
            onToggle={(notice) => { if (window.confirm(notice.isHidden ? '이 공지를 다시 공개할까요?' : '이 공지를 숨길까요?')) updateNoticeVisibility.mutate({ id: notice.id, isHidden: !notice.isHidden }); }}
            onRemove={(notice) => { if (window.confirm('이 공지를 삭제할까요?')) removeNotice.mutate(notice.id); }}
          />

          <ReportAdmin
            reports={filtered.reports}
            updating={updateReport.isPending}
            removing={removeReport.isPending || removePost.isPending || removeComment.isPending}
            onStatus={(report) => updateReport.mutate({ id: report.id, status: report.status === 'open' ? 'resolved' : 'open' })}
            onRemove={(report) => { if (window.confirm('이 신고 기록을 삭제할까요?')) removeReport.mutate(report.id); }}
            onDeleteTarget={(report) => {
              const label = report.targetType === 'comment' ? '댓글' : '글';
              if (!window.confirm(`신고된 ${label}을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;
              if (report.targetType === 'comment') removeComment.mutate(report.targetId);
              else removePost.mutate(report.targetId);
            }}
          />

          <TableSection title="회원 관리" empty="관리할 회원이 없습니다.">
            {filtered.users.map((entry) => (
              <UserRow
                key={entry.id}
                entry={entry}
                currentUserId={user.id}
                active={selectedUser?.id === entry.id}
                selectedNote={selectedUser?.id === entry.id ? selectedNote : ''}
                onDetail={() => setSelectedUserId((current) => (current === entry.id ? null : entry.id))}
                onNoteChange={(nextNote) => setNoteDrafts((drafts) => ({ ...drafts, [entry.id]: nextNote }))}
                onSaveNote={() => saveNote.mutate({ id: entry.id, note: noteDrafts[entry.id] ?? entry.adminNote ?? '' })}
                saving={saveNote.isPending}
                onRole={() => { if (window.confirm(entry.isAdmin ? '이 회원을 일반 사용자로 변경할까요?' : '이 회원을 관리자로 지정할까요?')) updateRole.mutate({ id: entry.id, isAdmin: !entry.isAdmin }); }}
                rolePending={updateRole.isPending}
                onRemove={() => { if (window.confirm('이 회원과 연결된 데이터를 삭제할까요?')) removeUser.mutate(entry.id); }}
                removePending={removeUser.isPending}
              />
            ))}
          </TableSection>

          <TableSection title="커뮤니티 글 관리" empty="관리할 글이 없습니다.">
            {filtered.posts.map((post) => (
              <Row key={post.id} title={post.title} meta={`${post.authorName || post.author} / ${post.category} / 조회 ${post.views} / 좋아요 ${post.likes}`} badge={post.isHidden ? '숨김' : '공개'} badgeTone={post.isHidden ? 'amber' : 'green'} actions={<><button type="button" onClick={() => { if (window.confirm(post.isHidden ? '이 글을 다시 공개할까요?' : '이 글을 사용자 화면에서 숨길까요?')) updatePostVisibility.mutate({ id: post.id, isHidden: !post.isHidden }); }} className="rounded-md border border-amber-200 px-3 py-2 text-sm font-bold text-amber-600 hover:bg-amber-50" disabled={updatePostVisibility.isPending}>{post.isHidden ? '복구' : '숨김'}</button><button type="button" onClick={() => { if (window.confirm('이 커뮤니티 글을 삭제할까요?')) removePost.mutate(post.id); }} className="rounded-md border border-red-200 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50" disabled={removePost.isPending}>삭제</button></>} />
            ))}
          </TableSection>

          <TableSection title="댓글 관리" empty="관리할 댓글이 없습니다.">
            {filtered.comments.map((comment) => <Row key={comment.id} title={comment.content} meta={`${comment.authorName || comment.author} / 글 번호 ${comment.postId} / ${comment.createdAt}`} actions={<button type="button" onClick={() => { if (window.confirm('이 댓글을 삭제할까요?')) removeComment.mutate(comment.id); }} className="rounded-md border border-red-200 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50" disabled={removeComment.isPending}>삭제</button>} />)}
          </TableSection>
        </>
      )}
    </main>
  );
}

function Metric({ label, value }) {
  return <div className="rounded-md border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>;
}

function StatusSection({ status }) {
  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <h2 className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-950">API 상태</h2>
      {status.isLoading && <LoadingSkeleton className="m-4 h-20 p-4" />}
      {status.error && <div className="p-4"><ErrorMessage error={status.error} /></div>}
      {status.data?.statuses && <div className="divide-y divide-slate-100">{status.data.statuses.map((entry) => <div key={entry.name} className="flex items-center justify-between gap-3 px-4 py-3 text-sm"><div><b>{entry.name}</b><p className="text-slate-500">{entry.provider}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${entry.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{entry.ok ? '정상' : entry.reason}</span></div>)}</div>}
    </section>
  );
}

function ActivitySection({ items }) {
  return <div className="rounded-md border border-slate-200 bg-white p-4"><h2 className="font-bold text-slate-950">최근 활동</h2>{items.length === 0 ? <p className="mt-3 text-sm text-slate-500">최근 활동이 없습니다.</p> : <div className="mt-3 space-y-3">{items.map((item) => <div key={item.id} className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{item.label}</span><span className="text-xs text-slate-400">{item.at}</span></div><p className="mt-2 line-clamp-1 text-sm font-semibold text-slate-800">{item.title}</p></div>)}</div>}</div>;
}

function UserRow({ entry, currentUserId, active, selectedNote, onDetail, onNoteChange, onSaveNote, saving, onRole, rolePending, onRemove, removePending }) {
  return (
    <div className={active ? 'bg-emerald-50/40' : ''}>
      <Row title={`${displayName(entry)} / @${entry.username}`} meta={`${entry.email} / ${entry.phone}`} badge={entry.isAdmin ? '관리자' : '사용자'} badgeTone={entry.isAdmin ? 'blue' : 'slate'} actions={<><button type="button" onClick={onDetail} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">{active ? '닫기' : '상세'}</button>{entry.id !== currentUserId && <button type="button" onClick={onRole} className="rounded-md border border-emerald-200 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50" disabled={rolePending}>{entry.isAdmin ? '사용자로 변경' : '관리자로 지정'}</button>}{entry.id !== currentUserId && <button type="button" onClick={onRemove} className="rounded-md border border-red-200 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50" disabled={removePending}>삭제</button>}</>} />
      {active && <UserDetail user={entry} note={selectedNote} onNoteChange={onNoteChange} onSave={onSaveNote} saving={saving} />}
    </div>
  );
}

function UserDetail({ user, note, onNoteChange, onSave, saving }) {
  return (
    <section className="mx-4 mb-4 rounded-md border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold text-emerald-700">회원 상세</p><h2 className="mt-1 text-xl font-bold text-slate-950">{displayName(user)}</h2><p className="mt-1 text-sm text-slate-500">아이디 @{user.username} / {user.email}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${user.isAdmin ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{user.isAdmin ? '관리자' : '사용자'}</span></div>
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <MiniMetric label="글" value={user.postsCount} />
        <MiniMetric label="댓글" value={user.commentsCount} />
        <MiniMetric label="포트폴리오" value={user.holdingsCount} />
        <MiniMetric label="관심 자산" value={user.favoritesCount} />
        <MiniMetric label="저장 뉴스" value={user.savedNewsCount} />
        <MiniMetric label="종목 메모" value={user.notesCount} />
        <MiniMetric label="가입일" value={user.createdAt || '-'} wide />
        <MiniMetric label="생년월일" value={user.birthDate || '-'} wide />
      </div>
      <label className="mt-4 block text-sm font-bold text-slate-700" htmlFor={`admin-user-note-${user.id}`}>관리자 메모</label>
      <textarea id={`admin-user-note-${user.id}`} value={note} onChange={(event) => onNoteChange(event.target.value)} className="mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500" placeholder="회원 응대 이력이나 확인할 메모를 적어두세요." />
      <div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs text-slate-500">{user.adminNoteUpdatedAt ? `마지막 저장 ${user.adminNoteUpdatedAt}` : '저장된 메모가 없습니다.'}</p><button type="button" onClick={onSave} disabled={saving} className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:bg-slate-300">{saving ? '저장 중' : '메모 저장'}</button></div>
    </section>
  );
}

function AnnouncementAdmin({ form, editing, notices, saving, updating, removing, error, onChange, onCreate, onCancelEdit, onEdit, onToggle, onRemove }) {
  return (
    <section className="mb-5 overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3"><h2 className="font-bold text-slate-950">공지사항 관리</h2></div>
      <form onSubmit={onCreate} className="border-b border-slate-100 p-4">
        <div className="grid gap-3 md:grid-cols-[160px_1fr]"><select value={form.priority} onChange={(event) => onChange('priority', event.target.value)} className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"><option value="normal">일반 공지</option><option value="important">중요 공지</option></select><input value={form.title} onChange={(event) => onChange('title', event.target.value)} className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500" placeholder="공지 제목" /></div>
        <textarea value={form.content} onChange={(event) => onChange('content', event.target.value)} className="mt-3 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="홈 화면에 노출할 공지 내용을 입력하세요." />
        {error && <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}
        <div className="mt-3 flex justify-end"><button type="submit" disabled={saving || form.title.trim().length < 2 || form.content.trim().length < 5} className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:bg-slate-300">{saving ? '저장 중' : editing ? '수정 저장' : '공지 등록'}</button>{editing && <button type="button" onClick={onCancelEdit} className="ml-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">수정 취소</button>}</div>
      </form>
      {notices.length === 0 ? <p className="p-5 text-sm text-slate-500">등록된 공지가 없습니다.</p> : <div className="divide-y divide-slate-100">{notices.map((notice) => <div key={notice.id} className="flex items-center justify-between gap-4 px-4 py-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-xs font-bold ${notice.priority === 'important' ? 'bg-[var(--color-primary)] text-white' : 'bg-slate-100 text-slate-600'}`}>{notice.priority === 'important' ? '중요' : '일반'}</span><span className={`rounded-full px-2 py-1 text-xs font-bold ${notice.isHidden ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{notice.isHidden ? '숨김' : '공개'}</span></div><b className="mt-2 block line-clamp-1 text-slate-950">{notice.title}</b><p className="mt-1 line-clamp-1 text-sm text-slate-500">{notice.content}</p></div><div className="flex shrink-0 flex-wrap justify-end gap-2"><button type="button" onClick={() => onEdit(notice)} className="rounded-md border border-emerald-200 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50">수정</button><button type="button" onClick={() => onToggle(notice)} disabled={updating} className="rounded-md border border-amber-200 px-3 py-2 text-sm font-bold text-amber-600 hover:bg-amber-50">{notice.isHidden ? '복구' : '숨김'}</button><button type="button" onClick={() => onRemove(notice)} disabled={removing} className="rounded-md border border-red-200 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50">삭제</button></div></div>)}</div>}
    </section>
  );
}

function ReportAdmin({ reports, updating, removing, onStatus, onRemove, onDeleteTarget }) {
  return (
    <section className="mb-5 overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3"><h2 className="font-bold text-slate-950">신고 관리</h2><p className="mt-1 text-xs text-slate-500">처리 완료는 관리자가 신고를 확인했다는 기록입니다. 실제 글/댓글 조치는 삭제 버튼으로 처리합니다.</p></div>
      {reports.length === 0 ? <p className="p-5 text-sm text-slate-500">접수된 신고가 없습니다.</p> : <div className="divide-y divide-slate-100">{reports.map((report) => <div key={report.id} className="flex items-center justify-between gap-4 px-4 py-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-xs font-bold ${report.status === 'open' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>{report.status === 'open' ? '처리 필요' : '처리 완료'}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{report.targetType === 'comment' ? '댓글' : '글'}</span></div><b className="mt-2 block line-clamp-1 text-slate-950">{report.targetTitle || report.targetContent || `대상 번호 ${report.targetId}`}</b><p className="mt-1 line-clamp-1 text-sm text-slate-500">신고자 {report.reporterName || report.reporter} / {report.reason}</p></div><div className="flex shrink-0 flex-wrap justify-end gap-2"><button type="button" onClick={() => onStatus(report)} disabled={updating} className="rounded-md border border-emerald-200 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50">{report.status === 'open' ? '확인 완료' : '다시 열기'}</button><button type="button" onClick={() => onDeleteTarget(report)} disabled={removing} className="rounded-md border border-red-200 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50">대상 삭제</button><button type="button" onClick={() => onRemove(report)} disabled={removing} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">기록 삭제</button></div></div>)}</div>}
    </section>
  );
}

function MiniMetric({ label, value, wide }) {
  return <div className={`rounded-md bg-slate-50 p-3 ${wide ? 'col-span-2' : ''}`}><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 truncate text-sm font-bold text-slate-950">{value}</p></div>;
}

function TableSection({ title, empty, children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return <section className="mb-5 overflow-hidden rounded-md border border-slate-200 bg-white"><h2 className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-950">{title}</h2>{items.length === 0 ? <p className="p-5 text-sm text-slate-500">{empty}</p> : <div className="divide-y divide-slate-100">{items}</div>}</section>;
}

function Row({ title, meta, badge, badgeTone = 'slate', actions }) {
  const badgeClasses = { amber: 'bg-amber-50 text-amber-700', blue: 'bg-emerald-50 text-emerald-700', green: 'bg-emerald-50 text-emerald-700', slate: 'bg-slate-100 text-slate-600' };
  return <div className="flex items-center justify-between gap-4 px-4 py-4"><div className="min-w-0"><b className="line-clamp-1 text-slate-950">{title}</b>{meta && <p className="mt-1 line-clamp-1 text-sm text-slate-500">{meta}</p>}</div><div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{badge && <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClasses[badgeTone] || badgeClasses.slate}`}>{badge}</span>}{actions}</div></div>;
}
