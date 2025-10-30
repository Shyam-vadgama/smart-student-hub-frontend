import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function QuizPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const canCreate = user?.role === 'faculty' || user?.role === 'hod';

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quiz', { credentials: 'include' });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        setQuizzes(await res.json());
      } else {
        setQuizzes([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Create quiz form (faculty/hod)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctIndex, setCorrectIndex] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);

  const addQuestion = () => {
    if (!questionText || !optionA || !optionB || !optionC || !optionD) return;
    setQuestions((prev) => [...prev, { text: questionText, options: [optionA, optionB, optionC, optionD], correctIndex }]);
    setQuestionText(""); setOptionA(""); setOptionB(""); setOptionC(""); setOptionD(""); setCorrectIndex(0);
  };

  const createQuiz = async () => {
    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, description, questions })
    });
    if (res.ok) { setTitle(""); setDescription(""); setQuestions([]); load(); }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Mechanical Quizzes" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          {canCreate && (
            <Card className="mb-6">
              <CardHeader><CardTitle>Create Quiz</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
                <div className="p-3 border rounded-md space-y-2">
                  <Input placeholder="Question" value={questionText} onChange={(e) => setQuestionText(e.target.value)} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input placeholder="Option A" value={optionA} onChange={(e) => setOptionA(e.target.value)} />
                    <Input placeholder="Option B" value={optionB} onChange={(e) => setOptionB(e.target.value)} />
                    <Input placeholder="Option C" value={optionC} onChange={(e) => setOptionC(e.target.value)} />
                    <Input placeholder="Option D" value={optionD} onChange={(e) => setOptionD(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Correct index (0-based):</span>
                    <Input type="number" className="w-24" min={0} max={3} value={correctIndex} onChange={(e) => setCorrectIndex(Number(e.target.value))} />
                    <Button onClick={addQuestion} disabled={!questionText || !optionA || !optionB || !optionC || !optionD}>Add Question</Button>
                  </div>
                  {questions.length > 0 && (
                    <div className="text-sm text-muted-foreground">{questions.length} question(s) added</div>
                  )}
                </div>
                <Button onClick={createQuiz} disabled={!title || questions.length === 0}>Create Quiz</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>{loading ? 'Loading...' : 'Quizzes'}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {quizzes.length === 0 ? (
                <div className="text-muted-foreground">No quizzes available.</div>
              ) : (
                quizzes.map((q) => (
                  <div key={q._id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <div className="font-medium">{q.title}</div>
                      <div className="text-sm text-muted-foreground">{q.description}</div>
                    </div>
                    <div>
                      <Button onClick={() => setLocation(`/quiz/${q._id}`)}>Open</Button>
                      {canCreate && (
                        <Button variant="outline" className="ml-2" onClick={() => setLocation(`/quiz/${q._id}/submissions`)}>Submissions</Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}


