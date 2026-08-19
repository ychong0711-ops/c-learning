import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const learners = pgTable("learners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  goal: text("goal").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: serial("id").primaryKey(),
    learnerId: integer("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    completed: boolean("completed").notNull().default(false),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_progress_learner_lesson").on(t.learnerId, t.lessonId),
    index("ix_progress_learner").on(t.learnerId),
  ]
);

export const snippets = pgTable(
  "snippets",
  {
    id: serial("id").primaryKey(),
    learnerId: integer("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull(),
    stdin: text("stdin").notNull().default(""),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("ix_snippets_learner").on(t.learnerId)]
);

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: serial("id").primaryKey(),
    learnerId: integer("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    questionId: text("question_id").notNull(),
    selectedIndex: integer("selected_index").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("ix_attempts_learner").on(t.learnerId),
    index("ix_attempts_question").on(t.questionId),
  ]
);
