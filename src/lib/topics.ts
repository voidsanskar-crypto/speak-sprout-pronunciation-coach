export type TopicId = "travel" | "interview" | "smalltalk" | "sounds";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface Topic {
  id: TopicId;
  name: string;
  blurb: string;
  difficulty: Difficulty;
  gradientClass: string;
}

export const TOPICS: Topic[] = [
  {
    id: "travel",
    name: "Travel",
    blurb: "Airports, hotels & getting around",
    difficulty: "Beginner",
    gradientClass: "bg-gradient-travel",
  },
  {
    id: "smalltalk",
    name: "Small Talk",
    blurb: "Easy chats with new friends",
    difficulty: "Beginner",
    gradientClass: "bg-gradient-smalltalk",
  },
  {
    id: "interview",
    name: "Job Interviews",
    blurb: "Sound confident and clear",
    difficulty: "Intermediate",
    gradientClass: "bg-gradient-interview",
  },
  {
    id: "sounds",
    name: "Tricky Sounds",
    blurb: "TH · R/L · V/W",
    difficulty: "Advanced",
    gradientClass: "bg-gradient-sounds",
  },
];

export function getTopic(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}
