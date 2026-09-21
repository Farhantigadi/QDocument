import { randomUUID } from "node:crypto";

export type VaultUser = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
};

export type VaultDocument = {
  id: string;
  title: string;
  category: string;
  sourceType: "upload" | "link";
  tags: string[];
  notes: string;
  fileType: "pdf" | "png" | "jpg" | "webp" | null;
  sizeBytes: number | null;
  sourceUrl: string | null;
  uploadedAt: string;
  updatedAt: string;
  status: "active" | "deleted";
  thumbnailUrl: string | null;
};

export type VaultActivity = {
  id: string;
  action: "uploaded" | "viewed" | "updated" | "deleted" | "login";
  label: string;
  createdAt: string;
};

const now = new Date();
const iso = (minutesAgo: number) =>
  new Date(now.getTime() - minutesAgo * 60_000).toISOString();

export const demoUser: VaultUser = {
  id: "usr_haven_demo",
  name: "Alex Morgan",
  email: "alex@example.com",
  role: "ADMIN",
  status: "ACTIVE",
};

export const documents: VaultDocument[] = [
  {
    id: "doc_passport",
    title: "Passport scan",
    category: "Identity",
    sourceType: "upload",
    tags: ["travel", "identity"],
    notes: "Current passport scan. Keep private.",
    fileType: "pdf",
    sizeBytes: 2_400_000,
    sourceUrl: null,
    uploadedAt: iso(42),
    updatedAt: iso(42),
    status: "active",
    thumbnailUrl: null,
  },
  {
    id: "doc_insurance",
    title: "Health insurance policy",
    category: "Medical",
    sourceType: "upload",
    tags: ["insurance", "health"],
    notes: "Policy documents and member details.",
    fileType: "pdf",
    sizeBytes: 4_800_000,
    sourceUrl: null,
    uploadedAt: iso(1_440),
    updatedAt: iso(1_440),
    status: "active",
    thumbnailUrl: null,
  },
  {
    id: "doc_lease",
    title: "Apartment lease",
    category: "Contracts",
    sourceType: "upload",
    tags: ["home", "lease"],
    notes: "Signed lease agreement.",
    fileType: "pdf",
    sizeBytes: 1_200_000,
    sourceUrl: null,
    uploadedAt: iso(2_880),
    updatedAt: iso(2_880),
    status: "active",
    thumbnailUrl: null,
  },
  {
    id: "doc_transcript",
    title: "University transcript",
    category: "Academic",
    sourceType: "upload",
    tags: ["education"],
    notes: "Official transcript.",
    fileType: "png",
    sizeBytes: 980_000,
    sourceUrl: null,
    uploadedAt: iso(5_040),
    updatedAt: iso(5_040),
    status: "active",
    thumbnailUrl: null,
  },
];

export const activities: VaultActivity[] = [
  {
    id: "activity_1",
    action: "uploaded",
    label: "Passport scan added",
    createdAt: iso(42),
  },
  {
    id: "activity_2",
    action: "viewed",
    label: "Health insurance policy viewed",
    createdAt: iso(180),
  },
  {
    id: "activity_3",
    action: "updated",
    label: "Apartment lease details updated",
    createdAt: iso(1_020),
  },
  {
    id: "activity_4",
    action: "login",
    label: "Signed in from this browser",
    createdAt: iso(1_440),
  },
];

export function addActivity(
  action: VaultActivity["action"],
  label: string,
): VaultActivity {
  const activity: VaultActivity = {
    id: randomUUID(),
    action,
    label,
    createdAt: new Date().toISOString(),
  };
  activities.unshift(activity);
  return activity;
}

export function findDocument(id: string) {
  return documents.find((document) => document.id === id);
}

export function bytesUsed() {
  return documents
    .filter((document) => document.status === "active")
    .reduce((total, document) => total + (document.sizeBytes ?? 0), 0);
}