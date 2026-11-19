import type { TopicId } from "./topics";

export const LEARNING_GOALS=["Travel","Work & interviews","Everyday conversations","Clear pronunciation"] as const;
export type LearningGoal=(typeof LEARNING_GOALS)[number];
const KEY="speakup:learning-goals:v1";
export function loadLearningGoals():LearningGoal[]{
 if(typeof window==="undefined")return [];
 try{return (JSON.parse(localStorage.getItem(KEY)??"[]") as string[]).filter((x):x is LearningGoal=>LEARNING_GOALS.includes(x as LearningGoal))}catch{return []}
}
export function saveLearningGoals(goals:LearningGoal[]){try{localStorage.setItem(KEY,JSON.stringify([...new Set(goals)]))}catch{/* local preferences are optional */}}
export function topicsForGoals(goals:LearningGoal[]):TopicId[]{
 const topics:TopicId[]=[];
 if(goals.includes("Travel"))topics.push("travel");
 if(goals.includes("Work & interviews"))topics.push("interview");
 if(goals.includes("Everyday conversations"))topics.push("smalltalk");
 if(goals.includes("Clear pronunciation"))topics.push("sounds");
 return topics;
}
