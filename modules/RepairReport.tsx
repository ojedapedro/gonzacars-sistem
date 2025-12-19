
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Printer, 
  CheckCircle, 
  Package, 
  Wrench, 
  Minus, 
  ClipboardList, 
  DollarSign, 
  History, 
  Wallet, 
  CalendarDays,
  X,
  AlertTriangle,
  Receipt
} from 'lucide-react';
import { VehicleRepair, RepairItem, PaymentMethod, Product, ServiceStatus, Installment } from '../types';

const LOGO_URL = "https://i.ibb.co/MDhy5tzK/image-2.png";

const RepairReport: React.FC<{ store: any }> = ({ store }) => {
  const [searchPlate, setSearchPlate] = useState('');
  const [currentRepair, setCurrentRepair] = useState<VehicleRepair | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [showInventorySearch, setShowInventorySearch] = useState(false);
  const [invSearchTerm, setInvSearchTerm] = useState('');
  
  const [tempPaymentMethod, setTempPaymentMethod] = useState<PaymentMethod>('Efectivo $');
  const [abonoAmount, setAbonoAmount] = useState<number>(0);
  const [abonoMethod, setAbonoMethod] = useState<PaymentMethod>('Efectivo $');

  const handleSearch = () => {
    if (!searchPlate.trim()) {
      alert('Por favor ingrese una placa');
      return;
    }

    const found = store.repairs.find((r: VehicleRepair) => 
      r.plate.toUpperCase().replace(/\s/g, '') === searchPlate.toUpperCase().replace(/\s/g, '')
    );

    if (found) {
      setCurrentRepair({ ...found });
      if (found.paymentMethod) setTempPaymentMethod(found.paymentMethod);
    } else {
      alert('Placa no encontrada en el sistema');
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
      productId: product.id,
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

  const calculatePaid = () => {
    if (!currentRepair || !currentRepair.installments) return 0;
    return currentRepair.installments.reduce((acc, inst) => acc + Number(inst.amount), 0);
  };

  const calculateBalance = () => calculateTotal() - calculatePaid();

  const filteredInventory = useMemo(() => {
    const inv = store.inventory || [];
    return inv.filter((p: Product) => 
      p.name.toLowerCase().includes(invSearchTerm.toLowerCase()) || 
      (p.barcode && p.barcode.toLowerCase().includes(invSearchTerm.toLowerCase()))
    );
  }, [store.inventory, invSearchTerm]);

  const registerAbono = () => {
    if (!currentRepair || abonoAmount <= 0) return;
    const balance = calculateBalance();
    if (abonoAmount > balance) {
      alert(`El abono ($${abonoAmount}) no puede ser mayor al saldo pendiente ($${balance.toFixed(2)})`);
      return;
    }

    const newInstallment: Installment = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      amount: abonoAmount,
      method: abonoMethod
    };

    const updated: VehicleRepair = {
      ...currentRepair,
      installments: [...(currentRepair.installments || []), newInstallment]
    };

    store.updateRepair(updated);
    setCurrentRepair(updated);
    setShowAbonoModal(false);
    setAbonoAmount(0);
  };

  const finalizeRepair = () => {
    if (!currentRepair) return;
    const balance = calculateBalance();
    let updatedInstallments = [...(currentRepair.installments || [])];
    
    if (balance > 0) {
      updatedInstallments.push({
        id: `final-${Date.now()}`,
        date: new Date().toISOString(),
        amount: balance,
        method: tempPaymentMethod
      });
    }

    const updated: VehicleRepair = {
      ...currentRepair,
      status: 'Entregado',
      finishedAt: new Date().toISOString(),
      paymentMethod: tempPaymentMethod,
      installments: updatedInstallments
    };

    store.updateRepair(updated);
    setCurrentRepair(updated);
    setShowPayModal(false);
    
    // Al registrar esta venta, el store restará automáticamente los productos del inventario
    store.addSale({
      id: `FAC-${Date.now().toString().slice(-6)}`,
      customerId: currentRepair.customerId,
      date: new Date().toISOString().split('T')[0],
      customerName: currentRepair.ownerName,
      items: currentRepair.items
        .filter(i => i.type === 'Repuesto' && i.productId)
        .map(i => ({ 
          productId: i.productId as string, 
          name: i.description, 
          price: i.price, 
          quantity: i.quantity 
        })),
      total: calculateTotal(),
      iva: false,
      paymentMethod: tempPaymentMethod
    });

    alert('Servicio finalizado. Stock de repuestos actualizado.');
    setTimeout(() => window.print(), 500);
  };

  const getStatusStyles = (status: ServiceStatus) => {
    switch (status) {
      case 'Entregado': return 'bg-green-600 text-white border-green-700';
      case 'Finalizado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'En Reparación': return 'bg-blue-600 text-white border-blue-700';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      {/* Header Impresión */}
      <div className="print-only mb-10 border-b-4 border-slate-900 pb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <img src={LOGO_URL} alt="Logo" className="w-24 h-24 object-contain" />
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter">Gonzacars C.A.</h1>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Taller Mecánico Especializado & Venta de Repuestos</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black text-blue-600 uppercase tracking-tight">Orden de Servicio</h2>
            <p className="font-bold text-slate-400">Emisión: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Buscador de Órdenes */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 mb-8 flex gap-4 no-print animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
          <input 
            type="text" 
            placeholder="Localizar reparación por placa (Ej: GZ123AB)..." 
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] uppercase outline-none focus:ring-4 focus:ring-blue-50 font-black tracking-widest transition-all"
            value={searchPlate}
            onChange={(e) => setSearchPlate(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button onClick={handleSearch} className="bg-slate-900 text-white px-10 py-4 rounded-[1.5rem] hover:bg-black flex items-center gap-3 font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-200">
          <Search size={18}/> Buscar Orden
        </button>
      </div>

      {currentRepair ? (
        <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-500">
          {/* Encabezado del Informe */}
          <div className="p-10 bg-slate-950 text-white flex justify-between items-start relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <Wrench size={220} />
            </div>
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-4">
                <h2 className="text-4xl font-black uppercase tracking-tighter">{currentRepair.ownerName}</h2>
                <select 
                  value={currentRepair.status}
                  onChange={(e) => handleStatusChange(e.target.value as ServiceStatus)}
                  className={`no-print px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all cursor-pointer outline-none ${getStatusStyles(currentRepair.status)}`}
                >
                  {['Ingresado', 'En Diagnóstico', 'En Reparación', 'Esperando Repuestos', 'Finalizado', 'Entregado'].map(s => (
                    <option key={s} value={s} className="bg-white text-slate-900">{s}</option>
                  ))}
                </select>
                <span className={`print-only px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${getStatusStyles(currentRepair.status)}`}>
                  {currentRepair.status}
                </span>
              </div>
              <p className="text-slate-400 font-bold text-xl uppercase tracking-tight flex items-center gap-3">
                {currentRepair.brand} {currentRepair.model} ({currentRepair.year})
                <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                <span className="text-blue-400 font-mono tracking-[0.2em]">{currentRepair.plate}</span>
              </p>
            </div>
            <div className="text-right relative z-10 no-print">
               <div className="bg-white/10 backdrop-blur-md p-5 rounded-[2rem] border border-white/10 inline-block">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Costo Estimado</p>
                  <p className="text-3xl font-black tracking-tighter text-blue-400">${calculateTotal().toFixed(2)}</p>
               </div>
            </div>
          </div>

          <div className="p-10 space-y-12 overflow-y-auto custom-scrollbar flex-1">
            {/* Diagnóstico */}
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 relative">
               <div className="absolute -top-4 left-10 bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                  Diagnóstico Técnico Inicial
               </div>
               <p className="text-slate-700 italic leading-relaxed font-semibold text-lg pt-2">"{currentRepair.diagnosis || 'No se registró un diagnóstico detallado.'}"</p>
            </div>

            {/* Detalle de Cargos */}
            <div className="space-y-6">
              <div className="flex justify-between items-center no-print">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                  <ClipboardList size={28} className="text-blue-600" /> Detalle de Cargos
                </h3>
                <div className="flex gap-3">
                  <button onClick={() => setShowInventorySearch(true)} className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
                    <Plus size={16}/> + Repuesto
                  </button>
                  <button onClick={() => addItemManually('Servicio')} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black shadow-xl shadow-slate-200 transition-all">
                    <Wrench size={16}/> + Mano de Obra
                  </button>
                </div>
              </div>

              {/* TABLA MEJORADA CON ZEBRA STRIPES */}
              <div className="overflow-hidden border-2 border-slate-950 rounded-[3rem] shadow-2xl bg-white">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-white text-left">
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] border-r border-slate-900">Categoría</th>
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] border-r border-slate-900">Descripción del Item</th>
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-center border-r border-slate-900">Cant.</th>
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-right border-r border-slate-900">Precio Unit. ($)</th>
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-right">Subtotal</th>
                      <th className="px-8 py-6 no-print"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentRepair.items.map(item => (
                      <tr key={item.id} className="group transition-all hover:bg-blue-50/50 even:bg-slate-50/80 border-l-8 border-transparent hover:border-blue-600">
                        <td className="px-8 py-6">
                          <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase border-2 shadow-sm ${
                            item.type === 'Repuesto' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            item.type === 'Servicio' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>{item.type}</span>
                        </td>
                        <td className="px-8 py-6">
                          <input 
                            type="text" 
                            className="w-full bg-transparent font-bold text-slate-800 uppercase outline-none focus:text-blue-700 transition-colors"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          />
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-center gap-3">
                            <button onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))} className="no-print p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 shadow-sm"><Minus size={12}/></button>
                            <span className="font-black text-slate-900 min-w-[20px] text-center">{item.quantity}</span>
                            <button onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)} className="no-print p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 shadow-sm"><Plus size={12}/></button>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-slate-400 font-black text-xs">$</span>
                            <input 
                              type="number" 
                              className="w-24 text-right bg-transparent font-black text-slate-800 outline-none focus:text-blue-700"
                              value={item.price}
                              onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                            />
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="font-black text-slate-950 text-lg tracking-tighter">${(item.price * item.quantity).toFixed(2)}</span>
                        </td>
                        <td className="px-8 py-6 text-right no-print">
                          <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 p-2 rounded-xl transition-all hover:bg-red-50">
                            <Trash2 size={20}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {currentRepair.items.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-8 py-32 text-center text-slate-300 font-black uppercase tracking-[0.4em] text-xs italic">La orden de reparación no contiene cargos registrados</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Finanzas del Informe */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
               {/* Abonos */}
               <div className="lg:col-span-7 space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                     <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <History size={18} className="text-blue-600" /> Historial de Abonos
                     </h3>
                     <button onClick={() => setShowAbonoModal(true)} className="no-print px-5 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all">
                        + Registrar Abono
                     </button>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                    {currentRepair.installments && currentRepair.installments.length > 0 ? (
                      currentRepair.installments.map((inst, idx) => (
                        <div key={inst.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 flex justify-between items-center shadow-sm group hover:border-blue-500 transition-all">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black group-hover:bg-blue-600 transition-colors">
                                 {idx + 1}
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <CalendarDays size={12} className="text-blue-500" /> {new Date(inst.date).toLocaleDateString()}
                                 </p>
                                 <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Método: <span className="text-slate-800">{inst.method}</span></p>
                              </div>
                           </div>
                           <p className="text-2xl font-black text-emerald-600 tracking-tighter">+ ${Number(inst.amount).toFixed(2)}</p>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border-4 border-dotted border-slate-200">
                         <DollarSign size={48} className="mx-auto text-slate-200 mb-4" />
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No se han registrado abonos previos</p>
                      </div>
                    )}
                  </div>
               </div>

               {/* Resumen Final */}
               <div className="lg:col-span-5">
                  <div className="bg-slate-950 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden border-4 border-slate-800">
                    <DollarSign className="absolute -bottom-10 -right-10 text-white/5" size={280} />
                    <div className="relative z-10 space-y-10">
                      <div>
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Total Presupuestado</p>
                        <h3 className="text-6xl font-black tracking-tighter leading-none">${calculateTotal().toFixed(2)}</h3>
                      </div>

                      <div className="space-y-5 pt-8 border-t border-white/10">
                        <div className="flex justify-between items-center text-emerald-400">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total Abonado</span>
                          <span className="text-2xl font-black tracking-tight">${calculatePaid().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-8 border-t border-white/20">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-blue-500 uppercase tracking-[0.4em]">Saldo Pendiente</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">A liquidar hoy</span>
                          </div>
                          <span className={`text-6xl font-black tracking-tighter ${calculateBalance() > 0 ? 'text-blue-500' : 'text-emerald-500'}`}>
                            ${calculateBalance().toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-10 bg-blue-600/10 p-8 rounded-[3rem] border border-blue-500/30 text-center">
                        <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] mb-3">Valor en Bolívares (Tasa: {store.exchangeRate})</p>
                        <p className="text-4xl font-black tracking-tighter text-blue-50">{(calculateBalance() * store.exchangeRate).toLocaleString('es-VE')} Bs</p>
                      </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* Acciones Finales */}
            <div className="flex flex-wrap gap-4 pt-10 no-print border-t border-slate-200">
              <button onClick={() => window.print()} className="flex-1 bg-white border-4 border-slate-950 py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-slate-50 shadow-xl transition-all">
                <Printer size={24}/> Imprimir Informe Completo
              </button>
              {currentRepair.status !== 'Entregado' && (
                <div className="flex-1 min-w-[450px] flex gap-4">
                  <div className="flex-1 relative">
                    <Wallet size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select 
                      className="w-full pl-16 pr-6 py-6 bg-slate-50 border-2 border-slate-200 rounded-[2.5rem] font-black uppercase text-xs tracking-widest outline-none focus:border-blue-600 appearance-none shadow-sm cursor-pointer"
                      value={tempPaymentMethod}
                      onChange={(e) => setTempPaymentMethod(e.target.value as PaymentMethod)}
                    >
                      {['Efectivo $', 'Efectivo Bs', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={() => setShowPayModal(true)} className="flex-[1.5] bg-blue-600 text-white py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95">
                    <CheckCircle size={24}/> Liquidar y Entregar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center h-[600px] text-slate-300 border-4 border-dashed border-slate-200 rounded-[4rem] bg-white/50 animate-in fade-in zoom-in duration-700">
          <div className="p-16 bg-slate-100 rounded-full mb-10 shadow-inner">
            <ClipboardList size={120} className="text-slate-200" />
          </div>
          <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Consulta de Informes</h4>
          <p className="mt-4 text-slate-500 text-center font-bold max-w-md px-10 leading-relaxed">Ingrese la placa del vehículo en el campo superior para cargar el historial de reparaciones, abonos y facturación.</p>
        </div>
      )}

      {/* Modal Inventario CORREGIDO */}
      {showInventorySearch && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-3xl w-full flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-8 duration-500 border-4 border-slate-100">
            <div className="p-10 border-b-2 border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter leading-none">Catálogo de Repuestos</h3>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                    <Package size={14} /> Inventario en Tiempo Real ({store.inventory?.length || 0})
                  </p>
                </div>
                <button onClick={() => setShowInventorySearch(false)} className="p-4 bg-white border-2 border-slate-200 rounded-[1.5rem] text-slate-400 hover:text-red-500 transition-all shadow-sm">
                  <X size={24} />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24}/>
                <input 
                  type="text" 
                  placeholder="Escriba el nombre del repuesto o código de barras..." 
                  className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-200 rounded-[2rem] outline-none focus:ring-4 focus:ring-blue-50 font-bold text-lg transition-all"
                  value={invSearchTerm}
                  onChange={(e) => setInvSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-4 bg-white custom-scrollbar">
              {(filteredInventory.length > 0) ? (
                filteredInventory.map((p: Product) => (
                  <button 
                    key={p.id}
                    onClick={() => addFromInventory(p)}
                    className="w-full p-6 flex items-center justify-between bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] hover:border-blue-500 hover:bg-blue-50 transition-all text-left group shadow-sm hover:shadow-xl"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${p.quantity <= 5 ? 'bg-red-50 text-red-600 border-2 border-red-100' : 'bg-blue-600 text-white shadow-lg shadow-blue-200'}`}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 group-hover:text-blue-700 uppercase text-lg leading-tight tracking-tight">{p.name}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white border border-slate-200 px-3 py-1 rounded-lg">{p.category}</span>
                          <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${p.quantity <= 5 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {p.quantity <= 5 && <AlertTriangle size={12} />} STOCK: {p.quantity} UNID.
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-8">
                       <div>
                          <p className="text-3xl font-black text-blue-600 tracking-tighter leading-none">${Number(p.price).toFixed(2)}</p>
                          <p className="text-[10px] font-mono font-bold text-slate-300 uppercase mt-2 tracking-widest">{p.barcode || 'SIN-BARRA'}</p>
                       </div>
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-200 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                          <Plus size={24} />
                       </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-24 text-center">
                  <Package size={80} className="mx-auto text-slate-100 mb-6" />
                  <p className="text-xl font-black text-slate-300 uppercase tracking-widest">No hay repuestos disponibles</p>
                  <p className="text-slate-400 font-medium mt-2">Verifique su inventario o refine su búsqueda.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Abonos */}
      {showAbonoModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[4rem] shadow-2xl max-w-md w-full p-12 animate-in zoom-in duration-300 border-4 border-slate-100 text-center">
            <div className="w-24 h-24 bg-blue-600 text-white rounded-[2.5rem] flex items-center justify-center mb-10 mx-auto rotate-3 shadow-2xl shadow-blue-200">
               <Receipt size={50} />
            </div>
            <h3 className="text-4xl font-black text-slate-950 mb-2 uppercase tracking-tighter">Registrar Abono</h3>
            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-10">Actualización de deuda</p>
            
            <div className="space-y-8">
              <div className="space-y-3">
                 <div className="relative">
                    <DollarSign size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600" />
                    <input 
                      type="number" 
                      className="w-full pl-16 pr-8 py-6 bg-slate-50 border-2 border-slate-200 rounded-[2rem] font-black text-5xl text-slate-950 outline-none focus:ring-8 focus:ring-blue-50 transition-all text-center"
                      value={abonoAmount || ''}
                      onChange={(e) => setAbonoAmount(Number(e.target.value))}
                      placeholder="0.00"
                      autoFocus
                    />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Actual: <span className="text-blue-600">${calculateBalance().toFixed(2)}</span></p>
              </div>
              <select 
                className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-200 rounded-[2rem] font-black uppercase text-xs tracking-widest outline-none appearance-none shadow-sm text-center"
                value={abonoMethod}
                onChange={(e) => setAbonoMethod(e.target.value as PaymentMethod)}
              >
                {['Efectivo $', 'Efectivo Bs', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <div className="flex flex-col gap-3 pt-6">
                <button onClick={registerAbono} className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-blue-700 shadow-2xl shadow-blue-100 transition-all">
                  Confirmar Cobro
                </button>
                <button onClick={() => setShowAbonoModal(false)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-red-500 transition-colors">Cancelar Operación</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Entrega */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[4rem] shadow-2xl max-w-lg w-full p-12 text-center border-4 border-slate-100 animate-in zoom-in duration-300">
            <div className="w-28 h-28 bg-emerald-500 text-white rounded-[3rem] flex items-center justify-center mx-auto mb-10 rotate-6 shadow-2xl shadow-emerald-200">
              <CheckCircle size={64} />
            </div>
            <h3 className="text-4xl font-black mb-3 text-slate-950 uppercase tracking-tighter">Finalizar Servicio</h3>
            <p className="text-slate-500 mb-10 font-bold leading-relaxed px-6">
              Se registrará el pago final de <span className="text-blue-600 font-black text-2xl tracking-tighter block my-2">${calculateBalance().toFixed(2)}</span> mediante <span className="text-slate-900 font-black">{tempPaymentMethod}</span>. Se emitirá el comprobante de salida y descontará el stock.
            </p>
            <div className="flex flex-col gap-4">
              <button onClick={finalizeRepair} className="w-full py-6 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.3em] hover:bg-black shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                <Receipt size={24} /> Confirmar Entrega
              </button>
              <button onClick={() => setShowPayModal(false)} className="w-full py-4 text-slate-400 font-black uppercase text-[11px] tracking-widest hover:text-slate-800">Cerrar Ventana</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairReport;
