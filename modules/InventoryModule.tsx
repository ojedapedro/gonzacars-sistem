
import React, { useState } from 'react';
import { Package, Search, Edit3, AlertCircle, Barcode, RotateCw, History, X, Truck, Calendar, DollarSign, ArrowRight } from 'lucide-react';
import { Product, Purchase } from '../types';

const InventoryModule: React.FC<{ store: any }> = ({ store }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBarcodeId, setEditingBarcodeId] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState(0);
  const [newBarcode, setNewBarcode] = useState('');
  
  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

  const openHistory = (product: Product) => {
    setSelectedProduct(product);
    setShowHistoryModal(true);
  };

  const getProductHistory = (product: Product): Purchase[] => {
    return store.purchases.filter((p: Purchase) => 
      p.productId === product.id || p.productName === product.name
    ).sort((a: Purchase, b: Purchase) => b.date.localeCompare(a.date));
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Control de Inventario</h3>
          <p className="text-slate-500 font-medium">Gestión de stock, precios y auditoría de abastecimiento</p>
        </div>
        <div className="relative w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input 
            type="text" 
            placeholder="Buscar por nombre, categoría o código..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 transition-all font-bold text-sm shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Código / Barcode</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Costo ($)</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Precio Venta ($)</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.map((p: Product) => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-5">
                  {editingBarcodeId === p.id ? (
                    <div className="flex items-center gap-2">
                      <input 
                        className="w-32 text-xs p-2 border border-blue-200 rounded-lg outline-none font-mono font-bold"
                        value={newBarcode}
                        onChange={(e) => setNewBarcode(e.target.value)}
                        onBlur={() => handleBarcodeUpdate(p.id)}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col group/code cursor-pointer" onClick={() => { setEditingBarcodeId(p.id); setNewBarcode(p.barcode || ''); }}>
                      <div className="flex items-center gap-2 text-slate-400 group-hover/code:text-blue-600 transition-colors">
                        <Barcode size={14}/>
                        <span className="font-mono text-xs font-bold">{p.barcode || 'N/A'}</span>
                      </div>
                      {p.barcode && <div className="h-4 w-16 bg-[repeating-linear-gradient(90deg,black,black_1px,transparent_1px,transparent_3px)] mt-1 opacity-10"></div>}
                    </div>
                  )}
                </td>
                <td className="px-8 py-5">
                  <div className="font-black text-slate-800 uppercase text-sm tracking-tight">{p.name}</div>
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{p.category}</div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center justify-center gap-2">
                    <input 
                      type="number" 
                      className={`w-16 px-2 py-1.5 border rounded-xl text-xs font-black text-center outline-none transition-all ${p.quantity <= 5 ? 'bg-red-50 border-red-200 text-red-600 focus:ring-4 focus:ring-red-50' : 'bg-slate-50 border-slate-100 text-slate-700 focus:ring-4 focus:ring-blue-50'}`}
                      value={p.quantity}
                      onChange={(e) => handleQuantityUpdate(p.id, Number(e.target.value))}
                    />
                    {p.quantity <= 5 && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
                  </div>
                </td>
                <td className="px-8 py-5 text-right font-bold text-slate-400 text-sm">${Number(p.cost || 0).toFixed(2)}</td>
                <td className="px-8 py-5 text-right">
                  {editingId === p.id ? (
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-24 px-3 py-1.5 border border-blue-200 rounded-lg focus:ring-4 focus:ring-blue-50 outline-none font-black text-right text-sm"
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                      autoFocus
                      onBlur={() => handlePriceUpdate(p.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePriceUpdate(p.id)}
                    />
                  ) : (
                    <span className="font-black text-blue-600 text-lg tracking-tighter">${Number(p.price || 0).toFixed(2)}</span>
                  )}
                </td>
                <td className="px-8 py-5">
                  <div className="flex justify-center gap-1">
                    <button 
                      onClick={() => { setEditingId(p.id); setNewPrice(p.price); }} 
                      title="Editar Precio"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Edit3 size={18}/>
                    </button>
                    <button 
                      onClick={() => openHistory(p)} 
                      title="Ver Historial de Compras"
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                    >
                      <History size={18}/>
                    </button>
                    <button 
                      onClick={() => regenerateBarcode(p.id)} 
                      title="Regenerar Código"
                      className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
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
          <div className="py-32 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-slate-200">
               <Package size={40} />
            </div>
            <p className="font-black text-slate-300 uppercase tracking-widest text-xs">No se encontraron productos en el inventario</p>
          </div>
        )}
      </div>

      {/* Product Purchase History Modal */}
      {showHistoryModal && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 bg-slate-950 text-white flex justify-between items-start relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5">
                  <History size={150} />
               </div>
               <div className="relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                      <History size={20} />
                    </div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Historial de Compras</h3>
                  </div>
                  <div className="mt-4">
                    <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]">Auditoría de Suministro</p>
                    <p className="text-slate-300 font-bold text-xl uppercase tracking-tight mt-1">{selectedProduct.name}</p>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Barcode: {selectedProduct.barcode || 'N/A'}</p>
                  </div>
               </div>
               <button onClick={() => setShowHistoryModal(false)} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all relative z-10 text-white">
                 <X size={24} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/50">
              {(() => {
                const history = getProductHistory(selectedProduct);
                return history.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Unidades Compradas</p>
                          <p className="text-3xl font-black text-slate-900 tracking-tighter">{history.reduce((acc, h) => acc + Number(h.quantity || 0), 0)}</p>
                       </div>
                       <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ultimo Costo Registrado</p>
                          <p className="text-3xl font-black text-emerald-600 tracking-tighter">${Number(history[0].price || 0).toFixed(2)}</p>
                       </div>
                       <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Veces Abastecido</p>
                          <p className="text-3xl font-black text-blue-600 tracking-tighter">{history.length}</p>
                       </div>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Proveedor</th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Cantidad</th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Costo ($)</th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {history.map((h) => (
                            <tr key={h.id} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2 text-slate-500">
                                   <Calendar size={12} className="text-emerald-500" />
                                   <span className="text-xs font-bold">{new Date(h.date).toLocaleDateString()}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                   <Truck size={12} className="text-blue-400" />
                                   <span className="text-xs font-black text-slate-700 uppercase truncate max-w-[150px]">{h.provider}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-full">{h.quantity}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-xs font-black text-slate-500">${Number(h.price || 0).toFixed(2)}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-sm font-black text-emerald-600">${Number(h.total || 0).toFixed(2)}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 text-center">
                     <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Truck size={32} />
                     </div>
                     <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">No hay órdenes de compra vinculadas a este producto.</p>
                     <p className="text-slate-400 text-[9px] mt-1 italic">Solo se muestran productos registrados a través del módulo de Compras.</p>
                  </div>
                );
              })()}
            </div>

            <div className="p-8 border-t border-slate-100 flex justify-end">
               <button 
                onClick={() => setShowHistoryModal(false)}
                className="bg-slate-900 text-white px-10 py-4 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
               >
                 Entendido
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryModule;
