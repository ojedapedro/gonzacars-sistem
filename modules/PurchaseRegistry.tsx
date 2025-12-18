
import React, { useState } from 'react';
import { Truck, Save } from 'lucide-react';
import { Purchase } from '../types';

const PurchaseRegistry: React.FC<{ store: any }> = ({ store }) => {
  const [formData, setFormData] = useState<Partial<Purchase>>({
    date: new Date().toISOString().split('T')[0],
    type: 'Contado',
    quantity: 1,
    price: 0
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
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
          <Truck className="text-blue-600" size={32}/>
          <h3 className="text-2xl font-bold text-slate-800">Registro de Compras (Stock)</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Compra</label>
              <input required type="date" className="w-full px-4 py-2 border rounded-lg" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
              <input required type="text" className="w-full px-4 py-2 border rounded-lg" value={formData.provider || ''} onChange={(e) => setFormData({...formData, provider: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nro. Factura</label>
              <input required type="text" className="w-full px-4 py-2 border rounded-lg" value={formData.invoiceNumber || ''} onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Compra</label>
              <select className="w-full px-4 py-2 border rounded-lg" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as 'Contado' | 'Crédito'})}>
                <option value="Contado">Contado</option>
                <option value="Crédito">Crédito</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl space-y-4">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Información del Producto</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Repuesto/Producto</label>
                <input required type="text" className="w-full px-4 py-2 border rounded-lg" value={formData.productName || ''} onChange={(e) => setFormData({...formData, productName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                <input required type="text" className="w-full px-4 py-2 border rounded-lg" value={formData.category || ''} onChange={(e) => setFormData({...formData, category: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Costo Unit. ($)</label>
                  <input required type="number" step="0.01" className="w-full px-4 py-2 border rounded-lg" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
                  <input required type="number" className="w-full px-4 py-2 border rounded-lg" value={formData.quantity || ''} onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})} />
                </div>
              </div>
            </div>
            <div className="text-right pt-4 border-t border-slate-200">
              <p className="text-slate-500 text-sm font-medium">Total Inversión</p>
              <p className="text-2xl font-bold text-blue-600">${((formData.price || 0) * (formData.quantity || 1)).toFixed(2)}</p>
            </div>
          </div>

          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 flex items-center justify-center gap-2 transition-all">
            <Save size={20}/> Registrar Compra e Inventario
          </button>
        </form>
      </div>
    </div>
  );
};

export default PurchaseRegistry;
