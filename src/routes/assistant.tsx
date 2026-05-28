import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Atom,
  BookOpenText,
  BrainCircuit,
  Calculator,
  FlaskConical,
  Globe,
  Languages,
  Lightbulb,
  PenLine,
  Send,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Card, PageHeader, Badge, PrimaryButton, SecondaryButton, SectionTitle } from "@/components/app/ui-bits";
import { cn } from "@/lib/utils";
import { useAIChat } from "@/hooks/api-hooks";
import { useAuth } from "@/hooks/use-auth";
import { resolveStudentId } from "@/lib/defaults";
import { RequireRole } from "@/components/app/require-role";
import { consumeAssistantPrompt } from "../lib/assistantPrompt";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "Learning Assistant — AetherLMS" },
      { name: "description", content: "Subject-wise AI learning assistant with question generation." },
    ],
  }),
  component: Assistant,
});

const subjects = [
  { id: "physics", name: "Physics", icon: Atom },
  { id: "math", name: "Mathematics", icon: Calculator },
  { id: "chem", name: "Chemistry", icon: FlaskConical },
  { id: "hist", name: "History", icon: Globe },
  { id: "eng", name: "English", icon: Languages },
];

type Msg = { id: number; role: "user" | "ai"; text: string };

const SEED: Record<string, Msg[]> = {
  physics: [{ id: 1, role: "ai", text: "Hi Aria. I can recap wave mechanics, build a quiz, or explain a concept step by step." }],
  math: [{ id: 1, role: "ai", text: "Hi. I noticed you are revising integral calculus. Want targeted practice or a short summary first?" }],
  chem: [{ id: 1, role: "ai", text: "Welcome to Chemistry. Ask me for help with reactions, bonding, or lab revision." }],
  hist: [{ id: 1, role: "ai", text: "Hello. I can help you review the Industrial Revolution, timelines, or essay structure." }],
  eng: [{ id: 1, role: "ai", text: "Hi. Need help with analysis, essay writing, grammar, or vocabulary revision?" }],
};

const SUBJECT_MAP: Record<string, string> = {
  physics: "Science",
  math: "Mathematics",
  chem: "Science",
  hist: "History",
  eng: "English",
};

function Assistant() {
  const [active, setActive] = useState("math");
  const [conv, setConv] = useState<Record<string, Msg[]>>(SEED);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { auth } = useAuth();
  const { mutateAsync, isPending } = useAIChat();

  const messages = conv[active] ?? [];
  const studentId = resolveStudentId(auth);
  const activeSubject = subjects.find((subject) => subject.id === active)?.name ?? active;

  const studyHistory = useMemo(
    () => [
      { title: "Exam revision", detail: "45 minutes on algebra and waves", time: "Today" },
      { title: "Practice quiz", detail: "Scored 8/10 on chemistry bonding", time: "Yesterday" },
      { title: "Summary request", detail: "Generated concise English notes", time: "2 days ago" },
    ],
    [],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, active]);

  useEffect(() => {
    const prompt = consumeAssistantPrompt();
    if (prompt) {
      void send(prompt);
    }
  }, []);

  function updateMessage(id: number, text: string) {
    setConv((current) => {
      const list = current[active] ?? [];
      return {
        ...current,
        [active]: list.map((message) => (message.id === id ? { ...message, text } : message)),
      };
    });
  }

  async function typeOutMessage(id: number, text: string) {
    setIsTyping(true);
    return new Promise<void>((resolve) => {
      let index = 0;
      const timer = window.setInterval(() => {
        index += 1;
        updateMessage(id, text.slice(0, index));
        if (index >= text.length) {
          window.clearInterval(timer);
          setIsTyping(false);
          resolve();
        }
      }, 12);
    });
  }

  async function send(text?: string) {
    const value = (text ?? draft).trim();
    if (!value) return;

    const userMessage: Msg = { id: Date.now(), role: "user", text: value };
    setConv((current) => ({ ...current, [active]: [...(current[active] ?? []), userMessage] }));
    setDraft("");

    const aiId = Date.now() + 1;
    const reply: Msg = { id: aiId, role: "ai", text: "" };
    setConv((current) => ({ ...current, [active]: [...(current[active] ?? []), reply] }));

    try {
      const subjectName = SUBJECT_MAP[active] ?? activeSubject;
      const response = await mutateAsync({
        student_id: studentId,
        subject: subjectName,
        question: value,
      });
      await typeOutMessage(aiId, response.answer);
    } catch (error) {
      updateMessage(aiId, error instanceof Error ? error.message : "AI request failed.");
      setIsTyping(false);
    }
  }

  return (
    <RequireRole roles={["student", "teacher", "admin"]}>
      <PageHeader
        eyebrow="AI tutor workspace"
        title="Learning Assistant"
        subtitle="A refined educational AI tutor with subject-aware chat, study suggestions, and polished response handling."
        actions={
          <>
            <Badge tone="brand"><Sparkles className="mr-1 inline size-3" /> Aether AI</Badge>
            <PrimaryButton onClick={() => send("Generate a 5-question quiz for me.")}>
              <Wand2 className="size-4" />
              Generate quiz
            </PrimaryButton>
            <SecondaryButton onClick={() => send("Explain this topic simply.")}>Explain simply</SecondaryButton>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <Card>
            <SectionTitle action={<Badge tone="brand">Subject map</Badge>}>Subjects</SectionTitle>
            <div className="space-y-1">
              {subjects.map((subject) => {
                const isActive = active === subject.id;
                return (
                  <button
                    key={subject.id}
                    onClick={() => setActive(subject.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
                      isActive
                        ? "border border-brand-200/70 bg-brand-50 text-brand-800 dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-200"
                        : "border border-transparent text-muted-foreground hover:border-border/70 hover:bg-secondary/60 hover:text-foreground",
                    )}
                  >
                    <subject.icon className={cn("size-4", isActive && "text-brand-600")} />
                    <span className="flex-1 text-left">{subject.name}</span>
                    {isActive && <Badge tone="success">Active</Badge>}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionTitle action={<Badge tone="success">Personalized</Badge>}>Study history</SectionTitle>
            <div className="space-y-3">
              {studyHistory.map((item) => (
                <div key={item.title} className="rounded-2xl border border-border/70 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle action={<Badge tone="brand">Insights</Badge>}>AI recommendations</SectionTitle>
            <div className="space-y-3">
              {[
                { icon: BrainCircuit, text: `Build a quick revision set for ${activeSubject}.` },
                { icon: Lightbulb, text: "Explain the topic in simple steps, then test recall." },
                { icon: BookOpenText, text: "Create a 5-question practice quiz with answers." },
                { icon: PenLine, text: "Summarise today's class notes in one page." },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3 rounded-2xl border border-border/70 px-4 py-3">
                  <item.icon className="mt-0.5 size-4 text-brand-600" />
                  <p className="text-sm leading-6 text-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="flex min-h-[720px] flex-col p-0">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-brand-foreground shadow-[0_16px_32px_-18px_rgba(79,70,229,0.75)]">
                <Sparkles className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{activeSubject} Tutor</p>
                <p className="text-xs text-muted-foreground">Online · Personalized for Grade 11-A</p>
              </div>
            </div>
            <Badge tone="success"><ShieldCheck className="mr-1 inline size-3" />Safe study mode</Badge>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-6 scrollbar-none">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-3", message.role === "user" && "justify-end")}
              >
                {message.role === "ai" && (
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background">
                    <Sparkles className="size-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm",
                    message.role === "ai"
                      ? "rounded-tl-md border border-border/70 bg-secondary/70 text-foreground"
                      : "rounded-tr-md bg-brand-600 text-brand-foreground",
                  )}
                >
                  {message.text || (message.role === "ai" && (isPending || isTyping) ? "..." : "")}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="border-t border-border/70 px-5 py-4">
            <div className="mb-4 flex flex-wrap gap-2">
              {[
                "Generate quiz",
                "Explain simply",
                "Create summary",
                "Practice questions",
                "Exam revision",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="rounded-full border border-border/70 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                send();
              }}
              className="flex items-center gap-2 rounded-3xl border border-border/70 bg-card p-2 shadow-sm focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500/20"
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask your AI tutor anything about this subject..."
                className="flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
                disabled={isPending || isTyping}
              />
              <button
                type="submit"
                className="inline-flex size-11 items-center justify-center rounded-2xl bg-brand-600 text-brand-foreground shadow-[0_16px_32px_-20px_rgba(79,70,229,0.85)] transition hover:bg-brand-700"
                disabled={isPending || isTyping}
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </Card>
      </div>
    </RequireRole>
  );
}
