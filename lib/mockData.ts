import { Task, ProgressLog } from "@/types";

export const mockTasks: Task[] = [
  { id: "1", topic_id: "t1", topic_name: "Python Basics", title: "Variables, data types & operators", duration_minutes: 45, type: "learning", is_complete: false, scheduled_date: new Date().toISOString().split("T")[0] },
  { id: "2", topic_id: "t1", topic_name: "Python Basics", title: "Control flow: if/else & loops", duration_minutes: 30, type: "learning", is_complete: false, scheduled_date: new Date().toISOString().split("T")[0] },
  { id: "3", topic_id: "t2", topic_name: "Functions", title: "Defining and calling functions", duration_minutes: 45, type: "learning", is_complete: false, scheduled_date: new Date().toISOString().split("T")[0] },
];

export const mockWeeklyProgress: ProgressLog[] = [
  { date: "Mon", tasks_planned: 3, tasks_completed: 3, minutes_planned: 90, minutes_spent: 85, streak_count: 1 },
  { date: "Tue", tasks_planned: 3, tasks_completed: 2, minutes_planned: 90, minutes_spent: 60, streak_count: 2 },
  { date: "Wed", tasks_planned: 2, tasks_completed: 2, minutes_planned: 60, minutes_spent: 55, streak_count: 3 },
  { date: "Thu", tasks_planned: 3, tasks_completed: 1, minutes_planned: 90, minutes_spent: 30, streak_count: 3 },
  { date: "Fri", tasks_planned: 3, tasks_completed: 3, minutes_planned: 90, minutes_spent: 90, streak_count: 4 },
  { date: "Sat", tasks_planned: 2, tasks_completed: 2, minutes_planned: 60, minutes_spent: 65, streak_count: 5 },
  { date: "Today", tasks_planned: 3, tasks_completed: 0, minutes_planned: 90, minutes_spent: 0, streak_count: 5 },
];

export const mockRoadmapWeeks = [
  {
    week: 1,
    label: "Week 1",
    topics: [
      { id: "t1", name: "Python Basics", estimated_minutes: 180, difficulty: 2, completed: true },
      { id: "t2", name: "Functions & Scope", estimated_minutes: 120, difficulty: 2, completed: true },
    ],
  },
  {
    week: 2,
    label: "Week 2",
    topics: [
      { id: "t3", name: "Lists & Dictionaries", estimated_minutes: 150, difficulty: 3, completed: false },
      { id: "t4", name: "File I/O", estimated_minutes: 90, difficulty: 2, completed: false },
    ],
  },
  {
    week: 3,
    label: "Week 3",
    topics: [
      { id: "t5", name: "OOP Fundamentals", estimated_minutes: 180, difficulty: 4, completed: false },
      { id: "t6", name: "Error Handling", estimated_minutes: 90, difficulty: 3, completed: false },
    ],
  },
  {
    week: 4,
    label: "Week 4",
    topics: [
      { id: "t7", name: "Modules & Packages", estimated_minutes: 120, difficulty: 3, completed: false },
      { id: "t8", name: "Final Project", estimated_minutes: 240, difficulty: 4, completed: false },
    ],
  },
];
