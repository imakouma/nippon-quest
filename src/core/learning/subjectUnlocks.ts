export const ROADMAP_SUBJECT_ORDER = ['kokugo', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo'] as const;

export interface RoadmapSubjectProgress {
  subject: string;
  grade: number;
  courseKind?: 'required-subject' | 'required-activity' | 'supplementary';
  state: 'cleared' | 'review' | 'current' | 'open' | 'locked';
}

const STARTING_SUBJECTS = new Set<string>(['kokugo', 'sansu', 'seikatsu']);
const FOUNDATION_GRADES = [1, 2] as const;

export const isCompletedRoadmapProgress = (node: RoadmapSubjectProgress) =>
  node.state === 'cleared' || node.state === 'review';

function completedThroughGradeTwo(nodes: readonly RoadmapSubjectProgress[], subject: string): boolean {
  return FOUNDATION_GRADES.every((grade) => {
    const required = nodes.filter(
      (node) => node.subject === subject && node.grade === grade && node.courseKind !== 'supplementary',
    );
    return required.length > 0 && required.every(isCompletedRoadmapProgress);
  });
}

/** 通常プレイで選べる教科。既存セーブを増やさず、現在の単元クリア状態から毎回導出する。 */
export function availableRoadmapSubjects(
  nodes: readonly RoadmapSubjectProgress[],
  developerMode = false,
): Set<string> {
  const presentSubjects = new Set(nodes.map((node) => node.subject));
  if (developerMode) {
    return new Set(ROADMAP_SUBJECT_ORDER.filter((subject) => presentSubjects.has(subject)));
  }

  const available = new Set(STARTING_SUBJECTS);
  if (completedThroughGradeTwo(nodes, 'seikatsu')) {
    available.add('rika');
    available.add('shakai');
  }
  if (completedThroughGradeTwo(nodes, 'kokugo') && completedThroughGradeTwo(nodes, 'sansu')) {
    available.add('eigo');
  }

  return new Set(
    ROADMAP_SUBJECT_ORDER.filter((subject) => presentSubjects.has(subject) && available.has(subject)),
  );
}
