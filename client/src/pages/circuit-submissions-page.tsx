import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function CircuitSubmissionsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [, params] = useRoute("/circuit/:id/submissions");
  const problemId = params?.id;
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const isFaculty = user?.role === 'faculty' || user?.role === 'hod';

  useEffect(() => {
    if (!isFaculty) {
      setLocation('/');
      return;
    }
    if (!problemId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/circuit/problems/${problemId}/submissions`, { credentials: 'include' });
        const ct = res.headers.get('content-type') || '';
        if (!res.ok) {
          const txt = await res.text();
          console.error('Failed to load submissions:', res.status, txt);
          setSubmissions([]);
          return;
        }
        if (ct.includes('application/json')) {
          setSubmissions(await res.json());
        } else {
          const txt = await res.text();
          console.error('Non-JSON submissions response:', txt);
          setSubmissions([]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [problemId, isFaculty]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Circuit Submissions" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>{loading ? 'Loading...' : 'Submissions'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {submissions.length === 0 ? (
                <div className="text-muted-foreground">No submissions yet.</div>
              ) : (
                submissions.map((s) => (
                  <div key={s._id} className="p-3 border rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{s.student?.name || 'Student'}</div>
                        <div className="text-sm text-muted-foreground">{new Date(s.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => alert(JSON.stringify(s.design, null, 2))}>Preview JSON</Button>
                        <Button onClick={() => window.open(`/api/circuit/submissions/${s._id}/pdf`, '_blank')}>Download PDF</Button>
                      </div>
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


