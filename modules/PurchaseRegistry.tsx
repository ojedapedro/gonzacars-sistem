
import React, { useState, useMemo } from 'react';
import { Truck, Save, Search, Calendar, Filter, FileText, ChevronRight, DollarSign, Tag, User, Hash, Plus, Trash2, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Purchase, Product } from '../types';

interface TemporaryItem {
  id: string;
  productId: string; // ID real del producto si existe
  productName: string;
  category: string;
  price: number;
  quantity: number;
}

const PurchaseRegistry: React.FC<{ store: any }> = ({ store }) => {
  const [activeTab, setActiveTab] = useState<'register' | 'history'>('register');
  
  // Datos del Encabezado (Proveedor y Factura)
  const [invoiceHeader, setInvoiceHeader] = useState({
    date: new Date().toISOString().split('T')[0],
    provider: '',
    invoiceNumber: '',
    type: 'Contado' as 'Contado' | 'Crédito'
  });

  // Ítem actual que se está redactando
  const [currentItem, setCurrentItem] = useState<Partial<TemporaryItem>>({
    productId: '',
    productName: '',
    category: '',
    price: 0,
    quantity: 1
  });

  // Lista de ítems cargados en la factura actual
  const [invoiceItems, setInvoiceItems] = useState<TemporaryItem[]>([]);

  // Filtros para el historial
  const [filters, setFilters] = useState({
    provider: '',
    status: 'Todas' as 'Todas' | 'Pendiente' | 'Cerrada',
    dateStart: '',
    dateEnd: ''
  });

  const addItemToInvoice = () => {
    if (!currentItem.productName || !currentItem.category || (currentItem.price || 0) <= 0) {
      alert("Complete los datos del producto correctamente.");
      return;
    }
    
    const newItem: TemporaryItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: currentItem.productId || '', // Preservar ID si se seleccionó de la lista
      productName: currentItem.productName || '',
      category: currentItem.category || '',
      price: Number(currentItem.price) || 0,
      quantity: Number(currentItem.quantity) || 1
    };
    
    setInvoiceItems([...invoiceItems, newItem]);
    setCurrentItem({ productId: '', productName: '', category: '', price: 0, quantity: 1 });
  };

  const handleProductSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCurrentItem(prev => ({ ...prev, productName: val }));
    
    // Buscar si existe en inventario
    const existing = store.inventory.find((p: Product) => p.name === val);
    if (existing) {
        setCurrentItem(prev => ({
            ...prev,
            productName: existing.name,
            productId: existing.id,
            category: existing.category,
            price: existing.cost // Sugerir último costo
        }));
    } else {
        // Si no existe o se cambió el nombre, resetear ID
        setCurrentItem(prev => ({ ...prev, productId: '' }));
    }
  };

  const removeItemFromInvoice = (id: string) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== id));
  };

  const processInvoice = (status: 'Pendiente' | 'Cerrada') => {
    if (!invoiceHeader.provider || !invoiceHeader.invoiceNumber || invoiceItems.length === 0) {
      alert("Debe completar el encabezado y añadir al menos un producto.");
      return;
    }

    const invoiceId = Math.random().toString(36).substr(2, 9).toUpperCase();
    
    // Preparar el lote de compras
    const purchasesBatch: Purchase[] = invoiceItems.map(item => ({
        id: Math.random().toString(36).substr(2, 9),
        invoiceId,
        date: invoiceHeader.date,
        provider: invoiceHeader.provider,
        invoiceNumber: invoiceHeader.invoiceNumber,
        productId: item.productId, // Pasar el ID vinculado si existe
        productName: item.productName,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
        type: invoiceHeader.type,
        status: status
    }));

    // Enviar lote completo al store para procesamiento atómico
    store.registerPurchaseBatch(purchasesBatch);

    alert(`Factura ${status} registrada con éxito. El inventario ha sido actualizado.`);
    
    // Resetear formulario
    setInvoiceHeader({
      date: new Date().toISOString().split('T')[0],
      provider: '',
      invoiceNumber: '',
      type: 'Contado'
    });
    setInvoiceItems([]);
    if (status === 'Cerrada') setActiveTab('history');
  };

  // Filtrado de Historial Avanzado
  const filteredPurchases = useMemo(() => {
    return store.purchases.filter((p: Purchase) => {
      const matchStatus = filters.status === 'Todas' || p.status === filters.status;
      const matchProvider = !filters.provider || p.provider.toLowerCase().includes(filters.provider.toLowerCase());
      const matchDateStart = !filters.dateStart || p.date >= filters.dateStart;
      const matchDateEnd = !filters.dateEnd || p.date <= filters.dateEnd;
      return matchStatus && matchProvider && matchDateStart && matchDateEnd;
    }).sort((a: Purchase, b: Purchase) => b.date.localeCompare(a.date));
  }, [store.purchases, filters]);

  const invoiceTotal = invoiceItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Sugerencias de categorías y productos
  const categories = Array.from(new Set(store.inventory.map((p: Product) => p.category))) as string[];
  const existingProducts = store.inventory as Product[];

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Abastecimiento de Almacén</h3>
          <p className="text-slate-500 font-medium">Registro multi-ítem de facturas de proveedores</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('register')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'register' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Nueva Factura
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Historial de Facturas
          </button>
        </div>
      </div>

      {activeTab === 'register' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Encabezado y Carga de Ítems */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-slate-200">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <FileText size={16} className="text-blue-500" /> Información del Proveedor
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Proveedor / Razón Social</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input required type="text" placeholder="Ej: Repuestos El Chamo C.A." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all" value={invoiceHeader.provider} onChange={(e) => setInvoiceHeader({...invoiceHeader, provider: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nro. Factura</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                      <input required type="text" placeholder="000123" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all" value={invoiceHeader.invoiceNumber} onChange={(e) => setInvoiceHeader({...invoiceHeader, invoiceNumber: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha</label>
                    <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" value={invoiceHeader.date} onChange={(e) => setInvoiceHeader({...invoiceHeader, date: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-slate-200">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Package size={16} className="text-blue-500" /> Carga de Productos
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Repuesto</label>
                  <input 
                    type="text" 
                    list="existingProducts" 
                    placeholder="Escriba para buscar..." 
                    className="w-full px-4 py-2.5 bg-white border border-slate-100 rounded-xl font-bold outline-none" 
                    value={currentItem.productName} 
                    onChange={handleProductSelect} 
                  />
                  <datalist id="existingProducts">
                    {existingProducts.map(p => <option key={p.id} value={p.name} />)}
                  </datalist>
                </div>
                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                  <input type="text" list="categories" placeholder="Motor..." className="w-full px-4 py-2.5 bg-white border border-slate-100 rounded-xl font-bold outline-none" value={currentItem.category} onChange={(e) => setCurrentItem({...currentItem, category: e.target.value})} />
                  <datalist id="categories">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Costo Unit. ($)</label>
                  <input type="number" step="0.01" className="w-full px-4 py-2.5 bg-white border border-slate-100 rounded-xl font-black outline-none" value={currentItem.price || ''} onChange={(e) => setCurrentItem({...currentItem, price: Number(e.target.value)})} />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cant.</label>
                  <input type="number" className="w-full px-2 py-2.5 bg-white border border-slate-100 rounded-xl font-black outline-none text-center" value={currentItem.quantity || ''} onChange={(e) => setCurrentItem({...currentItem, quantity: Number(e.target.value)})} />
                </div>
                <div className="md:col-span-1">
                  <button onClick={addItemToInvoice} className="w-full h-[46px] bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    <Plus size={20}/>
                  </button>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {invoiceItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                        <Package size={18}/>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                            <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{item.productName}</p>
                            {item.productId && <span className="bg-emerald-100 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Vinculado</span>}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category} • Cant: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-black text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase italic">@ ${item.price.toFixed(2)}</p>
                      </div>
                      <button onClick={() => removeItemFromInvoice(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </div>
                ))}
                {invoiceItems.length === 0 && (
                  <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                    <Package size={48} className="mx-auto text-slate-200 mb-3 opacity-30" />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Factura vacía, añada productos arriba</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel Derecho: Resumen y Procesamiento */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <DollarSign className="absolute -bottom-8 -right-8 opacity-10" size={160} />
              <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Total de Factura</p>
                <h3 className="text-5xl font-black tracking-tighter">${invoiceTotal.toFixed(2)}</h3>
                <div className="mt-8 space-y-4">
                  <div className="flex justify-between items-center py-3 border-t border-white/10">
                    <span className="text-[10px] font-black text-slate-500 uppercase">En Moneda Local</span>
                    <span className="text-xl font-bold text-emerald-400">{(invoiceTotal * store.exchangeRate).toLocaleString('es-VE')} Bs</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-t border-white/10">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Tasa de Cambio</span>
                    <span className="text-xs font-black">{store.exchangeRate} Bs</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Forma de Pago</label>
                <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black uppercase text-[10px] tracking-widest outline-none appearance-none cursor-pointer" value={invoiceHeader.type} onChange={(e) => setInvoiceHeader({...invoiceHeader, type: e.target.value as 'Contado' | 'Crédito'})}>
                  <option value="Contado">Pago Inmediato (Contado)</option>
                  <option value="Crédito">Compra a Crédito</option>
                </select>
              </div>
              
              <div className="flex flex-col gap-3 pt-4">
                <button 
                  disabled={invoiceItems.length === 0}
                  onClick={() => processInvoice('Pendiente')}
                  className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  <Clock size={16}/> Guardar como Pendiente
                </button>
                <button 
                  disabled={invoiceItems.length === 0}
                  onClick={() => processInvoice('Cerrada')}
                  className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-blue-700 shadow-2xl shadow-blue-100 transition-all disabled:opacity-50 active:scale-95"
                >
                  <CheckCircle size={20}/> Procesar y Cerrar
                </button>
              </div>
              <p className="text-[9px] text-slate-400 font-medium italic text-center px-4">Al cerrar la factura, los ítems se sumarán al inventario automáticamente.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {/* Filtros Historial Avanzados */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proveedor</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none"
                  placeholder="Filtrar proveedor..."
                  value={filters.provider}
                  onChange={(e) => setFilters({...filters, provider: e.target.value})}
                />
              </div>
            </div>
            <div className="w-48 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado Factura</label>
              <select 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black uppercase outline-none cursor-pointer"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value as any})}
              >
                <option value="Todas">Ver Todas</option>
                <option value="Pendiente">Pendientes</option>
                <option value="Cerrada">Cerradas / Procesadas</option>
              </select>
            </div>
            <div className="w-44 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Desde</label>
              <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" value={filters.dateStart} onChange={(e) => setFilters({...filters, dateStart: e.target.value})} />
            </div>
            <div className="w-44 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hasta</label>
              <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" value={filters.dateEnd} onChange={(e) => setFilters({...filters, dateEnd: e.target.value})} />
            </div>
            <button 
              onClick={() => setFilters({ provider: '', status: 'Todas', dateStart: '', dateEnd: '' })}
              className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-colors"
              title="Limpiar filtros"
            >
              <Filter size={18}/>
            </button>
          </div>

          {/* Listado de Compras */}
          <div className="flex-1 overflow-y-auto bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Factura / Fecha</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proveedor</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cant.</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPurchases.map((p: Purchase) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="text-slate-800 font-black text-xs">#{p.invoiceNumber}</p>
                      <p className="text-[9px] font-bold text-slate-400">{p.date}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-bold text-slate-700 uppercase text-xs">{p.provider}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                        p.status === 'Cerrada' 
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-slate-900 font-bold text-xs uppercase">{p.productName}</p>
                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">{p.category}</p>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-black">{p.quantity}</span>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-blue-600 text-lg">
                      ${p.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {filteredPurchases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center opacity-30">
                        <AlertCircle size={48} className="mb-2" />
                        <p className="italic font-bold">No se encontraron facturas con los filtros aplicados</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRegistry;
