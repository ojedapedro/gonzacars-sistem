
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Calendar as CalendarIcon, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { generateFinanceAudit } from '../lib/gemini';

const FinanceModule: React.FC<{ store: any }> = ({ store }) => {
  const [viewMode, setViewMode] = useState<'general' | 'daily'>('daily');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const filteredData = useMemo(() => {
    const sBase = Array.isArray(store.sales) ? store.sales : [];
    const pBase = Array.isArray(store.purchases) ? store.purchases : [];
    const eBase = Array.isArray(store.expenses) ? store.expenses : [];

    if (viewMode === 'general') {
      return { sales: sBase, purchases: pBase, expenses: eBase };
    } else {
      return {
        sales: sBase.filter((s: any) => s.date === filterDate),
        purchases: pBase.filter((p: any) => p.date === filterDate),
        expenses: eBase.filter((e: any) => e.date === filterDate)
      };
    }
  }, [store.sales, store.purchases, store.expenses, viewMode, filterDate]);

  const totalSales = filteredData.sales.reduce((acc: number, s: any) => acc + Number(s.total || 0), 0);
  const totalPurchases = filteredData.purchases.reduce((acc: number, p: any) => acc + Number(p.total || 0), 0);
  const totalExpenses = filteredData.expenses.reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);
  const balance = totalSales - (totalPurchases + totalExpenses);

  const handleAiAudit = async () => {
    setIsAiLoading(true);
    try {
      const analysis = await generateFinanceAudit({
        sales: totalSales,
        purchases: totalPurchases,
        expenses: totalExpenses,
        balance: balance,
        period: viewMode === 'general' ? 'Historial General' : `Fecha: ${filterDate}`
      });
      setAiAnalysis(analysis || null);
    } catch (error) {
      console.error("AI Audit Error:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const chartData = [
    { name: 'Ventas', value: totalSales, fill: '#3b82f6' },
    { name: 'Compras', value: totalPurchases, fill: '#ef4444' },
    { name: 'Gastos', value: totalExpenses, fill: '#f59e0b' }
  ];

  const categoryData: { name: string; value: number }[] = Object.values(
    filteredData.expenses.reduce((acc: Record<string, { name: string; value: number }>, curr: any) => {
      const cat = curr.category || 'Varios';
      if (!acc[cat]) {
        acc[cat] = { name: cat, value: 0 };
      }
      acc[cat].value += Number(curr.amount || 0);
      return acc;
    }, {} as Record<string, { name: string; value: number }>)
  );

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Análisis Financiero</h3>
          <p className="text-slate-500 font-medium mt-2">Rentabilidad y flujo de caja en tiempo real</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button onClick={() => setViewMode('general')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'general' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>General</button>
            <button onClick={() => setViewMode('daily')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'daily' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Diario</button>
          </div>
          {viewMode === 'daily' && (
            <input type="date" className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black outline-none" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          )}
          <button onClick={handleAiAudit} disabled={isAiLoading} className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 shadow-lg disabled:opacity-50">
            {isAiLoading ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14} className="text-blue-200"/>} Auditoría IA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Ventas" amount={totalSales} icon={<ArrowUpCircle className="text-emerald-500"/>} rate={store.exchangeRate}/>
        <StatCard title="Compras" amount={totalPurchases} icon={<ArrowDownCircle className="text-red-500"/>} rate={store.exchangeRate}/>
        <StatCard title="Gastos" amount={totalExpenses} icon={<ArrowDownCircle className="text-orange-500"/>} rate={store.exchangeRate}/>
        <StatCard title="Balance Neto" amount={balance} icon={<DollarSign className="text-blue-500"/>} rate={store.exchangeRate} isBalance/>
      </div>

      {aiAnalysis && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 mb-8 shadow-xl relative overflow-hidden animate-in fade-in duration-500">
          <h4 className="text-xs font-black text-blue-800 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-blue-500" /> Diagnóstico Financiero Estratégico
          </h4>
          <div className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">{aiAnalysis}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} />
              <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {categoryData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, amount: number, icon: React.ReactNode, rate: number, isBalance?: boolean }> = ({ title, amount, icon, rate, isBalance }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-blue-200 transition-all group">
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
      <div className="p-2.5 bg-slate-50 rounded-xl">{icon}</div>
    </div>
    <div className={`text-3xl font-black tracking-tighter leading-none ${isBalance ? (amount >= 0 ? 'text-blue-600' : 'text-red-600') : 'text-slate-900'}`}>
      {amount < 0 ? `-$${Number(Math.abs(amount)).toFixed(2)}` : `$${Number(amount).toFixed(2)}`}
    </div>
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
      <p className="text-[10px] text-slate-400 font-bold">{(Number(amount) * Number(rate || 0)).toLocaleString('es-VE')} Bs</p>
      <span className="text-[8px] font-black text-slate-300 uppercase italic">Tasa: {rate}</span>
    </div>
  </div>
);

export default FinanceModule;
