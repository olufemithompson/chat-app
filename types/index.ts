export interface Contact {
  /** Other participant user id (for typing / presence) */
  id?: string;
  name: string;
  avatar: string;
  email: string;
  online: boolean;
}

export interface Message {
  id: number;
  text: string;
  sender: "me" | "them";
  time: string;
}

export interface Conversation {
  id: number;
  name: string;
  avatar: string;
  preview: string;
  time: string;
  unread?: boolean;
  read?: boolean;
}

export type FileType = "pdf" | "fig" | "ai" | "doc" | "zip";

export type ContactTab = "Media" | "Link" | "Docs";
