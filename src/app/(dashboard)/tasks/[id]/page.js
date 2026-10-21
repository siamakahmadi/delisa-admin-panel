import { BoardView } from "@/components/tasks/board-view";

export default async function TaskBoardPage({ params }) {
  const { id } = await params;
  return <BoardView boardId={id} />;
}
