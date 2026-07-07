import { useState, useEffect } from 'react';
import Modal from './Modal';

export default function TaskDetailModal({ task, isOpen, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setConfirmingDelete(false);
    }
  }, [task]);

  if (!task) return null;

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(task.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Details">
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block font-mono text-xs text-charcoal mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-charcoal/20 rounded-lg bg-white font-body text-ink focus:outline-none focus:ring-2 focus:ring-rust"
          />
        </div>

        <div>
          <label className="block font-mono text-xs text-charcoal mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-charcoal/20 rounded-lg bg-white font-body text-ink focus:outline-none focus:ring-2 focus:ring-rust resize-none"
            placeholder="Add more detail..."
          />
        </div>

        <div>
          <label className="block font-mono text-xs text-charcoal mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 border border-charcoal/20 rounded-lg bg-white font-body text-ink focus:outline-none focus:ring-2 focus:ring-rust"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-rust text-paper rounded-lg font-body font-medium hover:bg-rust-dark transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        <div className="pt-3 border-t border-charcoal/10">
          {!confirmingDelete ? (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="w-full py-2 font-body text-sm text-rust-dark hover:text-rust"
            >
              Delete task
            </button>
          ) : (
            <div className="text-center">
              <p className="font-body text-sm text-charcoal mb-2">Delete this task permanently?</p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-1.5 bg-rust-dark text-paper rounded-lg font-body text-sm disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Yes, delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="px-4 py-1.5 font-body text-sm text-charcoal hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
