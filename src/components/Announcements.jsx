import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAnnouncements } from '../services/api';
import ErrorMessage from './ErrorMessage';
import LoadingSkeleton from './LoadingSkeleton';

export default function Announcements() {
  const { data = [], isLoading, error } = useQuery({ queryKey: ['announcements'], queryFn: getAnnouncements });
  const [selected, setSelected] = useState(null);
  const notices = data.slice(0, 5);

  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8"><LoadingSkeleton className="h-16 p-4" /></div>;
  if (error) return <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8"><ErrorMessage error={error} /></div>;
  if (notices.length === 0) return null;

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="rounded-md border border-emerald-100 bg-emerald-50">
          {notices.map((notice) => (
            <button
              key={notice.id}
              type="button"
              onClick={() => setSelected(notice)}
              className="flex w-full min-w-0 items-center gap-2 border-b border-emerald-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-100/60 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            >
              <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${notice.priority === 'important' ? 'bg-[var(--color-primary)] text-white' : 'bg-white text-emerald-700'}`}>
                {notice.priority === 'important' ? '중요' : '공지'}
              </span>
              <span className="min-w-0 flex-1 truncate font-bold text-slate-950">{notice.title}</span>
              <span className="shrink-0 text-xs font-bold text-emerald-700">보기</span>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="announcement-title">
          <article className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${selected.priority === 'important' ? 'bg-[var(--color-primary)] text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                  {selected.priority === 'important' ? '중요' : '공지'}
                </span>
                <h2 id="announcement-title" className="mt-3 break-words text-xl font-black text-slate-950">{selected.title}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                닫기
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto px-5 py-5">
              <p className="whitespace-pre-line break-words text-sm leading-7 text-slate-700">{selected.content}</p>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
