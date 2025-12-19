
import React, { useState, useMemo } from 'react';
import { Truck, Save, Search, Calendar, Filter, FileText, ChevronRight, DollarSign, Tag, User, Hash } from 'lucide-react';
import { Purchase } from '../types';

const PurchaseRegistry: React.FC<{ store: any }> = ({ store }) => {
  const [activeTab, setActiveTab] = useState<'register' | 'history'>('register');
  const [formData, setFormData] = useState<Partial<Purchase>>({
    date: new Date().toISOString().split('T')[0],
    type: 'Contado',
    quantity: 1,
    price: 0
  });

  // Filtros para el historial
  const [filters, setFilters] = useState({
    provider: '',
    category: '',
    dateStart: '',
    dateEnd: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const purchase: Purchase = {
      ...formData as Purchase,
      id: Math.random().toString(36).substr(2, 9),
      total: (formData.price || 0) * (formData.quantity || 1)
    };
    store.addPurchase(purchase);
    alert('Compra registrada e inventario actualizado');
    setFormData({ date: new Date().toISOString().split('T')[0], type: 'Contado', quantity: 1, price: 0 });
    setActiveTab('history');
  };

  // Lógica de filtrado
  const filteredPurchases = useMemo(() => {
    return store.purchases.filter((p: Purchase) => {
      const matchProvider = !filters.provider || p.provider.toLowerCase().includes(filters.provider.toLowerCase());
      const matchCategory = !filters.category || p.category.toLowerCase().includes(filters.category.toLowerCase());
      const matchDateStart = !filters.dateStart || p.date >= filters.dateStart;
      const matchDateEnd = !filters.dateEnd || p.date <= filters.dateEnd;
      return matchProvider && matchCategory && matchDateStart && matchDateEnd;
    }).sort((a: Purchase, b: Purchase) => b.date.localeCompare(a.date));
  }, [store.purchases, filters]);

  const totalInvoiced = filteredPurchases.reduce((acc: number, p: Purchase) => acc + p.total, 0);

  // Obtener categorías únicas para sugerencias de filtro
  // Fix: Explicitly type categories as string[] to avoid 'unknown' type inference issues
  const categories = useMemo<string[]>(() => {
    const purchases = (store.purchases || []) as Purchase[];
    const cats = new Set(purchases.map((p: Purchase) => p.category));
    return Array.from(cats);
  }, [store.purchases]);

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Gestión de Compras</h3>
          <p className="text-slate-500 font-medium">Registro de abastecimiento y auditoría de proveedores</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('register')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'register' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Registrar
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Historial
          </button>
        </div>
      </div>

      {activeTab === 'register' ? (
        <div className="bg-white rounded-[2.5rem] shadow-sm p-10 border border-slate-200 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Truck size={32}/>
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nueva Orden de Compra</h4>
              <p className="text-slate-400 text-sm font-medium">Ingrese los detalles para actualizar stock automáticamente</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                  <input required type="date" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-50/50 transition-all" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proveedor</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                  <input required type="text" placeholder="Ej: Repuestos El Chamo C.A." className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-50/50 transition-all" value={formData.provider || ''} onChange={(e) => setFormData({...formData, provider: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nro. Factura</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                  <input required type="text" placeholder="000123" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-50/50 transition-all" value={formData.invoiceNumber || ''} onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                <select className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none appearance-none" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as 'Contado' | 'Crédito'})}>
                  <option value="Contado">Pago de Contado</option>
                  <option value="Crédito">Compra a Crédito</option>
                </select>
              </div>
            </div>

            <div className="p-8 bg-blue-50/50 rounded-3xl border border-blue-100/50 space-y-6">
              <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Detalle de Producto</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Repuesto</label>
                  <input required type="text" placeholder="Ej: Bujías NGK Iridium" className="w-full px-4 py-3.5 bg-white border border-slate-100 rounded-2xl font-bold outline-none shadow-sm" value={formData.productName || ''} onChange={(e) => setFormData({...formData, productName: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                  <input required type="text" list="prev-categories" placeholder="Ej: Motor" className="w-full px-4 py-3.5 bg-white border border-slate-100 rounded-2xl font-bold outline-none shadow-sm" value={formData.category || ''} onChange={(e) => setFormData({...formData, category: e.target.value})} />
                  <datalist id="prev-categories">
                    {/* Fix: Added explicit string type for map callback parameter */}
                    {categories.map((c: string) => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Costo ($)</label>
                    <input required type="number" step="0.01" className="w-full px-4 py-3.5 bg-white border border-slate-100 rounded-2xl font-black outline-none shadow-sm" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cantidad</label>
                    <input required type="number" className="w-full px-4 py-3.5 bg-white border border-slate-100 rounded-2xl font-black outline-none shadow-sm" value={formData.quantity || ''} onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})} />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-blue-100">
                <div className="text-left">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Inversión Total</p>
                  <p className="text-3xl font-black text-blue-600">${((formData.price || 0) * (formData.quantity || 1)).toFixed(2)}</p>
                </div>
                <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center gap-2">
                  <Save size={18}/> Guardar Registro
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {/* Filtros */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proveedor</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none"
                  placeholder="Filtrar por proveedor..."
                  value={filters.provider}
                  onChange={(e) => setFilters({...filters, provider: e.target.value})}
                />
              </div>
            </div>
            <div className="w-44 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
              <select 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none appearance-none"
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
              >
                <option value="">Todas</option>
                {/* Fix: Added explicit string type for map callback parameter */}
                {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="w-44 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Desde</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                value={filters.dateStart}
                onChange={(e) => setFilters({...filters, dateStart: e.target.value})}
              />
            </div>
            <div className="w-44 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hasta</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                value={filters.dateEnd}
                onChange={(e) => setFilters({...filters, dateEnd: e.target.value})}
              />
            </div>
            <button 
              onClick={() => setFilters({ provider: '', category: '', dateStart: '', dateEnd: '' })}
              className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-colors"
              title="Limpiar Filtros"
            >
              <Filter size={18}/>
            </button>
          </div>

          {/* Resumen de Filtro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-100">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Filtrado</p>
              <p className="text-3xl font-black mt-1">${totalInvoiced.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Facturas Listadas</p>
              <p className="text-3xl font-black text-slate-800 mt-1">{filteredPurchases.length}</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categorías Activas</p>
              <p className="text-3xl font-black text-slate-800 mt-1">
                {new Set(filteredPurchases.map(p => p.category)).size}
              </p>
            </div>
          </div>

          {/* Listado */}
          <div className="flex-1 overflow-y-auto bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col custom-scrollbar">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proveedor</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Factura</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {filteredPurchases.map((p: Purchase) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400"/>
                          <span className="text-slate-700">{p.date}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-slate-900 font-bold">{p.provider}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-1.5">
                          <FileText size={14} className="text-slate-400"/>
                          <span className="text-slate-500 font-mono text-xs">{p.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div>
                          <p className="text-slate-800 text-sm font-bold">{p.productName}</p>
                          <p className="text-[10px] text-slate-400">Cant: {p.quantity} x ${p.price}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="text-blue-600 font-black text-lg">${p.total.toFixed(2)}</span>
                      </td>
                    </tr>
                  ))}
                  {filteredPurchases.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center text-slate-300 font-bold italic">
                        No se encontraron registros para los filtros aplicados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRegistry;
