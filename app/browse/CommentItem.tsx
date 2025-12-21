'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Reply, Trash2, Flag, X } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ProfileAvatar from '@/components/ProfileAvatar';

interface CommentItemProps {
  comment: {
    id: number;
    user_id?: number; // optional: API provides it; required for avatar
    text: string;
    author: string;
    author_role: string;
    author_class: string | null;
    created_at: string;
    upvotes: number;
    downvotes: number;
    user_vote: 'upvote' | 'downvote' | null;
    is_author: boolean;
    parent_id: number | null;
  };
  isModerator: boolean;
  onReply: (commentId: number) => void;
  onVote: (commentId: number, voteType: 'upvote' | 'downvote') => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
  onReport: (commentId: number, reason: string) => Promise<boolean>;
  depth?: number;
}

export default function CommentItem({
  comment,
  isModerator,
  onReply,
  onVote,
  onDelete,
  onReport,
  depth = 0
}: CommentItemProps) {
  const [upvotes, setUpvotes] = useState(comment.upvotes);
  const [downvotes, setDownvotes] = useState(comment.downvotes);
  const [userVote, setUserVote] = useState(comment.user_vote);
  const [isVoting, setIsVoting] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Keep local vote state in sync with latest props (e.g., after polling)
  useEffect(() => {
    setUpvotes(comment.upvotes);
    setDownvotes(comment.downvotes);
    setUserVote(comment.user_vote);
  }, [comment.id, comment.upvotes, comment.downvotes, comment.user_vote]);

  const handleVoteClick = async (voteType: 'upvote' | 'downvote') => {
    if (isVoting) return;

    setIsVoting(true);

    const wasUpvote = userVote === 'upvote';
    const wasDownvote = userVote === 'downvote';

    // Optimistic update
    if (voteType === 'upvote') {
      if (wasUpvote) {
        setUpvotes(prev => prev - 1);
        setUserVote(null);
      } else {
        setUpvotes(prev => prev + 1);
        if (wasDownvote) setDownvotes(prev => prev - 1);
        setUserVote('upvote');
      }
    } else {
      if (wasDownvote) {
        setDownvotes(prev => prev - 1);
        setUserVote(null);
      } else {
        setDownvotes(prev => prev + 1);
        if (wasUpvote) setUpvotes(prev => prev - 1);
        setUserVote('downvote');
      }
    }

    try {
      await onVote(comment.id, voteType);
    } catch {
      // Revert on error
      setUpvotes(comment.upvotes);
      setDownvotes(comment.downvotes);
      setUserVote(comment.user_vote);
    } finally {
      setIsVoting(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;

    setIsSubmittingReport(true);
    const success = await onReport(comment.id, reportReason);
    setIsSubmittingReport(false);

    if (success) {
      setShowReportDialog(false);
      setReportReason('');
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    await onDelete(comment.id);
  };

  const getBadge = () => {
    if (comment.is_author) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#8faf9d]/20 text-[#8faf9d] border border-[#8faf9d]/30">
          Ersteller
        </span>
      );
    }
    if (comment.author_role === 'admin') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
          Admin
        </span>
      );
    }
    if (comment.author_role === 'moderator') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
          Moderator
        </span>
      );
    }
    return null;
  };

  const marginLeft = depth > 0 ? `${Math.min(depth * 2, 8)}rem` : '0';

  return (
    <div style={{ marginLeft }} className="mb-3">
      <div className="bg-[#2a2520]/40 backdrop-blur-sm border border-[#e89a7a]/10 rounded-xl p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {typeof comment.user_id === 'number' && (
            <ProfileAvatar userId={comment.user_id} username={comment.author} size={20} />
          )}
          <span className="font-medium text-sm text-[#f5f1ed]">
            {comment.author}
          </span>
          {getBadge()}
          {comment.author_class && (
            <>
              <span className="text-[#b8aea5]">•</span>
              <span className="text-xs text-[#b8aea5]">Klasse {comment.author_class}</span>
            </>
          )}
          <span className="text-[#b8aea5]">•</span>
          <span className="text-xs text-[#b8aea5]">
            {new Date(comment.created_at).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        {/* Content */}
        <p className="text-sm text-[#f5f1ed] mb-3 whitespace-pre-wrap">
          {comment.text}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Vote buttons */}
          <button
            onClick={() => handleVoteClick('upvote')}
            disabled={isVoting}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
              userVote === 'upvote'
                ? 'bg-[#8faf9d] text-white'
                : 'bg-[#8faf9d]/10 text-[#8faf9d] hover:bg-[#8faf9d]/20'
            } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ThumbsUp className="h-3 w-3" />
            <span className="font-medium">{upvotes}</span>
          </button>

          <button
            onClick={() => handleVoteClick('downvote')}
            disabled={isVoting}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
              userVote === 'downvote'
                ? 'bg-[#e89a7a] text-white'
                : 'bg-[#e89a7a]/10 text-[#e89a7a] hover:bg-[#e89a7a]/20'
            } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ThumbsDown className="h-3 w-3" />
            <span className="font-medium">{downvotes}</span>
          </button>

          {/* Reply button */}
          {depth < 3 && (
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-[#b8aea5]/10 text-[#b8aea5] hover:bg-[#b8aea5]/20 transition-all"
            >
              <Reply className="h-3 w-3" />
              <span>Antworten</span>
            </button>
          )}

          {/* Moderator actions */}
          {isModerator && (
            <button
              onClick={handleDeleteClick}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
            >
              <Trash2 className="h-3 w-3" />
              <span>Löschen</span>
            </button>
          )}

          {/* Report button for non-moderators */}
          {!isModerator && (
            <button
              onClick={() => setShowReportDialog(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-[#b8aea5]/10 text-[#b8aea5] hover:bg-[#b8aea5]/20 transition-all"
            >
              <Flag className="h-3 w-3" />
              <span>Melden</span>
            </button>
          )}
        </div>
      </div>

      {/* Report Dialog */}
      {showReportDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#2a2520] rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#f5f1ed]">
                Kommentar melden
              </h3>
              <button
                onClick={() => {
                  setShowReportDialog(false);
                  setReportReason('');
                }}
                className="p-2 rounded-lg hover:bg-[#6b635a]/10 transition-colors"
              >
                <X className="h-5 w-5 text-[#b8aea5]" />
              </button>
            </div>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Warum möchtest du diesen Kommentar melden?"
              className="w-full px-4 py-3 rounded-xl border border-[#e89a7a]/20 bg-[#1a1714]/50 text-[#f5f1ed] placeholder-[#b8aea5] focus:outline-none focus:ring-2 focus:ring-[#e89a7a] resize-none transition-all"
              rows={4}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowReportDialog(false);
                  setReportReason('');
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#b8aea5]/10 text-[#f5f1ed] hover:bg-[#b8aea5]/20 transition-all"
              >
                Abbrechen
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason.trim() || isSubmittingReport}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#e89a7a] text-white hover:bg-[#d68868] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#e89a7a]/30"
              >
                {isSubmittingReport ? 'Wird gemeldet...' : 'Melden'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Kommentar löschen"
        message="Möchtest du diesen Kommentar wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmText="Löschen"
        cancelText="Abbrechen"
        variant="danger"
      />
    </div>
  );
}
