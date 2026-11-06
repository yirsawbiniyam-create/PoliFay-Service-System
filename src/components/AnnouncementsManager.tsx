import React, { useState } from 'react';
import { Megaphone, Plus, Trash2, Edit2, Sparkles, AlertCircle, Radio } from 'lucide-react';
import { Announcement } from '../types';
import {
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../services/dbService';

interface AnnouncementsManagerProps {
  announcements: Announcement[];
}

export const AnnouncementsManager: React.FC<AnnouncementsManagerProps> = ({ announcements }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'broadcast'>('broadcast');

  const handleOpenAdd = () => {
    setEditingAnn(null);
    setTitle('');
    setMessage('');
    setPriority('broadcast');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    setEditingAnn(ann);
    setTitle(ann.title);
    setMessage(ann.message);
    setPriority(ann.priority);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    if (editingAnn) {
      await updateAnnouncement(editingAnn.id, {
        title: title.trim(),
        message: message.trim(),
        priority,
      });
    } else {
      await addAnnouncement({
        title: title.trim(),
        message: message.trim(),
        priority,
        active: true,
        createdAt: new Date().toISOString(),
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (ann: Announcement) => {
    if (confirm(`ማስታወቂያው "${ann.title}" እንዲሰረዝ እርግጠኛ ነዎት?`)) {
      await deleteAnnouncement(ann.id);
    }
  };

  const handleToggleActive = async (ann: Announcement) => {
    await updateAnnouncement(ann.id, { active: !ann.active });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white font-serif">
              የማስታወቂያዎች ማስተላለፊያ ማዕከል
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            አድሚኑ በየስራ ክፍሉ በር ላይ ለሚገኙ ታብሌቶች እና ስክሪኖች ማስታወቂያዎችን ማስተላለፍ እና መለጠፍ ይችላል
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg transition-transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>አዲስ ማስታወቂያ ለጥፍ</span>
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            የተለጠፈ ማስታወቂያ የለም። "አዲስ ማስታወቂያ ለጥፍ" የሚለውን በመንካት አዲስ ማስተላለፍ ይችላሉ።
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all ${
                ann.active
                  ? 'border-amber-500/40 bg-gradient-to-r from-slate-900 to-slate-900/90'
                  : 'border-slate-800 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                      ann.priority === 'urgent'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : ann.priority === 'broadcast'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    }`}
                  >
                    <Radio className="w-3 h-3 animate-pulse" />
                    <span>
                      {ann.priority === 'urgent'
                        ? 'አስቸኳይ'
                        : ann.priority === 'broadcast'
                        ? 'አጠቃላይ ስርጭት'
                        : 'መደበኛ'}
                    </span>
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white">{ann.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(ann)}
                    className={`text-xs px-3 py-1 rounded-xl font-bold transition-colors ${
                      ann.active
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50 hover:bg-emerald-900'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {ann.active ? 'በስርጭት ላይ (Active)' : 'የቆመ (Inactive)'}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(ann)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="አስተካክል"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(ann)}
                    className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300"
                    title="ሰርዝ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-200 mt-2 leading-relaxed bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
                {ann.message}
              </p>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>የተለጠፈበት ቀን: {new Date(ann.createdAt).toLocaleDateString('am-ET')}</span>
                <span className="text-amber-400 font-medium">በሁሉም ታብሌቶች ላይ ይታያል</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingAnn ? 'ማስታወቂያ አስተካክል' : 'አዲስ ማስታወቂያ ለጥፍ'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  የማስታወቂያው ርዕስ *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ለምሳሌ፡ የዲጂታል መታወቂያ እና የፋይዳ ስካን መመሪያ"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  የስርጭት ደረጃ (Priority)
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'normal' | 'urgent' | 'broadcast')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="broadcast">አጠቃላይ ስርጭት (Broadcast)</option>
                  <option value="urgent">አስቸኳይ ማሳሰቢያ (Urgent)</option>
                  <option value="normal">መደበኛ (Normal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  የማስታወቂያው ዝርዝር መልዕክት *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="ለሰራተኞች ወይም ለባለጉዳዮች የሚተላለፈውን መልዕክት እዚህ ይጻፉ..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  ይቅር
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  አስተላልፍ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
