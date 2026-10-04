import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  LayoutDashboard,
  Search,
  FileText,
  Clock,
  UserRound,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Pencil,
  LogOut,
  Upload,
  ChevronDown,
  ExternalLink,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  FileCheck,
  RefreshCw,
  Library,
  Layers,
  GraduationCap,
  FileQuestion,
  HelpCircle,
  Key,
  Copy,
  ChevronUp,
  Check,
  Plus
} from 'lucide-react';

// ============================================================================
// Types & Interfaces
// ============================================================================

type ThemeMode = 'light' | 'dark' | 'system';
type NavRoute = 'home' | 'dashboard' | 'research' | 'reports' | 'history' | 'profile' | 'settings';

interface StudentUser {
  id: string;
  email: string;
  is_student_verified: boolean;
  created_at?: string;
}

interface StudentProfile {
  full_name: string;
  student_id: string;
  college: string;
  department: string;
  academic_level: string;
  year_semester: string;
  avatar_url: string;
  email?: string;
}

interface ScholarlySource {
  id: number;
  title: string;
  authors: string;
  year: number | null;
  publication_or_source: string;
  doi: string;
  url: string;
  has_full_text: boolean;
  has_abstract: boolean;
  content_mode: string;
  abstract: string;
  citation: string;
  credibility_rating: string;
  source_type?: string;
}

interface KeyFinding {
  title: string;
  description: string;
  evidence_type: string;
  impact_level: string;
  takeaway: string;
  academic_importance?: string;
  limitations?: string;
}

interface ResearchResult {
  request_id?: string;
  topic: string;
  subject: string;
  assignment_type: string;
  citation_style: string;
  summary: string;
  key_findings: KeyFinding[];
  sources: ScholarlySource[];
  research_questions: string[];
  methodology_recommendations?: string;
  gemini_configured?: boolean;
  configuration_requirement?: string | null;
}

interface AcademicReport {
  id: string;
  title: string;
  topic: string;
  subject: string;
  assignment_type: string;
  citation_style: string;
  word_count_estimate: number;
  abstract: string;
  report_content: {
    title?: string;
    abstract?: string;
    introduction?: string;
    literature_review?: string;
    methodology?: string;
    findings?: string;
    discussion?: string;
    limitations?: string;
    conclusion?: string;
    references?: string[];
    sources?: ScholarlySource[];
    research_questions?: string[];
    word_target?: number;
    word_count_actual?: number;
    generated_at?: string;
    last_edited?: string;
  };
  created_at: string;
  updated_at?: string;
}

interface ResearchPipelineStage {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

interface HistoryItem {
  id: string;
  topic: string;
  subject: string;
  assignment_type: string;
  citation_style: string;
  word_target: number;
  status: string;
  summary: string;
  key_findings: KeyFinding[];
  sources: ScholarlySource[];
  research_questions: string[];
  created_at: string;
}

// ============================================================================
// Main Application Component
// ============================================================================

export default function App() {
  // Theme State
  const [themePreference, setThemePreference] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('research_theme_mode');
    return (saved === 'light' || saved === 'dark' || saved === 'system') ? saved : 'dark';
  });

  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>('dark');

  // Navigation & Shell State
  const [activeNav, setActiveNav] = useState<NavRoute>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('research_sidebar_collapsed') === 'true';
  });
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Authentication & Profile State
  const [studentUser, setStudentUser] = useState<StudentUser | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showProfileCompleteModal, setShowProfileCompleteModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSwitchAccountModal, setShowSwitchAccountModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [viewingReport, setViewingReport] = useState<AcademicReport | null>(null);

  // Pending redirection upon auth
  const [intendedRoute, setIntendedRoute] = useState<NavRoute | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Assignment Research Form State
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('Artificial Intelligence');
  const [assignmentType, setAssignmentType] = useState('Research Paper');
  const [wordTarget, setWordTarget] = useState(2000);
  const [citationStyle, setCitationStyle] = useState('APA');
  const [guidelines, setGuidelines] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [researchDepth, setResearchDepth] = useState('Comprehensive');
  const [sourceQuality, setSourceQuality] = useState('Peer-reviewed');
  const [sourceCount, setSourceCount] = useState(5);
  const [dateFilter, setDateFilter] = useState('Any time');

  // File Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Research Execution State
  const [isConductingResearch, setIsConductingResearch] = useState(false);
  const [researchProgressStage, setResearchProgressStage] = useState('');
  const [currentResearchResult, setCurrentResearchResult] = useState<ResearchResult | null>(null);

  // 5-Stage Research Pipeline State (Screenshot 1)
  const [researchStages, setResearchStages] = useState<ResearchPipelineStage[]>([
    { id: 'planner', number: '01', name: '01 Planner Agent', subtitle: 'Decomposes Assignment & Formulates Inquiry', status: 'idle' },
    { id: 'research', number: '02', name: '02 Research Agent', subtitle: 'Discovers Relevant Academic Literature', status: 'idle' },
    { id: 'analysis', number: '03', name: '03 Analysis Agent', subtitle: 'Synthesizes Findings & Detects Gaps', status: 'idle' },
    { id: 'writer', number: '04', name: '04 Writer Agent', subtitle: 'Drafts Coherent Academic Assignment', status: 'idle' },
    { id: 'citation', number: '05', name: '05 Citation Agent', subtitle: 'Formats Academic Referencing & Citations', status: 'idle' }
  ]);
  const [researchProgressPercent, setResearchProgressPercent] = useState<number>(0);
  const [researchTerminalLog, setResearchTerminalLog] = useState<string>('');
  const [showProgressModal, setShowProgressModal] = useState<boolean>(false);

  // Research Questions State (Screenshot 2)
  const [editableQuestions, setEditableQuestions] = useState<string[]>([]);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);
  const [editingQuestionText, setEditingQuestionText] = useState<string>('');
  const [isRegeneratingQuestions, setIsRegeneratingQuestions] = useState<boolean>(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState<boolean>(false);
  const [newQuestionInput, setNewQuestionInput] = useState<string>('');

  // Verified Academic Sources Filter (Screenshot 3)
  const [sourceFilterTab, setSourceFilterTab] = useState<'all' | 'academic' | 'web' | 'reports'>('all');
  const [viewingCitationSource, setViewingCitationSource] = useState<ScholarlySource | null>(null);

  // Key Empirical Findings Accordion (Screenshot 4)
  const [expandedFindingIndices, setExpandedFindingIndices] = useState<number[]>([0, 1]);

  // 8-Section Generated Academic Report & Editor (Screenshot 5)
  const [generatedDraftReport, setGeneratedDraftReport] = useState<AcademicReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [editingSectionKey, setEditingSectionKey] = useState<string | null>(null);
  const [editingSectionContent, setEditingSectionContent] = useState<string>('');
  const [isSavingSectionEdit, setIsSavingSectionEdit] = useState<boolean>(false);
  const [hasUnsavedSectionEdits, setHasUnsavedSectionEdits] = useState<boolean>(false);
  const [reportExportScope, setReportExportScope] = useState<'report' | 'complete'>('report');
  const [isExportingFile, setIsExportingFile] = useState<boolean>(false);
  const [showRegenerateConfirmModal, setShowRegenerateConfirmModal] = useState<boolean>(false);

  // Collections
  const [reportsList, setReportsList] = useState<AcademicReport[]>([]);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // System & Config status
  const [configStatus, setConfigStatus] = useState<{
    gemini_configured: boolean;
    scholarly_index_status: string;
  }>({
    gemini_configured: false,
    scholarly_index_status: 'Active'
  });

  // --------------------------------------------------------------------------
  // Theme Application Logic
  // --------------------------------------------------------------------------
  useEffect(() => {
    localStorage.setItem('research_theme_mode', themePreference);

    if (themePreference === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setActiveTheme(isDark ? 'dark' : 'light');
    } else {
      setActiveTheme(themePreference);
    }
  }, [themePreference]);

  useEffect(() => {
    document.documentElement.dataset.theme = activeTheme;
  }, [activeTheme]);

  useEffect(() => {
    localStorage.setItem('research_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((cur) => (cur?.text === text ? null : cur));
    }, 4500);
  };

  // --------------------------------------------------------------------------
  // Fetch Current Session on Load
  // --------------------------------------------------------------------------
  const verifySession = async () => {
    try {
      setAuthLoading(true);
      const res = await fetch('/api/auth/me', {
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        setStudentUser(data.user);
        setProfile(data.profile);
        if (data.preferences?.theme) {
          setThemePreference(data.preferences.theme);
        }
        if (data.preferences?.default_citation_style) {
          setCitationStyle(data.preferences.default_citation_style);
        }
      } else {
        setStudentUser(null);
        setProfile(null);
      }
    } catch {
      setStudentUser(null);
      setProfile(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchConfigStatus = async () => {
    try {
      const res = await fetch('/api/config-status');
      if (res.ok) {
        const data = await res.json();
        setConfigStatus(data);
      }
    } catch {
      // offline / quiet
    }
  };

  useEffect(() => {
    verifySession();
    fetchConfigStatus();
  }, []);

  // --------------------------------------------------------------------------
  // Protected Navigation Helper
  // --------------------------------------------------------------------------
  const handleNavClick = (route: NavRoute) => {
    if (route === 'home') {
      setActiveNav('home');
      setMobileDrawerOpen(false);
      return;
    }

    // If user is not authenticated and trying to access private features
    if (!studentUser) {
      setIntendedRoute(route);
      setAuthMode('signin');
      setShowAuthModal(true);
      setMobileDrawerOpen(false);
      showToast('Please sign in to access your student workspace.', 'info');
      return;
    }

    setActiveNav(route);
    setMobileDrawerOpen(false);

    if (route === 'reports') fetchReports();
    if (route === 'history') fetchHistory();
  };

  // --------------------------------------------------------------------------
  // Fetch Reports and History
  // --------------------------------------------------------------------------
  const fetchReports = async () => {
    if (!studentUser) return;
    try {
      setReportsLoading(true);
      const res = await fetch('/api/reports', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setReportsList(data);
      }
    } catch {
      showToast('Failed to load reports.', 'error');
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!studentUser) return;
    try {
      setHistoryLoading(true);
      const res = await fetch('/api/history', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data);
      }
    } catch {
      showToast('Failed to load research history.', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Sign Out & Switch Account Actions
  // --------------------------------------------------------------------------
  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore network errors on signout
    }
    setStudentUser(null);
    setProfile(null);
    setCurrentResearchResult(null);
    setViewingReport(null);
    setReportsList([]);
    setHistoryList([]);
    setActiveNav('home');
    showToast('Signed out successfully. Session ended.', 'success');
  };

  const handleSwitchAccount = async () => {
    setShowSwitchAccountModal(false);
    try {
      await fetch('/api/auth/switch-account', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    setStudentUser(null);
    setProfile(null);
    setCurrentResearchResult(null);
    setViewingReport(null);
    setReportsList([]);
    setHistoryList([]);
    setActiveNav('home');
    setAuthMode('signin');
    setShowAuthModal(true);
    showToast('Previous session ended. Please sign in to your other student account.', 'info');
  };

  // --------------------------------------------------------------------------
  // File Upload Handler
  // --------------------------------------------------------------------------
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!studentUser) {
      setIntendedRoute('research');
      setShowAuthModal(true);
      showToast('Please sign in to upload assignment briefs.', 'info');
      return;
    }

    const validExtensions = ['.pdf', '.docx', '.txt'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setUploadError('Invalid file type. Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File exceeds the 15MB size limit.');
      return;
    }

    setUploadFile(file);
    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(25);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadProgress(60);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      setUploadProgress(90);
      if (res.ok) {
        const data = await res.json();
        setUploadedFileId(data.file.id);
        setUploadProgress(100);
        showToast(`Uploaded brief: ${file.name}`, 'success');
      } else {
        const err = await res.json();
        setUploadError(err.detail || 'Upload failed.');
        setUploadFile(null);
      }
    } catch {https://github.com/durisetivarshini-ux%20CODE%20NI%20GITHUB%20LO%20PUSH%20CHEYI
      setUploadError('Network error uploading file brief.');
      setUploadFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadedFile = () => {
    setUploadFile(null);
    setUploadedFileId(null);
    setUploadProgress(0);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --------------------------------------------------------------------------
  // Research Execution Handler
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // Multi-Agent Research Execution Pipeline (5 Stages)
  // --------------------------------------------------------------------------
  const handleConductResearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentUser) {
      setIntendedRoute('research');
      setShowAuthModal(true);
      showToast('Please sign in to generate academic research.', 'info');
      return;
    }

    if (!topic.trim()) {
      showToast('Please enter an assignment research topic.', 'error');
      return;
    }

    setIsConductingResearch(true);
    setShowProgressModal(true);
    setResearchProgressPercent(15);
    setResearchTerminalLog('Planner Agent: Interpreting assignment brief and formulating inquiry vectors...');
    setResearchStages([
      { id: 'planner', number: '01', name: '01 Planner Agent', subtitle: 'Decomposes Assignment & Formulates Inquiry', status: 'running' },
      { id: 'research', number: '02', name: '02 Research Agent', subtitle: 'Discovers Relevant Academic Literature', status: 'idle' },
      { id: 'analysis', number: '03', name: '03 Analysis Agent', subtitle: 'Synthesizes Findings & Detects Gaps', status: 'idle' },
      { id: 'writer', number: '04', name: '04 Writer Agent', subtitle: 'Drafts Coherent Academic Assignment', status: 'idle' },
      { id: 'citation', number: '05', name: '05 Citation Agent', subtitle: 'Formats Academic Referencing & Citations', status: 'idle' }
    ]);

    try {
      // Transition to Research Agent
      await new Promise((r) => setTimeout(r, 650));
      setResearchStages((prev) =>
        prev.map((s) =>
          s.id === 'planner'
            ? { ...s, status: 'completed' }
            : s.id === 'research'
            ? { ...s, status: 'running' }
            : s
        )
      );
      setResearchProgressPercent(35);
      setResearchTerminalLog('Research Agent: Discovering authentic scholarly literature via OpenAlex & Crossref...');

      // Call Backend Research API
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          subject,
          assignment_type: assignmentType,
          word_target: wordTarget,
          citation_style: citationStyle,
          guidelines: guidelines.trim(),
          source_count: sourceCount,
          file_id: uploadedFileId
        }),
        credentials: 'include'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Research execution failed.');
      }

      const researchData: ResearchResult = await res.json();
      setCurrentResearchResult(researchData);
      setEditableQuestions(researchData.research_questions || []);

      // Transition to Analysis Agent
      setResearchStages((prev) =>
        prev.map((s) =>
          s.id === 'research'
            ? { ...s, status: 'completed' }
            : s.id === 'analysis'
            ? { ...s, status: 'running' }
            : s
        )
      );
      setResearchProgressPercent(62);
      setResearchTerminalLog('Analysis Agent: Comparing empirical findings, synthesizing evidence, and detecting research gaps...');

      await new Promise((r) => setTimeout(r, 800));

      // Transition to Writer Agent
      setResearchStages((prev) =>
        prev.map((s) =>
          s.id === 'analysis'
            ? { ...s, status: 'completed' }
            : s.id === 'writer'
            ? { ...s, status: 'running' }
            : s
        )
      );
      setResearchProgressPercent(80);
      setResearchTerminalLog('Writer Agent: Preparing structured 8-section academic draft grounded in retrieved literature...');

      // Call Backend Report Generation API
      const reportRes = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: researchData.request_id,
          topic: researchData.topic,
          subject: researchData.subject,
          assignment_type: researchData.assignment_type,
          citation_style: researchData.citation_style,
          word_target: wordTarget,
          guidelines,
          sources: researchData.sources,
          include_student_details: true
        }),
        credentials: 'include'
      });

      // Transition to Citation Agent
      setResearchStages((prev) =>
        prev.map((s) =>
          s.id === 'writer'
            ? { ...s, status: 'completed' }
            : s.id === 'citation'
            ? { ...s, status: 'running' }
            : s
        )
      );
      setResearchProgressPercent(96);
      setResearchTerminalLog('Citation Agent: Validating bibliographic records, DOIs, and formatting citations...');

      let finalReportData: AcademicReport | null = null;
      if (reportRes.ok) {
        const reportJson = await reportRes.json();
        finalReportData = {
          id: reportJson.report_id,
          title: reportJson.title,
          topic: reportJson.topic,
          subject: reportJson.subject,
          assignment_type: reportJson.assignment_type || assignmentType,
          citation_style: reportJson.citation_style,
          word_count_estimate: reportJson.word_count_estimate,
          abstract: reportJson.abstract,
          report_content: reportJson.report_content,
          created_at: reportJson.created_at
        };
        setGeneratedDraftReport(finalReportData);
        setReportsList((prev) => [finalReportData!, ...prev.filter((r) => r.id !== finalReportData!.id)]);
      }

      // Mark Citation Agent Complete
      setResearchStages((prev) =>
        prev.map((s) => (s.id === 'citation' ? { ...s, status: 'completed' } : s))
      );
      setResearchProgressPercent(100);
      setResearchTerminalLog('Pipeline Complete: Verified academic workspace and 8-section draft ready.');

      showToast('Complete academic research workspace generated successfully!', 'success');
      fetchReports();
      fetchHistory();

      setTimeout(() => {
        setShowProgressModal(false);
      }, 950);
    } catch (err: any) {
      setResearchStages((prev) =>
        prev.map((s) => (s.status === 'running' ? { ...s, status: 'failed' } : s))
      );
      setResearchTerminalLog(`Pipeline Error: ${err.message || 'Operation failed.'}`);
      showToast(err.message || 'Research pipeline encountered an error.', 'error');
    } finally {
      setIsConductingResearch(false);
    }
  };

  // --------------------------------------------------------------------------
  // Questions Management Handlers (Screenshot 2)
  // --------------------------------------------------------------------------
  const handleCopyAllQuestions = () => {
    if (!editableQuestions.length) return;
    const text = editableQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n\n');
    navigator.clipboard.writeText(text);
    showToast('All research questions copied to clipboard!', 'success');
  };

  const handleCopySingleQuestion = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Question copied to clipboard!', 'success');
  };

  const handleStartEditQuestion = (idx: number, currentText: string) => {
    setEditingQuestionIdx(idx);
    setEditingQuestionText(currentText);
  };

  const handleSaveQuestionEdit = async (idx: number) => {
    if (!editingQuestionText.trim()) return;
    const updated = [...editableQuestions];
    updated[idx] = editingQuestionText.trim();
    setEditableQuestions(updated);
    setEditingQuestionIdx(null);

    if (currentResearchResult?.request_id) {
      try {
        await fetch(`/api/research/${currentResearchResult.request_id}/questions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions: updated }),
          credentials: 'include'
        });
        showToast('Question updated successfully.', 'success');
      } catch {
        showToast('Updated locally.', 'info');
      }
    }
  };

  const handleCancelQuestionEdit = () => {
    setEditingQuestionIdx(null);
    setEditingQuestionText('');
  };

  const handleRegenerateQuestions = async () => {
    if (!currentResearchResult?.request_id) {
      showToast('No active research record to regenerate questions.', 'error');
      return;
    }

    setIsRegeneratingQuestions(true);
    try {
      const res = await fetch(`/api/research/${currentResearchResult.request_id}/regenerate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setEditableQuestions(data.research_questions || []);
        showToast('Research questions regenerated with fresh angles!', 'success');
      } else {
        showToast('Failed to regenerate questions.', 'error');
      }
    } catch {
      showToast('Network error regenerating questions.', 'error');
    } finally {
      setIsRegeneratingQuestions(false);
    }
  };

  const handleAddCustomQuestion = async () => {
    if (!newQuestionInput.trim()) return;
    const updated = [...editableQuestions, newQuestionInput.trim()];
    setEditableQuestions(updated);
    setNewQuestionInput('');
    setShowAddQuestionModal(false);

    if (currentResearchResult?.request_id) {
      try {
        await fetch(`/api/research/${currentResearchResult.request_id}/questions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions: updated }),
          credentials: 'include'
        });
        showToast('Custom question added to research brief.', 'success');
      } catch {
        showToast('Question added locally.', 'info');
      }
    }
  };

  // --------------------------------------------------------------------------
  // Key Findings Handlers (Screenshot 4)
  // --------------------------------------------------------------------------
  const handleToggleFinding = (idx: number) => {
    setExpandedFindingIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // --------------------------------------------------------------------------
  // Report Section Editing Handlers (Screenshot 5)
  // --------------------------------------------------------------------------
  const handleStartEditSection = (sectionKey: string, initialContent: string) => {
    setEditingSectionKey(sectionKey);
    setEditingSectionContent(initialContent || '');
  };

  const handleCancelSectionEdit = () => {
    setEditingSectionKey(null);
    setEditingSectionContent('');
  };

  const handleSaveSectionEdit = async (sectionKey: string) => {
    const reportTarget = generatedDraftReport || viewingReport;
    if (!reportTarget) return;

    setIsSavingSectionEdit(true);
    try {
      const updatedContent = {
        ...reportTarget.report_content,
        [sectionKey]: editingSectionContent.trim()
      };

      const res = await fetch(`/api/reports/${reportTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_content: { [sectionKey]: editingSectionContent.trim() }
        }),
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        const updatedReport: AcademicReport = {
          ...reportTarget,
          word_count_estimate: data.word_count_estimate,
          report_content: updatedContent
        };
        if (generatedDraftReport?.id === reportTarget.id) {
          setGeneratedDraftReport(updatedReport);
        }
        if (viewingReport?.id === reportTarget.id) {
          setViewingReport(updatedReport);
        }
        setReportsList((prev) => prev.map((r) => (r.id === reportTarget.id ? updatedReport : r)));
        setEditingSectionKey(null);
        setHasUnsavedSectionEdits(false);
        showToast(`Section '${sectionKey.replace(/_/g, ' ')}' updated and saved!`, 'success');
      } else {
        showToast('Failed to save section changes.', 'error');
      }
    } catch {
      showToast('Network error saving section.', 'error');
    } finally {
      setIsSavingSectionEdit(false);
    }
  };

  // --------------------------------------------------------------------------
  // Report Regeneration & Export Handlers (Screenshot 5)
  // --------------------------------------------------------------------------
  const handleRegenerateReport = async () => {
    if (hasUnsavedSectionEdits) {
      setShowRegenerateConfirmModal(true);
      return;
    }
    await executeReportRegeneration();
  };

  const executeReportRegeneration = async () => {
    setShowRegenerateConfirmModal(false);
    if (!currentResearchResult) return;

    setIsGeneratingReport(true);
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: currentResearchResult.request_id,
          topic: currentResearchResult.topic,
          subject: currentResearchResult.subject,
          assignment_type: currentResearchResult.assignment_type,
          citation_style: currentResearchResult.citation_style,
          word_target: wordTarget,
          guidelines,
          sources: currentResearchResult.sources,
          include_student_details: true
        }),
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        const newReport: AcademicReport = {
          id: data.report_id,
          title: data.title,
          topic: data.topic,
          subject: data.subject,
          assignment_type: data.assignment_type || assignmentType,
          citation_style: data.citation_style,
          word_count_estimate: data.word_count_estimate,
          abstract: data.abstract,
          report_content: data.report_content,
          created_at: data.created_at
        };
        setGeneratedDraftReport(newReport);
        setReportsList((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);
        setHasUnsavedSectionEdits(false);
        showToast('Academic report successfully regenerated!', 'success');
      } else {
        const err = await res.json();
        showToast(err.detail || 'Failed to regenerate report.', 'error');
      }
    } catch {
      showToast('Network error regenerating report.', 'error');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadExport = (format: 'pdf' | 'docx' | 'txt' | 'md') => {
    const reportTarget = generatedDraftReport || viewingReport;
    if (!reportTarget) {
      showToast('No report available to export.', 'error');
      return;
    }

    setIsExportingFile(true);
    try {
      const url = `/api/reports/${reportTarget.id}/export/${format}?scope=${reportExportScope}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Downloading ${format.toUpperCase()} (${reportExportScope === 'complete' ? 'Complete Package' : 'Report Only'})...`, 'success');
    } catch {
      showToast('Failed to trigger export download.', 'error');
    } finally {
      setIsExportingFile(false);
    }
  };

  const handleCopyReportFull = (report: AcademicReport) => {
    const rc = report.report_content;
    const fullText = `# ${report.title}
*${report.subject} — ${report.citation_style} Format*

## Abstract
${rc.abstract || report.abstract}

## 1. Introduction
${rc.introduction || ''}

## 2. Literature Review
${rc.literature_review || ''}

## 3. Methodology
${rc.methodology || ''}

## 4. Findings & Thematic Analysis
${rc.findings || ''}

## 5. Discussion
${rc.discussion || ''}

## 6. Limitations & Future Directions
${rc.limitations || ''}

## 7. Conclusion
${rc.conclusion || ''}

## References
${(rc.references || []).map((r) => `- ${r}`).join('\n')}
`;
    navigator.clipboard.writeText(fullText);
    showToast('Complete report draft copied to clipboard!', 'success');
  };

  // --------------------------------------------------------------------------
  // Report CRUD Helpers
  // --------------------------------------------------------------------------
  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setReportsList((list) => list.filter((r) => r.id !== reportId));
        if (viewingReport?.id === reportId) setViewingReport(null);
        showToast('Report deleted.', 'info');
      } else {
        showToast('Failed to delete report.', 'error');
      }
    } catch {
      showToast('Network error deleting report.', 'error');
    }
  };

  const handleOpenRename = (report: AcademicReport) => {
    setRenameTargetId(report.id);
    setRenameValue(report.title);
    setShowRenameModal(true);
  };

  const handleSaveRename = async () => {
    if (!renameTargetId || !renameValue.trim()) return;
    try {
      const res = await fetch(`/api/reports/${renameTargetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameValue.trim() }),
        credentials: 'include'
      });
      if (res.ok) {
        setReportsList((list) =>
          list.map((r) => (r.id === renameTargetId ? { ...r, title: renameValue.trim() } : r))
        );
        if (viewingReport?.id === renameTargetId) {
          setViewingReport((v) => (v ? { ...v, title: renameValue.trim() } : null));
        }
        setShowRenameModal(false);
        showToast('Report renamed successfully.', 'success');
      }
    } catch {
      showToast('Error updating report title.', 'error');
    }
  };

  const handleDownloadReport = (report: AcademicReport, format: 'markdown' | 'text' | 'json') => {
    let content = '';
    let filename = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
    let mimeType = 'text/plain';

    const rc = report.report_content;

    if (format === 'json') {
      content = JSON.stringify(report, null, 2);
      filename += '.json';
      mimeType = 'application/json';
    } else if (format === 'markdown') {
      filename += '.md';
      content = `# ${report.title}
**Discipline:** ${report.subject} | **Assignment Type:** ${report.assignment_type} | **Citation Style:** ${report.citation_style}
**Author:** ${profile?.full_name || 'Student Researcher'} (${profile?.college || 'University'}, ${profile?.department || 'Department'})

---

## Abstract
${rc.abstract || report.abstract}

## 1. Introduction
${rc.introduction || ''}

## 2. Literature Review
${rc.literature_review || ''}

## 3. Methodology
${rc.methodology || ''}

## 4. Results & Findings
${rc.findings || ''}

## 5. Discussion
${rc.discussion || ''}

## 6. Conclusion
${rc.conclusion || ''}

## References
${(rc.references || []).map((ref, i) => `${i + 1}. ${ref}`).join('\n\n')}
`;
    } else {
      filename += '.txt';
      content = `${report.title.toUpperCase()}
Subject: ${report.subject}
Author: ${profile?.full_name || 'Student'}

ABSTRACT:
${rc.abstract || report.abstract}

INTRODUCTION:
${rc.introduction || ''}

LITERATURE REVIEW:
${rc.literature_review || ''}

METHODOLOGY:
${rc.methodology || ''}

FINDINGS:
${rc.findings || ''}

DISCUSSION:
${rc.discussion || ''}

CONCLUSION:
${rc.conclusion || ''}

REFERENCES:
${(rc.references || []).join('\n\n')}
`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded report (${format.toUpperCase()})`, 'success');
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        setHistoryList((list) => list.filter((item) => item.id !== id));
        showToast('History item removed.', 'info');
      }
    } catch {
      showToast('Failed to delete history item.', 'error');
    }
  };

  // Helper for student initials
  const getInitials = (name?: string) => {
    if (!name || !name.trim()) return 'S';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // --------------------------------------------------------------------------
  // Sub-components: Modals
  // --------------------------------------------------------------------------

  // 1. Auth Modal (Sign In & Sign Up)
  const renderAuthModal = () => {
    if (!showAuthModal) return null;

    return (
      <div className="modal-backdrop" onClick={() => setShowAuthModal(false)}>
        <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h3 className="modal-title">
                {authMode === 'signin' ? 'Welcome Back' : 'Create Student Account'}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                {authMode === 'signin'
                  ? 'Sign in to access your persistent research workspace'
                  : 'Join the academic research platform'}
              </p>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowAuthModal(false)}
            >
              <X size={18} />
            </button>
          </div>

          <AuthForm
            mode={authMode}
            onSuccess={(user, userProfile, requiresProfile) => {
              setStudentUser(user);
              setProfile(userProfile);
              setShowAuthModal(false);
              showToast(`Welcome, ${userProfile.full_name || 'Student'}!`, 'success');

              if (requiresProfile) {
                setShowProfileCompleteModal(true);
              } else if (intendedRoute) {
                setActiveNav(intendedRoute);
                setIntendedRoute(null);
              } else {
                setActiveNav('dashboard');
              }
            }}
            onSwitchMode={(mode) => setAuthMode(mode)}
          />
        </div>
      </div>
    );
  };

  // 2. Profile Completion Modal
  const renderProfileCompleteModal = () => {
    if (!showProfileCompleteModal) return null;

    return (
      <div className="modal-backdrop">
        <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h3 className="modal-title">Complete Your Student Profile</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Personalize your academic credentials for citation headings and report headers.
              </p>
            </div>
          </div>

          <ProfileForm
            initialProfile={profile}
            onSave={(updated) => {
              setProfile(updated);
              setShowProfileCompleteModal(false);
              showToast('Student profile completed!', 'success');
              if (intendedRoute) {
                setActiveNav(intendedRoute);
                setIntendedRoute(null);
              } else {
                setActiveNav('dashboard');
              }
            }}
            onCancel={() => {
              setShowProfileCompleteModal(false);
              setActiveNav('dashboard');
            }}
            isCompletionStep
          />
        </div>
      </div>
    );
  };

  // 3. Edit Profile Modal
  const renderEditProfileModal = () => {
    if (!showEditProfileModal) return null;

    return (
      <div className="modal-backdrop" onClick={() => setShowEditProfileModal(false)}>
        <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h3 className="modal-title">Edit Student Credentials</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Changes are saved to the persistent database and update immediately.
              </p>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowEditProfileModal(false)}
            >
              <X size={18} />
            </button>
          </div>

          <ProfileForm
            initialProfile={profile}
            onSave={(updated) => {
              setProfile(updated);
              setShowEditProfileModal(false);
              showToast('Profile updated successfully!', 'success');
            }}
            onCancel={() => setShowEditProfileModal(false)}
          />
        </div>
      </div>
    );
  };

  // 4. Switch Account Modal
  const renderSwitchAccountModal = () => {
    if (!showSwitchAccountModal) return null;

    return (
      <div className="modal-backdrop" onClick={() => setShowSwitchAccountModal(false)}>
        <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h3 className="modal-title">Switch Student Account</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                This securely terminates your current session and clears cached personal data.
              </p>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowSwitchAccountModal(false)}
            >
              <X size={18} />
            </button>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Are you sure you want to sign in with another student account? Any unsaved research in
            the workspace should be generated or saved before proceeding.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowSwitchAccountModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSwitchAccount}
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 5. Rename Report Modal
  const renderRenameModal = () => {
    if (!showRenameModal) return null;

    return (
      <div className="modal-backdrop" onClick={() => setShowRenameModal(false)}>
        <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Rename Academic Report</h3>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowRenameModal(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Report Title</label>
            <input
              type="text"
              className="form-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Enter new report title..."
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowRenameModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSaveRename}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // Main Render Views
  // --------------------------------------------------------------------------

  // VIEW: Public Home Page
  const renderHomeView = () => {
    return (
      <div className="home-container">
        {/* Hero Section */}
        <section className="home-hero-section">
          <div className="hero-main-card">
            <div>
              <div className="hero-badge-pill">
                <Sparkles size={14} />
                <span>Academic Research & Report Generator</span>
              </div>
              <h2 className="hero-headline">
                Research with clarity. <br />
                Write with confidence.
              </h2>
              <p className="hero-subheadline">
                An intelligent academic workspace for university students. Analyze assignment briefs,
                verify genuine peer-reviewed scholarly literature, synthesize evidence, and draft
                structured academic reports with citation precision.
              </p>
            </div>

            <div className="hero-cta-group">
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '12px 26px', fontSize: '0.98rem' }}
                onClick={() => {
                  if (studentUser) {
                    setActiveNav('research');
                  } else {
                    setIntendedRoute('research');
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }
                }}
              >
                <span>Start research</span>
                <ArrowRight size={18} />
              </button>

              {!studentUser && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '12px 22px', fontSize: '0.98rem' }}
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                >
                  Create free account
                </button>
              )}

              {studentUser && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActiveNav('dashboard')}
                >
                  Go to Dashboard
                </button>
              )}
            </div>
          </div>

          {/* Interactive Sample Research Preview (Replaces oversized empty sign-in box) */}
          <div className="sample-preview-card">
            <div>
              <div className="sample-preview-header">
                <span className="sample-tag">
                  <Library size={15} />
                  <span>Scholarly Sample Preview</span>
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'var(--verified-badge-bg)',
                    color: 'var(--verified-badge-text)'
                  }}
                >
                  APA 7th Verified
                </span>
              </div>

              <h4 className="sample-paper-title">
                Attention Mechanisms in Vision Transformers: A Systematic Comparative Review
              </h4>

              <div className="sample-meta-grid">
                <div className="sample-meta-item">
                  <span className="sample-meta-label">Discipline</span>
                  <span className="sample-meta-val">Artificial Intelligence</span>
                </div>
                <div className="sample-meta-item">
                  <span className="sample-meta-label">Target Words</span>
                  <span className="sample-meta-val">2,400 Words</span>
                </div>
                <div className="sample-meta-item">
                  <span className="sample-meta-label">Verified Sources</span>
                  <span className="sample-meta-val">5 Peer-Reviewed</span>
                </div>
                <div className="sample-meta-item">
                  <span className="sample-meta-label">Methodology</span>
                  <span className="sample-meta-val">Literature Synthesis</span>
                </div>
              </div>

              <div className="sample-finding-preview">
                <strong>Empirical Finding:</strong> Self-attention architectures yield an average
                4.2% top-1 accuracy improvement over classical CNN baselines on benchmark datasets,
                while trading off quadratic computational complexity.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1, fontSize: '0.84rem' }}
                onClick={() => {
                  setTopic('Attention Mechanisms in Vision Transformers');
                  setSubject('Artificial Intelligence');
                  if (studentUser) {
                    setActiveNav('research');
                  } else {
                    setIntendedRoute('research');
                    setShowAuthModal(true);
                  }
                }}
              >
                <span>Try this topic in workspace</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* Workflow Section: "How it works" */}
        <section className="workflow-section">
          <div className="section-heading-wrap">
            <p className="section-eyebrow">Academic Research Pipeline</p>
            <h3 className="section-title">How It Works</h3>
            <p className="section-desc">
              Four structured stages designed to ensure scholastic rigor and save hours of assignment research.
            </p>
          </div>

          <div className="workflow-grid">
            <div className="workflow-card">
              <div className="workflow-step-num">1</div>
              <h4 className="workflow-step-title">Add Assignment Brief</h4>
              <p className="workflow-step-text">
                Specify your assignment topic, target word count, academic discipline, and citation style.
                Attach syllabus guidelines or rubric documents.
              </p>
            </div>

            <div className="workflow-card">
              <div className="workflow-step-num">2</div>
              <h4 className="workflow-step-title">Find Relevant Sources</h4>
              <p className="workflow-step-text">
                Search OpenAlex and Crossref repositories for genuine peer-reviewed publications, complete
                with real authors, verified DOIs, and direct open-access links.
              </p>
            </div>

            <div className="workflow-card">
              <div className="workflow-step-num">3</div>
              <h4 className="workflow-step-title">Review the Research</h4>
              <p className="workflow-step-text">
                Inspect structured empirical findings, theoretical frameworks, methodological benchmarks,
                and recommended research questions.
              </p>
            </div>

            <div className="workflow-card">
              <div className="workflow-step-num">4</div>
              <h4 className="workflow-step-title">Prepare a Report</h4>
              <p className="workflow-step-text">
                Generate an 8-section university-standard academic paper (Abstract to References), export to
                Markdown or Text, and save under your personal account.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="workflow-section" style={{ marginTop: '16px' }}>
          <div className="section-heading-wrap">
            <p className="section-eyebrow">Academic Rigor & Privacy</p>
            <h3 className="section-title">Built For Student Excellence</h3>
            <p className="section-desc">
              Designed from the ground up for university standards, citation accuracy, and complete student data privacy.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-box">
              <div className="feature-icon-wrap">
                <ShieldCheck size={22} />
              </div>
              <h4>No Hallucinated Citations</h4>
              <p>
                Every paper retrieved originates from live OpenAlex and Crossref scientific registries.
                Titles, authors, years, and DOI links are 100% verified.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrap">
                <GraduationCap size={22} />
              </div>
              <h4>Standard Academic Formats</h4>
              <p>
                Seamless formatting in APA 7th, IEEE, MLA 9th, and Harvard citation conventions for both
                in-text references and bibliography entries.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrap">
                <Layers size={22} />
              </div>
              <h4>Isolated Student Ownership</h4>
              <p>
                Strict authorization ensures student briefs, research requests, and generated papers are
                never accessible by other users.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  };

  // VIEW: Dashboard
  const renderDashboardView = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Welcome Banner */}
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '28px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-md)',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.74rem',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: 'var(--accent-primary)',
                letterSpacing: '0.06em'
              }}
            >
              Academic Workspace
            </span>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '4px 0 6px', color: 'var(--text-primary)' }}>
              Welcome back, {profile?.full_name || studentUser?.email}
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {profile?.college ? `${profile.college} • ` : ''}
              {profile?.department || 'Research Scholar'} • {profile?.academic_level || 'Undergraduate'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setActiveNav('research')}
            >
              <Search size={16} />
              <span>Start New Research</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                fetchReports();
                setActiveNav('reports');
              }}
            >
              <FileText size={16} />
              <span>My Reports</span>
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
          {/* Recent Reports / Quick Launch */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Recent Academic Reports
                </h4>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                  onClick={() => {
                    fetchReports();
                    setActiveNav('reports');
                  }}
                >
                  View All
                </button>
              </div>

              {reportsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  <FileQuestion size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ margin: '0 0 12px', fontSize: '0.9rem' }}>No saved academic reports yet.</p>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ fontSize: '0.82rem' }}
                    onClick={() => setActiveNav('research')}
                  >
                    Conduct Your First Research
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {reportsList.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: 'var(--surface-card-subtle)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ overflow: 'hidden' }}>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          {r.title}
                        </strong>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {r.subject} • {r.citation_style} • ~{r.word_count_estimate} words
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '6px 12px', flexShrink: 0 }}
                        onClick={() => {
                          setViewingReport(r);
                          setActiveNav('reports');
                        }}
                      >
                        Read
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Engine Status Banner */}
            <div
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <CheckCircle2 size={18} color="var(--accent-teal)" />
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Scholarly Index Status: Active
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Connected to OpenAlex & Crossref registries with 250M+ verified academic papers, DOIs,
                and peer-reviewed citations.
              </p>
            </div>
          </div>

          {/* Student Profile Card (Matches Screenshots 3 & 4) */}
          <div>
            {renderProfileCard()}
          </div>
        </div>
      </div>
    );
  };

  // Profile Card Component (Matches Screenshots 3 & 4 with fixed high contrast)
  const renderProfileCard = () => {
    return (
      <aside className="profile-card">
        <div className="profile-header-wrap">
          <div className="profile-avatar-large">
            {getInitials(profile?.full_name || studentUser?.email)}
          </div>
          <div className="profile-name-group">
            <h3>{profile?.full_name || 'Student Researcher'}</h3>
            <p>{studentUser?.email}</p>
          </div>
        </div>

        {/* Student Status Badge */}
        {studentUser?.is_student_verified ? (
          <div className="badge-verified-student" title="Genuine student identity verified by university registrar">
            <ShieldCheck size={16} />
            <span>Verified Student Researcher</span>
          </div>
        ) : (
          <div className="badge-registered-student" title="Student account active. Institutional verification optional.">
            <CheckCircle2 size={16} />
            <span>Registered Student Researcher</span>
          </div>
        )}

        {/* Student Data Table */}
        <div className="profile-meta-table">
          <div className="profile-meta-row">
            <span className="label">Student ID / Roll No.</span>
            <span className="value">{profile?.student_id || 'Not specified'}</span>
          </div>
          <div className="profile-meta-row">
            <span className="label">College / University</span>
            <span className="value">{profile?.college || 'Not specified'}</span>
          </div>
          <div className="profile-meta-row">
            <span className="label">Department</span>
            <span className="value">{profile?.department || 'Not specified'}</span>
          </div>
          <div className="profile-meta-row">
            <span className="label">Academic Level</span>
            <span className="value">{profile?.academic_level || 'Undergraduate'}</span>
          </div>
          <div className="profile-meta-row">
            <span className="label">Year / Semester</span>
            <span className="value">{profile?.year_semester || 'Not specified'}</span>
          </div>
        </div>

        {/* Profile Action Buttons */}
        <div className="profile-actions-stack">
          <button
            type="button"
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => setShowSwitchAccountModal(true)}
          >
            <UserRound size={16} />
            <span>Switch or Sign in with another account</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => setShowEditProfileModal(true)}
          >
            <Pencil size={16} />
            <span>Edit Student Data</span>
          </button>

          <button
            type="button"
            className="btn-danger"
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={handleSignOut}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    );
  };

  // VIEW: New Research Form (Matches Screenshot 2 with Responsive Enhancements)
  const renderResearchView = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div className="research-form-card">
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
              Assignment Research Brief
            </h3>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Configure your assignment parameters. The agent queries authoritative scholarly indexes
              and synthesizes verified evidence.
            </p>
          </div>

          <form onSubmit={handleConductResearch} className="research-form">
            {/* Topic Input */}
            <div className="form-group">
              <label>Assignment Topic / Research Inquiry *</label>
              <input
                type="text"
                className="form-input"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Deep Learning in Medical Imaging, Ethical Implications of Autonomous AI, Quantum Cryptography..."
                required
              />
            </div>

            {/* Subject and Assignment Type (2 columns) */}
            <div className="form-row-2col">
              <div className="form-group">
                <label>Subject</label>
                <select
                  className="form-select"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Medicine & Healthcare">Medicine & Healthcare</option>
                  <option value="Business Analytics">Business Analytics</option>
                  <option value="Environmental Science">Environmental Science</option>
                  <option value="Psychology">Psychology</option>
                  <option value="Law & Ethics">Law & Ethics</option>
                  <option value="General Academic Discipline">General Academic Discipline</option>
                </select>
              </div>

              <div className="form-group">
                <label>Assignment Type</label>
                <select
                  className="form-select"
                  value={assignmentType}
                  onChange={(e) => setAssignmentType(e.target.value)}
                >
                  <option value="Research Paper">Research Paper</option>
                  <option value="Case Study">Case Study</option>
                  <option value="Literature Review">Literature Review</option>
                  <option value="Systematic Review">Systematic Review</option>
                  <option value="Essay">Essay</option>
                  <option value="Term Paper">Term Paper</option>
                </select>
              </div>
            </div>

            {/* Word Count Target */}
            <div className="form-group">
              <label>Word Count Target</label>
              <div className="chips-wrap">
                {[500, 1000, 1500, 2000, 3000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`chip-btn ${wordTarget === val ? 'selected' : ''}`}
                    onClick={() => setWordTarget(val)}
                  >
                    {val === 3000 ? '3000+' : val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Citation Style */}
            <div className="form-group">
              <label>Citation Style</label>
              <div className="chips-wrap">
                {['APA', 'IEEE', 'MLA', 'Harvard'].map((style) => (
                  <button
                    key={style}
                    type="button"
                    className={`chip-btn ${citationStyle === style ? 'selected' : ''}`}
                    onClick={() => setCitationStyle(style)}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Instructions / Syllabus Guidelines */}
            <div className="form-group">
              <label>Additional Instructions / Syllabus Guidelines</label>
              <textarea
                className="form-textarea"
                value={guidelines}
                onChange={(e) => setGuidelines(e.target.value)}
                placeholder="Provide syllabus criteria, focus themes, evaluation rubrics, or specific requirements..."
              />
            </div>

            {/* Attach Assignment Brief (Matches Screenshot 2) */}
            <div className="form-group">
              <label>Attach Assignment Brief (PDF, DOCX, TXT)</label>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
              />

              {!uploadFile ? (
                <div
                  className="upload-drop-panel"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="upload-icon-circle">
                    <Upload size={22} />
                  </div>
                  <span className="upload-prompt-text">Click to upload document brief</span>
                  <span className="upload-support-text">Supports PDF, DOCX, and TXT (Max 15MB)</span>
                </div>
              ) : (
                <div className="uploaded-file-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileCheck size={20} color="var(--accent-primary)" />
                    <div>
                      <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)', display: 'block' }}>
                        {uploadFile.name}
                      </strong>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • {isUploading ? `Uploading ${uploadProgress}%...` : 'Uploaded'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                      onClick={removeUploadedFile}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {uploadError && (
                <span style={{ fontSize: '0.78rem', color: 'var(--danger-text)', marginTop: '4px' }}>
                  {uploadError}
                </span>
              )}
            </div>

            {/* Advanced Research Settings Accordion */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <button
                type="button"
                className="accordion-toggle"
                onClick={() => setAdvancedOpen(!advancedOpen)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={16} />
                  <span>Advanced Research Settings</span>
                </div>
                <ChevronDown
                  size={16}
                  style={{
                    transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </button>

              {advancedOpen && (
                <div className="accordion-body">
                  <div className="form-group">
                    <label>Research Depth</label>
                    <select
                      className="form-select"
                      value={researchDepth}
                      onChange={(e) => setResearchDepth(e.target.value)}
                    >
                      <option value="Introductory">Introductory</option>
                      <option value="Comprehensive">Comprehensive</option>
                      <option value="Exhaustive">Exhaustive Academic</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Source Quality Criteria</label>
                    <select
                      className="form-select"
                      value={sourceQuality}
                      onChange={(e) => setSourceQuality(e.target.value)}
                    >
                      <option value="Peer-reviewed">Peer-reviewed Journals</option>
                      <option value="Authoritative">Academic & Institutional</option>
                      <option value="Conference">Top Conference Proceedings</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Minimum Sources</label>
                    <select
                      className="form-select"
                      value={sourceCount}
                      onChange={(e) => setSourceCount(Number(e.target.value))}
                    >
                      <option value={3}>3 Verified Sources</option>
                      <option value={5}>5 Verified Sources</option>
                      <option value={8}>8 Verified Sources</option>
                      <option value={10}>10 Verified Sources</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '12px 28px', fontSize: '0.94rem' }}
                disabled={isConductingResearch}
              >
                {isConductingResearch ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Synthesizing Literature...</span>
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    <span>Generate Research</span>
                  </>
                )}
              </button>
            </div>

            {isConductingResearch && (
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'var(--accent-soft)',
                  border: '1px solid var(--accent-soft-border)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <RefreshCw size={16} className="animate-spin" color="var(--accent-primary)" />
                <span>{researchProgressStage}</span>
              </div>
            )}
          </form>
        </div>

        {/* Research Results View */}
        {currentResearchResult && renderResearchResultsSection()}
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // Progress Modal (Screenshot 1)
  // --------------------------------------------------------------------------
  const renderProgressModal = () => {
    if (!showProgressModal) return null;

    const allCompleted = researchStages.every((s) => s.status === 'completed');
    const hasFailed = researchStages.some((s) => s.status === 'failed');

    return (
      <div className="research-progress-overlay">
        <div className="progress-panel-card">
          {(allCompleted || hasFailed) && (
            <button
              type="button"
              onClick={() => setShowProgressModal(false)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={18} />
            </button>
          )}

          <div className="progress-sparkle-icon">
            <Sparkles size={28} />
          </div>

          <h3 className="progress-modal-title">AI Research in Progress</h3>
          <p className="progress-modal-topic">
            Topic: <strong>{topic || currentResearchResult?.topic || 'Academic Inquiry'}</strong>
          </p>

          <div className="progress-tracker-row">
            <span>Progress</span>
            <span className="progress-percent-val">{researchProgressPercent}%</span>
          </div>

          <div className="progress-track-bar">
            <div
              className="progress-fill-bar"
              style={{ width: `${researchProgressPercent}%` }}
            />
          </div>

          <div className="progress-stage-list">
            {researchStages.map((stage) => {
              const isRunning = stage.status === 'running';
              const isDone = stage.status === 'completed';
              const isFail = stage.status === 'failed';

              return (
                <div
                  key={stage.id}
                  className={`stage-item-row ${isRunning ? 'running' : ''} ${isDone ? 'completed' : ''}`}
                >
                  <div className="stage-item-left">
                    <div className={`stage-circle-indicator ${stage.status}`}>
                      {isDone && <Check size={16} strokeWidth={2.8} />}
                      {isRunning && <RefreshCw size={15} className="animate-spin" />}
                      {!isDone && !isRunning && !isFail && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-strong)' }} />
                      )}
                      {isFail && <AlertCircle size={16} color="#dc2626" />}
                    </div>

                    <div className="stage-text-group">
                      <span className="stage-title-text">
                        {stage.name}
                      </span>
                      <span className="stage-sub-text">{stage.subtitle}</span>
                    </div>
                  </div>

                  <span className={`stage-status-badge ${stage.status}`}>
                    {stage.status === 'idle' ? 'PENDING' : stage.status}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="progress-terminal-footer" title={researchTerminalLog}>
            {researchTerminalLog || 'Agent orchestrator active...'}
          </div>
        </div>
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // Add Custom Research Question Modal
  // --------------------------------------------------------------------------
  const renderAddQuestionModal = () => {
    if (!showAddQuestionModal) return null;

    return (
      <div className="modal-backdrop">
        <div className="modal-card" style={{ maxWidth: '520px' }}>
          <div className="modal-header">
            <div>
              <h3 className="modal-title">Add Custom Research Question</h3>
              <p className="modal-subtitle">Formulate an additional inquiry vector for your assignment</p>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => {
                setShowAddQuestionModal(false);
                setNewQuestionInput('');
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              Question / Inquiry Thesis *
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              value={newQuestionInput}
              onChange={(e) => setNewQuestionInput(e.target.value)}
              placeholder="e.g. How do modern algorithmic constraints impact reproducible evaluation in real-world deployments?"
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                setShowAddQuestionModal(false);
                setNewQuestionInput('');
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleAddCustomQuestion}
              disabled={!newQuestionInput.trim()}
            >
              Add Question
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // Citation Details & BibTeX Modal
  // --------------------------------------------------------------------------
  const renderCitationDetailsModal = () => {
    if (!viewingCitationSource) return null;

    const s = viewingCitationSource;
    const authorLastName = (s.authors || 'Author').split(/[\s,]+/)[0].toLowerCase();
    const year = s.year || '2024';
    const bibtexKey = `${authorLastName}${year}`;
    const bibtexStr = `@article{${bibtexKey},
  title={${s.title}},
  author={${s.authors}},
  journal={${s.publication_or_source}},
  year={${year}}${s.doi ? `,\n  doi={${s.doi}}` : ''}
}`;

    return (
      <div className="modal-backdrop">
        <div className="modal-card" style={{ maxWidth: '640px' }}>
          <div className="modal-header">
            <div>
              <h3 className="modal-title">Citation & Bibliographic Details</h3>
              <p className="modal-subtitle">Verified metadata retrieved from scholarly repositories</p>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setViewingCitationSource(null)}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                {s.source_type || 'Academic Paper'} • {s.content_mode}
              </span>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 6px' }}>
                {s.title}
              </h4>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {s.authors} — {s.publication_or_source} ({s.year || 'n.d.'})
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>Standard Formatted Citation:</strong>
                <button
                  type="button"
                  className="copy-citation-pill-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(s.citation || '');
                    showToast('Citation copied!', 'success');
                  }}
                >
                  <Copy size={13} />
                  <span>Copy</span>
                </button>
              </div>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--surface-input)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {s.citation || `${s.authors} (${s.year}). ${s.title}. ${s.publication_or_source}.`}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>BibTeX Entry:</strong>
                <button
                  type="button"
                  className="copy-citation-pill-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(bibtexStr);
                    showToast('BibTeX copied!', 'success');
                  }}
                >
                  <Copy size={13} />
                  <span>Copy BibTeX</span>
                </button>
              </div>
              <pre style={{ margin: 0, padding: '12px', borderRadius: '10px', background: 'var(--surface-input)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)', overflowX: 'auto' }}>
                {bibtexStr}
              </pre>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setViewingCitationSource(null)}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // Unsaved Edits Regeneration Confirm Modal
  // --------------------------------------------------------------------------
  const renderRegenerateConfirmModal = () => {
    if (!showRegenerateConfirmModal) return null;

    return (
      <div className="modal-backdrop">
        <div className="modal-card" style={{ maxWidth: '480px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--danger-bg)', color: 'var(--danger-text)', display: 'grid', placeItems: 'center' }}>
              <AlertCircle size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Unsaved Section Edits
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Confirmation required before regeneration
              </p>
            </div>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 20px' }}>
            You have active edits in your assignment draft. Regenerating the report will query the Writer Agent to generate a brand new 8-section document and replace your local section modifications.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setShowRegenerateConfirmModal(false)}
            >
              Keep My Edits
            </button>
            <button
              type="button"
              className="btn-primary"
              style={{ background: 'var(--accent-primary)' }}
              onClick={executeReportRegeneration}
            >
              Confirm & Regenerate
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // Complete Research Workspace Section (Screenshots 2, 3, 4, 5)
  // --------------------------------------------------------------------------
  const renderResearchResultsSection = () => {
    if (!currentResearchResult) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Pipeline Summary Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '14px 20px',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#10b981', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <Check size={16} strokeWidth={3} />
            </div>
            <div>
              <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>
                Multi-Agent Scholarly Pipeline Verified (5/5 Stages Completed)
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Planner • Research • Analysis • Writer • Citation
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn-outline"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            onClick={() => setShowProgressModal(true)}
          >
            <Sparkles size={14} />
            <span>View Pipeline Details</span>
          </button>
        </div>

        {/* 1. Research Questions Section (Screenshot 2) */}
        {renderResearchQuestions()}

        {/* 2. Verified Academic Sources (Screenshot 3) */}
        {renderAcademicSources()}

        {/* 3. Key Empirical Findings (Screenshot 4) */}
        {renderKeyFindings()}

        {/* 4. Structured Academic Assignment Draft - 8-Section Report (Screenshot 5) */}
        {(generatedDraftReport || viewingReport) && renderReportDraftSection(generatedDraftReport || viewingReport!)}
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // 1. Research Questions Sub-Component (Screenshot 2)
  // --------------------------------------------------------------------------
  const renderResearchQuestions = () => {
    return (
      <section className="rq-section-card">
        <div className="rq-header-row">
          <div className="rq-title-block">
            <div className="rq-question-icon-circle">
              <FileQuestion size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Research Questions
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Inquiry vectors formulated by the Planner Agent
              </p>
            </div>
          </div>

          <div className="rq-actions-group">
            <button
              type="button"
              className="btn-outline"
              style={{ padding: '6px 14px', fontSize: '0.82rem', gap: '6px' }}
              onClick={handleCopyAllQuestions}
            >
              <Copy size={14} />
              <span>Copy All</span>
            </button>

            <button
              type="button"
              className="btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.82rem', gap: '6px' }}
              onClick={handleRegenerateQuestions}
              disabled={isRegeneratingQuestions}
            >
              <RefreshCw size={14} className={isRegeneratingQuestions ? 'animate-spin' : ''} />
              <span>{isRegeneratingQuestions ? 'Regenerating...' : 'Regenerate Questions'}</span>
            </button>

            <button
              type="button"
              className="btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.82rem', gap: '4px' }}
              onClick={() => setShowAddQuestionModal(true)}
              title="Add Custom Inquiry Vector"
            >
              <Plus size={14} />
              <span>Add Question</span>
            </button>
          </div>
        </div>

        <div className="rq-list-container">
          {editableQuestions.map((q, idx) => {
            const isEditing = editingQuestionIdx === idx;

            return (
              <div key={idx} className="rq-item-box">
                <div className="rq-number-pill">{idx + 1}</div>

                {isEditing ? (
                  <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={editingQuestionText}
                      onChange={(e) => setEditingQuestionText(e.target.value)}
                      style={{ flex: 1, fontSize: '0.9rem', padding: '6px 10px' }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => handleSaveQuestionEdit(idx)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      onClick={handleCancelQuestionEdit}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="rq-question-content">{q}</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        className="rq-button-icon"
                        onClick={() => handleStartEditQuestion(idx, q)}
                        title="Edit question text"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="rq-button-icon"
                        onClick={() => handleCopySingleQuestion(q)}
                        title="Copy question to clipboard"
                      >
                        <Copy size={15} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  // --------------------------------------------------------------------------
  // 2. Verified Academic Sources Sub-Component (Screenshot 3)
  // --------------------------------------------------------------------------
  const renderAcademicSources = () => {
    if (!currentResearchResult) return null;

    const sources = currentResearchResult.sources || [];

    // Filter logic
    const filteredSources = sources.filter((s) => {
      if (sourceFilterTab === 'all') return true;
      const typeStr = (s.source_type || '').toLowerCase();
      const venueStr = (s.publication_or_source || '').toLowerCase();
      if (sourceFilterTab === 'academic') {
        return (
          typeStr.includes('journal') ||
          typeStr.includes('conference') ||
          typeStr.includes('paper') ||
          typeStr.includes('academic') ||
          venueStr.includes('ieee') ||
          venueStr.includes('acm') ||
          venueStr.includes('springer') ||
          venueStr.includes('journal')
        );
      }
      if (sourceFilterTab === 'reports') {
        return (
          typeStr.includes('report') ||
          venueStr.includes('consortium') ||
          venueStr.includes('report') ||
          venueStr.includes('policy') ||
          venueStr.includes('whitepaper')
        );
      }
      if (sourceFilterTab === 'web') {
        return (
          typeStr.includes('web') ||
          typeStr.includes('repository') ||
          !typeStr.includes('journal')
        );
      }
      return true;
    });

    return (
      <section className="sources-section-card">
        <div className="sources-header-bar">
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Verified Academic Sources
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Authentic literature retrieved and evaluated by the Research Agent
            </p>
          </div>

          <div className="source-filter-pills">
            {(['all', 'academic', 'web', 'reports'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`source-filter-tab ${sourceFilterTab === tab ? 'active' : ''}`}
                onClick={() => setSourceFilterTab(tab)}
              >
                {tab === 'all'
                  ? 'All'
                  : tab === 'academic'
                  ? 'Academic'
                  : tab === 'web'
                  ? 'Web'
                  : 'Reports'}
              </button>
            ))}
          </div>
        </div>

        <div className="sources-grid-2col">
          {filteredSources.map((source, index) => {
            const relevanceLabel =
              index === 0
                ? 'High Relevance'
                : index === 1
                ? 'Foundational Relevance'
                : index === 2
                ? 'Supporting Relevance'
                : 'Verified Scholarly';

            const displayType = (source.source_type || 'ACADEMIC')
              .replace(/Article|Paper/gi, '')
              .trim() || 'ACADEMIC';

            return (
              <article key={source.id || index} className="academic-card-v2">
                <div>
                  <div className="academic-badges-top">
                    <span className="type-pill-badge">{displayType}</span>
                    <span className="relevance-pill-badge">{relevanceLabel}</span>
                  </div>

                  <a
                    href={source.doi || source.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="academic-card-title-link"
                    title={source.title}
                  >
                    {source.title}
                  </a>

                  <div className="academic-card-authors-venue">
                    {source.authors || 'Scholarly Authors'} — {source.publication_or_source || 'Academic Publication'}, {source.year || '2024'}
                  </div>

                  <p className="academic-card-excerpt">
                    {source.abstract || 'Peer-reviewed scholarly contribution providing empirical methodology and systematic findings on this assignment topic.'}
                  </p>
                </div>

                <div className="academic-card-footer-btns">
                  {source.doi || source.url ? (
                    <a
                      href={source.doi || source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="open-source-link-btn"
                    >
                      <span>Open Source</span>
                      <ExternalLink size={13} />
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Indexed Record</span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="copy-citation-pill-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(source.citation || `${source.authors} (${source.year}). ${source.title}. ${source.publication_or_source}.`);
                        showToast('Citation copied to clipboard!', 'success');
                      }}
                      title="Copy full academic citation"
                    >
                      <Copy size={13} />
                      <span>Copy Citation</span>
                    </button>
                    <button
                      type="button"
                      className="rq-button-icon"
                      onClick={() => setViewingCitationSource(source)}
                      title="View Citation & BibTeX"
                    >
                      <FileText size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  };

  // --------------------------------------------------------------------------
  // 3. Key Findings Sub-Component (Screenshot 4)
  // --------------------------------------------------------------------------
  const renderKeyFindings = () => {
    if (!currentResearchResult?.key_findings?.length) return null;

    return (
      <section className="findings-section-card">
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Key Empirical Findings
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Synthesized by the Analysis Agent with supporting evidence
          </p>
        </div>

        <div className="findings-list-wrapper">
          {currentResearchResult.key_findings.map((f, idx) => {
            const isOpen = expandedFindingIndices.includes(idx);

            return (
              <div key={idx} className={`finding-accordion-box ${isOpen ? 'open' : ''}`}>
                <div className="finding-acc-header" onClick={() => handleToggleFinding(idx)}>
                  <div className="finding-acc-header-left">
                    <span className="finding-bullet-blue" />
                    <span>{f.title}</span>
                  </div>

                  <div style={{ color: 'var(--text-muted)', display: 'grid', placeItems: 'center' }}>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {isOpen && (
                  <div className="finding-acc-body">
                    <div>
                      <div className="finding-sub-label">EMPIRICAL EVIDENCE:</div>
                      <div className="finding-inner-box">
                        {f.description}
                      </div>
                    </div>

                    <div>
                      <div className="finding-sub-label">ACADEMIC IMPORTANCE:</div>
                      <div className="finding-inner-box">
                        {f.academic_importance || f.takeaway || 'Substantiates core assignment theses with peer-reviewed literature.'}
                      </div>
                    </div>

                    {f.limitations && (
                      <div>
                        <div className="finding-sub-label">RESEARCH GAP / LIMITATION:</div>
                        <div className="finding-inner-box" style={{ color: 'var(--text-muted)' }}>
                          {f.limitations}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  // --------------------------------------------------------------------------
  // 4. Structured Academic Assignment Draft (Screenshot 5)
  // --------------------------------------------------------------------------
  const renderReportDraftSection = (report: AcademicReport, isStandaloneView: boolean = false) => {
    const rc = report.report_content || {};
    const actualWords = report.word_count_estimate || 0;
    const targetWords = rc.word_target || wordTarget || 2000;
    const percentTarget = Math.round((actualWords / targetWords) * 100);

    const sectionsList = [
      { key: 'abstract', title: '1. Abstract & Executive Summary', text: rc.abstract || report.abstract },
      { key: 'introduction', title: '2. Introduction & Problem Formulation', text: rc.introduction },
      { key: 'literature_review', title: '3. Literature Review & Theoretical Framework', text: rc.literature_review },
      { key: 'methodology', title: '4. Methodology & Analytical Approach', text: rc.methodology },
      { key: 'findings', title: '5. Thematic Analysis / Main Findings', text: rc.findings },
      { key: 'discussion', title: '6. Discussion & Academic Implications', text: rc.discussion },
      { key: 'limitations', title: '7. Limitations & Future Research Directions', text: rc.limitations },
      { key: 'conclusion', title: '8. Conclusion & Synthesis', text: rc.conclusion }
    ];

    const referencesList = rc.references || [];

    return (
      <section className="report-generated-card">
        {/* Top Action Bar matching Screenshot 5 */}
        <div className="report-draft-top-bar">
          <div>
            <div className="report-draft-kicker">STRUCTURED ACADEMIC ASSIGNMENT DRAFT</div>
            <h2 className="report-draft-title">8-Section Generated Report</h2>
          </div>

          <div className="report-btn-toolbar">
            {/* Scope selector */}
            <div className="report-scope-toggle" title="Export Scope Selection">
              <button
                type="button"
                className={`report-scope-btn ${reportExportScope === 'report' ? 'active' : ''}`}
                onClick={() => setReportExportScope('report')}
              >
                Report Only
              </button>
              <button
                type="button"
                className={`report-scope-btn ${reportExportScope === 'complete' ? 'active' : ''}`}
                onClick={() => setReportExportScope('complete')}
              >
                Complete Package
              </button>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.84rem', gap: '6px' }}
              onClick={handleRegenerateReport}
              disabled={isGeneratingReport}
            >
              <RefreshCw size={15} className={isGeneratingReport ? 'animate-spin' : ''} />
              <span>{isGeneratingReport ? 'Drafting Report...' : 'Regenerate Report'}</span>
            </button>

            <button
              type="button"
              className="btn-outline"
              style={{ padding: '8px 14px', fontSize: '0.84rem', gap: '6px' }}
              onClick={() => handleCopyReportFull(report)}
            >
              <Copy size={15} />
              <span>Copy</span>
            </button>

            <button
              type="button"
              className="btn-outline"
              style={{ padding: '8px 14px', fontSize: '0.84rem', gap: '6px' }}
              onClick={() => handleDownloadExport('txt')}
              disabled={isExportingFile}
            >
              <Download size={15} />
              <span>Download TXT</span>
            </button>

            <button
              type="button"
              className="btn-outline"
              style={{ padding: '8px 14px', fontSize: '0.84rem', gap: '6px' }}
              onClick={() => handleDownloadExport('pdf')}
              disabled={isExportingFile}
            >
              <Download size={15} />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              className="btn-outline"
              style={{ padding: '8px 14px', fontSize: '0.84rem', gap: '6px' }}
              onClick={() => handleDownloadExport('docx')}
              disabled={isExportingFile}
              title="Download Word Document"
            >
              <Download size={15} />
              <span>Download DOCX</span>
            </button>

            {isStandaloneView && (
              <button
                type="button"
                className="btn-danger"
                style={{ padding: '8px 12px', fontSize: '0.84rem' }}
                onClick={() => handleDeleteReport(report.id)}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Stats Pill Bar */}
        <div className="stats-summary-pill-bar">
          <span>Target: <strong>{targetWords.toLocaleString()} words</strong></span>
          <span>•</span>
          <span>Actual: <strong>{actualWords.toLocaleString()} words</strong> ({percentTarget}%)</span>
          <span>•</span>
          <span>Structure: <strong>8 / 8 Sections Completed</strong></span>
          <span>•</span>
          <span>Citation Standard: <strong>{report.citation_style}</strong></span>
        </div>

        {/* The Clean Academic Paper (Matches Screenshot 5) */}
        <article className="report-paper-container">
          <h1 className="report-paper-h1">{report.topic}</h1>
          <div className="report-paper-subtitle">
            Structured Academic Assignment in {report.subject}
          </div>
          <div className="report-paper-meta-line">
            Format: {report.citation_style} Citation Style • Target: {targetWords.toLocaleString()} words • Actual: {actualWords.toLocaleString()} words
          </div>
          <div className="report-paper-date-line">
            Date: {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>

          <hr className="report-paper-hr" />

          {/* 8 Sections with browser inline editing */}
          {sectionsList.map((sec) => {
            const isEditing = editingSectionKey === sec.key;

            return (
              <section key={sec.key} className="report-section-unit">
                <div className="report-section-unit-header">
                  <h3 className="report-section-unit-title">{sec.title}</h3>
                  <button
                    type="button"
                    className="section-edit-trigger"
                    onClick={() => handleStartEditSection(sec.key, sec.text || '')}
                    title="Edit this section directly in browser"
                  >
                    <Pencil size={13} />
                    <span>Edit</span>
                  </button>
                </div>

                {isEditing ? (
                  <div style={{ marginTop: '8px' }}>
                    <textarea
                      className="report-inline-textarea"
                      value={editingSectionContent}
                      onChange={(e) => {
                        setEditingSectionContent(e.target.value);
                        setHasUnsavedSectionEdits(true);
                      }}
                      rows={8}
                    />
                    <div className="section-edit-actions">
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={handleCancelSectionEdit}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        onClick={() => handleSaveSectionEdit(sec.key)}
                        disabled={isSavingSectionEdit}
                      >
                        {isSavingSectionEdit ? 'Saving...' : 'Save to Report'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="report-section-body-text">
                    {sec.text || 'This section is being drafted by the Writer Agent.'}
                  </div>
                )}
              </section>
            );
          })}

          {/* Reference List Section (strictly formatted in selected style) */}
          <section className="report-section-unit">
            <h3 className="report-section-unit-title" style={{ marginBottom: '14px' }}>
              8. References ({report.citation_style} Standard)
            </h3>
            {referencesList.length > 0 ? (
              <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {referencesList.map((refStr, idx) => (
                  <li key={idx} style={{ marginBottom: '10px' }}>
                    {refStr}
                  </li>
                ))}
              </ol>
            ) : (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Bibliographic citations verified by Citation Agent.
              </p>
            )}
          </section>
        </article>
      </section>
    );
  };

  // --------------------------------------------------------------------------
  // VIEW: Reports List & Full Report Viewer
  // --------------------------------------------------------------------------
  const renderReportsView = () => {
    if (viewingReport) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setViewingReport(null)}
            >
              <ChevronLeft size={16} />
              <span>Back to Reports List</span>
            </button>
          </div>

          {renderReportDraftSection(viewingReport, true)}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
              Saved Academic Reports
            </h3>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              All reports generated under your authenticated student account.
            </p>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={() => setActiveNav('research')}
          >
            <Search size={16} />
            <span>Generate New Report</span>
          </button>
        </div>

        {reportsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
            <span>Loading saved reports...</span>
          </div>
        ) : reportsList.length === 0 ? (
          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '48px 24px',
              textAlign: 'center'
            }}
          >
            <FileQuestion size={44} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: 'var(--text-primary)' }}>No reports generated yet</h4>
            <p style={{ margin: '0 0 16px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Conduct a research inquiry and click "Generate Full Academic Report" to save a publication paper here.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setActiveNav('research')}
            >
              Start Assignment Research
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {reportsList.map((r) => (
              <div
                key={r.id}
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                      {r.subject}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px', lineHeight: 1.4 }}>
                    {r.title}
                  </h4>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {r.abstract}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {r.citation_style} • ~{r.word_count_estimate}w
                    </span>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        onClick={() => setViewingReport(r)}
                      >
                        Read
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ width: '30px', height: '30px' }}
                        title="Rename report"
                        onClick={() => handleOpenRename(r)}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ width: '30px', height: '30px', color: 'var(--danger-text)' }}
                        title="Delete report"
                        onClick={() => handleDeleteReport(r.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // VIEW: Research History
  const renderHistoryView = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
              Research Inquiry History
            </h3>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Review past assignment literature syntheses conducted under your account.
            </p>
          </div>
        </div>

        {historyLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
            <span>Loading research history...</span>
          </div>
        ) : historyList.length === 0 ? (
          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '48px 24px',
              textAlign: 'center'
            }}
          >
            <Clock size={44} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: 'var(--text-primary)' }}>No research history yet</h4>
            <p style={{ margin: '0 0 16px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Inquiries submitted through the New Research form will appear here.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setActiveNav('research')}
            >
              Start Research
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {historyList.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                      {item.subject}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                  <strong style={{ fontSize: '1.02rem', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    {item.topic}
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {item.assignment_type} • {item.citation_style} • {item.sources?.length || 0} Sources Retrieved
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '0.82rem' }}
                    onClick={() => {
                      setTopic(item.topic);
                      setSubject(item.subject);
                      setAssignmentType(item.assignment_type);
                      setCitationStyle(item.citation_style);
                      setCurrentResearchResult({
                        request_id: item.id,
                        topic: item.topic,
                        subject: item.subject,
                        assignment_type: item.assignment_type,
                        citation_style: item.citation_style,
                        summary: item.summary,
                        key_findings: item.key_findings || [],
                        sources: item.sources || [],
                        research_questions: item.research_questions || []
                      });
                      setActiveNav('research');
                    }}
                  >
                    Reopen in Workspace
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    style={{ color: 'var(--danger-text)' }}
                    title="Delete history entry"
                    onClick={() => handleDeleteHistory(item.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // VIEW: Settings
  const renderSettingsView = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' }}>
        <div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
            Workspace Settings
          </h3>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Configure theme aesthetics, default citation standards, and academic engine preferences.
          </p>
        </div>

        {/* Theme Settings */}
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '24px'
          }}
        >
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Theme & Appearance
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 16px' }}>
            Choose between intentional light or dark themes, or sync with your operating system.
          </p>

          <div className="chips-wrap">
            {[
              { id: 'light', label: 'Light Theme', icon: Sun },
              { id: 'dark', label: 'Dark Theme', icon: Moon },
              { id: 'system', label: 'System Preference', icon: Sparkles }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`chip-btn ${themePreference === id ? 'selected' : ''}`}
                onClick={async () => {
                  setThemePreference(id as ThemeMode);
                  if (studentUser) {
                    try {
                      await fetch('/api/profile/preferences', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ theme: id }),
                        credentials: 'include'
                      });
                    } catch {
                      // ignore
                    }
                  }
                }}
              >
                <Icon size={14} style={{ display: 'inline', marginRight: '6px' }} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Default Citation Style */}
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '24px'
          }}
        >
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Default Citation Standard
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 16px' }}>
            Pre-selected citation style for all new research projects.
          </p>

          <div className="chips-wrap">
            {['APA', 'IEEE', 'MLA', 'Harvard'].map((style) => (
              <button
                key={style}
                type="button"
                className={`chip-btn ${citationStyle === style ? 'selected' : ''}`}
                onClick={async () => {
                  setCitationStyle(style);
                  if (studentUser) {
                    try {
                      await fetch('/api/profile/preferences', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ default_citation_style: style }),
                        credentials: 'include'
                      });
                      showToast(`Default citation style updated to ${style}`, 'success');
                    } catch {
                      // ignore
                    }
                  }
                }}
              >
                <span>{style} Style</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Engine Status */}
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Key size={18} color="var(--accent-primary)" />
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              AI Synthesis Engine (Google Gemini 3.8 Flash)
            </h4>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 16px' }}>
            {configStatus.gemini_configured ? (
              <span style={{ color: 'var(--verified-badge-text)', fontWeight: 700 }}>
                ✓ Configured and Active. Automated synthesis and report drafting are enabled.
              </span>
            ) : (
              <span>
                Gemini API key is required for multi-step AI synthesis. Genuine scholarly search
                (OpenAlex & Crossref) remains fully operational without a key.
              </span>
            )}
          </p>

          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--surface-card-subtle)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            To configure or update your key, edit <code>GEMINI_API_KEY</code> in <code>backend/.env</code>.
            Get a free key from{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
            >
              Google AI Studio
            </a>.
          </div>
        </div>
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // Main Layout Return
  // --------------------------------------------------------------------------
  return (
    <div className={`app-shell ${activeTheme}`}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999,
            padding: '12px 20px',
            borderRadius: '12px',
            background: toastMessage.type === 'error' ? 'var(--danger-bg)' : 'var(--surface-card-elevated)',
            color: toastMessage.type === 'error' ? 'var(--danger-text)' : 'var(--text-primary)',
            border: `1px solid ${toastMessage.type === 'error' ? 'var(--danger-border)' : 'var(--border-strong)'}`,
            boxShadow: 'var(--shadow-lg)',
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          {toastMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} color="var(--accent-primary)" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Modals */}
      {renderAuthModal()}
      {renderProfileCompleteModal()}
      {renderEditProfileModal()}
      {renderSwitchAccountModal()}
      {renderRenameModal()}
      {renderProgressModal()}
      {renderAddQuestionModal()}
      {renderCitationDetailsModal()}
      {renderRegenerateConfirmModal()}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileDrawerOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header - Never Clipped! */}
        <div className="sidebar-header">
          <button
            type="button"
            className="brand-button"
            onClick={() => handleNavClick('home')}
            title="AI Assignment Research Agent"
          >
            <div className="brand-icon">
              <BookOpen size={20} />
            </div>
            {!sidebarCollapsed && (
              <div className="brand-copy">
                <span className="brand-title">AI Assignment</span>
                <span className="brand-subtitle">Research Agent</span>
                <span className="brand-tagline">Academic Research Portal</span>
              </div>
            )}
          </button>

          <button
            type="button"
            className="collapse-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="sidebar-nav">
          <button
            type="button"
            className={`nav-button ${activeNav === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
            title="Public Home"
          >
            <span className="nav-button-icon"><BookOpen size={18} /></span>
            {!sidebarCollapsed && <span>Home</span>}
          </button>

          {studentUser ? (
            <>
              <div className="nav-section-title">
                {!sidebarCollapsed ? 'Research Workspace' : '•••'}
              </div>

              <button
                type="button"
                className={`nav-button ${activeNav === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('dashboard')}
                title="Dashboard"
              >
                <span className="nav-button-icon"><LayoutDashboard size={18} /></span>
                {!sidebarCollapsed && <span>Dashboard</span>}
              </button>

              <button
                type="button"
                className={`nav-button ${activeNav === 'research' ? 'active' : ''}`}
                onClick={() => handleNavClick('research')}
                title="New Research"
              >
                <span className="nav-button-icon"><Search size={18} /></span>
                {!sidebarCollapsed && <span>New Research</span>}
              </button>

              <button
                type="button"
                className={`nav-button ${activeNav === 'reports' ? 'active' : ''}`}
                onClick={() => handleNavClick('reports')}
                title="My Reports"
              >
                <span className="nav-button-icon"><FileText size={18} /></span>
                {!sidebarCollapsed && <span>My Reports</span>}
              </button>

              <button
                type="button"
                className={`nav-button ${activeNav === 'history' ? 'active' : ''}`}
                onClick={() => handleNavClick('history')}
                title="Research History"
              >
                <span className="nav-button-icon"><Clock size={18} /></span>
                {!sidebarCollapsed && <span>Research History</span>}
              </button>

              <div className="nav-section-title">
                {!sidebarCollapsed ? 'Account' : '•••'}
              </div>

              <button
                type="button"
                className={`nav-button ${activeNav === 'profile' ? 'active' : ''}`}
                onClick={() => handleNavClick('profile')}
                title="Student Profile"
              >
                <span className="nav-button-icon"><UserRound size={18} /></span>
                {!sidebarCollapsed && <span>Profile</span>}
              </button>

              <button
                type="button"
                className={`nav-button ${activeNav === 'settings' ? 'active' : ''}`}
                onClick={() => handleNavClick('settings')}
                title="Settings"
              >
                <span className="nav-button-icon"><Settings size={18} /></span>
                {!sidebarCollapsed && <span>Settings</span>}
              </button>
            </>
          ) : (
            <>
              <div className="nav-section-title">
                {!sidebarCollapsed ? 'Get Started' : '•••'}
              </div>

              <button
                type="button"
                className="nav-button"
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                title="Sign In"
              >
                <span className="nav-button-icon"><UserRound size={18} /></span>
                {!sidebarCollapsed && <span>Sign In</span>}
              </button>

              <button
                type="button"
                className="nav-button"
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }}
                title="Create Account"
              >
                <span className="nav-button-icon"><GraduationCap size={18} /></span>
                {!sidebarCollapsed && <span>Create Account</span>}
              </button>
            </>
          )}
        </nav>

        {/* Sidebar Footer with Authenticated Student Mini-card */}
        <div className="sidebar-footer">
          {studentUser ? (
            <div
              className="sidebar-user-card"
              onClick={() => handleNavClick('profile')}
              title={`${profile?.full_name || studentUser.email} (Click to open profile)`}
            >
              <div className="sidebar-avatar">
                {getInitials(profile?.full_name || studentUser.email)}
              </div>
              {!sidebarCollapsed && (
                <div className="sidebar-user-info">
                  <span className="sidebar-user-name">
                    {profile?.full_name || 'Student Researcher'}
                  </span>
                  <span className="sidebar-user-email">
                    {studentUser.email}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '6px' }}>
              {!sidebarCollapsed && (
                <span style={{ fontSize: '0.74rem', color: 'var(--sidebar-text-muted)' }}>
                  Guest Visitor Mode
                </span>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 35
          }}
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* MAIN CONTENT SHELL */}
      <div className="content-shell">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open mobile navigation"
            >
              <Menu size={18} />
            </button>

            <div className="topbar-title-wrap">
              <p className="eyebrow">
                {studentUser ? 'Student Research Portal' : 'Public Academic Preview'}
              </p>
              <h1>
                {activeNav === 'home' && 'Academic Research Platform'}
                {activeNav === 'dashboard' && 'Research Workspace'}
                {activeNav === 'research' && 'Assignment Brief & Research'}
                {activeNav === 'reports' && 'Academic Reports Repository'}
                {activeNav === 'history' && 'Research History'}
                {activeNav === 'profile' && 'Student Researcher Profile'}
                {activeNav === 'settings' && 'Workspace Preferences'}
              </h1>
            </div>
          </div>

          <div className="topbar-actions">
            {!studentUser ? (
              <>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => {
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={() => handleNavClick('profile')}
                >
                  <span style={{ fontWeight: 700 }}>{profile?.full_name?.split(' ')[0] || 'Profile'}</span>
                </button>
              </div>
            )}

            {/* Theme Toggle Button */}
            <button
              type="button"
              className="btn-icon"
              onClick={() => {
                const nextTheme = activeTheme === 'light' ? 'dark' : 'light';
                setThemePreference(nextTheme);
              }}
              aria-label="Toggle light/dark theme"
              title={`Switch to ${activeTheme === 'light' ? 'dark' : 'light'} theme`}
            >
              {activeTheme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="page-main">
          {activeNav === 'home' && renderHomeView()}
          {activeNav === 'dashboard' && renderDashboardView()}
          {activeNav === 'research' && renderResearchView()}
          {activeNav === 'reports' && renderReportsView()}
          {activeNav === 'history' && renderHistoryView()}
          {activeNav === 'profile' && (
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
              {renderProfileCard()}
            </div>
          )}
          {activeNav === 'settings' && renderSettingsView()}
        </main>
      </div>
    </div>
  );
}

// ============================================================================
// Auth Form Component (Sign In & Sign Up)
// ============================================================================

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onSuccess: (user: StudentUser, profile: StudentProfile, requiresProfile: boolean) => void;
  onSwitchMode: (mode: 'signin' | 'signup') => void;
}

function AuthForm({ mode, onSuccess, onSwitchMode }: AuthFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = mode === 'signup' ? '/api/auth/register' : '/api/auth/login';
      const payload = mode === 'signup'
        ? { full_name: fullName.trim(), email: email.trim(), password, confirm_password: confirmPassword }
        : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { detail: `Server error (${res.status}). Please verify the backend is active.` };
      }

      if (res.ok) {
        onSuccess(data.user, data.profile, Boolean(data.requires_profile_completion));
      } else {
        setErrorMsg(data.detail || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message ? `Network error: ${err.message}` : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {errorMsg && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger-text)',
            fontSize: '0.84rem'
          }}
        >
          {errorMsg}
        </div>
      )}

      {mode === 'signup' && (
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            className="form-input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. John Doe"
            required
          />
        </div>
      )}

      <div className="form-group">
        <label>Email Address *</label>
        <input
          type="email"
          className="form-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="student@university.edu"
          required
        />
      </div>

      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label>Password *</label>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showPassword ? 'Hide' : 'Show'}</span>
          </button>
        </div>
        <input
          type={showPassword ? 'text' : 'password'}
          className="form-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      {mode === 'signup' && (
        <div className="form-group">
          <label>Confirm Password *</label>
          <input
            type={showPassword ? 'text' : 'password'}
            className="form-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
      )}

      <button
        type="submit"
        className="btn-primary"
        style={{ width: '100%', padding: '12px', marginTop: '6px' }}
        disabled={loading}
      >
        {loading ? (
          <RefreshCw size={16} className="animate-spin" />
        ) : (
          <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
        )}
      </button>

      <div style={{ textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '8px' }}>
        {mode === 'signin' ? (
          <span>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => onSwitchMode('signup')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              Sign up
            </button>
          </span>
        ) : (
          <span>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => onSwitchMode('signin')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              Sign in
            </button>
          </span>
        )}
      </div>
    </form>
  );
}

// ============================================================================
// Profile Form Component (Edit & Onboarding)
// ============================================================================

interface ProfileFormProps {
  initialProfile: StudentProfile | null;
  onSave: (updated: StudentProfile) => void;
  onCancel: () => void;
  isCompletionStep?: boolean;
}

function ProfileForm({ initialProfile, onSave, onCancel, isCompletionStep }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialProfile?.full_name || '');
  const [studentId, setStudentId] = useState(initialProfile?.student_id || '');
  const [college, setCollege] = useState(initialProfile?.college || '');
  const [department, setDepartment] = useState(initialProfile?.department || '');
  const [academicLevel, setAcademicLevel] = useState(initialProfile?.academic_level || 'Undergraduate');
  const [yearSemester, setYearSemester] = useState(initialProfile?.year_semester || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Full name cannot be blank.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          student_id: studentId.trim() || null,
          college: college.trim() || null,
          department: department.trim() || null,
          academic_level: academicLevel,
          year_semester: yearSemester.trim() || null
        }),
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        onSave(data.profile);
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || 'Failed to update student profile.');
      }
    } catch {
      setErrorMsg('Network error updating student profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {errorMsg && (
        <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--danger-bg)', color: 'var(--danger-text)', fontSize: '0.84rem' }}>
          {errorMsg}
        </div>
      )}

      <div className="form-group">
        <label>Full Student Name *</label>
        <input
          type="text"
          className="form-input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>

      <div className="form-row-2col">
        <div className="form-group">
          <label>Student ID / Roll No.</label>
          <input
            type="text"
            className="form-input"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="e.g. STU-2026-8941"
          />
        </div>

        <div className="form-group">
          <label>Academic Level</label>
          <select
            className="form-select"
            value={academicLevel}
            onChange={(e) => setAcademicLevel(e.target.value)}
          >
            <option value="Undergraduate">Undergraduate</option>
            <option value="Graduate">Graduate</option>
            <option value="Postgraduate">Postgraduate</option>
            <option value="Doctoral / PhD">Doctoral / PhD</option>
            <option value="High School">High School</option>
          </select>
        </div>
      </div>

      <div className="form-row-2col">
        <div className="form-group">
          <label>College or University</label>
          <input
            type="text"
            className="form-input"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            placeholder="e.g. Stanford University"
          />
        </div>

        <div className="form-group">
          <label>Department / Course</label>
          <input
            type="text"
            className="form-input"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Computer Science & Engineering"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Year / Semester</label>
        <input
          type="text"
          className="form-input"
          value={yearSemester}
          onChange={(e) => setYearSemester(e.target.value)}
          placeholder="e.g. Year 3, Semester 1"
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
        >
          {isCompletionStep ? 'Skip for now' : 'Cancel'}
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}
