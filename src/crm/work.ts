import type { Row } from "./resources";
export type WorkSession = Row & {
  company_id: string | null;
  source_follow_up: string | null;
  stage: number;
  status: "active" | "paused" | "completed" | "skipped";
  email_id: string | null;
  call_id: string | null;
  contact_at: string | null;
  planned_at: string | null;
  state: {
    channel?: string;
    due?: string;
    reason?: string;
    mode?: string;
    scratch?: {
      lead?: Record<string, string>;
      channel?: "email" | "phone";
      due?: string;
      reason?: string;
      view?: number;
      mail?: {
        to_address: string;
        subject: string;
        body: string;
        attachment_ids: string[];
      };
    };
  };
};
export type WorkData = {
  session: WorkSession | null;
  company: Row | null;
  email: Row | null;
  followup: Row | null;
  lastEmail: Row | null;
  calls: Row[];
  history: Row[];
  activity: Row[];
  templates: Row[];
  documents: Row[];
  permissions: Row[];
  signature: string;
  queue: (Row & {
    company_id: string;
    label: string;
    rank: number;
    due_at: string | null;
  })[];
  stats: {
    leads: number;
    emails: number;
    calls: number;
    followups: number;
    tasks: number;
  };
  integrations: { smtp: boolean; phone: boolean };
};
