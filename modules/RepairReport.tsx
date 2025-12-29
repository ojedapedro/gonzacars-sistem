
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
  FileText,
  ArrowDownCircle,
  ArrowUpCircle,
  Ticket,
  ChevronRight,
  ShieldCheck,
  Info,
  Layers,
  Fuel
} from 'lucide-react';
import { VehicleRepair, RepairItem, PaymentMethod, Product, ServiceStatus, Installment } from '../types';

const LOGO_URL = "https://i.ibb.co/MDhy5tzK/image-2.png";

const RepairReport: React.FC<{ store: any }> = ({ store }) => {
  const [searchPlate, setSearchPlate] = useState('');
  const [currentRepair, setCurrentRepair] = useState<VehicleRepair | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [showSOAModal, setShowSOAModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [showInventorySearch, setShowInventorySearch] = useState(false);
  const [invSearchTerm, setInvSearchTerm] = useState('');
  
  const [tempPaymentMethod, setTempPaymentMethod] = useState<PaymentMethod>('Efectivo $');
  const [abonoAmount, setAbonoAmount] = useState<number>(0);
  const [abonoMethod, setAbonoMethod] = useState<PaymentMethod>('Efectivo $');

  const filteredInventory = useMemo(() => {
    return (store.inventory || []).filter((p: Product) => 
      p.name.toLowerCase().includes(invSearchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(invSearchTerm.toLowerCase()) ||
      p.barcode?.includes(invSearchTerm)
    );
  }, [store.inventory, invSearchTerm]);

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
      description: type === 'Servicio' ? 'Mano de obra especializada' : 
                   type === 'Consumible' ? 'Insumo técnico' : '',
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

  const registerAbono = () => {
    if (!currentRepair || abonoAmount <= 0) {
      alert('Ingrese un monto válido');
      return;
    }
    const newInstallment: Installment = {
      id: `abono-${Date.now()}`,
      date: new Date().toISOString(),
      amount: abonoAmount,
      method: abonoMethod
    };
    const updated: VehicleRepair = {
      ...currentRepair,
      installments: [...(currentRepair.installments || []), newInstallment]
    };
    setCurrentRepair(updated);
    store.updateRepair(updated);
    setShowAbonoModal(false);
    setAbonoAmount(0);
    alert('Abono registrado con éxito');
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

    alert('Servicio finalizado con éxito.');
    setTimeout(() => window.print(), 500);
  };

  const getStatusStyles = (status: ServiceStatus) => {
    switch (status) {
      case 'Entregado': return 'bg-emerald-600 text-white border-emerald-700';
      case 'Finalizado': return 'bg-blue-600 text-white border-blue-700';
      case 'En Reparación': return 'bg-amber-600 text-white border-amber-700';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getItemTypeStyles = (type: RepairItem['type']) => {
    switch (type) {
      case 'Repuesto': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Servicio': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Consumible': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      
      {/* SECCIÓN DE IMPRESIÓN DE INFORME (ESTILO PDF ADJUNTO) */}
      {currentRepair && (
        <div className="hidden print:block print-only p-12 bg-white text-slate-900 font-sans min-h-screen">
          {/* Header - Basado en Screenshot */}
          <div className="flex justify-between items-start mb-10">
            <div className="flex gap-8 items-center">
              <img src={LOGO_URL} alt="Logo" className="w-24 h-24 object-contain grayscale" />
              <div className="border-l-2 border-slate-200 pl-8">
                <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-1 text-slate-900">Gonzacars C.A.</h1>
                <p className="text-sm font-black text-slate-500 tracking-[0.1em] uppercase">Informe Técnico y Estado de Cuenta</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2">Valencia, Edo. Carabobo | RIF: J-50030426-9</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-slate-900">ORDEN REF: <span className="text-blue-600">#{currentRepair.id.toUpperCase().slice(-8)}</span></p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Fecha Reporte: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="h-[1px] bg-slate-900 w-full mb-10"></div>

          {/* Bloques de Información (Cajas gemelas del screenshot) */}
          <div className="grid grid-cols-2 gap-10 mb-10">
            <div className="bg-white border-2 border-slate-100 p-8 rounded-none relative">
              <h3 className="absolute -top-3 left-4 bg-white px-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">Titular de la Cuenta</h3>
              <div className="space-y-1">
                <p className="font-black text-xl text-slate-900 uppercase leading-none">{currentRepair.ownerName}</p>
                <p className="text-xs font-bold text-slate-500">ID: {currentRepair.customerId}</p>
              </div>
            </div>
            <div className="bg-white border-2 border-slate-100 p-8 rounded-none relative">
              <h3 className="absolute -top-3 left-4 bg-white px-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">Detalle Vehículo</h3>
              <div className="space-y-1">
                <p className="font-black text-xl text-slate-900 uppercase leading-none">{currentRepair.brand} {currentRepair.model}</p>
                <p className="text-xs font-black text-blue-600 tracking-widest">{currentRepair.plate.toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Diagnóstico Técnico */}
          <div className="mb-10">
             <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-widest mb-3 flex items-center gap-2">
                <ClipboardList size={14} className="text-blue-600" /> Diagnóstico y Requerimiento
             </h4>
             <div className="p-8 bg-slate-50 border-l-4 border-slate-900 text-sm italic text-slate-600 leading-relaxed font-medium">
                {currentRepair.diagnosis || "Sin diagnóstico adicional registrado."}
             </div>
          </div>

          {/* Tabla de Cargos (Rediseñada para incluir Cant, Precio, Total) */}
          <div className="mb-12">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-4 uppercase tracking-widest font-black text-[9px]">Fecha</th>
                  <th className="p-4 uppercase tracking-widest font-black text-[9px]">Concepto / Descripción</th>
                  <th className="p-4 uppercase tracking-widest font-black text-[9px] text-center">Cant.</th>
                  <th className="p-4 uppercase tracking-widest font-black text-[9px] text-right">Débito (+)</th>
                  <th className="p-4 uppercase tracking-widest font-black text-[9px] text-right">Saldo USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentRepair.items.map((item, idx) => {
                  const subtotal = item.price * item.quantity;
                  return (
                    <tr key={idx} className="odd:bg-white even:bg-slate-50/50">
                      <td className="p-4 text-[10px] font-bold text-slate-400">{new Date(currentRepair.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <p className="font-black text-slate-800 uppercase text-xs leading-tight">{item.description}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.type} {item.productId ? `| REF: ${item.productId}` : ''}</p>
                      </td>
                      <td className="p-4 text-center font-black text-slate-900 text-xs">{item.quantity}</td>
                      <td className="p-4 text-right font-bold text-slate-500 text-xs">${item.price.toFixed(2)}</td>
                      <td className="p-4 text-right font-black text-slate-900 text-sm">${subtotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
                {/* Abonos realizados */}
                {currentRepair.installments?.map((inst, idx) => (
                  <tr key={`inst-${idx}`} className="bg-emerald-50/30">
                    <td className="p-4 text-[10px] font-bold text-slate-400">{new Date(inst.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <p className="font-black text-emerald-700 uppercase text-xs leading-tight">ABONO RECIBIDO ({inst.method})</p>
                    </td>
                    <td className="p-4 text-center">-</td>
                    <td className="p-4 text-right font-black text-emerald-600 text-xs">-${inst.amount.toFixed(2)}</td>
                    <td className="p-4 text-right font-bold text-slate-300 text-sm">CRÉDITO</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Caja de Total (Estilo del screenshot) */}
          <div className="flex justify-end mb-20">
             <div className="w-80 border-[3px] border-slate-900 p-8 text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Saldo Pendiente</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">${calculateBalance().toFixed(2)} USD</p>
                
                <div className="mt-6 pt-6 border-t-2 border-slate-100">
                  <p className="text-xl font-black text-slate-800 tracking-tight">Equiv: {(calculateBalance() * store.exchangeRate).toLocaleString('es-VE')} Bs</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 italic">Tasa Ref: {store.exchangeRate} Bs/$</p>
                </div>
             </div>
          </div>

          {/* Firmas (Basado en screenshot) */}
          <div className="grid grid-cols-2 gap-20 px-10 text-center font-black uppercase text-[10px] tracking-widest mt-auto">
            <div className="border-t-2 border-slate-900 pt-4">
              Firma Autorizada
            </div>
            <div className="border-t-2 border-slate-900 pt-4">
              Conformidad Cliente
            </div>
          </div>

          {/* Footer de Página con Logo Mini */}
          <div className="mt-20 border-t border-slate-100 pt-10 text-center">
             <img src={LOGO_URL} alt="Logo Small" className="w-12 h-12 object-contain grayscale mx-auto mb-4 opacity-50" />
             <h4 className="text-sm font-black uppercase text-slate-900">Gonzacars C.A.</h4>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">RIF: J-50030426-9</p>
             <p className="text-[8px] font-medium text-slate-400 mt-1 uppercase">Av Bolivar norte; Calle Miranda Valencia Carabobo</p>
          </div>
        </div>
      )}

      {/* UI DE LA APLICACIÓN (NO-PRINT) */}
      <div className="print:hidden h-full flex flex-col">
        {/* Buscador de Órdenes */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 mb-8 flex gap-4 no-print animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24}/>
            <input 
              type="text" 
              placeholder="Buscar vehículo por placa..." 
              className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] uppercase outline-none focus:ring-4 focus:ring-blue-50 font-black tracking-widest transition-all shadow-inner"
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} className="bg-slate-950 text-white px-12 py-5 rounded-[2rem] hover:bg-black flex items-center gap-4 font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-200">
            <Search size={22}/> Localizar Orden
          </button>
        </div>

        {currentRepair ? (
          <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-500 relative">
            {/* Header de la App */}
            <div className="p-10 bg-slate-950 text-white flex justify-between items-start relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12">
                <Wrench size={240} />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-6">
                  <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">{currentRepair.ownerName}</h2>
                  <select 
                    value={currentRepair.status}
                    onChange={(e) => handleStatusChange(e.target.value as ServiceStatus)}
                    className={`px-6 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border-2 transition-all cursor-pointer outline-none shadow-lg ${getStatusStyles(currentRepair.status)}`}
                  >
                    {['Ingresado', 'En Diagnóstico', 'En Reparación', 'Esperando Repuestos', 'Finalizado', 'Entregado'].map(s => (
                      <option key={s} value={s} className="bg-white text-slate-900">{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-slate-400 font-bold text-2xl uppercase tracking-tight flex items-center gap-4">
                    {currentRepair.brand} {currentRepair.model} ({currentRepair.year})
                    <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                    <span className="text-blue-500 font-mono tracking-widest bg-blue-500/10 px-4 py-1 rounded-xl border border-blue-500/20">{currentRepair.plate}</span>
                  </p>
                </div>
              </div>
              <div className="text-right relative z-10 flex flex-col items-end gap-5">
                <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl flex flex-col items-end">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Presupuesto Total Estimado</p>
                    <p className="text-5xl font-black tracking-tighter text-blue-400 leading-none">${calculateTotal().toFixed(2)}</p>
                    <div className="mt-4 pt-4 border-t border-white/5 w-full text-right">
                       <p className="text-[10px] font-bold text-emerald-400 tracking-tight">{(calculateTotal() * store.exchangeRate).toLocaleString('es-VE')} Bs</p>
                    </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowAbonoModal(true)}
                    className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-950/40"
                  >
                    <DollarSign size={18} /> Registrar Abono
                  </button>
                  <button 
                    onClick={() => setShowSOAModal(true)}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-950/40"
                  >
                    <FileText size={18} /> Ver Estado de Cuenta
                  </button>
                </div>
              </div>
            </div>

            <div className="p-10 space-y-12 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/20">
              <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 relative shadow-sm">
                <div className="absolute -top-5 left-12 bg-blue-600 text-white px-8 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl">
                    Diagnóstico Técnico Detallado
                </div>
                <p className="text-slate-700 italic leading-relaxed font-semibold text-xl pt-4">"{currentRepair.diagnosis || 'Pendiente por diagnóstico.'}"</p>
              </div>

              <div className="space-y-8">
                <div className="flex justify-between items-center px-4">
                  <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter flex items-center gap-4">
                    <Layers size={34} className="text-blue-600" /> Detalle de Cargos a la Orden
                  </h3>
                  <div className="flex gap-4">
                    <button onClick={() => setShowInventorySearch(true)} className="px-8 py-4 bg-blue-600 text-white rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95">
                      <Plus size={18}/> + Repuesto
                    </button>
                    <button onClick={() => addItemManually('Servicio')} className="px-8 py-4 bg-slate-900 text-white rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black shadow-xl shadow-slate-200 transition-all active:scale-95">
                      <Wrench size={18}/> + Mano de Obra
                    </button>
                    <button onClick={() => addItemManually('Consumible')} className="px-8 py-4 bg-amber-600 text-white rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-amber-700 shadow-xl shadow-amber-100 transition-all active:scale-95">
                      <Fuel size={18}/> + Consumible
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden border-4 border-slate-950 rounded-[3.5rem] shadow-2xl bg-white">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-white text-left">
                        <th className="px-10 py-7 text-[12px] font-black uppercase tracking-[0.25em] border-r border-white/5">Categoría</th>
                        <th className="px-10 py-7 text-[12px] font-black uppercase tracking-[0.25em] border-r border-white/5">Descripción del Item</th>
                        <th className="px-10 py-7 text-[12px] font-black uppercase tracking-[0.25em] text-center border-r border-white/5">Cant.</th>
                        <th className="px-10 py-7 text-[12px] font-black uppercase tracking-[0.25em] text-right border-r border-white/5">P. Unit. ($)</th>
                        <th className="px-10 py-7 text-[12px] font-black uppercase tracking-[0.25em] text-right">Subtotal</th>
                        <th className="px-10 py-7"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentRepair.items.map(item => (
                        <tr key={item.id} className="group transition-all hover:bg-blue-50/40 even:bg-slate-50/50 border-l-[12px] border-transparent hover:border-blue-600">
                          <td className="px-10 py-7">
                            <span className={`text-[10px] px-4 py-1.5 rounded-full font-black uppercase border-2 shadow-sm ${getItemTypeStyles(item.type)}`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-10 py-7">
                            <input 
                              type="text" 
                              className="w-full bg-transparent font-black text-slate-800 uppercase outline-none focus:text-blue-700 transition-colors text-sm"
                              value={item.description}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            />
                          </td>
                          <td className="px-10 py-7">
                            <div className="flex items-center justify-center gap-4">
                              <button onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))} className="w-9 h-9 flex items-center justify-center bg-white border-2 border-slate-200 rounded-xl text-slate-300 hover:text-blue-600 hover:border-blue-500 shadow-sm transition-all"><Minus size={14}/></button>
                              <span className="font-black text-slate-900 text-lg min-w-[30px] text-center">{item.quantity}</span>
                              <button onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)} className="w-9 h-9 flex items-center justify-center bg-white border-2 border-slate-200 rounded-xl text-slate-300 hover:text-blue-600 hover:border-blue-500 shadow-sm transition-all"><Plus size={14}/></button>
                            </div>
                          </td>
                          <td className="px-10 py-7 text-right">
                            <div className="flex items-center justify-between min-w-[120px]">
                              <span className="text-slate-300 font-black text-sm">$</span>
                              <input 
                                type="number" 
                                className="w-24 text-right bg-transparent font-black text-slate-800 outline-none focus:text-blue-700 text-lg pr-2"
                                value={item.price}
                                onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                              />
                            </div>
                          </td>
                          <td className="px-10 py-7 text-right">
                            <span className="font-black text-slate-950 text-2xl tracking-tighter">${(item.price * item.quantity).toFixed(2)}</span>
                          </td>
                          <td className="px-10 py-7 text-right">
                            <button onClick={() => removeItem(item.id)} className="text-slate-200 hover:text-red-500 p-3 rounded-2xl transition-all hover:bg-red-50">
                              <Trash2 size={24}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botones de Acción de Impresión */}
              <div className="flex flex-wrap gap-6 pt-12 border-t-2 border-slate-100 no-print">
                <button onClick={() => window.print()} className="flex-1 bg-white border-4 border-slate-950 py-7 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] flex items-center justify-center gap-5 hover:bg-slate-50 shadow-2xl transition-all active:scale-[0.98]">
                  <Printer size={30}/> Imprimir Reporte Técnico PDF
                </button>
                {currentRepair.status !== 'Entregado' && (
                  <button onClick={() => setShowPayModal(true)} className="flex-1 bg-blue-600 text-white py-7 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] flex items-center justify-center gap-5 hover:bg-blue-700 shadow-2xl transition-all active:scale-[0.98]">
                    <CheckCircle size={30}/> Procesar Salida y Entrega
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-[650px] text-slate-300 border-[6px] border-dashed border-slate-200 rounded-[5rem] bg-white animate-in fade-in zoom-in duration-700">
            <div className="p-20 bg-slate-50 rounded-full mb-12 shadow-inner group">
              <ClipboardList size={140} className="text-slate-200 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <h4 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Buscador de Reportes</h4>
            <p className="mt-6 text-slate-500 text-center font-bold max-w-md px-12 leading-relaxed text-lg italic">
              "Ingrese la placa del vehículo para gestionar los cargos, pagos y emitir el informe técnico refinado."
            </p>
          </div>
        )}
      </div>

      {/* MODALES EXISTENTES PARA ABONO, INVENTARIO, ETC. */}
      {showInventorySearch && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[4rem] shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden border-8 border-slate-100">
            <div className="p-12 border-b-4 border-slate-50 bg-slate-50/50">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-4xl font-black text-slate-950 uppercase tracking-tighter leading-none">Repuestos Disponibles</h3>
                  <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em] mt-4 flex items-center gap-3">
                    <Package size={18} /> Inventario en tiempo real
                  </p>
                </div>
                <button onClick={() => setShowInventorySearch(false)} className="w-16 h-16 bg-white border-4 border-slate-100 rounded-3xl text-slate-300 hover:text-red-500 transition-all flex items-center justify-center">
                  <X size={32} />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400" size={30}/>
                <input 
                  type="text" 
                  placeholder="Buscar repuesto por nombre o código..." 
                  className="w-full pl-20 pr-10 py-6 bg-white border-4 border-slate-200 rounded-[2.5rem] outline-none focus:ring-8 focus:ring-blue-50 font-black text-xl transition-all shadow-inner"
                  value={invSearchTerm}
                  onChange={(e) => setInvSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-12 space-y-5 bg-white custom-scrollbar">
              {filteredInventory.map((p: Product) => (
                <button 
                  key={p.id}
                  onClick={() => addFromInventory(p)}
                  className="w-full p-8 flex items-center justify-between bg-slate-50 border-4 border-slate-100 rounded-[3rem] hover:border-blue-600 hover:bg-blue-50 transition-all text-left group shadow-sm active:scale-[0.99]"
                >
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 bg-slate-950 text-white rounded-3xl flex items-center justify-center font-black text-2xl group-hover:bg-blue-600 transition-colors shadow-lg">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 group-hover:text-blue-700 uppercase text-2xl tracking-tighter leading-none mb-1">{p.name}</p>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         {p.category} <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span> STOCK: {p.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black text-blue-600 tracking-tighter leading-none mb-1">${Number(p.price).toFixed(2)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAbonoModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[5rem] shadow-2xl max-w-md w-full p-16 animate-in zoom-in duration-300 border-8 border-slate-100 text-center">
            <h3 className="text-5xl font-black text-slate-950 mb-4 uppercase tracking-tighter leading-none">Registrar Abono</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-12">Pago parcial de servicios</p>
            <div className="space-y-10 mt-10">
              <div className="relative">
                <span className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-300">$</span>
                <input 
                  type="number" 
                  className="w-full pl-16 pr-8 py-8 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] font-black text-6xl text-slate-950 outline-none text-center shadow-inner focus:border-emerald-600 transition-all"
                  value={abonoAmount || ''}
                  onChange={(e) => setAbonoAmount(Number(e.target.value))}
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <select 
                className="w-full px-10 py-6 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] font-black uppercase text-xs outline-none text-center appearance-none cursor-pointer hover:border-emerald-200 transition-all"
                value={abonoMethod}
                onChange={(e) => setAbonoMethod(e.target.value as PaymentMethod)}
              >
                {['Efectivo $', 'Efectivo Bs', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <button onClick={registerAbono} className="w-full bg-emerald-600 text-white py-8 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] hover:bg-emerald-700 transition-all shadow-2xl active:scale-95">
                Confirmar Cobro
              </button>
              <button onClick={() => setShowAbonoModal(false)} className="w-full py-4 text-slate-400 font-black uppercase text-[11px] tracking-widest hover:text-slate-900 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showSOAModal && currentRepair && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center z-[110] p-4 no-print overflow-y-auto">
          <div className="bg-white rounded-[4rem] shadow-2xl max-w-5xl w-full flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in duration-300 border-8 border-slate-100">
            <div className="p-12 bg-emerald-700 text-white flex justify-between items-center relative overflow-hidden shrink-0">
               <div className="absolute top-0 right-0 p-12 opacity-10 rotate-45">
                  <FileText size={220} />
               </div>
               <div className="relative z-10">
                  <h3 className="text-5xl font-black uppercase tracking-tighter leading-none">Historial Financiero</h3>
                  <p className="text-emerald-100 text-[11px] font-black uppercase tracking-[0.4em] mt-4 opacity-80 italic">Balance de Transacciones - Orden #{currentRepair.id.toUpperCase()}</p>
               </div>
               <button onClick={() => setShowSOAModal(false)} className="w-16 h-16 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-3xl transition-all relative z-10 text-white border-2 border-white/20 group">
                 <X size={32} className="group-hover:rotate-90 transition-transform duration-500" />
               </button>
            </div>

            <div className="p-12 overflow-y-auto custom-scrollbar flex-1 space-y-12 bg-slate-50/50">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-200 shadow-sm">
                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Acumulado ($)</p>
                     <p className="text-4xl font-black text-slate-900 tracking-tighter">${calculateTotal().toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-200 shadow-sm">
                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Abonado ($)</p>
                     <p className="text-4xl font-black text-emerald-600 tracking-tighter">${calculatePaid().toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-8 rounded-[3rem] border-4 border-emerald-600 shadow-2xl shadow-emerald-900/10">
                     <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-3">Saldo Por Cobrar</p>
                     <p className="text-4xl font-black text-slate-900 tracking-tighter">${calculateBalance().toFixed(2)}</p>
                  </div>
               </div>

               <div className="bg-white rounded-[3.5rem] border-4 border-slate-100 shadow-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white border-b-4 border-slate-950">
                        <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest">Fecha</th>
                        <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest">Descripción / Referencia</th>
                        <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-right">Cargo (+)</th>
                        <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-right">Crédito (-)</th>
                        <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-right">Balance USD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="bg-slate-50/50">
                         <td className="px-10 py-6 text-xs font-bold text-slate-500">{new Date(currentRepair.createdAt).toLocaleDateString()}</td>
                         <td className="px-10 py-6 text-xs font-black text-slate-800 uppercase tracking-tight">Cargo Inicial por Orden de Servicio</td>
                         <td className="px-10 py-6 text-right font-black text-slate-950 text-base">${calculateTotal().toFixed(2)}</td>
                         <td className="px-10 py-6 text-right">-</td>
                         <td className="px-10 py-6 text-right font-black text-slate-950 text-xl tracking-tighter">${calculateTotal().toFixed(2)}</td>
                      </tr>
                      {currentRepair.installments?.map((inst, idx) => {
                        const runningBal = calculateTotal() - currentRepair.installments!.slice(0, idx + 1).reduce((acc, i) => acc + i.amount, 0);
                        return (
                          <tr key={inst.id} className="hover:bg-slate-50 transition-colors group">
                             <td className="px-10 py-6 text-xs font-bold text-slate-500">{new Date(inst.date).toLocaleDateString()}</td>
                             <td className="px-10 py-6 text-xs font-black text-slate-800 uppercase tracking-tight">Abono Registrado ({inst.method})</td>
                             <td className="px-10 py-6 text-right">-</td>
                             <td className="px-10 py-6 text-right">
                                <span className="flex items-center justify-end gap-2 text-emerald-600 font-black">
                                  <ArrowDownCircle size={14} className="text-emerald-500" /> ${inst.amount.toFixed(2)}
                                </span>
                             </td>
                             <td className="px-10 py-6 text-right font-black text-slate-950 text-xl tracking-tighter">
                                ${runningBal.toFixed(2)}
                             </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
               </div>
            </div>

            <div className="p-10 border-t-4 border-slate-100 bg-white flex justify-between items-center shrink-0">
               <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pendiente en Bs (Ref)</span>
                  <span className="text-3xl font-black text-emerald-700 tracking-tighter leading-none">{(calculateBalance() * store.exchangeRate).toLocaleString('es-VE')} Bs</span>
               </div>
               <div className="flex gap-6">
                  <button 
                    onClick={() => window.print()}
                    className="bg-slate-950 text-white px-10 py-5 rounded-[2.5rem] font-black uppercase text-[11px] tracking-widest hover:bg-black transition-all shadow-2xl flex items-center gap-3"
                  >
                    <Printer size={22}/> Imprimir Estado de Cuenta
                  </button>
                  <button 
                    onClick={() => setShowSOAModal(false)}
                    className="bg-slate-100 text-slate-500 px-10 py-5 rounded-[2.5rem] font-black uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all border-2 border-slate-200"
                  >
                    Cerrar
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {showPayModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[5rem] shadow-2xl max-w-xl w-full p-16 text-center border-8 border-slate-100 animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
               <CheckCircle size={60} />
            </div>
            <h3 className="text-5xl font-black mb-6 text-slate-950 uppercase tracking-tighter leading-none">Cerrar Orden</h3>
            <p className="text-slate-500 mb-12 font-bold text-lg leading-relaxed">
              Está a punto de cerrar la orden y entregar el vehículo. Se liquidará el saldo pendiente de:
              <span className="text-emerald-600 font-black text-5xl tracking-tighter block mt-4 animate-pulse">${calculateBalance().toFixed(2)}</span>
            </p>
            <div className="space-y-4">
               <div className="flex flex-col items-center mb-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Vía de pago final:</p>
                  <select 
                    className="w-full px-10 py-5 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] font-black uppercase text-xs outline-none text-center appearance-none cursor-pointer"
                    value={tempPaymentMethod}
                    onChange={(e) => setTempPaymentMethod(e.target.value as PaymentMethod)}
                  >
                    {['Efectivo $', 'Efectivo Bs', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
               </div>
               <button onClick={finalizeRepair} className="w-full py-8 bg-slate-950 text-white rounded-[3rem] font-black uppercase text-sm tracking-[0.4em] hover:bg-black shadow-2xl transition-all active:scale-95">
                 Liquidar y Generar PDF Final
               </button>
               <button onClick={() => setShowPayModal(false)} className="w-full py-4 text-slate-400 font-black uppercase text-[11px] tracking-widest hover:text-red-500 transition-colors">Volver</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairReport;
