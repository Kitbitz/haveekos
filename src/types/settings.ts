export interface GCashSettings {
  primary: string;
  secondary: string;
  primaryLabel: string;
  secondaryLabel: string;
  updatedAt?: number;
}

export interface AnnouncementSettings {
  content: string;
  isEnabled: boolean;
  updatedAt?: number;
}

export type Settings = {
  gcash: GCashSettings;
  announcement: AnnouncementSettings;
}