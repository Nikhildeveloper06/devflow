const { createTask, getTasksByColumn, getTasksByBoard, getTaskById, updateTask, deleteTask } = require('../models/taskModel');
const { getColumnById } = require('../models/columnModel');
const { getBoardById } = require('../models/boardModel');

const VALID_PRIORITIES = ['low', 'medium', 'high'];

// Helper: verifies the logged-in user owns the board that a given column belongs to
async function verifyColumnOwnership(columnId, userId) {
  const column = await getColumnById(columnId);
  if (!column) return null;

  const board = await getBoardById(column.board_id, userId);
  if (!board) return null;

  return column;
}

async function create(req, res) {
  try {
    const { columnId, title, description, priority, position } = req.body;
    const userId = req.user.userId;

    if (!columnId || !title || title.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'columnId and title are required' });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ success: false, error: 'priority must be low, medium, or high' });
    }

    const column = await verifyColumnOwnership(columnId, userId);
    if (!column) {
      return res.status(404).json({ success: false, error: 'Column not found' });
    }

    const task = await createTask(
      columnId,
      title.trim(),
      description || null,
      priority || 'medium',
      position || 0
    );
    res.status(201).json({ success: true, task });

  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong creating the task' });
  }
}

async function getAllForColumn(req, res) {
  try {
    const { columnId } = req.params;
    const userId = req.user.userId;

    const column = await verifyColumnOwnership(columnId, userId);
    if (!column) {
      return res.status(404).json({ success: false, error: 'Column not found' });
    }

    const tasks = await getTasksByColumn(columnId);
    res.json({ success: true, tasks });

  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong fetching tasks' });
  }
}

// Gets every task across every column on a board — one call to render the whole Kanban board
async function getAllForBoard(req, res) {
  try {
    const { boardId } = req.params;
    const userId = req.user.userId;

    const board = await getBoardById(boardId, userId);
    if (!board) {
      return res.status(404).json({ success: false, error: 'Board not found' });
    }

    const tasks = await getTasksByBoard(boardId);
    res.json({ success: true, tasks });

  } catch (err) {
    console.error('Get board tasks error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong fetching tasks' });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const { title, description, priority, position, columnId } = req.body;
    const userId = req.user.userId;

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ success: false, error: 'priority must be low, medium, or high' });
    }

    const task = await getTaskById(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Verify ownership via the task's current column/board
    const ownedColumn = await verifyColumnOwnership(task.column_id, userId);
    if (!ownedColumn) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // If moving to a different column (drag-and-drop across columns), verify that new column is also owned
    if (columnId && columnId !== task.column_id) {
      const targetColumn = await verifyColumnOwnership(columnId, userId);
      if (!targetColumn) {
        return res.status(404).json({ success: false, error: 'Target column not found' });
      }
    }

    const updated = await updateTask(id, { title, description, priority, position, columnId });
    res.json({ success: true, task: updated });

  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong updating the task' });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const task = await getTaskById(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const ownedColumn = await verifyColumnOwnership(task.column_id, userId);
    if (!ownedColumn) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    await deleteTask(id);
    res.json({ success: true, message: 'Task deleted' });

  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong deleting the task' });
  }
}

module.exports = { create, getAllForColumn, getAllForBoard, update, remove };
