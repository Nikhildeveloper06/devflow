const pool = require('../config/db');

// Create a new task in a column
async function createTask(columnId, title, description, priority, position) {
  const result = await pool.query(
    `INSERT INTO tasks (column_id, title, description, priority, position)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, column_id, title, description, priority, position, created_at`,
    [columnId, title, description, priority, position]
  );
  return result.rows[0];
}

// Get all tasks for a column, ordered by position
async function getTasksByColumn(columnId) {
  const result = await pool.query(
    `SELECT id, column_id, title, description, priority, position, created_at
     FROM tasks
     WHERE column_id = $1
     ORDER BY position ASC`,
    [columnId]
  );
  return result.rows;
}

// Get all tasks for an entire board (joins through columns) — useful for loading a full board view in one call
async function getTasksByBoard(boardId) {
  const result = await pool.query(
    `SELECT tasks.id, tasks.column_id, tasks.title, tasks.description,
            tasks.priority, tasks.position, tasks.created_at
     FROM tasks
     JOIN columns ON tasks.column_id = columns.id
     WHERE columns.board_id = $1
     ORDER BY tasks.position ASC`,
    [boardId]
  );
  return result.rows;
}

// Get a single task by ID
async function getTaskById(taskId) {
  const result = await pool.query(
    `SELECT id, column_id, title, description, priority, position, created_at
     FROM tasks
     WHERE id = $1`,
    [taskId]
  );
  return result.rows[0];
}

// Update a task (title, description, priority, position, or move to a different column)
async function updateTask(taskId, fields) {
  const { title, description, priority, position, columnId } = fields;
  const result = await pool.query(
    `UPDATE tasks
     SET title = COALESCE($2, title),
         description = COALESCE($3, description),
         priority = COALESCE($4, priority),
         position = COALESCE($5, position),
         column_id = COALESCE($6, column_id)
     WHERE id = $1
     RETURNING id, column_id, title, description, priority, position, created_at`,
    [taskId, title, description, priority, position, columnId]
  );
  return result.rows[0];
}

// Delete a task
async function deleteTask(taskId) {
  const result = await pool.query(
    `DELETE FROM tasks WHERE id = $1 RETURNING id`,
    [taskId]
  );
  return result.rows[0];
}

module.exports = { createTask, getTasksByColumn, getTasksByBoard, getTaskById, updateTask, deleteTask };
