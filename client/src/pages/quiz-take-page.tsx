import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function QuizTakePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quiz, setQuiz] = useState<any | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, params] = useRoute("/quiz/:id");
  const quizId = params?.id;
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!quizId) return;
    fetch(`/api/quiz/${quizId}`, { credentials: 'include' })
      .then(async (r) => {
        const ct = r.headers.get('content-type') || '';
        if (!r.ok || !ct.includes('application/json')) return null;
        return r.json();
      })
      .then((data) => {
        setQuiz(data);
        setAnswers(new Array(data?.questions?.length || 0).fill(undefined));
      });
  }, [quizId]);

  const select = (idx: number, opt: number) => {
    const next = [...answers];
    next[idx] = opt;
    setAnswers(next);
  };

  const submit = async () => {
    setError(null);
    const res = await fetch(`/api/quiz/${quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ answers })
    });
    if (res.ok) {
      const data = await res.json();
      setScore(data.score);
    } else {
      try {
        const errorData = await res.json();
        setError(errorData.message || 'An error occurred while submitting.');
        if (typeof errorData.score !== 'undefined') {
          setScore(errorData.score);
        }
      } catch (e) {
        setError('An unexpected error occurred.');
      }
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={quiz ? quiz.title : 'Quiz'} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Card>
            <CardHeader><CardTitle>{score == null ? 'Answer the quiz' : `Score: ${score}`}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-100 text-red-700 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
              {score == null && quiz?.questions?.map((q: any, i: number) => (
                <div key={i} className="p-3 border rounded-md">
                  <div className="font-medium mb-2">{i + 1}. {q.text}</div>
                  <div className="grid gap-2">
                    {q.options.map((opt: string, j: number) => (
                      <Button key={j} variant={answers[i] === j ? 'default' : 'outline'} onClick={() => select(i, j)}>{opt}</Button>
                    ))}
                  </div>
                </div>
              ))}
              {score == null && (
                <Button onClick={submit} disabled={!answers.every((a) => a !== undefined)}>Submit</Button>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}


