export type PartType = "PART_1" | "PART_2" | "PART_3" | "PART_4" | "PART_5" | "PART_6" | "PART_7";
export type Skill = "LISTENING" | "READING" | "FULL";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
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
  audioUrl: string | null;
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

export const PART_LABELS: Record<PartType, { labelKey: string; descriptionKey: string; skill: "listening" | "reading" }> = {
  PART_1: { labelKey: "part1", descriptionKey: "photographs", skill: "listening" },
  PART_2: { labelKey: "part2", descriptionKey: "questionResponse", skill: "listening" },
  PART_3: { labelKey: "part3", descriptionKey: "conversations", skill: "listening" },
  PART_4: { labelKey: "part4", descriptionKey: "talks", skill: "listening" },
  PART_5: { labelKey: "part5", descriptionKey: "incompleteSentences", skill: "reading" },
  PART_6: { labelKey: "part6", descriptionKey: "textCompletion", skill: "reading" },
  PART_7: { labelKey: "part7", descriptionKey: "readingComprehension", skill: "reading" },
};

export const READING_PARTS: PartType[] = ["PART_5", "PART_6", "PART_7"];
export const LISTENING_PARTS: PartType[] = ["PART_1", "PART_2", "PART_3", "PART_4"];

export const AI_QUESTION_COUNTS: Partial<Record<PartType, number>> = {
  PART_5: 30,
  PART_6: 16,
  PART_7: 54,
};

export function createEmptyQuestion(partType?: PartType): TestQuestion {
  const isPart2 = partType === "PART_2";
  const labels: ("A" | "B" | "C" | "D")[] = isPart2 ? ["A", "B", "C"] : ["A", "B", "C", "D"];
  
  return {
    id: crypto.randomUUID(),
    content: "",
    audioUrl: null,
    imageUrl: null,
    passage: null,
    correctAnswer: "A",
    options: labels.map(label => ({ label, content: "" })),
  };
}

export function createEmptyPart(type: PartType): TestPart {
  return {
    id: crypto.randomUUID(),
    type,
    audioUrl: null,
    questions: [],
  };
}

export function getDefaultParts(skill: Skill): TestPart[] {
  if (skill === "LISTENING") return LISTENING_PARTS.map(createEmptyPart);
  if (skill === "READING") return READING_PARTS.map(createEmptyPart);
  return [...LISTENING_PARTS, ...READING_PARTS].map(createEmptyPart);
}
