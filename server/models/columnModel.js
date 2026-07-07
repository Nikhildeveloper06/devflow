const pool = require('../config/db');

// Create a new column on a board
async function createColumn(boardId, name, position) {
  const result = await pool.query(
    `INSERT INTO columns (board_id, name, position)
     VALUES ($1, $2, $3)
     RETURNING id, board_id, name, position, created_at`,
    [boardId, name, position]
  );
  return result.rows[0];
}

// Get all columns for a board, ordered by position
async function getColumnsByBoard(boardId) {
  const result = await pool.query(
    `SELECT id, board_id, name, position, created_at
     FROM columns
     WHERE board_id = $1
     ORDER BY position ASC`,
    [boardId]
  );
  return result.rows;
}

// Get a single column by ID
async function getColumnById(columnId) {
  const result = await pool.query(
    `SELECT id, board_id, name, position, created_at
     FROM columns
     WHERE id = $1`,
    [columnId]
  );
  return result.rows[0];
}

// Update a column's name and/or position
async function updateColumn(columnId, name, position) {
  const result = await pool.query(
    `UPDATE columns
     SET name = COALESCE($2, name),
         position = COALESCE($3, position)
     WHERE id = $1
     RETURNING id, board_id, name, position, created_at`,
    [columnId, name, position]
  );
  return result.rows[0];
}

// Delete a column
async function deleteColumn(columnId) {
  const result = await pool.query(
    `DELETE FROM columns WHERE id = $1 RETURNING id`,
    [columnId]
  );
  return result.rows[0];
}

module.exports = { createColumn, getColumnsByBoard, getColumnById, updateColumn, deleteColumn };
