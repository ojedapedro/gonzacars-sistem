
import React, { useState } from 'react';
// Added missing ClipboardList and DollarSign icons to the lucide-react import
import { Search, Plus, Trash2, Printer, CheckCircle, Package, Wrench, Fuel, Minus, Save, ClipboardList, DollarSign } from 'lucide-react';
import { VehicleRepair, RepairItem, PaymentMethod, Product } from '../types';

const RepairReport: React.FC<{ store: any }> = ({ store }) => {
  const [searchPlate, setSearchPlate] = useState('');
  const [currentRepair, setCurrentRepair] = useState<VehicleRepair | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showInventorySearch, setShowInventorySearch] = useState(false);
  const [invSearchTerm, setInvSearchTerm] = useState('');

  const handleSearch = () => {
    const found = store.repairs.find((r: VehicleRepair) => r.plate.toUpperCase() === searchPlate.toUpperCase());
    if (found) {
      setCurrentRepair({ ...found });
    } else {
      alert('Placa no encontrada');
      setCurrentRepair(null);
    }
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

  const finalizeRepair = (method: PaymentMethod) => {
    if (!currentRepair) return;
    const updated: VehicleRepair = {
      ...currentRepair,
      status: 'Entregado',
      finishedAt: new Date().toISOString(),
      paymentMethod: method
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
      paymentMethod: method
    });

    alert('Reparación finalizada. Procediendo a imprimir informe...');
    window.print();
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
            className="w-full pl-10 pr-4 py-2 border rounded-lg uppercase outline-none focus:ring-2 focus:ring-blue-500"
            value={searchPlate}
            onChange={(e) => setSearchPlate(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button onClick={handleSearch} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium transition-all">
          <Search size={18}/> Buscar
        </button>
      </div>

      {currentRepair ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-8 bg-slate-900 text-white flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold">{currentRepair.ownerName}</h2>
                <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${currentRepair.status === 'Entregado' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {currentRepair.status}
                </span>
              </div>
              <p className="text-slate-400">{currentRepair.brand} {currentRepair.model} ({currentRepair.year}) - Placa: <span className="text-blue-400 font-mono">{currentRepair.plate}</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Ingreso: {new Date(currentRepair.createdAt).toLocaleDateString()}</p>
              <p className="text-xs text-slate-500">Responsable: {currentRepair.responsible}</p>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Diagnosis */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <ClipboardList size={16} /> Diagnóstico Técnico
              </h3>
              <p className="text-slate-700 italic leading-relaxed">"{currentRepair.diagnosis}"</p>
            </div>

            {/* Items Management */}
            <div>
              <div className="flex justify-between items-center mb-6 no-print">
                <h3 className="text-lg font-bold text-slate-800 border-l-4 border-blue-600 pl-3">Detalle de Cargos</h3>
                <div className="flex gap-2">
                  <button onClick={() => setShowInventorySearch(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-all">
                    <Package size={16}/> + Desde Inventario
                  </button>
                  <button onClick={() => addItemManually('Servicio')} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-purple-200 transition-all">
                    <Wrench size={16}/> + Mano de Obra
                  </button>
                  <button onClick={() => addItemManually('Consumible')} className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-200 transition-all">
                    <Fuel size={16}/> + Consumible
                  </button>
                </div>
              </div>

              <div className="overflow-hidden border border-slate-100 rounded-xl">
                <table className="w-full">
                  <thead>
                    <tr className="text-left bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Cantidad</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Precio ($)</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Subtotal</th>
                      <th className="px-6 py-4 no-print"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {currentRepair.items.map(item => (
                      <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`text-[9px] px-2 py-1 rounded-full font-black uppercase ${
                            item.type === 'Repuesto' ? 'bg-blue-100 text-blue-700' :
                            item.type === 'Consumible' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                          }`}>{item.type}</span>
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="text" 
                            className="w-full bg-transparent border-none focus:ring-0 font-medium text-slate-800 outline-none"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Especifique..."
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))} className="p-1 hover:text-blue-600 transition-colors no-print"><Minus size={14}/></button>
                            <input 
                              type="number" 
                              className="w-12 text-center bg-transparent font-bold border-none focus:ring-0"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                            />
                            <button onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)} className="p-1 hover:text-blue-600 transition-colors no-print"><Plus size={14}/></button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-slate-400 text-sm">$</span>
                            <input 
                              type="number" 
                              className="w-20 text-right bg-transparent border-none focus:ring-0 font-bold"
                              value={item.price}
                              onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
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
                        <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">No hay cargos registrados aún</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="mt-8 flex flex-col items-end gap-2 bg-slate-50 p-8 rounded-2xl">
                <div className="flex justify-between w-64 text-sm text-slate-500 border-b pb-2 mb-2">
                  <span>Subtotal USD</span>
                  <span className="font-bold text-slate-800">${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-64 text-sm text-slate-500">
                  <span>Monto en Bolívares</span>
                  <span className="font-bold text-slate-800">{(calculateTotal() * store.exchangeRate).toLocaleString('es-VE')} Bs</span>
                </div>
                <div className="flex justify-between w-64 items-center mt-4 border-t border-slate-200 pt-4">
                  <span className="text-lg font-bold text-slate-400 uppercase tracking-tighter">Total a Cobrar</span>
                  <span className="text-4xl font-black text-blue-600">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-8 no-print border-t border-slate-100">
              <button 
                onClick={() => window.print()}
                className="flex-1 border border-slate-300 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
              >
                <Printer size={20}/> Vista de Impresión
              </button>
              {currentRepair.status !== 'Entregado' && (
                <button 
                  onClick={() => setShowPayModal(true)}
                  className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg shadow-green-100 transition-all"
                >
                  <CheckCircle size={20}/> Procesar Cierre y Pago
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[500px] text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
          <div className="p-6 bg-slate-100 rounded-full mb-6">
            <ClipboardList size={48} className="text-slate-300" />
          </div>
          <h4 className="text-xl font-bold text-slate-800">Gestor de Reparaciones</h4>
          <p className="mt-2 text-slate-500 text-center max-w-xs px-6">Busque el vehículo por número de placa para gestionar sus cargos y generar el reporte final.</p>
        </div>
      )}

      {/* Inventory Search Modal */}
      {showInventorySearch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[80vh]">
            <div className="p-8 border-b">
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Seleccionar de Inventario</h3>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                <input 
                  type="text" 
                  placeholder="Buscar repuesto..." 
                  className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={invSearchTerm}
                  onChange={(e) => setInvSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredInventory.map((p: Product) => (
                <button 
                  key={p.id}
                  onClick={() => addFromInventory(p)}
                  className="w-full p-4 flex items-center justify-between hover:bg-blue-50 rounded-xl transition-all text-left group"
                >
                  <div>
                    <p className="font-bold text-slate-800 group-hover:text-blue-700">{p.name}</p>
                    <p className="text-xs text-slate-500 uppercase font-medium">{p.category} • Stock: {p.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">${p.price.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400">Cod: {p.barcode}</p>
                  </div>
                </button>
              ))}
              {filteredInventory.length === 0 && (
                <div className="p-10 text-center text-slate-400 italic">No se encontraron repuestos</div>
              )}
            </div>

            <div className="p-6 border-t flex gap-3">
              <button onClick={() => setShowInventorySearch(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <DollarSign size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-slate-800">Finalizar Operación</h3>
            <p className="text-slate-500 mb-8">Seleccione la forma de pago utilizada por el cliente para cerrar la orden.</p>
            
            <div className="grid grid-cols-2 gap-3 mb-8">
              {(['Efectivo Bs', 'Efectivo $', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'] as PaymentMethod[]).map(m => (
                <button 
                  key={m}
                  onClick={() => finalizeRepair(m)}
                  className="px-4 py-4 border rounded-2xl font-bold text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all text-sm shadow-sm"
                >
                  {m}
                </button>
              ))}
            </div>

            <button onClick={() => setShowPayModal(false)} className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-all">Regresar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairReport;
