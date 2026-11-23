export type TrackId =
  'foundations' | 'architecture' | 'performance' | 'craft' | 'production' | 'micro-frontends';

export interface Track {
  id: TrackId;
  title: string;
  blurb: string;
  order: number;
  colorVar: `--track-${TrackId}`;
}

export interface ModuleMeta {
  slug: string;
  number: number;
  title: string;
  track: TrackId;
  oneIdea: string;
  minutes: number;
  phase: 0 | 1 | 2 | 3 | 4;
}

export interface LabSpec {
  id: string;
  title: string;
  tryThis: string[];
  whatHappened: string;
}

export interface Pitfall {
  title: string;
  symptom: string;
  cause: string;
  fix: string;
  bad?: string;
  good?: string;
}

export interface MeetingCard {
  say: string[];
  ask: string[];
  redFlags: string[];
  tradeoff: string;
}

export interface ModuleContent extends ModuleMeta {
  outcomes: string[];
  sections: { heading: string; paragraphs: string[] }[];
  labs: LabSpec[];
  pitfalls: Pitfall[];
  meeting: MeetingCard;
  selfCheck: { question: string; answer: string }[];
  links: { label: string; url: string }[];
  glossary: { term: string; definition: string }[];
}

export type LabComponents = Record<string, import('react').ComponentType>;

export interface ModuleEntry {
  content: ModuleContent;
  loadLabs: () => Promise<{ labs: LabComponents }>;
}
