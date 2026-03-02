import React, { useState, useEffect } from 'react';
import { Calendar, Users, Bell, Plus, X, Edit2, Trash2, Check, AlertTriangle, Clock, CreditCard, Mail, History, Settings, Download, Upload } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  price: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  notes: string;
}

interface Payment {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  date: string;
  type: 'payment' | 'refund';
  method: 'card' | 'bank' | 'cash';
  status: 'completed' | 'pending' | 'failed';
  invoice: string;
}

interface Notification {
  id: string;
  clientId: string;
  clientName: string;
  type: 'expiry_7' | 'expiry_3' | 'expiry_1' | 'expired' | 'payment';
  sentAt: string;
  email: string;
  status: 'sent' | 'pending' | 'failed';
}

interface AppSettings {
  adminEmail: string;
  notifyDays: number[];
  emailTemplates: {
    expiry_7: string;
    expiry_3: string;
    expiry_1: string;
    expired: string;
    payment: string;
  };
}

const defaultClients: Client[] = [
  {
    id: '1',
    name: 'Иван Петров',
    email: 'ivan@example.com',
    phone: '+7 999 123-45-67',
    plan: 'Премиум',
    price: 2990,
    startDate: '2025-01-15',
    endDate: '2026-03-15',
    autoRenew: true,
    notes: 'VIP клиент'
  },
  {
    id: '2',
    name: 'Анна Сидорова',
    email: 'anna@example.com',
    phone: '+7 999 234-56-78',
    plan: 'Стандарт',
    price: 990,
    startDate: '2025-02-01',
    endDate: '2026-03-05',
    autoRenew: false,
    notes: ''
  },
  {
    id: '3',
    name: 'ООО "Технологии"',
    email: 'info@tech.ru',
    phone: '+7 495 123-45-67',
    plan: 'Бизнес',
    price: 9990,
    startDate: '2025-01-01',
    endDate: '2026-03-20',
    autoRenew: true,
    notes: 'Корпоративный клиент, 50 пользователей'
  },
  {
    id: '4',
    name: 'Мария Козлова',
    email: 'maria@example.com',
    phone: '+7 999 345-67-89',
    plan: 'Базовый',
    price: 490,
    startDate: '2025-03-01',
    endDate: '2026-04-01',
    autoRenew: true,
    notes: ''
  }
];

const defaultPayments: Payment[] = [
  { id: 'p1', clientId: '1', clientName: 'Иван Петров', amount: 2990, date: '2025-02-15', type: 'payment', method: 'card', status: 'completed', invoice: 'INV-2025-001' },
  { id: 'p2', clientId: '2', clientName: 'Анна Сидорова', amount: 990, date: '2025-02-01', type: 'payment', method: 'bank', status: 'completed', invoice: 'INV-2025-002' },
  { id: 'p3', clientId: '3', clientName: 'ООО "Технологии"', amount: 9990, date: '2025-02-01', type: 'payment', method: 'bank', status: 'completed', invoice: 'INV-2025-003' },
  { id: 'p4', clientId: '1', clientName: 'Иван Петров', amount: 2990, date: '2025-01-15', type: 'payment', method: 'card', status: 'completed', invoice: 'INV-2025-004' },
  { id: 'p5', clientId: '4', clientName: 'Мария Козлова', amount: 490, date: '2025-03-01', type: 'payment', method: 'card', status: 'completed', invoice: 'INV-2025-005' },
];

const defaultSettings: AppSettings = {
  adminEmail: 'admin@mycompany.ru',
  notifyDays: [7, 3, 1],
  emailTemplates: {
    expiry_7: 'Здравствуйте, {name}! Напоминаем, что ваша подписка "{plan}" истекает через 7 дней ({date}). Продлите подписку, чтобы не потерять доступ.',
    expiry_3: 'Здравствуйте, {name}! Ваша подписка "{plan}" истекает через 3 дня ({date}). Не забудьте продлить!',
    expiry_1: 'Здравствуйте, {name}! Завтра истекает ваша подписка "{plan}". Продлите сейчас!',
    expired: 'Здравствуйте, {name}! Ваша подписка "{plan}" истекла. Продлите подписку для восстановления доступа.',
    payment: 'Здравствуйте, {name}! Мы получили ваш платёж на сумму {amount} ₽. Спасибо!'
  }
};

// Helper functions for localStorage
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

export default function App() {
  const [clients, setClients] = useState<Client[]>(() => loadFromStorage('subscription_clients', defaultClients));
  const [payments, setPayments] = useState<Payment[]>(() => loadFromStorage('subscription_payments', defaultPayments));
  const [notifications, setNotifications] = useState<Notification[]>(() => loadFromStorage('subscription_notifications', []));
  const [settings, setSettings] = useState<AppSettings>(() => loadFromStorage('subscription_settings', defaultSettings));
  
  const [activeTab, setActiveTab] = useState<'calendar' | 'clients' | 'expiring' | 'payments' | 'notifications' | 'settings'>('calendar');
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  const [formData, setFormData] = useState<Omit<Client, 'id'>>({
    name: '',
    email: '',
    phone: '',
    plan: 'Стандарт',
    price: 990,
    startDate: '',
    endDate: '',
    autoRenew: true,
    notes: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    clientId: '',
    amount: 0,
    method: 'card' as 'card' | 'bank' | 'cash',
    type: 'payment' as 'payment' | 'refund'
  });

  // Save to localStorage when data changes
  useEffect(() => {
    saveToStorage('subscription_clients', clients);
  }, [clients]);

  useEffect(() => {
    saveToStorage('subscription_payments', payments);
  }, [payments]);

  useEffect(() => {
    saveToStorage('subscription_notifications', notifications);
  }, [notifications]);

  useEffect(() => {
    saveToStorage('subscription_settings', settings);
  }, [settings]);

  // Toast notification
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const plans = [
    { name: 'Базовый', price: 490 },
    { name: 'Стандарт', price: 990 },
    { name: 'Премиум', price: 2990 },
    { name: 'Бизнес', price: 9990 }
  ];

  const getDaysUntilExpiry = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getExpiryStatus = (endDate: string) => {
    const days = getDaysUntilExpiry(endDate);
    if (days < 0) return 'expired';
    if (days <= 7) return 'critical';
    if (days <= 30) return 'warning';
    return 'ok';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'critical': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusText = (endDate: string) => {
    const days = getDaysUntilExpiry(endDate);
    if (days < 0) return `Истекла ${Math.abs(days)} дн. назад`;
    if (days === 0) return 'Истекает сегодня';
    if (days === 1) return 'Истекает завтра';
    return `${days} дн. до продления`;
  };

  const expiringClients = clients
    .filter(c => getDaysUntilExpiry(c.endDate) <= 30)
    .sort((a, b) => getDaysUntilExpiry(a.endDate) - getDaysUntilExpiry(b.endDate));

  const handleSubmit = () => {
    if (editingClient) {
      setClients(clients.map(c => c.id === editingClient.id ? { ...formData, id: editingClient.id } : c));
      showToast('Клиент обновлён');
    } else {
      setClients([...clients, { ...formData, id: Date.now().toString() }]);
      showToast('Клиент добавлен');
    }
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      plan: 'Стандарт',
      price: 990,
      startDate: '',
      endDate: '',
      autoRenew: true,
      notes: ''
    });
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setShowModal(true);
  };

  const deleteClient = (id: string) => {
    if (confirm('Удалить клиента?')) {
      setClients(clients.filter(c => c.id !== id));
      showToast('Клиент удалён');
    }
  };

  const renewSubscription = (client: Client) => {
    const endDate = new Date(client.endDate);
    endDate.setMonth(endDate.getMonth() + 1);
    setClients(clients.map(c => c.id === client.id ? { ...c, endDate: endDate.toISOString().split('T')[0] } : c));
    
    const newPayment: Payment = {
      id: `p${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      amount: client.price,
      date: new Date().toISOString().split('T')[0],
      type: 'payment',
      method: 'card',
      status: 'completed',
      invoice: `INV-${new Date().getFullYear()}-${String(payments.length + 1).padStart(3, '0')}`
    };
    setPayments([newPayment, ...payments]);
    showToast(`Подписка ${client.name} продлена на месяц`);
  };

  const addPayment = () => {
    const client = clients.find(c => c.id === paymentForm.clientId);
    if (!client) return;
    
    const newPayment: Payment = {
      id: `p${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      amount: paymentForm.amount,
      date: new Date().toISOString().split('T')[0],
      type: paymentForm.type,
      method: paymentForm.method,
      status: 'completed',
      invoice: `INV-${new Date().getFullYear()}-${String(payments.length + 1).padStart(3, '0')}`
    };
    setPayments([newPayment, ...payments]);
    
    const newNotification: Notification = {
      id: `n${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      type: 'payment',
      sentAt: new Date().toISOString().split('T')[0],
      email: client.email,
      status: 'sent'
    };
    setNotifications([newNotification, ...notifications]);
    
    setShowPaymentModal(false);
    setPaymentForm({ clientId: '', amount: 0, method: 'card', type: 'payment' });
    showToast('Платёж добавлен');
  };

  const sendNotification = (client: Client, type: Notification['type']) => {
    const newNotification: Notification = {
      id: `n${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      type,
      sentAt: new Date().toISOString().split('T')[0],
      email: client.email,
      status: 'sent'
    };
    setNotifications([newNotification, ...notifications]);
    
    // Create mailto link for sending email
    const template = settings.emailTemplates[type];
    const subject = type === 'payment' ? 'Подтверждение оплаты' : 'Напоминание о продлении подписки';
    const body = template
      .replace('{name}', client.name)
      .replace('{plan}', client.plan)
      .replace('{date}', new Date(client.endDate).toLocaleDateString('ru-RU'))
      .replace('{amount}', client.price.toString());
    
    const mailtoLink = `mailto:${client.email}?cc=${settings.adminEmail}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
    
    showToast(`Письмо подготовлено для ${client.email}`);
  };

  const exportData = () => {
    const data = {
      clients,
      payments,
      notifications,
      settings,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscription-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Данные экспортированы');
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.clients) setClients(data.clients);
        if (data.payments) setPayments(data.payments);
        if (data.notifications) setNotifications(data.notifications);
        if (data.settings) setSettings(data.settings);
        showToast('Данные импортированы');
      } catch {
        showToast('Ошибка импорта файла', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const getClientsForDate = (day: number) => {
    const dateStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return clients.filter(c => c.endDate === dateStr);
  };

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  const totalMRR = clients.reduce((sum, c) => sum + c.price, 0);
  const totalRevenue = payments.filter(p => p.type === 'payment' && p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  const getNotificationTypeText = (type: Notification['type']) => {
    switch (type) {
      case 'expiry_7': return 'За 7 дней до окончания';
      case 'expiry_3': return 'За 3 дня до окончания';
      case 'expiry_1': return 'За 1 день до окончания';
      case 'expired': return 'Подписка истекла';
      case 'payment': return 'Подтверждение оплаты';
    }
  };

  const getPaymentMethodText = (method: Payment['method']) => {
    switch (method) {
      case 'card': return '💳 Карта';
      case 'bank': return '🏦 Банк. перевод';
      case 'cash': return '💵 Наличные';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Менеджер подписок</h1>
              <p className="text-sm text-slate-500">Управление клиентами и продлениями</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Добавить</span> платёж
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Добавить</span> клиента
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 md:px-6 py-4 grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white rounded-xl p-3 md:p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-slate-800">{clients.length}</p>
              <p className="text-xs md:text-sm text-slate-500">Клиентов</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 md:p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-slate-800">{clients.filter(c => c.autoRenew).length}</p>
              <p className="text-xs md:text-sm text-slate-500">Автопродление</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 md:p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-slate-800">{expiringClients.length}</p>
              <p className="text-xs md:text-sm text-slate-500">Скоро истекают</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 md:p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-slate-800">{totalMRR.toLocaleString()} ₽</p>
              <p className="text-xs md:text-sm text-slate-500">MRR</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 md:p-4 border border-slate-200 col-span-2 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-slate-800">{totalRevenue.toLocaleString()} ₽</p>
              <p className="text-xs md:text-sm text-slate-500">Выручка</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-6">
        <div className="flex gap-1 md:gap-2 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-2 md:px-4 py-3 font-medium transition-colors whitespace-nowrap text-sm ${activeTab === 'calendar' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-1 md:gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Календарь</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-2 md:px-4 py-3 font-medium transition-colors whitespace-nowrap text-sm ${activeTab === 'clients' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-1 md:gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Клиенты</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('expiring')}
            className={`px-2 md:px-4 py-3 font-medium transition-colors whitespace-nowrap text-sm ${activeTab === 'expiring' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-1 md:gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Внимание</span>
              {expiringClients.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{expiringClients.length}</span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-2 md:px-4 py-3 font-medium transition-colors whitespace-nowrap text-sm ${activeTab === 'payments' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-1 md:gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Платежи</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-2 md:px-4 py-3 font-medium transition-colors whitespace-nowrap text-sm ${activeTab === 'notifications' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-1 md:gap-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Уведомления</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-2 md:px-4 py-3 font-medium transition-colors whitespace-nowrap text-sm ${activeTab === 'settings' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-1 md:gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Настройки</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 py-4">
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                className="px-3 py-1 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                ←
              </button>
              <h2 className="text-lg font-semibold text-slate-800">
                {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
              </h2>
              <button
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                className="px-3 py-1 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                →
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                <div key={day} className="text-center text-xs md:text-sm font-medium text-slate-500 py-2">{day}</div>
              ))}
              {Array.from({ length: getFirstDayOfMonth(selectedMonth) }).map((_, i) => (
                <div key={`empty-${i}`} className="h-16 md:h-24" />
              ))}
              {Array.from({ length: getDaysInMonth(selectedMonth) }).map((_, i) => {
                const day = i + 1;
                const dayClients = getClientsForDate(day);
                const today = new Date();
                const isToday = today.getDate() === day && today.getMonth() === selectedMonth.getMonth() && today.getFullYear() === selectedMonth.getFullYear();
                return (
                  <div
                    key={day}
                    className={`h-16 md:h-24 border rounded-lg p-1 ${isToday ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}
                  >
                    <div className={`text-xs md:text-sm font-medium mb-1 ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>{day}</div>
                    <div className="space-y-0.5 overflow-y-auto max-h-10 md:max-h-16">
                      {dayClients.map(client => (
                        <div
                          key={client.id}
                          className={`text-xs px-1 py-0.5 rounded truncate ${getStatusColor(getExpiryStatus(client.endDate))}`}
                          title={client.name}
                        >
                          {client.name}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Клиент</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Тариф</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Цена</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Окончание</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Статус</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Действия</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-slate-800">{client.name}</div>
                        <div className="text-sm text-slate-500">{client.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-slate-100 rounded text-sm">{client.plan}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{client.price.toLocaleString()} ₽</td>
                    <td className="px-4 py-3 text-slate-700">{new Date(client.endDate).toLocaleDateString('ru-RU')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(getExpiryStatus(client.endDate))}`}>
                        {getStatusText(client.endDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => sendNotification(client, 'expiry_7')} className="p-1 text-slate-500 hover:text-blue-600" title="Отправить напоминание">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEditModal(client)} className="p-1 text-slate-500 hover:text-indigo-600">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteClient(client.id)} className="p-1 text-slate-500 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'expiring' && (
          <div className="space-y-4">
            {expiringClients.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-slate-600">Нет подписок, требующих внимания</p>
              </div>
            ) : (
              expiringClients.map(client => (
                <div key={client.id} className={`bg-white rounded-xl border-2 p-4 ${getStatusColor(getExpiryStatus(client.endDate))}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-lg font-bold text-slate-600">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{client.name}</h3>
                        <p className="text-sm text-slate-500">{client.email}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-sm font-medium">{client.plan}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-sm">{client.price.toLocaleString()} ₽/мес</span>
                          {client.autoRenew && (
                            <>
                              <span className="text-slate-400">•</span>
                              <span className="text-sm text-green-600">Автопродление</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <div className="text-lg font-bold">{getStatusText(client.endDate)}</div>
                      <div className="text-sm text-slate-500">до {new Date(client.endDate).toLocaleDateString('ru-RU')}</div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => sendNotification(client, getDaysUntilExpiry(client.endDate) <= 1 ? 'expiry_1' : getDaysUntilExpiry(client.endDate) <= 3 ? 'expiry_3' : 'expiry_7')}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" /> Напомнить
                        </button>
                        <button
                          onClick={() => renewSubscription(client)}
                          className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                        >
                          Продлить
                        </button>
                      </div>
                    </div>
                  </div>
                  {client.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-200 text-sm text-slate-600">
                      📝 {client.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Дата</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Клиент</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Сумма</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Способ</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Счёт</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Статус</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{new Date(payment.date).toLocaleDateString('ru-RU')}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{payment.clientName}</td>
                    <td className="px-4 py-3">
                      <span className={payment.type === 'refund' ? 'text-red-600' : 'text-green-600'}>
                        {payment.type === 'refund' ? '-' : '+'}{payment.amount.toLocaleString()} ₽
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{getPaymentMethodText(payment.method)}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-sm">{payment.invoice}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.status === 'completed' ? 'Оплачен' : payment.status === 'pending' ? 'Ожидание' : 'Ошибка'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Дата</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Клиент</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Тип</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Статус</th>
                </tr>
              </thead>
              <tbody>
                {notifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Пока нет отправленных уведомлений
                    </td>
                  </tr>
                ) : (
                  notifications.map(notification => (
                    <tr key={notification.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">{new Date(notification.sentAt).toLocaleDateString('ru-RU')}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{notification.clientName}</td>
                      <td className="px-4 py-3 text-slate-500">{notification.email}</td>
                      <td className="px-4 py-3 text-slate-700">{getNotificationTypeText(notification.type)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          notification.status === 'sent' ? 'bg-green-100 text-green-800' :
                          notification.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {notification.status === 'sent' ? '✓ Отправлено' : notification.status === 'pending' ? 'Ожидание' : 'Ошибка'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5" /> Настройки уведомлений
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email администратора (копия всех уведомлений)</label>
                  <input
                    type="email"
                    value={settings.adminEmail}
                    onChange={e => setSettings({ ...settings, adminEmail: e.target.value })}
                    className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="admin@company.ru"
                  />
                  <p className="text-sm text-slate-500 mt-1">На этот адрес будут отправляться копии всех уведомлений клиентам</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Отправлять напоминания за:</label>
                  <div className="flex gap-4 flex-wrap">
                    {[7, 3, 1].map(day => (
                      <label key={day} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.notifyDays.includes(day)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSettings({ ...settings, notifyDays: [...settings.notifyDays, day].sort((a, b) => b - a) });
                            } else {
                              setSettings({ ...settings, notifyDays: settings.notifyDays.filter(d => d !== day) });
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-700">{day} {day === 1 ? 'день' : day < 5 ? 'дня' : 'дней'}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Шаблоны писем</h3>
              <div className="space-y-4">
                {Object.entries(settings.emailTemplates).map(([key, template]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {getNotificationTypeText(key as Notification['type'])}
                    </label>
                    <textarea
                      value={template}
                      onChange={e => setSettings({ ...settings, emailTemplates: { ...settings.emailTemplates, [key]: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows={2}
                    />
                    <p className="text-xs text-slate-500 mt-1">Переменные: {'{name}'}, {'{plan}'}, {'{date}'}, {'{amount}'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Download className="w-5 h-5" /> Экспорт / Импорт данных
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Экспортируйте данные для резервной копии или переноса на другой компьютер.
              </p>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={exportData}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Download className="w-4 h-4" /> Экспортировать
                </button>
                <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer">
                  <Upload className="w-4 h-4" /> Импортировать
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold">{editingClient ? 'Редактировать клиента' : 'Новый клиент'}</h2>
              <button onClick={closeModal} className="p-1 text-slate-500 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Имя / Компания</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Иван Иванов"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Телефон</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="+7 999 123-45-67"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Тариф</label>
                  <select
                    value={formData.plan}
                    onChange={e => {
                      const plan = plans.find(p => p.name === e.target.value);
                      setFormData({ ...formData, plan: e.target.value, price: plan?.price || 990 });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {plans.map(plan => (
                      <option key={plan.name} value={plan.name}>{plan.name} — {plan.price} ₽</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Цена (₽/мес)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Начало подписки</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Окончание подписки</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Заметки</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={2}
                  placeholder="Дополнительная информация..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoRenew"
                  checked={formData.autoRenew}
                  onChange={e => setFormData({ ...formData, autoRenew: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="autoRenew" className="text-sm text-slate-700">Автоматическое продление</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-slate-200">
              <button onClick={closeModal} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg">
                Отмена
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.endDate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingClient ? 'Сохранить' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold">Новый платёж</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 text-slate-500 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Клиент</label>
                <select
                  value={paymentForm.clientId}
                  onChange={e => {
                    const client = clients.find(c => c.id === e.target.value);
                    setPaymentForm({ ...paymentForm, clientId: e.target.value, amount: client?.price || 0 });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Выберите клиента</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Сумма (₽)</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Тип</label>
                  <select
                    value={paymentForm.type}
                    onChange={e => setPaymentForm({ ...paymentForm, type: e.target.value as 'payment' | 'refund' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="payment">Оплата</option>
                    <option value="refund">Возврат</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Способ оплаты</label>
                  <select
                    value={paymentForm.method}
                    onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value as 'card' | 'bank' | 'cash' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="card">Карта</option>
                    <option value="bank">Банковский перевод</option>
                    <option value="cash">Наличные</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-slate-200">
              <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg">
                Отмена
              </button>
              <button
                onClick={addPayment}
                disabled={!paymentForm.clientId || !paymentForm.amount}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Добавить платёж
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
