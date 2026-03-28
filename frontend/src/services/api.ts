import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

export interface Bill {
  id: number;
  bill_id: number;
  state: string;
  session_id: number | null;
  bill_number: string;
  title: string;
  description: string | null;
  full_text: string | null;
  sponsors: Sponsor[];
  committee: string | null;
  status: string | null;
  status_id: number | null;
  url: string | null;
  classification: 'PRO' | 'ANTI' | 'NEUTRAL' | null;
  score: number | null;
  relevance_score: number | null;
  relevance_breakdown: {
    keyword_points: number;
    committee_points: number;
    sponsor_points: number;
    total_score: number;
    details: string[];
  } | null;
  llm_reasoning: string | null;
  confidence: number | null;
  relevance_keywords: string[] | null;
  last_action: string | null;
  last_action_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Sponsor {
  name?: string;
  party?: string;
  role?: string;
  people_id?: number;
}

export interface BillsResponse {
  bills: Bill[];
  total: number;
  limit: number;
  offset: number;
}

export interface Stats {
  total: number;
  pro: number;
  anti: number;
  neutral: number;
  state_breakdown: Record<string, { PRO: number; ANTI: number; NEUTRAL: number; total: number }>;
  average_score: number;
  recent_bills: Bill[];
  score_distribution: { range: string; count: number }[];
}

export interface PipelineResult {
  status: string;
  result: {
    states_processed: { state: string; fetched: number; relevant: number; stored: number; new: number }[];
    total_fetched: number;
    total_relevant: number;
    total_stored: number;
    total_new: number;
    classifications: { PRO: number; ANTI: number; NEUTRAL: number };
    errors: string[];
    started_at: string;
    completed_at: string;
  };
}

export interface ClassificationDetails {
  classification: string;
  confidence: number;
  pro_score: number;
  anti_score: number;
  pro_matches: Record<string, { count: number; weight: number; score: number }>;
  anti_matches: Record<string, { count: number; weight: number; score: number }>;
}

export interface BillDetail extends Bill {
  classification_details: ClassificationDetails;
}

// ── API Functions ────────────────────────────────────────────

export async function fetchBills(params?: {
  state?: string;
  classification?: string;
  min_score?: number;
  max_score?: number;
  keyword?: string;
  recent_only?: boolean;
  limit?: number;
  offset?: number;
}): Promise<BillsResponse> {
  const { data } = await api.get('/bills', { params });
  return data;
}

export async function fetchBill(billId: number): Promise<BillDetail> {
  const { data } = await api.get(`/bills/${billId}`);
  return data;
}

export async function fetchStats(): Promise<Stats> {
  const { data } = await api.get('/stats');
  return data;
}

export async function fetchDigest(format: 'html' | 'markdown' = 'html'): Promise<string> {
  const { data } = await api.get('/digest', {
    params: { format },
    responseType: format === 'html' ? 'text' : 'json',
  });
  return format === 'html' ? data : data.content;
}

export async function runPipeline(states?: string, timeframe: string = '30d'): Promise<PipelineResult> {
  const { data } = await api.post('/run-pipeline', null, {
    params: {
      ...(states ? { states } : {}),
      timeframe
    },
    timeout: 900000, // 15 minute timeout specifically for the long-running LLM pipeline
  });
  return data;
}

export async function getPipelineStatus(): Promise<{ is_running: boolean; progress: number; message: string }> {
  const { data } = await api.get('/run-pipeline/status');
  return data;
}

export async function healthCheck(): Promise<{ status: string }> {
  const { data } = await api.get('/health');
  return data;
}

export async function deleteBills(billIds: string[], deleteAll: boolean = false): Promise<{ deleted_count: number }> {
  const { data } = await api.delete('/bills', {
    params: deleteAll ? { delete_all: true } : undefined,
    data: billIds,
  });
  return data;
}

export default api;
