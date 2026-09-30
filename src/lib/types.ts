export type Role = "super_admin" | "club_admin" | "coach" | "staff" | "player";

export type Locale = "fr" | "en";

export interface User {
  id: string;
  email: string;
  password?: string;
  passwordHash?: string;
  name: string;
  role: Role;
  clubId: string | null;
  playerId?: string;
  avatar: string;
  status: "active" | "invited" | "suspended";
  lastLogin: string;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  league: "Elite One" | "Elite Two";
  city: string;
  country: string;
  founded: number;
  stadium: string;
  colors: [string, string];
  logoLetter: string;
}

export interface PlayerStats {
  matches: number;
  goals: number;
  assists: number;
  minutes: number;
  yellow: number;
  red: number;
  passPct: number;
  duelsWon: number;
  distanceKm: number;
  sprintTop: number;
}

export interface CareerStop {
  season: string;
  club: string;
  matches: number;
  goals: number;
}

export interface Player {
  id: string;
  clubId: string;
  name: string;
  position: "GB" | "DC" | "DG" | "DD" | "MDC" | "MC" | "MOC" | "AG" | "AD" | "BU";
  number: number;
  age: number;
  nationality: string;
  height: number;
  weight: number;
  foot: "Droit" | "Gauche" | "Ambidextre";
  marketValue: number;
  fatigue: number;
  form: number;
  contractEnd: string;
  salary: number;
  photo: string;
  stats: PlayerStats;
  career: CareerStop[];
  listed: boolean;
}

export interface Contract {
  id: string;
  playerId: string;
  clubId: string;
  start: string;
  end: string;
  salary: number;
  bonus: number;
  releaseClause: number;
  status: "active" | "expiring" | "renewal" | "terminated";
  clauses: string[];
}

export interface Match {
  id: string;
  clubId: string;
  opponent: string;
  competition: string;
  date: string;
  venue: "Domicile" | "Extérieur";
  scoreHome: number | null;
  scoreAway: number | null;
  analyzed: boolean;
  formation: string;
}

export interface VideoClip {
  id: string;
  matchId: string;
  clubId?: string;
  title: string;
  minute: number;
  type: "highlight" | "tactical" | "individual";
  playerId?: string;
  notes: string;
}

export interface MedicalRecord {
  id: string;
  playerId: string;
  date: string;
  type: "visite" | "blessure" | "recup" | "prevention";
  diagnosis: string;
  protocol: string;
  status: "ouvert" | "en_cours" | "clos";
  injuryRisk: number;
}

export interface LoadEntry {
  id: string;
  playerId: string;
  date: string;
  session: string;
  acute: number;
  chronic: number;
  gpsKm: number;
  sprints: number;
  topSpeed: number;
}

export interface CalendarEvent {
  id: string;
  clubId: string;
  title: string;
  type: "match" | "entrainement" | "medical" | "reunion" | "deplacement";
  start: string;
  end: string;
  location: string;
  team: string;
  notes: string;
  googleSynced: boolean;
}

export interface Channel {
  id: string;
  clubId: string;
  name: string;
  kind: "group" | "announce" | "dm";
  members: string[];
}

export interface Message {
  id: string;
  channelId: string;
  fromId: string;
  content: string;
  at: string;
  ephemeral?: boolean;
}

export interface StatusUpdate {
  id: string;
  userId: string;
  text: string;
  at: string;
  expiresAt: string;
}

export interface ScoutReport {
  id: string;
  clubId: string;
  targetName: string;
  club: string;
  country: string;
  position: string;
  age: number;
  rating: number;
  marketValue: number;
  notes: string;
  scout: string;
  date: string;
  status: "watch" | "recommend" | "contacted" | "signed";
}

export interface TransferDeal {
  id: string;
  clubId: string;
  playerName: string;
  fromClub: string;
  toClub: string;
  value: number;
  status: "veille" | "negociation" | "offre" | "accord" | "clos";
  aiNote: string;
  updated: string;
}

export interface Task {
  id: string;
  clubId: string;
  title: string;
  assignee: string;
  role: string;
  urgent: boolean;
  status: "open" | "doing" | "done";
  due: string;
}

export interface Alert {
  id: string;
  clubId: string;
  type: "fatigue" | "contrat" | "blessure" | "tache" | "rapport";
  severity: "info" | "warn" | "critical";
  title: string;
  body: string;
  at: string;
  read: boolean;
  playerId?: string;
}

export interface AgentLog {
  id: string;
  agentId: string;
  action: string;
  at: string;
  level: "info" | "success" | "warn";
}

export interface AiAgent {
  id: string;
  name: string;
  tag: string;
  description: string;
  status: "online" | "busy" | "idle";
  lastAction: string;
}

export interface TacticalBriefing {
  id: string;
  clubId: string;
  matchId: string;
  title: string;
  formation: string;
  content: string;
  createdAt: string;
}

export interface DesignProposal {
  id: string;
  clubId: string;
  title: string;
  summary: string;
  applied: boolean;
  createdAt: string;
}

export interface MonthlyReport {
  id: string;
  clubId: string;
  month: string;
  kpis: { label: string; value: string }[];
  narrative: string;
  sent: boolean;
}

export interface AuditEntry {
  id: string;
  at: string;
  user: string;
  action: string;
  entity: string;
  clubId?: string | null;
}

export interface Subscription {
  clubId: string;
  plan: "starter" | "elite" | "continent";
  status: "trial" | "active" | "past_due";
  renews: string;
  seats: number;
}

export interface AppState {
  users: User[];
  clubs: Club[];
  players: Player[];
  contracts: Contract[];
  matches: Match[];
  videos: VideoClip[];
  medical: MedicalRecord[];
  loads: LoadEntry[];
  events: CalendarEvent[];
  channels: Channel[];
  messages: Message[];
  statuses: StatusUpdate[];
  scouts: ScoutReport[];
  transfers: TransferDeal[];
  tasks: Task[];
  alerts: Alert[];
  agents: AiAgent[];
  agentLogs: AgentLog[];
  briefings: TacticalBriefing[];
  designs: DesignProposal[];
  reports: MonthlyReport[];
  audit: AuditEntry[];
  subscriptions: Subscription[];
}

export interface IntegrationsStatus {
  ai: {
    mode: "chatbotai" | "openai" | "anthropic" | "deepseek" | "local";
    label: string;
    fallback?: boolean;
    connected?: boolean;
  };
  chatbot?: { enabled: boolean; label: string; widget: boolean; embed: boolean };
  stripe: { mode: "stripe" | "local"; label: string };
  google: { mode: "oauth" | "local"; label: string };
  calendar: { mode: "google" | "local"; label: string };
  email: { mode: "resend" | "smtp" | "outbox"; label: string };
  vision: { mode: "yolo" | "local"; label: string };
}

export const POSITIONS: Player["position"][] = [
  "GB", "DC", "DG", "DD", "MDC", "MC", "MOC", "AG", "AD", "BU",
];
