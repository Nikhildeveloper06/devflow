const { createColumn, getColumnsByBoard, getColumnById, updateColumn, deleteColumn } = require('../models/columnModel');
const { getBoardById } = require('../models/boardModel');

// Helper: confirms the logged-in user actually owns the board a column belongs to
async function verifyBoardOwnership(boardId, userId) {
  const board = await getBoardById(boardId, userId);
  return board; // will be undefined if the board doesn't exist OR isn't owned by this user
}

async function create(req, res) {
  try {
    const { boardId, name, position } = req.body;
    const userId = req.user.userId;

    if (!boardId || !name || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'boardId and name are required' });
    }

    const board = await verifyBoardOwnership(boardId, userId);
    if (!board) {
      return res.status(404).json({ success: false, error: 'Board not found' });
    }

    const column = await createColumn(boardId, name.trim(), position || 0);
    res.status(201).json({ success: true, column });

  } catch (err) {
    console.error('Create column error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong creating the column' });
  }
}

async function getAll(req, res) {
  try {
    const { boardId } = req.params;
    const userId = req.user.userId;

    const board = await verifyBoardOwnership(boardId, userId);
    if (!board) {
      return res.status(404).json({ success: false, error: 'Board not found' });
    }

    const columns = await getColumnsByBoard(boardId);
    res.json({ success: true, columns });

  } catch (err) {
    console.error('Get columns error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong fetching columns' });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const { name, position } = req.body;
    const userId = req.user.userId;

    const column = await getColumnById(id);
    if (!column) {
      return res.status(404).json({ success: false, error: 'Column not found' });
    }

    // Verify the user owns the board this column belongs to
    const board = await verifyBoardOwnership(column.board_id, userId);
    if (!board) {
      return res.status(404).json({ success: false, error: 'Column not found' });
    }

    const updated = await updateColumn(id, name, position);
    res.json({ success: true, column: updated });

  } catch (err) {
    console.error('Update column error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong updating the column' });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const column = await getColumnById(id);
    if (!column) {
      return res.status(404).json({ success: false, error: 'Column not found' });
    }

    const board = await verifyBoardOwnership(column.board_id, userId);
    if (!board) {
      return res.status(404).json({ success: false, error: 'Column not found' });
    }

    await deleteColumn(id);
    res.json({ success: true, message: 'Column deleted' });

  } catch (err) {
    console.error('Delete column error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong deleting the column' });
  }
}

module.exports = { create, getAll, update, remove };
