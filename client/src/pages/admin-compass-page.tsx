import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/use-auth';

type CompassInfo = {
  uriRedacted: string;
  note: string;
  docs: string;
  download: string;
};

export default function AdminCompassPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [info, setInfo] = useState<CompassInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/admin/compass', { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => { if (mounted) setInfo(data); })
      .catch((e) => { if (mounted) setError('Failed to load Compass details'); })
    return () => { mounted = false; };
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="MongoDB Compass" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">MongoDB Compass Connection</h1>
            {error && <div className="text-red-500">{error}</div>}
            {info && (
              <div className="bg-white rounded-xl shadow p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Redacted Connection String</h2>
                  <code className="block p-3 bg-muted rounded break-words">{info.uriRedacted}</code>
                  <p className="text-sm text-muted-foreground mt-2">{info.note}</p>
                </div>
                <div className="space-x-3">
                  <a className="underline text-blue-600" href={info.download} target="_blank" rel="noreferrer">Download Compass</a>
                  <a className="underline text-blue-600" href={info.docs} target="_blank" rel="noreferrer">How to connect</a>
                </div>
                <div className="text-sm text-muted-foreground">
                  Tip: Open Compass → New Connection → paste your full MONGO_URI from server/.env
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


