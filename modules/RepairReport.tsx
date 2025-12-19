
import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Printer, 
  CheckCircle, 
  Package, 
  Wrench, 
  Fuel, 
  Minus, 
  ClipboardList, 
  DollarSign, 
  ChevronDown, 
  Camera, 
  X,
  History, 
  AlertCircle,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Clock,
  CalendarDays
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
  
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  
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

  const calculateBalance = () => {
    return calculateTotal() - calculatePaid();
  };

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
    alert('Abono registrado correctamente.');
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
    
    store.addSale({
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
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

    alert('Reparación finalizada y stock actualizado.');
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
    <div className="p-8 max-w-7xl mx-auto">
      {/* Cabecera de Impresión */}
      <div className="print-only mb-10 border-b-2 border-slate-900 pb-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="Logo Gonzacars" className="w-20 h-20 object-contain" />
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">Gonzacars C.A.</h1>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">R.I.F. J-12345678-9 | Taller & Repuestos</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-black uppercase text-blue-600">Informe de Servicio</h2>
            <p className="text-xs font-bold text-slate-400">Fecha: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Buscador - No se imprime */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-8 flex gap-4 no-print animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
          <input 
            type="text" 
            placeholder="Ingrese Placa para localizar reparación (Ej: PED123OJ)" 
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl uppercase outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all"
            value={searchPlate}
            onChange={(e) => setSearchPlate(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button onClick={handleSearch} className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl hover:bg-black flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg shadow-slate-200">
          <Search size={18}/> Buscar Orden
        </button>
      </div>

      {currentRepair ? (
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          {/* Header del Informe */}
          <div className="p-10 bg-slate-900 text-white flex justify-between items-start relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <Wrench size={200} />
            </div>
            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <h2 className="text-4xl font-black uppercase tracking-tighter">{currentRepair.ownerName}</h2>
                <div className="no-print">
                   <select 
                    value={currentRepair.status}
                    onChange={(e) => handleStatusChange(e.target.value as ServiceStatus)}
                    className={`appearance-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all cursor-pointer outline-none shadow-lg ${getStatusStyles(currentRepair.status)}`}
                  >
                    {['Ingresado', 'En Diagnóstico', 'En Reparación', 'Esperando Repuestos', 'Finalizado', 'Entregado'].map(s => (
                      <option key={s} value={s} className="bg-white text-slate-900">{s}</option>
                    ))}
                  </select>
                </div>
                <span className={`print-only px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${getStatusStyles(currentRepair.status)}`}>
                  {currentRepair.status}
                </span>
              </div>
              <p className="text-slate-400 font-bold text-lg uppercase tracking-tight">
                {currentRepair.brand} {currentRepair.model} ({currentRepair.year}) 
                <span className="mx-3 text-slate-600">|</span> 
                Placa: <span className="text-blue-400 font-mono">{currentRepair.plate}</span>
              </p>
            </div>
            <div className="text-right relative z-10">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha de Ingreso</p>
                <p className="text-xl font-black">{new Date(currentRepair.createdAt).toLocaleDateString()}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Responsable: {currentRepair.responsible}</p>
              </div>
            </div>
          </div>

          <div className="p-10 space-y-10">
            {/* Diagnóstico */}
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 relative">
               <div className="absolute -top-4 left-8 bg-blue-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                  Diagnóstico Técnico
               </div>
               <p className="text-slate-700 italic leading-relaxed font-medium text-lg pt-2">"{currentRepair.diagnosis}"</p>
            </div>

            {/* Tabla de Cargos Estilizada */}
            <div>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6 no-print">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                  <ClipboardList size={24} className="text-blue-600" /> Detalle de Cargos
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setShowInventorySearch(true)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    <Package size={14}/> + Repuesto
                  </button>
                  <button onClick={() => addItemManually('Servicio')} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-slate-200">
                    <Wrench size={14}/> + Mano de Obra
                  </button>
                </div>
              </div>

              <div className="overflow-hidden border-2 border-slate-900 rounded-[2.5rem] shadow-2xl bg-white">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left bg-slate-900 text-white">
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] border-r border-slate-800">Categoría</th>
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] border-r border-slate-800">Descripción del Item</th>
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-center border-r border-slate-800">Cant.</th>
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-right border-r border-slate-800">Precio ($)</th>
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-right">Subtotal</th>
                      <th className="px-8 py-6 no-print"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentRepair.items.map(item => (
                      <tr key={item.id} className="group hover:bg-blue-50/50 transition-all border-l-8 border-transparent hover:border-blue-600 even:bg-slate-50/50">
                        <td className="px-8 py-6">
                          <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase shadow-sm border-2 ${
                            item.type === 'Repuesto' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            item.type === 'Consumible' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>{item.type}</span>
                        </td>
                        <td className="px-8 py-6">
                          <input 
                            type="text" 
                            className="w-full bg-transparent border-b-2 border-transparent group-hover:border-blue-200 focus:border-blue-500 px-0 py-2 transition-all font-bold text-slate-800 outline-none uppercase text-sm"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          />
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-center gap-3">
                            <button onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))} className="no-print p-2 hover:bg-blue-600 hover:text-white rounded-lg transition-all border border-slate-200"><Minus size={12}/></button>
                            <span className="font-black text-slate-900 text-sm min-w-[30px] text-center">{item.quantity}</span>
                            <button onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)} className="no-print p-2 hover:bg-blue-600 hover:text-white rounded-lg transition-all border border-slate-200"><Plus size={12}/></button>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-slate-400 font-black">$</span>
                            <input 
                              type="number" 
                              className="w-24 text-right bg-transparent border-b-2 border-transparent group-hover:border-blue-200 focus:border-blue-500 px-0 py-2 transition-all font-black text-sm"
                              value={item.price}
                              onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                            />
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="font-black text-slate-900 text-base tracking-tighter">${(item.price * item.quantity).toFixed(2)}</span>
                        </td>
                        <td className="px-8 py-6 text-right no-print">
                          <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 p-2.5 rounded-xl transition-all hover:bg-red-50">
                            <Trash2 size={20}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {currentRepair.items.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-8 py-24 text-center text-slate-300 font-black uppercase tracking-[0.3em] text-xs italic">La orden de reparación no contiene cargos registrados</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECCIÓN DE ABONOS Y SALDOS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
               {/* Historial de Pagos (Lado Izquierdo) */}
               <div className="lg:col-span-7 space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                     <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <History size={18} className="text-blue-600" /> Historial de Pagos / Abonos
                     </h3>
                     <button 
                        onClick={() => setShowAbonoModal(true)}
                        className="no-print px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                     >
                        + Registrar Abono
                     </button>
                  </div>

                  <div className="space-y-4">
                    {currentRepair.installments && currentRepair.installments.length > 0 ? (
                      currentRepair.installments.map((inst, idx) => (
                        <div key={inst.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 flex justify-between items-center shadow-sm hover:border-blue-600 transition-all group">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm group-hover:bg-blue-600 transition-colors">
                                 {idx + 1}
                              </div>
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <CalendarDays size={14} className="text-blue-500" />
                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                       {new Date(inst.date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                 </div>
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Vía: <span className="text-slate-900">{inst.method}</span></p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-2xl font-black text-emerald-600 tracking-tighter">+ ${Number(inst.amount).toFixed(2)}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase italic">Confirmado</p>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-16 text-center bg-slate-50 rounded-[2.5rem] border-4 border-dotted border-slate-200">
                         <DollarSign size={40} className="mx-auto text-slate-300 mb-3" />
                         <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Esperando pagos del cliente</p>
                      </div>
                    )}
                  </div>
               </div>

               {/* Resumen de Cuenta (Lado Derecho) */}
               <div className="lg:col-span-5">
                  <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border-4 border-slate-800">
                    <DollarSign className="absolute -bottom-10 -right-10 text-white/5" size={250} />
                    <div className="relative z-10 space-y-8">
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3">Total Presupuestado</p>
                        <h3 className="text-5xl font-black tracking-tighter">${calculateTotal().toFixed(2)}</h3>
                      </div>

                      <div className="space-y-4 pt-6 border-t border-white/10">
                        <div className="flex justify-between items-center text-emerald-400">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pagos Acumulados</span>
                          <span className="text-2xl font-black tracking-tight">${calculatePaid().toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center pt-6 border-t border-white/20">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em]">Saldo Final</span>
                            <span className="text-[9px] font-bold text-slate-600 uppercase mt-1">Por liquidar</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-6xl font-black tracking-tighter ${calculateBalance() > 0 ? 'text-blue-500' : 'text-emerald-500'}`}>
                              ${calculateBalance().toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-8 bg-blue-600/10 p-6 rounded-[2.5rem] border border-blue-500/30">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2 text-center">Referencia Bs (Tasa: {store.exchangeRate})</p>
                        <p className="text-3xl font-black text-center tracking-tighter text-blue-100">{(calculateBalance() * store.exchangeRate).toLocaleString('es-VE')} Bs</p>
                        <p className="text-[8px] font-bold text-slate-600 uppercase text-center mt-2 italic">Valor sujeto a cambio de tasa diaria</p>
                      </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* Acciones Finales */}
            <div className="flex flex-wrap gap-4 pt-10 no-print border-t border-slate-200">
              <button onClick={() => window.print()} className="flex-1 min-w-[200px] bg-white border-2 border-slate-900 py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-slate-50 transition-all shadow-xl">
                <Printer size={22}/> Imprimir Informe
              </button>
              
              {currentRepair.status !== 'Entregado' && (
                <div className="flex-1 min-w-[400px] flex gap-4">
                  <div className="flex-1 relative">
                    <Wallet size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select 
                      className="w-full pl-14 pr-4 py-6 bg-slate-50 border-2 border-slate-200 rounded-[2.5rem] font-black uppercase text-[11px] tracking-widest outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer shadow-sm"
                      value={tempPaymentMethod}
                      onChange={(e) => setTempPaymentMethod(e.target.value as PaymentMethod)}
                    >
                      {['Efectivo Bs', 'Efectivo $', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={() => setShowPayModal(true)} className="flex-[1.5] bg-blue-600 text-white py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95">
                    <CheckCircle size={22}/> Finalizar y Entregar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[600px] text-slate-400 border-4 border-dashed border-slate-200 rounded-[4rem] bg-white/50">
          <div className="p-12 bg-slate-100 rounded-full mb-8">
            <ClipboardList size={100} className="text-slate-300 opacity-50" />
          </div>
          <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Consulta de Órdenes</h4>
          <p className="mt-4 text-slate-500 text-center font-bold max-w-md px-10">Ingrese la placa del vehículo para gestionar los detalles de facturación, abonos y entrega del servicio técnico.</p>
        </div>
      )}

      {/* Modal de Registro de Abono */}
      {showAbonoModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-md w-full p-12 animate-in zoom-in duration-300 border-4 border-slate-100">
            <div className="w-24 h-24 bg-blue-600 text-white rounded-[2.5rem] flex items-center justify-center mb-10 rotate-3 shadow-2xl shadow-blue-200">
               <DollarSign size={50} />
            </div>
            <h3 className="text-4xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Nuevo Abono</h3>
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mb-10">Abono parcial a la cuenta</p>
            
            <div className="space-y-8">
              <div className="space-y-3">
                 <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-3">Monto en Dólares ($)</label>
                 <div className="relative">
                    <DollarSign size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600" />
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full pl-14 pr-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-4xl text-slate-900 outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                      value={abonoAmount || ''}
                      onChange={(e) => setAbonoAmount(Number(e.target.value))}
                      placeholder="0.00"
                      autoFocus
                    />
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-3">Canal de Pago</label>
                 <select 
                  className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black uppercase text-[11px] tracking-widest outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                  value={abonoMethod}
                  onChange={(e) => setAbonoMethod(e.target.value as PaymentMethod)}
                >
                  {['Efectivo $', 'Efectivo Bs', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-6 pt-6">
                 <button onClick={() => setShowAbonoModal(false)} className="flex-1 py-6 text-slate-400 font-black uppercase text-[11px] tracking-widest hover:text-red-500 transition-colors">Cancelar</button>
                 <button onClick={registerAbono} className="flex-[2] bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-100 transition-all">Confirmar Abono</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairReport;
