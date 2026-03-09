export type PartType = "PART_1" | "PART_2" | "PART_3" | "PART_4" | "PART_5" | "PART_6" | "PART_7";
export type Skill = "listening" | "reading" | "full";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type TestStatus = "active" | "draft" | "archived";

export interface TestOption {
  label: "A" | "B" | "C" | "D";
  content: string;
}

export interface TestQuestion {
  id: string;
  content: string;
  audioUrl: string | null;
  imageUrl: string | null;
  passage: string | null;
  correctAnswer: "A" | "B" | "C" | "D";
  options: TestOption[];
}

export interface TestPart {
  id: string;
  type: PartType;
  questions: TestQuestion[];
}

export interface TestData {
  name: string;
  skill: Skill;
  level: Difficulty;
  duration: number;
  status: TestStatus;
  parts: TestPart[];
}

export const PART_LABELS: Record<PartType, { label: string; description: string; skill: "listening" | "reading" }> = {
  PART_1: { label: "Part 1", description: "Photographs", skill: "listening" },
  PART_2: { label: "Part 2", description: "Question-Response", skill: "listening" },
  PART_3: { label: "Part 3", description: "Conversations", skill: "listening" },
  PART_4: { label: "Part 4", description: "Talks", skill: "listening" },
  PART_5: { label: "Part 5", description: "Incomplete Sentences", skill: "reading" },
  PART_6: { label: "Part 6", description: "Text Completion", skill: "reading" },
  PART_7: { label: "Part 7", description: "Reading Comprehension", skill: "reading" },
};

export const READING_PARTS: PartType[] = ["PART_5", "PART_6", "PART_7"];
export const LISTENING_PARTS: PartType[] = ["PART_1", "PART_2", "PART_3", "PART_4"];

export const AI_QUESTION_COUNTS: Partial<Record<PartType, number>> = {
  PART_5: 30,
  PART_6: 16,
  PART_7: 54,
};

export function createEmptyQuestion(): TestQuestion {
  return {
    id: crypto.randomUUID(),
    content: "",
    audioUrl: null,
    imageUrl: null,
    passage: null,
    correctAnswer: "A",
    options: [
      { label: "A", content: "" },
      { label: "B", content: "" },
      { label: "C", content: "" },
      { label: "D", content: "" },
    ],
  };
}

export function createEmptyPart(type: PartType): TestPart {
  return {
    id: crypto.randomUUID(),
    type,
    questions: [],
  };
}

export function getDefaultParts(skill: Skill): TestPart[] {
  if (skill === "listening") return LISTENING_PARTS.map(createEmptyPart);
  if (skill === "reading") return READING_PARTS.map(createEmptyPart);
  return [...LISTENING_PARTS, ...READING_PARTS].map(createEmptyPart);
}
