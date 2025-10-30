import { Link } from "wouter";
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/use-auth";
// Import raw HTML templates to preserve exact UI and styles
// Vite supports importing as raw strings via ?raw
// Relative to this file: ../../Resume-Templates/
// @ts-ignore
import template1Raw from "../../Resume-Templates/template-1.html?raw";
// @ts-ignore
import template2Raw from "../../Resume-Templates/template-2.html?raw";
// @ts-ignore
import template3Raw from "../../Resume-Templates/template-3.html?raw";
import { useLocation } from "wouter";

export default function ResumeBuilderPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [experience, setExperience] = useState<string[]>([""]);
  const [education, setEducation] = useState<string[]>([""]);
  const [skills, setSkills] = useState<string>("");
  const [template, setTemplate] = useState<1 | 2 | 3>(1);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const templateFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ suggestions?: string[]; learningRoadmap?: Array<{ topic: string; why?: string; resources?: string }>; missingSkills?: string[] } | null>(null);
  
  // New state for editing
  const [isEditMode, setIsEditMode] = useState(false);
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [location] = useLocation();

  // Check if we're in edit mode
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const id = params.get('id');
    
    if (id) {
      setIsEditMode(true);
      setResumeId(parseInt(id));
      // Fetch the resume data
      fetchResumeData(parseInt(id));
    }
  }, [location]);

  // Fetch resume data for editing
  const fetchResumeData = async (id: number) => {
    try {
      const res = await fetch(`/api/resumes/${id}`, {
        credentials: 'include'
      });
      
      if (!res.ok) throw new Error('Failed to fetch resume');
      
      const data = await res.json();
      
      // Populate form with fetched data
      setFullName(data.data.fullName || "");
      setEmail(data.data.email || "");
      setPhone(data.data.phone || "");
      setWebsite(data.data.website || "");
      setTitle(data.data.title || "");
      setSummary(data.data.summary || "");
      setExperience(Array.isArray(data.data.experience) && data.data.experience.length ? data.data.experience : [""]);
      setEducation(Array.isArray(data.data.education) && data.data.education.length ? data.data.education : [""]);
      setSkills(data.data.skills || "");
      setTemplate([1,2,3].includes(data.template) ? data.template : 1);
    } catch (e) {
      console.error('Error loading resume:', e);
      window.alert('Error loading resume data');
    }
  };

  // Load from localStorage (only for new resumes)
  useEffect(() => {
    if (isEditMode) return; // Skip if editing
    
    try {
      const saved = localStorage.getItem("resumeBuilderDraft");
      if (saved) {
        const data = JSON.parse(saved);
        setFullName(data.fullName || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setWebsite(data.website || "");
        setTitle(data.title || "");
        setSummary(data.summary || "");
        setExperience(Array.isArray(data.experience) && data.experience.length ? data.experience : [""]);
        setEducation(Array.isArray(data.education) && data.education.length ? data.education : [""]);
        setSkills(data.skills || "");
        setTemplate([1,2,3].includes(data.template) ? data.template : 1);
      }
    } catch {}
  }, [isEditMode]);

  // Prefill from logged-in user (only for new resumes)
  useEffect(() => {
    if (user && !isEditMode) {
      if (!fullName) setFullName(user.name || "");
      if (!email) setEmail(user.email || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isEditMode]);

  // Save to localStorage (only for new resumes)
  useEffect(() => {
    if (isEditMode) return; // Skip if editing
    
    const payload = { fullName, email, phone, website, title, summary, experience, education, skills, template };
    localStorage.setItem("resumeBuilderDraft", JSON.stringify(payload));
  }, [fullName, email, phone, website, title, summary, experience, education, skills, template, isEditMode]);

  const handleChangeList = (setter: Dispatch<SetStateAction<string[]>>) => (index: number, value: string) => {
    setter((prev: string[]) => prev.map((item: string, i: number) => (i === index ? value : item)));
  };

  const handleAddList = (setter: Dispatch<SetStateAction<string[]>>) => () => setter((prev: string[]) => [...prev, ""]);

  const handleRemoveList = (setter: Dispatch<SetStateAction<string[]>>) => (index: number) =>
    setter((prev: string[]) => prev.filter((_: string, i: number) => i !== index));

  const printPreview = () => {
    const iframe = templateFrameRef.current;
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };

  const skillChips = useMemo(() => skills.split(",").map((s) => s.trim()).filter(Boolean), [skills]);

  // Build template HTML strings using current data
  const escapeHtml = (str: string) => str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Write template HTML into iframe for preview
  useEffect(() => {
    const iframe = templateFrameRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    const raw = template === 1 ? template1Raw : template === 2 ? template2Raw : template3Raw;
    doc.open();
    doc.write(raw);
    doc.close();
    
    // After the template is written, populate fields to match exact UI
    const populate = () => {
      try {
        const d = iframe.contentDocument || iframe.contentWindow?.document;
        if (!d) return;
        const safe = (v: string) => escapeHtml(v || "");
        
        // Common
        const nameEl = d.querySelector('.name');
        if (nameEl) nameEl.textContent = fullName || "";
        const titleEl = d.querySelector('.title');
        if (titleEl) titleEl.textContent = title || "";
        
        // Contact sections vary
        if (template === 1) {
          const contact = d.querySelector('.contact-info');
          if (contact) {
            contact.innerHTML = '';
            const add = (label: string, value: string) => {
              if (!value) return;
              const div = d.createElement('div');
              div.className = 'contact-item';
              div.innerHTML = `<span class="contact-label">${label}</span><span>${safe(value)}</span>`;
              contact.appendChild(div);
            };
            add('📧', email);
            add('📱', phone);
            add('🌐', website);
          }
          
          const setSection = (titleText: string, html: string) => {
            const sections = Array.from(d.querySelectorAll('.section')) as HTMLElement[];
            const sec = sections.find(s => s.querySelector('.section-title')?.textContent?.trim().toLowerCase() === titleText.toLowerCase());
            if (!sec) return;
            const desc = sec.querySelector('.item-description');
            if (desc) desc.innerHTML = html;
          };
          
          setSection('Profile', safe(summary));
          
          const fillListSection = (titleText: string, items: string[], itemClass: string) => {
            const sections = Array.from(d.querySelectorAll('.section')) as HTMLElement[];
            const sec = sections.find(s => s.querySelector('.section-title')?.textContent?.trim().toLowerCase() === titleText.toLowerCase());
            if (!sec) return;
            // remove existing .item blocks after the title
            Array.from(sec.querySelectorAll('.item')).forEach(e => e.remove());
            items.forEach(it => {
              const itemDiv = d.createElement('div');
              itemDiv.className = itemClass;
              const p = d.createElement('p');
              p.className = 'item-description';
              p.textContent = it;
              itemDiv.appendChild(p);
              sec.appendChild(itemDiv);
            });
          };
          
          fillListSection('Experience', experience.filter(Boolean), 'item');
          
          const skillsWrap = d.querySelector('.skills-container');
          if (skillsWrap) {
            skillsWrap.innerHTML = '';
            skillChips.forEach(s => {
              const div = d.createElement('div');
              div.className = 'skill';
              div.textContent = s;
              skillsWrap.appendChild(div);
            });
          }
          
          fillListSection('Education', education.filter(Boolean), 'item');
        }
        
        if (template === 2) {
          const contact = d.querySelector('.sidebar .contact-info');
          if (contact) {
            contact.innerHTML = '<div class="contact-section-title">Contact</div>';
            const add = (icon: string, value: string) => {
              if (!value) return;
              const div = d.createElement('div');
              div.className = 'contact-item';
              div.innerHTML = `<div class="contact-icon">${icon}</div><div>${safe(value)}</div>`;
              contact.appendChild(div);
            };
            add('📧', email);
            add('📱', phone);
            add('🔗', website);
          }
          
          const setSection = (titleText: string, html: string) => {
            const sections = Array.from(d.querySelectorAll('.section')) as HTMLElement[];
            const sec = sections.find(s => s.querySelector('.section-title')?.textContent?.trim().toLowerCase() === titleText.toLowerCase());
            if (!sec) return;
            const p = sec.querySelector('.item-description');
            if (p) p.innerHTML = html;
          };
          
          setSection('Profile', safe(summary));
          
          const fillItems = (titleText: string, items: string[], containerSelector: string) => {
            const sections = Array.from(d.querySelectorAll('.section')) as HTMLElement[];
            const sec = sections.find(s => s.querySelector('.section-title')?.textContent?.trim().toLowerCase() === titleText.toLowerCase());
            if (!sec) return;
            Array.from(sec.querySelectorAll('.item')).forEach(e => e.remove());
            items.forEach(it => {
              const item = d.createElement('div');
              item.className = 'item';
              const p = d.createElement('p');
              p.className = 'item-description';
              p.textContent = it;
              item.appendChild(p);
              sec.appendChild(item);
            });
          };
          
          fillItems('Experience', experience.filter(Boolean), '.item');
          
          const skillsSec = Array.from(d.querySelectorAll('.section'))
            .find(s => s.querySelector('.section-title')?.textContent?.trim().toLowerCase() === 'skills');
          if (skillsSec) {
            const container = skillsSec.querySelector('.interests-container');
            if (container) {
              container.innerHTML = '';
              skillChips.forEach(s => {
                const div = d.createElement('div');
                div.className = 'interest';
                div.textContent = s;
                container.appendChild(div);
              });
            }
          }
          
          const eduSec = Array.from(d.querySelectorAll('.section'))
            .find(s => s.querySelector('.section-title')?.textContent?.trim().toLowerCase() === 'education');
          if (eduSec) {
            Array.from(eduSec.querySelectorAll('.item')).forEach(e => e.remove());
            education.filter(Boolean).forEach(it => {
              const item = d.createElement('div');
              item.className = 'item';
              const p = d.createElement('p');
              p.className = 'item-description';
              p.textContent = it;
              item.appendChild(p);
              eduSec.appendChild(item);
            });
          }
        }
        
        if (template === 3) {
          const contact = d.querySelector('.contact-info');
          if (contact) {
            contact.innerHTML = '';
            const add = (value: string) => {
              if (!value) return;
              const div = d.createElement('div');
              div.className = 'contact-item';
              div.textContent = value;
              contact.appendChild(div);
            };
            add(email);
            add(phone);
            add(website);
          }
          
          const setSectionByTitle = (titleText: string, html: string) => {
            const sections = Array.from(d.querySelectorAll('.section')) as HTMLElement[];
            const sec = sections.find(s => s.querySelector('.section-title')?.textContent?.trim().toLowerCase() === titleText.toLowerCase());
            if (!sec) return;
            const p = sec.querySelector('.item-description');
            if (p) p.innerHTML = html;
          };
          
          setSectionByTitle('Professional Profile', safe(summary));
          
          const fillList = (titleText: string, items: string[], itemClass: string) => {
            const sections = Array.from(d.querySelectorAll('.section')) as HTMLElement[];
            const sec = sections.find(s => s.querySelector('.section-title')?.textContent?.trim().toLowerCase() === titleText.toLowerCase());
            if (!sec) return;
            Array.from(sec.querySelectorAll('.item')).forEach(e => e.remove());
            items.forEach(it => {
              const item = d.createElement('div');
              item.className = itemClass;
              const p = d.createElement('p');
              p.className = 'item-description';
              p.textContent = it;
              item.appendChild(p);
              sec.appendChild(item);
            });
          };
          
          fillList('Professional Experience', experience.filter(Boolean), 'item');
          
          const skillsSec = Array.from(d.querySelectorAll('.section'))
            .find(s => s.querySelector('.section-title')?.textContent?.trim().toLowerCase() === 'skills & expertise');
          if (skillsSec) {
            const container = skillsSec.querySelector('.skill-tags');
            if (container) {
              container.innerHTML = '';
              skillChips.forEach(s => {
                const div = d.createElement('div');
                div.className = 'skill-tag';
                div.textContent = s;
                container.appendChild(div);
              });
            }
          }
          
          fillList('Education', education.filter(Boolean), 'item');
        }
      } catch {}
    };
    
    // Give the browser a tick to lay out the document before populating
    setTimeout(populate, 0);
  }, [template, fullName, title, email, phone, website, summary, experience, education, skillChips]);

  // Save to profile (backend persistence)
  const handleSaveToProfile = async () => {
    try {
      setIsSaving(true);
      const payload = {
        template,
        data: { fullName, title, email, phone, website, summary, experience, education, skills }
      };
      
      const url = isEditMode && resumeId ? `/api/resumes/${resumeId}` : '/api/resumes';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error(`Failed to ${isEditMode ? 'update' : 'save'} resume`);
      
      window.alert(`Resume ${isEditMode ? 'updated' : 'saved'} to your profile`);
    } catch (e) {
      window.alert(`Error ${isEditMode ? 'updating' : 'saving'} resume`);
    } finally {
      setIsSaving(false);
    }
  };

  // Ask AI for suggestions
  const handleAskAI = async () => {
    try {
      setIsSuggesting(true);
      const payload = { summary, skills: skillChips, experience, education };
      const res = await fetch('/api/resumes/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('AI suggestion failed');
      
      const data = await res.json();
      setAiSuggestions(data);
    } catch (e) {
      setAiSuggestions({ suggestions: ["Could not fetch AI suggestions. Please try again later."] });
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={isEditMode ? "Edit Resume" : "Create Resume"} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
            <section className="bg-card border border-border rounded-lg p-4">
              <h2 className="font-semibold mb-3">Your Details</h2>
              <div className="space-y-3">
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" className="w-full bg-background border border-input rounded px-3 py-2" />
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Professional Title (e.g. Software Engineer)" className="w-full bg-background border border-input rounded px-3 py-2" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full bg-background border border-input rounded px-3 py-2" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full bg-background border border-input rounded px-3 py-2" />
                <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website / Portfolio" className="w-full bg-background border border-input rounded px-3 py-2" />
                <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Summary" className="w-full bg-background border border-input rounded px-3 py-2 h-24" />
              </div>
              
              <div className="mt-5">
                <h3 className="font-medium mb-2">Experience</h3>
                <div className="space-y-2">
                  {experience.map((item, idx) => (
                    <div className="flex gap-2" key={`exp-${idx}`}>
                      <input value={item} onChange={(e) => handleChangeList(setExperience)(idx, e.target.value)} placeholder="e.g. Software Engineer at ABC (2022-2024)" className="flex-1 bg-background border border-input rounded px-3 py-2" />
                      <button onClick={() => handleRemoveList(setExperience)(idx)} className="px-3 rounded border border-input hover:bg-accent">-</button>
                    </div>
                  ))}
                  <button onClick={handleAddList(setExperience)} className="text-sm text-primary">+ Add experience</button>
                </div>
              </div>
              
              <div className="mt-5">
                <h3 className="font-medium mb-2">Education</h3>
                <div className="space-y-2">
                  {education.map((item, idx) => (
                    <div className="flex gap-2" key={`edu-${idx}`}> 
                      <input value={item} onChange={(e) => handleChangeList(setEducation)(idx, e.target.value)} placeholder="e.g. B.Tech in CSE, XYZ University (2019-2023)" className="flex-1 bg-background border border-input rounded px-3 py-2" />
                      <button onClick={() => handleRemoveList(setEducation)(idx)} className="px-3 rounded border border-input hover:bg-accent">-</button>
                    </div>
                  ))}
                  <button onClick={handleAddList(setEducation)} className="text-sm text-primary">+ Add education</button>
                </div>
              </div>
              
              <div className="mt-5">
                <h3 className="font-medium mb-2">Skills</h3>
                <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Comma separated skills e.g. React, Node, SQL" className="w-full bg-background border border-input rounded px-3 py-2" />
              </div>
              
              <div className="mt-6 flex gap-3 flex-wrap items-center">
                {!isEditMode && (
                  <button onClick={(e) => { e.preventDefault(); window.alert("Draft saved locally"); }} className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-primary-foreground text-sm font-medium shadow hover:opacity-90">
                    Save Draft
                  </button>
                )}
                <button onClick={(e) => { e.preventDefault(); printPreview(); }} className="inline-flex items-center justify-center rounded-md border border-input px-5 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                  Print / Export
                </button>
                <button disabled={isSaving} onClick={(e) => { e.preventDefault(); handleSaveToProfile(); }} className="inline-flex items-center justify-center rounded-md border border-input px-5 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                  {isSaving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Resume' : 'Save to Profile')}
                </button>
                <button disabled={isSuggesting} onClick={(e) => { e.preventDefault(); handleAskAI(); }} className="inline-flex items-center justify-center rounded-md border border-input px-5 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                  {isSuggesting ? 'Asking AI...' : 'Ask AI for Suggestions'}
                </button>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Template:</span>
                  <button onClick={(e) => { e.preventDefault(); setTemplate(1); }} className={`px-3 py-1 rounded border text-sm ${template === 1 ? "bg-primary text-primary-foreground" : "border-input"}`}>1</button>
                  <button onClick={(e) => { e.preventDefault(); setTemplate(2); }} className={`px-3 py-1 rounded border text-sm ${template === 2 ? "bg-primary text-primary-foreground" : "border-input"}`}>2</button>
                  <button onClick={(e) => { e.preventDefault(); setTemplate(3); }} className={`px-3 py-1 rounded border text-sm ${template === 3 ? "bg-primary text-primary-foreground" : "border-input"}`}>3</button>
                </div>
              </div>
              
              {aiSuggestions && (
                <div className="mt-4 bg-card border border-border rounded p-4 space-y-3">
                  {aiSuggestions.suggestions && (
                    <div>
                      <h4 className="font-medium mb-2">Suggestions</h4>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {aiSuggestions.suggestions.map((s, i) => (<li key={`sug-${i}`}>{s}</li>))}
                      </ul>
                    </div>
                  )}
                  {aiSuggestions.missingSkills && aiSuggestions.missingSkills.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Missing Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestions.missingSkills.map((s, i) => (<span key={`ms-${i}`} className="px-2 py-1 text-xs rounded border border-input">{s}</span>))}
                      </div>
                    </div>
                  )}
                  {aiSuggestions.learningRoadmap && aiSuggestions.learningRoadmap.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Learning Roadmap</h4>
                      <ol className="list-decimal pl-5 text-sm space-y-1">
                        {aiSuggestions.learningRoadmap.map((r, i) => (
                          <li key={`lr-${i}`}><span className="font-medium">{r.topic}</span>{r.why ? ` — ${r.why}` : ''}{r.resources ? ` (resources: ${r.resources})` : ''}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </section>
            
            <section className="bg-card border border-border rounded-lg p-4">
              <h2 className="font-semibold mb-3">Live Preview</h2>
              <div className="border border-dashed border-border rounded-lg overflow-hidden">
                <iframe ref={templateFrameRef} title="resume-preview" className="w-full" style={{ height: 700, border: 0 }} />
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}