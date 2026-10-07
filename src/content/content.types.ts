import type { StationId } from '@/core/world/stations';

export type LinkCopy = Readonly<{ label: string; href: string }>;
export type FigureCopy = Readonly<{ value: string; caption: string }>;
type StationBase<Id extends StationId> = Readonly<{
  id: Id;
  label: string;
  tag: string;
  title: string;
}>;
export type BriefStationId =
  'llm-product' | 'marketplace-chat' | 'admin-app' | 'ai-engineering' | 'this-world';
export type HomeBaseCopy = StationBase<'home-base'> &
  Readonly<{
    role: string;
    lede: string;
    contactCta: string;
    cv: Readonly<{ label: string }>;
    linkedin: LinkCopy;
    stats: readonly FigureCopy[];
    chips: readonly string[];
  }>;
export type BriefCopy = StationBase<BriefStationId> &
  Readonly<{
    lede: string;
    items: readonly string[];
    chips: readonly string[];
    result: FigureCopy;
  }>;
export type SystemsCopy = StationBase<'systems'> &
  Readonly<{
    lede: string;
    groups: readonly Readonly<{
      title: string;
      years: string | null;
      items: readonly Readonly<{ name: string; years: string | null }>[];
    }>[];
  }>;
export type FlightLogCopy = StationBase<'flight-log'> &
  Readonly<{
    entries: readonly Readonly<{ years: string; role: string; summary: string }>[];
  }>;
export type ContactCopy = StationBase<'contact'> &
  Readonly<{
    lede: string;
    email: string;
    copy: Readonly<{ idle: string; done: string }>;
    linkedin: LinkCopy;
  }>;
export type StationsCopy = Readonly<{
  'home-base': HomeBaseCopy;
  'llm-product': BriefCopy;
  'marketplace-chat': BriefCopy;
  'admin-app': BriefCopy;
  'ai-engineering': BriefCopy;
  systems: SystemsCopy;
  'flight-log': FlightLogCopy;
  'this-world': BriefCopy;
  contact: ContactCopy;
}>;
export type WorldCopy = Readonly<{
  loader: {
    name: string;
    line: string;
    stages: { generating: string; engine: string; building: string; ready: string };
    progress: string;
    takeOff: string;
    textLink: string;
  };
  header: {
    brand: string;
    autopilot: string;
    map: string;
    toText: string;
    toWorld: string;
    soundOn: string;
    soundOff: string;
  };
  hud: {
    linked: string;
    barLabel: string;
    barCell: string;
    boost: string;
    hints: { keyboard: string; touch: string; dockedKeyboard: string; dockedTouch: string };
  };
  menus: { autopilotTitle: string; visited: string; mapLabel: string; mapCaption: string };
  panel: { takeOff: string; takeOffKey: string };
  titleCard: string;
  announceDocked: string;
  navLabel: string;
  notices: { noWebgl2: string; failed: string };
  slowPrompt: { text: string; action: string; dismiss: string };
  skyName: readonly string[];
}>;
export type ContactFormCopy = Readonly<{
  labels: { name: string; email: string; message: string; website: string };
  submit: string;
  sending: string;
  errors: {
    name: string;
    email: string;
    message: string;
    nameTooLong: string;
    emailTooLong: string;
    messageTooLong: string;
  };
  status: { invalid: string; sent: string; rateLimited: string; sendFailed: string };
}>;
export type SiteCopy = Readonly<{
  title: string;
  description: string;
  ogAlt: string;
  person: { name: string; jobTitle: string; sameAs: readonly string[] };
}>;
