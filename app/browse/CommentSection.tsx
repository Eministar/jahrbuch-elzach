'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, Send } from 'lucide-react';
import CommentItem from './CommentItem';

interface Comment {
  id: number;
  submission_id: number;
  user_id: number;
  parent_id: number | null;
  text: string;
  author: string;
  author_role: string;
  author_class: string | null;
  created_at: string;
  upvotes: number;
  downvotes: number;
  user_vote: 'upvote' | 'downvote' | null;
  is_author: boolean;
}

interface CommentSectionProps {
  submissionId: number;
  isModerator: boolean;
}

export default function CommentSection({
  submissionId,
  isModerator
}: CommentSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/comments?submissionId=${submissionId}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && comments.length === 0) {
      loadComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Live updates: Lightweight polling while the section is open
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    const controller = new AbortController();

    async function fetchLatest() {
      try {
        const res = await fetch(`/api/comments?submissionId=${submissionId}` , { cache: 'no-store', signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        if (!isCancelled && data && Array.isArray(data.comments)) {
          setComments(data.comments);
        }
      } catch {
        // ignore fetch/abort errors
      }
    }

    // initial fetch and then interval
    fetchLatest();
    const id = setInterval(fetchLatest, 4000);

    return () => {
      isCancelled = true;
      controller.abort();
      clearInterval(id);
    };
  }, [isOpen, submissionId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          text: newComment.trim(),
          parentId: null
        })
      });

      if (response.ok) {
        setNewComment('');
        await loadComments();
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: number) => {
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          text: replyText.trim(),
          parentId
        })
      });

      if (response.ok) {
        setReplyText('');
        setReplyingTo(null);
        await loadComments();
      }
    } catch (error) {
      console.error('Failed to submit reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (commentId: number, voteType: 'upvote' | 'downvote') => {
    try {
      const response = await fetch('/api/comments/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, voteType })
      });

      if (response.ok) {
        // Trigger background refresh to keep UI in sync without waiting
        loadComments();
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      throw error;
    }
  };

  const handleDelete = async (commentId: number) => {
    // Optimistically remove the comment from UI
    setComments(prev => prev.filter(c => c.id !== commentId));

    try {
      const response = await fetch('/api/comments/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId })
      });

      if (!response.ok) {
        // Revert on failure
        await loadComments();
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      await loadComments();
    }
  };

  const handleReport = async (commentId: number, reason: string) => {
    try {
      const response = await fetch('/api/comments/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, reason })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to report comment:', error);
      return false;
    }
  };

  const handleReply = (commentId: number) => {
    setReplyingTo(commentId);
    setReplyText('');
  };

  // Organize comments into threads
  const topLevelComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: number) => comments.filter(c => c.parent_id === parentId);

  const renderComment = (comment: Comment, depth = 0) => {
    const replies = getReplies(comment.id);

    return (
      <div key={comment.id}>
        <CommentItem
          comment={comment}
          isModerator={isModerator}
          onReply={handleReply}
          onVote={handleVote}
          onDelete={handleDelete}
          onReport={handleReport}
          depth={depth}
        />

        {/* Reply form */}
        {replyingTo === comment.id && (
          <div style={{ marginLeft: `${Math.min((depth + 1) * 2, 8)}rem` }} className="mb-3">
            <div className="bg-[#2a2520]/60 backdrop-blur-md border border-[#e89a7a]/20 rounded-xl p-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Deine Antwort..."
                className="w-full px-3 py-2 rounded-lg border border-[#e89a7a]/20 bg-[#1a1714]/50 text-sm text-[#f5f1ed] placeholder-[#b8aea5] focus:outline-none focus:ring-2 focus:ring-[#e89a7a] resize-none transition-all"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setReplyingTo(null)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-[#b8aea5]/10 text-[#f5f1ed] hover:bg-[#b8aea5]/20 transition-all"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyText.trim() || isSubmitting}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-[#8faf9d] text-white hover:bg-[#7f9f8d] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="h-3 w-3" />
                  {isSubmitting ? 'Wird gesendet...' : 'Antworten'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Render replies recursively */}
        {replies.map(reply => renderComment(reply, depth + 1))}
      </div>
    );
  };

  const commentCount = comments.length;

  return (
    <div className="mt-4">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#2a2520]/40 backdrop-blur-sm border border-[#e89a7a]/10 hover:border-[#e89a7a]/20 transition-all"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[#8faf9d]" />
          <span className="font-medium text-[#f5f1ed]">
            Kommentare {commentCount > 0 && `(${commentCount})`}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-[#b8aea5]" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[#b8aea5]" />
        )}
      </button>

      {/* Comments Section */}
      {isOpen && (
        <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
          {/* New Comment Form */}
          <div className="bg-[#2a2520]/60 backdrop-blur-md border border-[#e89a7a]/20 rounded-xl p-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Schreibe einen Kommentar..."
              className="w-full px-4 py-3 rounded-xl border border-[#e89a7a]/20 bg-[#1a1714]/50 text-[#f5f1ed] placeholder-[#b8aea5] focus:outline-none focus:ring-2 focus:ring-[#e89a7a] resize-none transition-all"
              rows={3}
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8faf9d] text-white hover:bg-[#7f9f8d] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#8faf9d]/30"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Wird gesendet...' : 'Kommentieren'}
              </button>
            </div>
          </div>

          {/* Comments List */}
          {isLoading ? (
            <div className="text-center py-8 text-[#b8aea5]">
              Lädt Kommentare...
            </div>
          ) : commentCount === 0 ? (
            <div className="text-center py-8 text-[#b8aea5]">
              Noch keine Kommentare. Sei der Erste!
            </div>
          ) : (
            <div className="space-y-2">
              {topLevelComments.map(comment => renderComment(comment))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
