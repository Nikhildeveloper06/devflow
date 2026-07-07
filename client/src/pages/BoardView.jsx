import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../services/api';
import Modal from '../components/Modal';
import TaskDetailModal from '../components/TaskDetailModal';

const priorityStyles = {
  high: 'bg-rust/10 text-rust-dark border-rust/30',
  medium: 'bg-charcoal/10 text-charcoal border-charcoal/20',
  low: 'bg-charcoal/5 text-charcoal/60 border-charcoal/10',
};

function TaskCard({ task, isOverlay, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.4 : 1,
  };

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={isOverlay ? undefined : style}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      onClick={isOverlay ? undefined : () => onClick(task)}
      className={`bg-white p-3 rounded-lg border border-charcoal/10 hover:border-charcoal/20 transition-colors cursor-grab active:cursor-grabbing ${isOverlay ? 'shadow-lg rotate-2' : ''}`}
    >
      <p className="font-body text-sm text-ink mb-2">{task.title}</p>
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-mono border ${priorityStyles[task.priority]}`}>
        {task.priority}
      </span>
    </div>
  );
}

function Column({ column, tasks, onAddTask, onTaskClick, onDeleteColumn }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: 'column', columnId: column.id },
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="w-72 flex-shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="font-body font-semibold text-ink text-sm">{column.name}</h2>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-charcoal/50">{tasks.length}</span>
          {!confirmingDelete ? (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="text-charcoal/40 hover:text-rust-dark transition-colors font-body text-sm leading-none px-1"
              title="Delete column"
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      {confirmingDelete && (
        <div className="mb-2 p-2 bg-rust/5 border border-rust/20 rounded-lg">
          <p className="font-body text-xs text-charcoal mb-2">Delete "{column.name}" and all its tasks?</p>
          <div className="flex gap-2">
            <button
              onClick={() => onDeleteColumn(column.id)}
              className="px-2 py-1 bg-rust-dark text-paper rounded font-body text-xs"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="px-2 py-1 font-body text-xs text-charcoal"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`space-y-2 min-h-[80px] rounded-lg transition-colors ${isOver ? 'bg-rust/5 ring-2 ring-rust/30' : ''}`}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-6 border border-dashed border-charcoal/15 rounded-lg">
              <p className="font-body text-xs text-charcoal/40">Drop here</p>
            </div>
          )}
        </div>
      </SortableContext>

      <button
        onClick={() => onAddTask(column.id)}
        className="w-full mt-2 py-2 text-left px-2 font-body text-sm text-charcoal/60 hover:text-rust hover:bg-white rounded-lg transition-colors"
      >
        + Add task
      </button>
    </div>
  );
}

export default function BoardView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTask, setActiveTask] = useState(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskModalColumnId, setTaskModalColumnId] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [savingTask, setSavingTask] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [addingColumn, setAddingColumn] = useState(false);
  const [columnName, setColumnName] = useState('');
  const [savingColumn, setSavingColumn] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  useEffect(() => {
    fetchBoardData();
  }, [id]);

  async function fetchBoardData() {
    setLoading(true);
    setError('');
    try {
      const [boardRes, columnsRes, tasksRes] = await Promise.all([
        api.get(`/boards/${id}`),
        api.get(`/columns/board/${id}`),
        api.get(`/tasks/board/${id}`),
      ]);
      setBoard(boardRes.data.board);
      setColumns(columnsRes.data.columns);
      setTasks(tasksRes.data.tasks);
    } catch (err) {
      setError('Failed to load board. It may not exist or you may not have access.');
    } finally {
      setLoading(false);
    }
  }

  function tasksForColumn(columnId) {
    return tasks
      .filter((t) => t.column_id === columnId)
      .sort((a, b) => a.position - b.position);
  }

  function handleDragStart(event) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeTaskId = active.id;
    const activeTaskObj = tasks.find((t) => t.id === activeTaskId);
    if (!activeTaskObj) return;
    const activeColumnId = activeTaskObj.column_id;

    let overColumnId = null;
    if (over.data.current?.type === 'task') {
      overColumnId = over.data.current.task.column_id;
    } else if (over.data.current?.type === 'column') {
      overColumnId = over.data.current.columnId;
    }
    if (!overColumnId) return;

    if (activeColumnId === overColumnId) {
      const columnTasks = tasksForColumn(activeColumnId);
      const oldIndex = columnTasks.findIndex((t) => t.id === activeTaskId);
      const newIndex = columnTasks.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reordered = arrayMove(columnTasks, oldIndex, newIndex).map((t, index) => ({
        ...t,
        position: index,
      }));

      setTasks((prev) => [
        ...prev.filter((t) => t.column_id !== activeColumnId),
        ...reordered,
      ]);

      const movedTask = reordered.find((t) => t.id === activeTaskId);
      try {
        await api.patch(`/tasks/${activeTaskId}`, { position: movedTask.position });
      } catch (err) {
        setError('Failed to save new order');
        fetchBoardData();
      }
    } else {
      const destTasks = tasksForColumn(overColumnId);
      const newPosition = destTasks.length;

      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeTaskId ? { ...t, column_id: overColumnId, position: newPosition } : t
        )
      );

      try {
        await api.patch(`/tasks/${activeTaskId}`, {
          columnId: overColumnId,
          position: newPosition,
        });
      } catch (err) {
        setError('Failed to move task');
        fetchBoardData();
      }
    }
  }

  function openTaskModal(columnId) {
    setTaskModalColumnId(columnId);
    setTaskTitle('');
    setTaskDescription('');
    setTaskPriority('medium');
    setTaskModalOpen(true);
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setSavingTask(true);
    try {
      const position = tasksForColumn(taskModalColumnId).length;
      const response = await api.post('/tasks', {
        columnId: taskModalColumnId,
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        priority: taskPriority,
        position,
      });
      setTasks([...tasks, response.data.task]);
      setTaskModalOpen(false);
    } catch (err) {
      setError('Failed to create task');
    } finally {
      setSavingTask(false);
    }
  }

  function handleTaskClick(task) {
    setSelectedTask(task);
    setDetailModalOpen(true);
  }

  async function handleSaveTask(taskId, updates) {
    const response = await api.patch(`/tasks/${taskId}`, updates);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? response.data.task : t)));
  }

  async function handleDeleteTask(taskId) {
    await api.delete(`/tasks/${taskId}`);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  async function handleDeleteColumn(columnId) {
    try {
      await api.delete(`/columns/${columnId}`);
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      setTasks((prev) => prev.filter((t) => t.column_id !== columnId));
    } catch (err) {
      setError('Failed to delete column');
    }
  }

  async function handleCreateColumn(e) {
    e.preventDefault();
    if (!columnName.trim()) return;

    setSavingColumn(true);
    try {
      const position = columns.length;
      const response = await api.post('/columns', {
        boardId: id,
        name: columnName.trim(),
        position,
      });
      setColumns([...columns, response.data.column]);
      setColumnName('');
      setAddingColumn(false);
    } catch (err) {
      setError('Failed to create column');
    } finally {
      setSavingColumn(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <p className="font-mono text-charcoal">Loading board...</p>
      </div>
    );
  }

  if (error && !board) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-paper gap-4">
        <p className="font-body text-rust-dark">{error}</p>
        <button onClick={() => navigate('/boards')} className="font-body text-sm text-rust hover:underline">
          ← Back to boards
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-charcoal/10 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/boards')} className="font-body text-sm text-charcoal hover:text-rust">
          ← Boards
        </button>
        <h1 className="font-display text-xl text-ink">{board?.name}</h1>
      </header>

      <main className="p-6 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-w-max items-start">
            {columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                tasks={tasksForColumn(column.id)}
                onAddTask={openTaskModal}
                onTaskClick={handleTaskClick}
                onDeleteColumn={handleDeleteColumn}
              />
            ))}

            <div className="w-72 flex-shrink-0">
              {addingColumn ? (
                <form onSubmit={handleCreateColumn} className="bg-white p-3 rounded-lg border border-charcoal/10">
                  <input
                    type="text"
                    value={columnName}
                    onChange={(e) => setColumnName(e.target.value)}
                    placeholder="Column name"
                    autoFocus
                    className="w-full px-2 py-1.5 border border-charcoal/20 rounded-md bg-white font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={savingColumn}
                      className="px-3 py-1.5 bg-rust text-paper rounded-md font-body text-xs font-medium disabled:opacity-50"
                    >
                      {savingColumn ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingColumn(false)}
                      className="px-3 py-1.5 font-body text-xs text-charcoal hover:text-ink"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setAddingColumn(true)}
                  className="w-full py-2.5 text-left px-3 font-body text-sm text-charcoal/60 hover:text-rust border border-dashed border-charcoal/20 rounded-lg hover:border-rust transition-colors"
                >
                  + Add column
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </main>

      <Modal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} title="Add Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block font-mono text-xs text-charcoal mb-1">Title</label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2 border border-charcoal/20 rounded-lg bg-white font-body text-ink focus:outline-none focus:ring-2 focus:ring-rust"
              placeholder="Task title"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-charcoal mb-1">Description (optional)</label>
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-charcoal/20 rounded-lg bg-white font-body text-ink focus:outline-none focus:ring-2 focus:ring-rust resize-none"
              placeholder="Add more detail..."
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-charcoal mb-1">Priority</label>
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
              className="w-full px-3 py-2 border border-charcoal/20 rounded-lg bg-white font-body text-ink focus:outline-none focus:ring-2 focus:ring-rust"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={savingTask}
            className="w-full py-2.5 bg-rust text-paper rounded-lg font-body font-medium hover:bg-rust-dark transition-colors disabled:opacity-50"
          >
            {savingTask ? 'Adding...' : 'Add Task'}
          </button>
        </form>
      </Modal>

      <TaskDetailModal
        task={selectedTask}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
