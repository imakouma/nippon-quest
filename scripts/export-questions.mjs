import { writeFileSync, mkdirSync } from "fs";
import { ALL_UNITS } from "../curriculum";
import { getQuestionsByUnit } from "./index";

mkdirSync("public/data/questions", { recursive: true });

for (const unit of ALL_UNITS) {
  const questions = getQuestionsByUnit(unit.id);
  const path = `public/data/questions/${unit.id}.json`;
  writeFileSync(path, JSON.stringify({ questions }, null, 2));
  console.log(`${path}: ${questions.length} questions`);
}

console.log("Done.");
