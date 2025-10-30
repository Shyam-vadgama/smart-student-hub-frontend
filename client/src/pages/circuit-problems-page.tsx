import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function CircuitProblemsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [problems, setProblems] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const canCreate = user?.role === 'faculty' || user?.role === 'hod';

  const load = async () => {
    setLoading(true);
    try {
      console.log('Loading circuit problems...');
      const res = await fetch('/api/circuit/problems', { credentials: 'include' });
      console.log('Response status:', res.status);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));
      
      const ct = res.headers.get('content-type') || '';
      if (!res.ok) {
        const txt = await res.text();
        console.error('Failed to load circuit problems:', res.status, txt);
        setProblems([]);
        return;
      }
      if (ct.includes('application/json')) {
        const data = await res.json();
        console.log('Circuit problems data:', data);
        setProblems(data);
      } else {
        const txt = await res.text();
        console.error('Non-JSON response for circuit problems:', txt);
        setProblems([]);
      }
    } catch (error) {
      console.error('Error loading circuit problems:', error);
      setProblems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createProblem = async () => {
    console.log('Creating circuit problem:', { title, description });
    console.log('User:', user);
    
    const res = await fetch('/api/circuit/problems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, description })
    });
    
    console.log('Create response status:', res.status);
    console.log('Create response headers:', Object.fromEntries(res.headers.entries()));
    
    const ct = res.headers.get('content-type') || '';
    if (!res.ok) {
      const txt = await res.text();
      console.error('Failed to create circuit problem:', res.status, txt);
      return;
    }
    if (ct.includes('application/json')) {
      const data = await res.json();
      console.log('Created circuit problem:', data);
      setTitle("");
      setDescription("");
      load();
    } else {
      const txt = await res.text();
      console.error('Non-JSON response when creating circuit problem:', txt);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Circuit Problems" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          {canCreate && (
            <Card className="mb-6">
              <CardHeader><CardTitle>Create Problem</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Textarea placeholder="Description / Requirements" value={description} onChange={(e) => setDescription(e.target.value)} />
                <Button onClick={createProblem} disabled={!title || !description}>Create</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>{loading ? 'Loading...' : 'Problems'}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {problems.length === 0 ? (
                <div className="text-muted-foreground">No problems available for your department.</div>
              ) : problems.map((p) => (
                <div key={p._id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <div className="font-medium">{p.title}</div>
                    <div className="text-sm text-muted-foreground line-clamp-2">{p.description}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setLocation(`/circuit/${p._id}`)}>Open in Simulator</Button>
                    {canCreate && (
                      <Button variant="outline" onClick={() => setLocation(`/circuit/${p._id}/submissions`)}>View Submissions</Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}


