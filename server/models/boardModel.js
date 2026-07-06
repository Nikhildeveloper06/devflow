const pool = require('../config/db');

// Create a new board for a given user
async function createBoard(name, ownerId) {
  const result = await pool.query(
    `INSERT INTO boards (name, owner_id)
     VALUES ($1, $2)
     RETURNING id, name, owner_id, created_at`,
    [name, ownerId]
  );
  return result.rows[0];
}

// Get all boards belonging to a specific user
async function getBoardsByUser(ownerId) {
  const result = await pool.query(
    `SELECT id, name, owner_id, created_at
     FROM boards
     WHERE owner_id = $1
     ORDER BY created_at DESC`,
    [ownerId]
  );
  return result.rows;
}

// Get a single board by ID (also checks ownership)
async function getBoardById(boardId, ownerId) {
  const result = await pool.query(
    `SELECT id, name, owner_id, created_at
     FROM boards
     WHERE id = $1 AND owner_id = $2`,
    [boardId, ownerId]
  );
  return result.rows[0];
}

// Delete a board (also checks ownership, so you can't delete someone else's board)
async function deleteBoard(boardId, ownerId) {
  const result = await pool.query(
    `DELETE FROM boards
     WHERE id = $1 AND owner_id = $2
     RETURNING id`,
    [boardId, ownerId]
  );
  return result.rows[0];
}

module.exports = { createBoard, getBoardsByUser, getBoardById, deleteBoard };
