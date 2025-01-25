interface CreativeEntry {
  id: string;
  type: "text" | "image" | "drawing";
  content: string;
  timestamp: Date;
  tags?: string[];
  isPrivate: boolean;
}

interface CreativeSpace {
  entries: CreativeEntry[];
  currentDraft?: CreativeEntry;
  scratchpad: string;
}
