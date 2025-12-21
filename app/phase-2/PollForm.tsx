"use client";

import { useState, useEffect } from "react";
import GlassCard from "@/components/ui/GlassCard";
import GlowButton from "@/components/ui/GlowButton";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type QuestionType = "text" | "multiple-choice" | "multiple-select" | "slider";

type PollOption = {
  value: string;
  label: string;
};

type Question = {
  id: string;
  type: QuestionType;
  question: string;
  required: boolean;
  placeholder?: string;
  maxLength?: number;
  options?: PollOption[];
  min?: number;
  max?: number;
  step?: number;
  labels?: {
    min: string;
    max: string;
  };
  minSelections?: number;
};

type Poll = {
  id: string;
  title: string;
  description: string;
  questions: Question[];
};

type PollData = {
  polls: Poll[];
};

export default function PollForm({ userId }: { userId: number }) {
  const [pollData, setPollData] = useState<PollData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/polls.json")
      .then((res) => res.json())
      .then((data) => {
        setPollData(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const validateAnswers = (poll: Poll): boolean => {
    const newErrors: Record<string, string> = {};

    poll.questions.forEach((q) => {
      if (q.required) {
        const answer = answers[q.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0)) {
          newErrors[q.id] = "Diese Frage muss beantwortet werden";
        } else if (q.type === "multiple-select" && q.minSelections && Array.isArray(answer)) {
          if (answer.length < q.minSelections) {
            newErrors[q.id] = `Bitte wähle mindestens ${q.minSelections} Optionen`;
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (poll: Poll) => {
    if (!validateAnswers(poll)) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/polls/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          pollId: poll.id,
          answers,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert("Fehler beim Absenden. Bitte versuche es erneut.");
      }
    } catch {
      alert("Netzwerkfehler. Bitte versuche es später erneut.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const error = errors[question.id];

    switch (question.type) {
      case "text":
        return (
          <div className="space-y-2">
            <textarea
              value={(answers[question.id] as string) || ""}
              onChange={(e) => {
                setAnswers({ ...answers, [question.id]: e.target.value });
                if (errors[question.id]) {
                  setErrors({ ...errors, [question.id]: "" });
                }
              }}
              placeholder={question.placeholder}
              maxLength={question.maxLength}
              rows={4}
              className={`input-base w-full resize-none ${
                error ? "border-[#ef5350]" : ""
              }`}
            />
            {question.maxLength && (
              <div className="text-xs text-[#b8aea5] text-right">
                {((answers[question.id] as string) || "").length} / {question.maxLength}
              </div>
            )}
          </div>
        );

      case "multiple-choice":
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-3 p-4 rounded-xl border ${
                  answers[question.id] === option.value
                    ? "border-[#66bb6a] bg-[#66bb6a]/5"
                    : "border-[#e89a7a]/15 bg-[#2a2520]/60"
                } hover:border-[#e89a7a]/30 transition-all cursor-pointer`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={answers[question.id] === option.value}
                  onChange={(e) => {
                    setAnswers({ ...answers, [question.id]: e.target.value });
                    if (errors[question.id]) {
                      setErrors({ ...errors, [question.id]: "" });
                    }
                  }}
                  className="h-5 w-5 text-[#66bb6a] focus:ring-[#66bb6a]"
                />
                <span className="text-sm text-[#f5f1ed] font-medium">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        );

      case "multiple-select":
        const selectedValues = (answers[question.id] as string[]) || [];
        return (
          <div className="space-y-3">
            {question.options?.map((option) => {
              const isChecked = selectedValues.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-4 rounded-xl border ${
                    isChecked
                      ? "border-[#66bb6a] bg-[#66bb6a]/5"
                      : "border-[#e89a7a]/15 bg-[#2a2520]/60"
                  } hover:border-[#e89a7a]/30 transition-all cursor-pointer`}
                >
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={isChecked}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...selectedValues, option.value]
                        : selectedValues.filter((v) => v !== option.value);
                      setAnswers({ ...answers, [question.id]: newValues });
                      if (errors[question.id]) {
                        setErrors({ ...errors, [question.id]: "" });
                      }
                    }}
                    className="h-5 w-5 rounded text-[#66bb6a] focus:ring-[#66bb6a]"
                  />
                  <span className="text-sm text-[#f5f1ed] font-medium">
                    {option.label}
                  </span>
                </label>
              );
            })}
            {question.minSelections && (
              <div className="text-xs text-[#b8aea5]">
                Mindestens {question.minSelections} Optionen auswählen
              </div>
            )}
          </div>
        );

      case "slider":
        const value = Number(answers[question.id]) || question.min || 0;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#b8aea5]">
                {question.labels?.min}
              </span>
              <span className="text-2xl font-bold text-[#66bb6a]">
                {value}
              </span>
              <span className="text-xs text-[#b8aea5]">
                {question.labels?.max}
              </span>
            </div>
            <input
              type="range"
              min={question.min}
              max={question.max}
              step={question.step}
              value={value}
              onChange={(e) => {
                setAnswers({ ...answers, [question.id]: e.target.value });
                if (errors[question.id]) {
                  setErrors({ ...errors, [question.id]: "" });
                }
              }}
              className="w-full h-2 bg-[#e89a7a]/20 rounded-lg appearance-none cursor-pointer slider-thumb"
              style={{
                background: `linear-gradient(to right, #66bb6a 0%, #66bb6a ${
                  ((value - (question.min || 0)) / ((question.max || 10) - (question.min || 0))) * 100
                }%, #d97757 ${
                  ((value - (question.min || 0)) / ((question.max || 10) - (question.min || 0))) * 100
                }%, #d97757 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-[#b8aea5]">
              <span>{question.min}</span>
              <span>{question.max}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#d97757]" />
      </div>
    );
  }

  if (!pollData || pollData.polls.length === 0) {
    return (
      <GlassCard>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-[#f44336] mx-auto mb-4" />
          <p className="text-lg text-[#b8aea5]">
            Keine Umfragen verfügbar
          </p>
        </div>
      </GlassCard>
    );
  }

  const poll = pollData.polls[0];

  if (submitted) {
    return (
      <GlassCard>
        <div className="text-center py-12">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-[#66bb6a]/10 text-[#66bb6a] mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-bold text-[#f5f1ed] mb-4">
            Vielen Dank!
          </h2>
          <p className="text-lg text-[#b8aea5] mb-8">
            Deine Antworten wurden erfolgreich gespeichert. Wir freuen uns über deine Teilnahme!
          </p>
          <GlowButton as="a" href="/" variant="primary">
            Zurück zur Startseite
          </GlowButton>
        </div>
      </GlassCard>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      <GlassCard fade={false}>
        <div className="mb-8" style={{ width: '100%' }}>
          <h2 className="text-2xl font-bold text-[#f5f1ed] mb-2">
            {poll.title}
          </h2>
          <p className="text-[#b8aea5]">{poll.description}</p>
        </div>

        <div className="space-y-8" style={{ width: '100%' }}>
          {poll.questions.map((question, index) => (
            <div key={question.id} className="space-y-3" style={{ width: '100%', maxWidth: '100%' }}>
              <div className="flex items-start gap-3" style={{ width: '100%' }}>
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e89a7a]/10 text-[#e89a7a] text-sm font-bold">
                  {index + 1}
                </span>
                <div style={{ flex: 1, width: '100%', minWidth: 0 }}>
                  <h3 className="text-lg font-semibold text-[#f5f1ed] mb-3 break-words">
                    {question.question}
                    {question.required && (
                      <span className="text-[#ef5350] ml-1">*</span>
                    )}
                  </h3>
                  <div style={{ width: '100%', maxWidth: '100%' }}>
                    {renderQuestion(question)}
                  </div>
                  {errors[question.id] && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-[#ef5350]">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span className="break-words">{errors[question.id]}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-[#e89a7a]/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#b8aea5]">
              Felder mit <span className="text-[#ef5350]">*</span> sind Pflichtfelder
            </p>
            <GlowButton
              onClick={() => handleSubmit(poll)}
              disabled={submitting}
              variant="primary"
              className="w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Wird gesendet...
                </>
              ) : (
                "Abstimmung abschicken"
              )}
            </GlowButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
