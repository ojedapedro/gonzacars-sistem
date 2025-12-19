
import React, { useState } from 'react';
import { Package, Search, Edit3, AlertCircle, Barcode, RotateCw } from 'lucide-react';
import { Product } from '../types';

const InventoryModule: React.FC<{ store: any }> = ({ store }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBarcodeId, setEditingBarcodeId] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState(0);
  const [newBarcode, setNewBarcode] = useState('');

  const filtered = store.inventory.filter((p: Product) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.includes(searchTerm)
  );

  const handlePriceUpdate = (id: string) => {
    store.updateInventoryPrice(id, newPrice);
    setEditingId(null);
  };

  const handleQuantityUpdate = (id: string, val: number) => {
    store.updateInventoryQuantity(id, val);
  };

  const handleBarcodeUpdate = (id: string) => {
    store.updateBarcode(id, newBarcode);
    setEditingBarcodeId(null);
  };

  const regenerateBarcode = (id: string) => {
    store.updateBarcode(id, store.generateBarcode());
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Control de Inventario</h3>
          <p className="text-slate-500 text-sm">Gestión de stock, precios y códigos de barras</p>
        </div>
        <div className="relative w-96">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
          <input 
            type="text" 
            placeholder="Buscar por nombre, categoría o código..." 
            className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-left border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Código</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Producto</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Stock (Editar)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Costo ($)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Precio Venta ($)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p: Product) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  {editingBarcodeId === p.id ? (
                    <div className="flex items-center gap-2">
                      <input 
                        className="w-32 text-xs p-1 border rounded"
                        value={newBarcode}
                        onChange={(e) => setNewBarcode(e.target.value)}
                        onBlur={() => handleBarcodeUpdate(p.id)}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col group cursor-pointer" onClick={() => { setEditingBarcodeId(p.id); setNewBarcode(p.barcode || ''); }}>
                      <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-600 transition-colors">
                        <Barcode size={14}/>
                        <span className="font-mono text-xs font-bold">{p.barcode || 'SIN CÓDIGO'}</span>
                      </div>
                      {p.barcode && <div className="h-4 w-20 bg-[repeating-linear-gradient(90deg,black,black_1px,transparent_1px,transparent_3px)] mt-1 opacity-20"></div>}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">{p.name}</div>
                  <div className="text-xs text-slate-500 font-medium uppercase">{p.category}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <input 
                      type="number" 
                      className={`w-16 px-2 py-1 border rounded-lg text-sm font-black text-center outline-none transition-all ${p.quantity <= 5 ? 'bg-red-50 border-red-200 text-red-600 focus:ring-2 focus:ring-red-500' : 'bg-green-50 border-green-200 text-green-600 focus:ring-2 focus:ring-green-500'}`}
                      value={p.quantity}
                      onChange={(e) => handleQuantityUpdate(p.id, Number(e.target.value))}
                    />
                    {p.quantity <= 5 && <AlertCircle size={14} className="text-red-500" />}
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-medium text-slate-400">${p.cost.toFixed(2)}</td>
                <td className="px-6 py-4 text-right">
                  {editingId === p.id ? (
                    <input 
                      type="number" 
                      className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                      autoFocus
                      onBlur={() => handlePriceUpdate(p.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePriceUpdate(p.id)}
                    />
                  ) : (
                    <span className="font-bold text-blue-600">${p.price.toFixed(2)}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-1">
                    <button 
                      onClick={() => { setEditingId(p.id); setNewPrice(p.price); }} 
                      title="Editar Precio"
                      className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit3 size={18}/>
                    </button>
                    <button 
                      onClick={() => regenerateBarcode(p.id)} 
                      title="Regenerar Código"
                      className="p-2 text-slate-400 hover:text-purple-600 transition-colors"
                    >
                      <RotateCw size={18}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filtered.length === 0 && (
          <div className="p-10 text-center text-slate-400">
            <Package size={48} className="mx-auto mb-4 opacity-10" />
            No se encontraron productos en el inventario
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryModule;
