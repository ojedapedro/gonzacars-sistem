
import React, { useState } from 'react';
import { Search, Plus, Trash2, Printer, CheckCircle, Package, Wrench, Fuel, Minus, ClipboardList, DollarSign, ChevronDown, Camera, Download, Wallet } from 'lucide-react';
import { VehicleRepair, RepairItem, PaymentMethod, Product, ServiceStatus } from '../types';

const RepairReport: React.FC<{ store: any }> = ({ store }) => {
  const [searchPlate, setSearchPlate] = useState('');
  const [currentRepair, setCurrentRepair] = useState<VehicleRepair | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showInventorySearch, setShowInventorySearch] = useState(false);
  const [invSearchTerm, setInvSearchTerm] = useState('');
  const [tempPaymentMethod, setTempPaymentMethod] = useState<PaymentMethod>('Efectivo $');

  const handleSearch = () => {
    const found = store.repairs.find((r: VehicleRepair) => r.plate.toUpperCase() === searchPlate.toUpperCase());
    if (found) {
      setCurrentRepair({ ...found });
      if (found.paymentMethod) setTempPaymentMethod(found.paymentMethod);
    } else {
      alert('Placa no encontrada');
      setCurrentRepair(null);
    }
  };

  const handleStatusChange = (newStatus: ServiceStatus) => {
    if (!currentRepair) return;
    const updated = { ...currentRepair, status: newStatus };
    setCurrentRepair(updated);
    store.updateRepair(updated);
  };

  const addItemManually = (type: RepairItem['type']) => {
    if (!currentRepair) return;
    const newItem: RepairItem = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      description: type === 'Servicio' ? 'Mano de obra' : '',
      quantity: 1,
      price: 0
    };
    const updated = { ...currentRepair, items: [...currentRepair.items, newItem] };
    setCurrentRepair(updated);
    store.updateRepair(updated);
  };

  const addFromInventory = (product: Product) => {
    if (!currentRepair) return;
    const newItem: RepairItem = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'Repuesto',
      description: product.name,
      quantity: 1,
      price: product.price
    };
    const updated = { ...currentRepair, items: [...currentRepair.items, newItem] };
    setCurrentRepair(updated);
    store.updateRepair(updated);
    setShowInventorySearch(false);
    setInvSearchTerm('');
  };

  const updateItem = (itemId: string, field: keyof RepairItem, value: any) => {
    if (!currentRepair) return;
    const updatedItems = currentRepair.items.map(i => i.id === itemId ? { ...i, [field]: value } : i);
    const updated = { ...currentRepair, items: updatedItems };
    setCurrentRepair(updated);
    store.updateRepair(updated);
  };

  const removeItem = (itemId: string) => {
    if (!currentRepair) return;
    const updatedItems = currentRepair.items.filter(i => i.id !== itemId);
    const updated = { ...currentRepair, items: updatedItems };
    setCurrentRepair(updated);
    store.updateRepair(updated);
  };

  const calculateTotal = () => {
    if (!currentRepair) return 0;
    return currentRepair.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  };

  const finalizeRepair = () => {
    if (!currentRepair) return;
    const updated: VehicleRepair = {
      ...currentRepair,
      status: 'Entregado',
      finishedAt: new Date().toISOString(),
      paymentMethod: tempPaymentMethod
    };
    store.updateRepair(updated);
    setCurrentRepair(updated);
    setShowPayModal(false);
    
    store.addSale({
      id: Math.random().toString(36).substr(2, 9),
      customerId: currentRepair.customerId,
      date: new Date().toISOString().split('T')[0],
      customerName: currentRepair.ownerName,
      items: currentRepair.items.map(i => ({ productId: i.id, name: i.description, price: i.price, quantity: i.quantity })),
      total: calculateTotal(),
      iva: false,
      paymentMethod: tempPaymentMethod
    });

    alert('Reparación finalizada e informe generado.');
    setTimeout(() => window.print(), 500);
  };

  const getStatusStyles = (status: ServiceStatus) => {
    switch (status) {
      case 'Entregado': return 'bg-green-500 text-white';
      case 'Finalizado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'En Reparación': return 'bg-blue-600 text-white';
      case 'En Diagnóstico': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Esperando Repuestos': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredInventory = store.inventory.filter((p: Product) => 
    p.name.toLowerCase().includes(invSearchTerm.toLowerCase()) || 
    p.barcode?.includes(invSearchTerm)
  );

  return (
    <div className="p-8">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 flex gap-4 no-print">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
          <input 
            type="text" 
            placeholder="Ingrese Placa (ej: ABC-123)" 
            className="w-full pl-10 pr-4 py-2 border rounded-lg uppercase outline-none focus:ring-2 focus:ring-blue-500 font-bold"
            value={searchPlate}
            onChange={(e) => setSearchPlate(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button onClick={handleSearch} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-bold transition-all">
          <Search size={18}/> Buscar
        </button>
      </div>

      {currentRepair ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header con Selector de Estado */}
          <div className="p-8 bg-slate-900 text-white flex justify-between items-start">
            <div>
              <div className="flex flex-wrap items-center gap-4 mb-2">
                <h2 className="text-3xl font-black uppercase tracking-tight">{currentRepair.ownerName}</h2>
                
                {/* Selector de Estado Dinámico */}
                <div className="relative no-print">
                  <select 
                    value={currentRepair.status}
                    onChange={(e) => handleStatusChange(e.target.value as ServiceStatus)}
                    className={`appearance-none pl-4 pr-10 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all cursor-pointer outline-none ${getStatusStyles(currentRepair.status)}`}
                  >
                    {['Ingresado', 'En Diagnóstico', 'En Reparación', 'Esperando Repuestos', 'Finalizado', 'Entregado'].map(s => (
                      <option key={s} value={s} className="bg-white text-slate-900">{s}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                
                {/* Badge para impresión */}
                <span className={`print-only px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${getStatusStyles(currentRepair.status)}`}>
                  {currentRepair.status}
                </span>
              </div>
              <p className="text-slate-400 font-medium">{currentRepair.brand} {currentRepair.model} ({currentRepair.year}) — Placa: <span className="text-blue-400 font-mono font-bold">{currentRepair.plate}</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400 font-bold">Ingreso: {new Date(currentRepair.createdAt).toLocaleDateString()}</p>
              <p className="text-xs text-slate-500 font-medium">Responsable: {currentRepair.responsible}</p>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Diagnosis */}
              <div className="lg:col-span-7 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ClipboardList size={16} /> Diagnóstico Técnico
                </h3>
                <p className="text-slate-700 italic leading-relaxed font-medium">"{currentRepair.diagnosis}"</p>
              </div>

              {/* Evidence Photos Grid - Minimalist approach */}
              {currentRepair.evidencePhotos && currentRepair.evidencePhotos.length > 0 && (
                <div className="lg:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Camera size={16} /> Evidencias
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {currentRepair.evidencePhotos.map((photo, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white">
                        <img src={photo} className="w-full h-full object-cover" alt={`Evidencia ${idx + 1}`} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center no-print p-2">
                           <a 
                            href={photo} 
                            download={`evidencia_${currentRepair.plate}_${idx + 1}.png`}
                            className="bg-white p-1.5 rounded-md text-blue-600 shadow-xl hover:scale-105 transition-transform"
                            title="Descargar imagen"
                          >
                            <Download size={14} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Items Management */}
            <div>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6 no-print">
                <h3 className="text-lg font-black text-slate-800 border-l-4 border-blue-600 pl-3 uppercase tracking-tighter">Detalle de Cargos</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setShowInventorySearch(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
                    <Package size={14}/> + Inventario
                  </button>
                  <button onClick={() => addItemManually('Servicio')} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-purple-200 transition-all">
                    <Wrench size={14}/> + Mano de Obra
                  </button>
                  <button onClick={() => addItemManually('Consumible')} className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-green-200 transition-all">
                    <Fuel size={14}/> + Consumible
                  </button>
                </div>
              </div>

              <div className="overflow-hidden border border-slate-100 rounded-xl">
                <table className="w-full">
                  <thead>
                    <tr className="text-left bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cant.</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Precio ($)</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Subtotal</th>
                      <th className="px-6 py-4 no-print"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {currentRepair.items.map(item => (
                      <tr key={item.id} className="group hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`text-[9px] px-2 py-1 rounded-md font-black uppercase ${
                            item.type === 'Repuesto' ? 'bg-blue-100 text-blue-700' :
                            item.type === 'Consumible' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                          }`}>{item.type}</span>
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="text" 
                            className="w-full bg-transparent border-none focus:ring-0 font-bold text-slate-800 outline-none"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Especifique..."
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3 font-mono">
                            <button onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))} className="p-1 hover:text-blue-600 transition-colors no-print"><Minus size={12}/></button>
                            <input 
                              type="number" 
                              className="w-10 text-center bg-transparent font-black border-none focus:ring-0 p-0"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                            />
                            <button onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)} className="p-1 hover:text-blue-600 transition-colors no-print"><Plus size={12}/></button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <span className="text-slate-400 text-xs font-bold">$</span>
                            <input 
                              type="number" 
                              className="w-16 text-right bg-transparent border-none focus:ring-0 font-black p-0"
                              value={item.price}
                              onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-black text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 text-right no-print">
                          <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {currentRepair.items.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-300 font-bold italic">No hay cargos registrados aún</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="mt-8 flex flex-col items-end gap-2 bg-slate-50 p-8 rounded-2xl border border-slate-100">
                <div className="flex justify-between w-72 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-3 mb-1">
                  <span>Subtotal</span>
                  <span className="text-slate-800">${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-72 text-[10px] font-bold text-slate-400 uppercase">
                  <span>En Bolívares</span>
                  <span className="text-slate-600">{(calculateTotal() * store.exchangeRate).toLocaleString('es-VE')} Bs</span>
                </div>
                
                {/* Visualización de Pago en Reporte Final */}
                {(currentRepair.status === 'Entregado' || currentRepair.paymentMethod) && (
                  <div className="flex justify-between w-72 text-xs font-black text-blue-600 uppercase tracking-widest pt-3">
                    <span>Método de Pago</span>
                    <span>{currentRepair.paymentMethod || tempPaymentMethod}</span>
                  </div>
                )}

                <div className="flex justify-between w-72 items-center mt-6 border-t border-slate-200 pt-5">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Orden</span>
                  <span className="text-4xl font-black text-blue-600 tracking-tighter">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 pt-8 no-print border-t border-slate-100">
              <button 
                onClick={() => window.print()}
                className="flex-1 min-w-[200px] border-2 border-slate-200 py-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <Printer size={18}/> Imprimir Informe
              </button>
              
              {currentRepair.status !== 'Entregado' && (
                <div className="flex-1 min-w-[300px] flex gap-2">
                  <div className="flex-1 relative">
                    <Wallet size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select 
                      className="w-full pl-11 pr-4 py-4 bg-slate-100 border-2 border-slate-100 rounded-xl font-black uppercase text-[10px] tracking-widest outline-none focus:border-blue-500 transition-all appearance-none"
                      value={tempPaymentMethod}
                      onChange={(e) => setTempPaymentMethod(e.target.value as PaymentMethod)}
                    >
                      {['Efectivo Bs', 'Efectivo $', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={() => setShowPayModal(true)}
                    className="flex-[1.5] bg-green-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-green-700 shadow-xl shadow-green-100 transition-all"
                  >
                    <CheckCircle size={18}/> Procesar Cierre
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[500px] text-slate-400 border-2 border-dashed border-slate-200 rounded-[3rem] bg-white/50">
          <div className="p-8 bg-slate-100 rounded-full mb-6">
            <ClipboardList size={64} className="text-slate-300 opacity-50" />
          </div>
          <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Gestor de Reparaciones</h4>
          <p className="mt-2 text-slate-500 text-center font-medium max-w-sm px-6">Localice un vehículo por placa para gestionar sus estados, cargos y cierre definitivo de orden.</p>
        </div>
      )}

      {/* Inventory Search Modal */}
      {showInventorySearch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[80vh]">
            <div className="p-8 border-b">
              <h3 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-tighter">Inventario de Repuestos</h3>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                <input 
                  type="text" 
                  placeholder="Buscar repuesto..." 
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 font-bold"
                  value={invSearchTerm}
                  onChange={(e) => setInvSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {filteredInventory.map((p: Product) => (
                <button 
                  key={p.id}
                  onClick={() => addFromInventory(p)}
                  className="w-full p-4 flex items-center justify-between hover:bg-blue-50/50 rounded-2xl transition-all text-left group border border-transparent hover:border-blue-100"
                >
                  <div>
                    <p className="font-black text-slate-800 group-hover:text-blue-700 uppercase text-sm leading-tight">{p.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">{p.category} • STOCK: {p.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-blue-600 text-lg">${p.price.toFixed(2)}</p>
                    <p className="text-[10px] font-mono text-slate-400">{p.barcode}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-6 border-t flex gap-3">
              <button onClick={() => setShowInventorySearch(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 text-center">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
              <CheckCircle size={48} />
            </div>
            <h3 className="text-3xl font-black mb-2 text-slate-800 uppercase tracking-tighter">Confirmar Cierre</h3>
            <p className="text-slate-500 mb-8 font-medium italic">Se registrará el pago por <strong>{tempPaymentMethod}</strong> y se cerrará la orden de forma definitiva.</p>
            
            <button 
              onClick={finalizeRepair}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all mb-4"
            >
              Confirmar y Finalizar
            </button>

            <button onClick={() => setShowPayModal(false)} className="w-full py-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-all">Regresar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairReport;
