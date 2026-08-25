import { redirect } from 'next/navigation';

export default function TasksPerformancePage() {
  redirect('/tasks?view=performance');
}
