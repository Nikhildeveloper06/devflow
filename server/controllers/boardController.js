const { createBoard, getBoardsByUser, getBoardById, deleteBoard } = require('../models/boardModel');

async function create(req, res) {
  try {
    const { name } = req.body;
    const ownerId = req.user.userId; // comes from JWT via requireAuth middleware

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Board name is required' });
    }

    const board = await createBoard(name.trim(), ownerId);
    res.status(201).json({ success: true, board });

  } catch (err) {
    console.error('Create board error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong creating the board' });
  }
}

async function getAll(req, res) {
  try {
    const ownerId = req.user.userId;
    const boards = await getBoardsByUser(ownerId);
    res.json({ success: true, boards });

  } catch (err) {
    console.error('Get boards error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong fetching boards' });
  }
}

async function getOne(req, res) {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;

    const board = await getBoardById(id, ownerId);
    if (!board) {
      return res.status(404).json({ success: false, error: 'Board not found' });
    }

    res.json({ success: true, board });

  } catch (err) {
    console.error('Get board error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong fetching the board' });
  }
}

async function remove(req, res) {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;

    const deleted = await deleteBoard(id, ownerId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Board not found' });
    }

    res.json({ success: true, message: 'Board deleted' });

  } catch (err) {
    console.error('Delete board error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong deleting the board' });
  }
}

module.exports = { create, getAll, getOne, remove };
