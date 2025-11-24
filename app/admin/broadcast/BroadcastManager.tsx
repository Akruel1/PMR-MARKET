'use client';

import { useState, useEffect } from 'react';
import { Send, Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface BroadcastTemplate {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

export default function BroadcastManager() {
  const [templates, setTemplates] = useState<BroadcastTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState({ name: '', message: '' });
  const [showNewTemplate, setShowNewTemplate] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/admin/broadcast/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.message.trim()) {
      toast.error('Заполните все поля');
      return;
    }

    try {
      const res = await fetch('/api/admin/broadcast/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      });

      if (res.ok) {
        toast.success('Шаблон создан');
        setNewTemplate({ name: '', message: '' });
        setShowNewTemplate(false);
        loadTemplates();
      } else {
        throw new Error('Failed to create template');
      }
    } catch (error) {
      toast.error('Ошибка при создании шаблона');
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Удалить этот шаблон?')) return;

    try {
      const res = await fetch(`/api/admin/broadcast/templates/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Шаблон удален');
        loadTemplates();
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (error) {
      toast.error('Ошибка при удалении шаблона');
    }
  };

  const sendBroadcast = async (templateId: string, message: string) => {
    if (!confirm('Отправить рассылку всем пользователям, которые приняли лицензию бота?')) return;

    setSending(templateId);
    try {
      const res = await fetch('/api/admin/broadcast/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Рассылка отправлена ${data.sentCount} пользователям`);
      } else {
        throw new Error(data.error || 'Failed to send broadcast');
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при отправке рассылки');
    } finally {
      setSending(null);
    }
  };

  if (loading) {
    return <div className="text-center text-dark-text">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Create New Template */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-dark-text">Шаблоны рассылки</h2>
          <button
            onClick={() => setShowNewTemplate(!showNewTemplate)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Создать шаблон</span>
          </button>
        </div>

        {showNewTemplate && (
          <div className="mb-6 p-4 bg-dark-bg2 rounded-lg border border-neutral-700">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Название шаблона
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="input-dark w-full"
                  placeholder="Например: Новые акции"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Сообщение
                </label>
                <textarea
                  value={newTemplate.message}
                  onChange={(e) => setNewTemplate({ ...newTemplate, message: e.target.value })}
                  className="input-dark w-full h-32"
                  placeholder="Текст сообщения для рассылки..."
                />
              </div>
              <div className="flex space-x-2">
                <button onClick={createTemplate} className="btn-primary flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Сохранить</span>
                </button>
                <button
                  onClick={() => {
                    setShowNewTemplate(false);
                    setNewTemplate({ name: '', message: '' });
                  }}
                  className="px-4 py-2 rounded-lg bg-dark-bg border border-neutral-700 text-dark-textSecondary hover:bg-neutral-800"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Templates List */}
        {templates.length === 0 ? (
          <p className="text-dark-textSecondary text-center py-8">
            Нет созданных шаблонов. Создайте первый шаблон для рассылки.
          </p>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-4 bg-dark-bg2 rounded-lg border border-neutral-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-dark-text mb-2">
                      {template.name}
                    </h3>
                    <p className="text-dark-textSecondary whitespace-pre-wrap">
                      {template.message}
                    </p>
                    <p className="text-sm text-neutral-500 mt-2">
                      Создан: {new Date(template.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => sendBroadcast(template.id, template.message)}
                      disabled={sending === template.id}
                      className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 flex items-center space-x-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>{sending === template.id ? 'Отправка...' : 'Отправить'}</span>
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}















