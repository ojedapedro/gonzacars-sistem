
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Filter, Download, Sparkles, Loader2 } from 'lucide-react';
import { generateFinanceAudit } from '../lib/gemini';

const FinanceModule: React.FC<{ store: any }> = ({ store }) => {
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const totalSales = store.sales.reduce((acc: number, s: any) => acc + s.total, 0);
  const totalPurchases = store.purchases.reduce((acc: number, p: any) => acc + p.total, 0);
  const totalExpenses = store.expenses.reduce((acc: number, e: any) => acc + e.amount, 0);
  const balance = totalSales - (totalPurchases + totalExpenses);

  const handleAiAudit = async () => {
    setIsAiLoading(true);
    try {
      const analysis = await generateFinanceAudit({
        sales: totalSales,
        purchases: totalPurchases,
        expenses: totalExpenses,
        balance: balance
      });
      setAiAnalysis(analysis || null);
    } catch (error) {
      console.error("AI Audit Error:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Fixed: Added explicit typing for chartData to ensure compatibility with Recharts
  const chartData: { name: string; value: number; fill: string }[] = [
    { name: 'Ventas', value: totalSales, fill: '#3b82f6' },
    { name: 'Compras', value: totalPurchases, fill: '#ef4444' },
    { name: 'Gastos', value: totalExpenses, fill: '#f59e0b' }
  ];

  // Fixed: Added explicit Record typing for the reduce accumulator and typed the resulting categoryData array
  const categoryData: { name: string; value: number }[] = Object.values(
    store.expenses.reduce((acc: Record<string, { name: string; value: number }>, curr: any) => {
      acc[curr.category] = acc[curr.category] || { name: curr.category, value: 0 };
      acc[curr.category].value += curr.amount;
      return acc;
    }, {} as Record<string, { name: string; value: number }>)
  );

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Panel Financiero</h3>
          <p className="text-slate-500 font-medium">Análisis de rentabilidad y auditoría inteligente</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleAiAudit}
            disabled={isAiLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
          >
            {isAiLoading ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18} className="text-blue-200"/>}
            Generar Análisis IA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Ventas" amount={totalSales} icon={<ArrowUpCircle className="text-green-500"/>} rate={store.exchangeRate}/>
        <StatCard title="Total Compras" amount={totalPurchases} icon={<ArrowDownCircle className="text-red-500"/>} rate={store.exchangeRate}/>
        <StatCard title="Total Gastos" amount={totalExpenses} icon={<ArrowDownCircle className="text-orange-500"/>} rate={store.exchangeRate}/>
        <StatCard title="Balance Neto" amount={balance} icon={<DollarSign className="text-blue-500"/>} rate={store.exchangeRate} isBalance/>
      </div>

      {aiAnalysis && (
        <div className="bg-white p-8 rounded-[2rem] border border-blue-100 mb-8 shadow-xl shadow-blue-50 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 p-8">
            <Sparkles className="text-blue-200 opacity-50" size={64}/>
          </div>
          <h4 className="text-lg font-black text-blue-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-blue-500" /> Reporte Estratégico de Gonzacars
          </h4>
          <div className="text-slate-600 leading-relaxed space-y-4 max-w-4xl relative z-10 font-medium whitespace-pre-line">
            {aiAnalysis}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-6 uppercase text-xs tracking-widest">Comparativa Mensual ($)</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-6 uppercase text-xs tracking-widest">Distribución de Egresos</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={{fontSize: 10, fontWeight: 700}}>
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, amount: number, icon: React.ReactNode, rate: number, isBalance?: boolean }> = ({ title, amount, icon, rate, isBalance }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
    </div>
    <div className={`text-2xl font-black ${isBalance ? (amount >= 0 ? 'text-green-600' : 'text-red-600') : 'text-slate-900'}`}>
      {amount < 0 ? `-$${Math.abs(amount).toFixed(2)}` : `$${amount.toFixed(2)}`}
    </div>
    <p className="text-[10px] text-slate-400 mt-1 font-bold">
      {(amount * rate).toLocaleString('es-VE')} BS
    </p>
  </div>
);

export default FinanceModule;
