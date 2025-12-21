'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SubmissionCard from './SubmissionCard';
import type { Submission } from './page';
import { Filter, ArrowUpDown } from 'lucide-react';

interface BrowseClientProps {
  initialSubmissions: Submission[];
  isModerator: boolean;
  currentSort: string;
  currentCategory: string;
  categories: string[];
}

export default function BrowseClient({
  initialSubmissions,
  isModerator,
  currentSort,
  currentCategory,
  categories,
}: BrowseClientProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [, startTransition] = useTransition();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Update submissions when props change (from router.refresh)
  useEffect(() => {
    setSubmissions(initialSubmissions);
    setIsInitialLoad(false);
  }, [initialSubmissions]);

  // Live updates: lightweight polling to keep list fresh without reload
  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    async function fetchLatest() {
      try {
        const params = new URLSearchParams();
        if (currentSort && currentSort !== 'recent') params.set('sort', currentSort);
        if (currentCategory && currentCategory !== 'all') params.set('category', currentCategory);
        const url = params.toString() ? `/api/submissions/list?${params.toString()}` : '/api/submissions/list';
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        if (!isCancelled && data && Array.isArray(data.submissions)) {
          setSubmissions(data.submissions);
        }
      } catch {
        // ignore abort/errors to avoid noisy logs
      }
    }

    // initial fetch + interval
    fetchLatest();
    const id = setInterval(fetchLatest, 4000);

    return () => {
      isCancelled = true;
      controller.abort();
      clearInterval(id);
    };
  }, [currentSort, currentCategory]);

  const handleVote = async (submissionId: number, voteType: 'upvote' | 'downvote') => {
    try {
      const response = await fetch('/api/submissions/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, voteType }),
      });

      if (!response.ok) {
        throw new Error('Vote failed');
      }

      // Silent refresh in background - no loading state
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error('Vote error:', error);
    }
  };

  const handleReport = async (submissionId: number, reason: string) => {
    try {
      const response = await fetch('/api/submissions/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, reason }),
      });

      if (!response.ok) {
        throw new Error('Report failed');
      }

      return true;
    } catch (error) {
      console.error('Report error:', error);
      return false;
    }
  };

  const handleModerate = async (submissionId: number, action: 'delete' | 'ban', reason?: string) => {
    try {
      const response = await fetch('/api/submissions/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, action, reason }),
      });

      if (!response.ok) {
        throw new Error('Moderation failed');
      }

      // Optimistically remove from UI with animation
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));

      // Silent refresh in background
      startTransition(() => {
        router.refresh();
      });

      return true;
    } catch (error) {
      console.error('Moderate error:', error);
      // Revert on error
      setSubmissions(initialSubmissions);
      return false;
    }
  };

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === 'recent') {
      params.delete('sort');
    } else {
      params.set('sort', sort);
    }

    const newUrl = params.toString() ? `/browse?${params.toString()}` : '/browse';
    router.push(newUrl);
  };

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === 'all') {
      params.delete('category');
    } else {
      params.set('category', category);
    }

    const newUrl = params.toString() ? `/browse?${params.toString()}` : '/browse';
    router.push(newUrl);
  };

  return (
    <div className="space-y-6">
      {/* Filters - Sticky and smooth */}
      <div className="sticky top-0 z-30 bg-[#1a1714] backdrop-blur-xl pb-6 -mx-4 px-4 pt-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Sort */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#f5f1ed] mb-2">
              <ArrowUpDown className="inline h-4 w-4 mr-2" />
              Sortierung
            </label>
            <select
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-0 bg-[#2a2520]/50 backdrop-blur-sm text-[#f5f1ed] focus:outline-none focus:ring-2 focus:ring-[#e89a7a]/50 transition-all cursor-pointer hover:bg-[#2a2520]/70 shadow-sm hover:shadow-md"
            >
              <option value="recent">Neueste zuerst</option>
              <option value="oldest">Älteste zuerst</option>
              <option value="upvotes">Meiste Upvotes</option>
              <option value="downvotes">Meiste Downvotes</option>
              <option value="controversial">Kontrovers</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#f5f1ed] mb-2">
              <Filter className="inline h-4 w-4 mr-2" />
              Kategorie
            </label>
            <select
              value={currentCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-0 bg-[#2a2520]/50 backdrop-blur-sm text-[#f5f1ed] focus:outline-none focus:ring-2 focus:ring-[#e89a7a]/50 transition-all cursor-pointer hover:bg-[#2a2520]/70 shadow-sm hover:shadow-md"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'Alle Kategorien' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submissions Count */}
        <div className="mt-4 text-sm text-[#b8aea5]">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8faf9d]/10 border border-[#8faf9d]/20">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#8faf9d] animate-pulse" />
            {submissions.length} {submissions.length === 1 ? 'Beitrag' : 'Beiträge'}
          </span>
        </div>
      </div>

      {/* Submissions Grid with stagger animation */}
      {submissions.length === 0 ? (
        <div className="text-center py-20 animate-in fade-in duration-500">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-[#8faf9d]/10 mb-4">
            <Filter className="h-10 w-10 text-[#8faf9d]" />
          </div>
          <p className="text-[#b8aea5] text-lg">
            Keine Beiträge gefunden.
          </p>
          <p className="text-sm text-[#b8aea5] mt-2">
            Versuche andere Filter oder komm später wieder!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {submissions.map((submission, index) => (
            <div
              key={submission.id}
              className={`${isInitialLoad ? 'animate-in slide-in-from-bottom-4 fade-in' : ''}`}
              style={{
                animationDelay: isInitialLoad ? `${index * 50}ms` : '0ms',
                animationFillMode: 'both'
              }}
            >
              <SubmissionCard
                submission={submission}
                userVote={submission.user_vote}
                isModerator={isModerator}
                onVote={handleVote}
                onReport={handleReport}
                onModerate={handleModerate}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
