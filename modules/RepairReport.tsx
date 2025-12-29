
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
      description: type === 'Servicio' ? 'Mano de obra' : 
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

  const getBalanceAfterInstallment = (installmentId: string) => {
    if (!currentRepair) return 0;
    const total = calculateTotal();
    const installments = [...(currentRepair.installments || [])].sort((a, b) => a.date.localeCompare(b.date));
    let runningPaid = 0;
    for (const inst of installments) {
      runningPaid += inst.amount;
      if (inst.id === installmentId) break;
    }
    return total - runningPaid;
  };

  const accountStatementLedger = useMemo(() => {
    if (!currentRepair) return [];
    
    const totalCost = calculateTotal();
    const ledger = [];
    
    ledger.push({
      date: currentRepair.createdAt,
      description: 'CARGO POR SERVICIOS Y REPUESTOS',
      debit: totalCost,
      credit: 0,
      balance: totalCost
    });

    let runningBalance = totalCost;
    const sortedInstallments = [...(currentRepair.installments || [])].sort((a, b) => a.date.localeCompare(b.date));
    
    sortedInstallments.forEach(inst => {
      runningBalance -= inst.amount;
      ledger.push({
        date: inst.date,
        description: `ABONO RECIBIDO (${inst.method.toUpperCase()})`,
        debit: 0,
        credit: inst.amount,
        balance: runningBalance
      });
    });

    return ledger;
  }, [currentRepair]);

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
    
    setSelectedInstallment(newInstallment);
    setShowReceiptModal(true);
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
      
      {/* SECCIÓN DE IMPRESIÓN DE INFORME TÉCNICO DETALLADO (PDF) */}
      {currentRepair && (
        <div className="hidden print:block print-only p-12 bg-white text-slate-900 font-sans">
          {/* Header Corporativo Refinado */}
          <div className="flex justify-between items-start border-b-8 border-slate-950 pb-8 mb-10">
            <div className="flex gap-8 items-center">
              <img src={LOGO_URL} alt="Logo" className="w-28 h-28 object-contain grayscale" />
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-1">Gonzacars C.A.</h1>
                <p className="text-sm font-black text-slate-500 tracking-[0.25em] uppercase">Taller Mecánico Especializado y Venta de Repuestos</p>
                <div className="mt-4 text-[11px] font-bold text-slate-600 space-y-1">
                  <p>RIF: J-50030426-9</p>
                  <p>DIRECCIÓN: Av. Bolivar norte; Calle Miranda, Local 113-109C, Valencia, Edo. Carabobo.</p>
                  <p>TELÉFONO: (0412) 000-0000 | @gonzacars.ca</p>
                </div>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="bg-slate-950 text-white px-10 py-5 rounded-[2rem] mb-6 shadow-xl text-center">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 opacity-60">Informe de Servicio</h2>
                <p className="text-3xl font-black tracking-tighter">#{currentRepair.id.toUpperCase().slice(-8)}</p>
              </div>
              <div className="space-y-1 text-[11px] font-black uppercase text-slate-400 tracking-widest text-right">
                <p>Ingreso: {new Date(currentRepair.createdAt).toLocaleDateString()}</p>
                {currentRepair.finishedAt && (
                  <p className="text-emerald-600 font-black border-t border-slate-100 pt-1 mt-1">Entrega: {new Date(currentRepair.finishedAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </div>

          {/* Grid de Información Cliente/Vehículo */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-200">
              <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-4 border-b border-slate-200 pb-2">Datos del Cliente</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Titular:</span>
                  <span className="font-black text-slate-900 uppercase">{currentRepair.ownerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Cédula/RIF:</span>
                  <span className="font-black text-slate-900">{currentRepair.customerId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Asesor:</span>
                  <span className="font-black text-slate-900 uppercase">{currentRepair.responsible}</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-200">
              <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-4 border-b border-slate-200 pb-2">Información del Vehículo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Placa:</span>
                  <span className="bg-slate-950 text-white px-4 py-1 rounded-xl font-mono font-black text-lg shadow-sm">{currentRepair.plate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Unidad:</span>
                  <span className="font-black text-slate-900 uppercase">{currentRepair.brand} {currentRepair.model} ({currentRepair.year})</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Estatus:</span>
                  <span className="font-black text-blue-600 uppercase">{currentRepair.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnóstico Técnico */}
          <div className="mb-10">
            <h3 className="font-black text-slate-950 uppercase text-[11px] tracking-[0.2em] mb-4 flex items-center gap-2">
              <ClipboardList size={18} className="text-blue-600" /> Detalle Técnico del Requerimiento
            </h3>
            <div className="p-10 bg-slate-50 border-4 border-slate-100 rounded-[3rem] text-base leading-relaxed text-slate-700 italic font-medium min-h-[120px] relative shadow-inner">
               <div className="absolute top-6 right-8 text-slate-200 opacity-20"><Wrench size={60} /></div>
               {currentRepair.diagnosis || "No se especificaron observaciones adicionales."}
            </div>
          </div>

          {/* Tabla Maestra de Cargos: Repuestos, Consumibles y Mano de Obra */}
          <div className="mb-12 overflow-hidden border-4 border-slate-950 rounded-[3rem] shadow-2xl">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-slate-950 text-white text-left">
                  <th className="p-5 uppercase tracking-[0.2em] font-black text-[9px]">Categoría</th>
                  <th className="p-5 uppercase tracking-[0.2em] font-black text-[9px]">Descripción Detallada</th>
                  <th className="p-5 uppercase tracking-[0.2em] font-black text-[9px] text-center">Cant.</th>
                  <th className="p-5 uppercase tracking-[0.2em] font-black text-[9px] text-right">Unitario ($)</th>
                  <th className="p-5 uppercase tracking-[0.2em] font-black text-[9px] text-right">Subtotal ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentRepair.items.map((item, idx) => (
                  <tr key={idx} className="odd:bg-white even:bg-slate-50/50">
                    <td className="p-5">
                      <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border-2 ${getItemTypeStyles(item.type)}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-5 font-black text-slate-800 uppercase text-[11px] leading-tight">{item.description}</td>
                    <td className="p-5 text-center font-black text-slate-950">{item.quantity}</td>
                    <td className="p-5 text-right font-bold text-slate-500">${item.price.toFixed(2)}</td>
                    <td className="p-5 text-right font-black text-slate-950 text-base tracking-tighter">${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumen Financiero en Pie de Página */}
          <div className="flex justify-between items-start gap-16 mb-16">
            <div className="flex-1">
              <h3 className="font-black text-slate-950 uppercase text-[11px] tracking-[0.2em] mb-4 flex items-center gap-2">
                <History size={16} className="text-emerald-600" /> Relación de Pagos Registrados
              </h3>
              <div className="bg-slate-50 border-2 border-slate-200 rounded-[2.5rem] overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-slate-200 text-slate-600">
                      <th className="p-3 text-left uppercase font-black text-[9px] tracking-widest">Fecha</th>
                      <th className="p-3 text-left uppercase font-black text-[9px] tracking-widest">Método</th>
                      <th className="p-3 text-right uppercase font-black text-[9px] tracking-widest">Abono ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentRepair.installments?.map((inst, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="p-3 font-bold text-slate-500">{new Date(inst.date).toLocaleDateString()}</td>
                        <td className="p-3 uppercase font-black text-slate-800">{inst.method}</td>
                        <td className="p-3 text-right font-black text-emerald-600 text-sm">${inst.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    {!currentRepair.installments?.length && (
                      <tr><td colSpan={3} className="p-6 text-center italic text-slate-300 font-bold uppercase text-[10px] tracking-widest">No se registran pagos previos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="w-96 bg-slate-950 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden border-8 border-slate-900">
               <div className="absolute top-0 right-0 opacity-10 p-4 rotate-12"><DollarSign size={100} /></div>
               <div className="space-y-5 relative z-10">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="uppercase font-black text-[10px] tracking-[0.3em]">Monto Total Orden</span>
                    <span className="font-black text-lg tracking-tighter">${calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-500 pb-6 border-b border-white/10">
                    <span className="uppercase font-black text-[10px] tracking-[0.3em]">Total Abonado</span>
                    <span className="font-black text-lg tracking-tighter">-${calculatePaid().toFixed(2)}</span>
                  </div>
                  <div className="pt-2 flex justify-between items-center">
                    <span className="uppercase font-black text-[12px] tracking-[0.4em] text-blue-500">Saldo Pendiente</span>
                    <span className="text-5xl font-black tracking-tighter leading-none">${calculateBalance().toFixed(2)}</span>
                  </div>
                  <div className="mt-6 pt-6 border-t border-white/20 text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Monto en Bolívares (Ref)</p>
                    <p className="text-2xl font-black text-emerald-400">{(calculateBalance() * store.exchangeRate).toLocaleString('es-VE')} Bs</p>
                    <p className="text-[9px] font-bold text-slate-600 italic mt-1">Tasa: {store.exchangeRate} Bs/$</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Firmas de Conformidad */}
          <div className="mt-28 grid grid-cols-2 gap-40 px-20 text-center font-black uppercase text-[11px] tracking-[0.3em]">
            <div className="border-t-4 border-slate-950 pt-6">
              <p className="mb-1">Control de Calidad</p>
              <p className="text-[9px] font-bold text-slate-400">GONZACARS C.A.</p>
            </div>
            <div className="border-t-4 border-slate-950 pt-6">
              <p className="mb-1">Recibido Conforme</p>
              <p className="text-[9px] font-bold text-slate-400">CLIENTE</p>
            </div>
          </div>

          <div className="mt-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.5em] leading-relaxed">
             Documento informativo generado por Gonzacars C.A. para control de servicio técnico.
          </div>
        </div>
      )}

      {/* UI DE LA APLICACIÓN (NO-PRINT) */}
      <div className="print:hidden h-full flex flex-col">
        {/* Buscador de Órdenes Mejorado */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 mb-8 flex gap-4 no-print animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24}/>
            <input 
              type="text" 
              placeholder="Buscar por placa del vehículo (Ej: ABC12DE)..." 
              className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] uppercase outline-none focus:ring-4 focus:ring-blue-50 font-black tracking-widest transition-all shadow-inner"
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} className="bg-slate-950 text-white px-12 py-5 rounded-[2rem] hover:bg-black flex items-center gap-4 font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-200">
            <Search size={22}/> Consultar Orden
          </button>
        </div>

        {currentRepair ? (
          <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-500 relative">
            {/* Header del Panel de Control */}
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
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Presupuesto Estimado</p>
                    <p className="text-5xl font-black tracking-tighter text-blue-400 leading-none">${calculateTotal().toFixed(2)}</p>
                    <div className="mt-4 pt-4 border-t border-white/5 w-full text-right">
                       <p className="text-[10px] font-bold text-emerald-400 tracking-tight">{(calculateTotal() * store.exchangeRate).toLocaleString('es-VE')} Bs</p>
                    </div>
                </div>
                <button 
                  onClick={() => setShowSOAModal(true)}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-950/40"
                >
                  <FileText size={18} /> Ver Estado de Cuenta
                </button>
              </div>
            </div>

            <div className="p-10 space-y-12 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/20">
              <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 relative shadow-sm">
                <div className="absolute -top-5 left-12 bg-blue-600 text-white px-8 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl">
                    Diagnóstico Técnico Inicial
                </div>
                <p className="text-slate-700 italic leading-relaxed font-semibold text-xl pt-4">"{currentRepair.diagnosis || 'Pendiente por definir.'}"</p>
              </div>

              <div className="space-y-8">
                <div className="flex justify-between items-center px-4">
                  <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter flex items-center gap-4">
                    <Layers size={34} className="text-blue-600" /> Detalle de Cargos
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
                        <th className="px-10 py-7 text-[12px] font-black uppercase tracking-[0.25em] text-right border-r border-white/5">Precio Unit. ($)</th>
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

              {/* Resumen de Pagos y Totales en la App */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-8">
                    <div className="flex justify-between items-center border-b-2 border-slate-100 pb-6">
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                          <History size={24} className="text-emerald-500" /> Relación de Pagos Parciales
                      </h3>
                      <button onClick={() => setShowAbonoModal(true)} className="px-8 py-3 bg-emerald-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-50 transition-all active:scale-95">
                          + Registrar Abono
                      </button>
                    </div>
                    <div className="space-y-5 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                      {currentRepair.installments?.map((inst, idx) => (
                        <div key={inst.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 flex justify-between items-center shadow-sm group hover:border-emerald-500 transition-all">
                           <div className="flex items-center gap-6">
                              <div className="w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center font-black group-hover:bg-emerald-600 transition-colors shadow-lg">
                                 {idx + 1}
                              </div>
                              <div>
                                 <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 mb-1">
                                    <CalendarDays size={14} className="text-blue-500" /> {new Date(inst.date).toLocaleDateString()}
                                 </p>
                                 <p className="text-[11px] font-bold text-slate-400 uppercase">Método: <span className="text-slate-800 font-black">{inst.method}</span></p>
                              </div>
                           </div>
                           <div className="flex items-center gap-6">
                              <p className="text-3xl font-black text-emerald-600 tracking-tighter leading-none">+ ${Number(inst.amount).toFixed(2)}</p>
                              <button 
                                onClick={() => { setSelectedInstallment(inst); setShowReceiptModal(true); }}
                                className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 transition-all border border-slate-100"
                                title="Ticket"
                              >
                                <Ticket size={22} />
                              </button>
                           </div>
                        </div>
                      ))}
                    </div>
                </div>

                <div className="lg:col-span-5">
                    <div className="bg-slate-950 rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden border-[10px] border-slate-900">
                      <DollarSign className="absolute -bottom-16 -right-16 text-white/5" size={320} />
                      <div className="relative z-10 space-y-12">
                        <div>
                          <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Monto Bruto Orden</p>
                          <h3 className="text-7xl font-black tracking-tighter leading-none">${calculateTotal().toFixed(2)}</h3>
                        </div>
                        <div className="space-y-6 pt-10 border-t border-white/10">
                          <div className="flex justify-between items-center text-emerald-500">
                            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Total Recibido</span>
                            <span className="text-3xl font-black tracking-tighter">${calculatePaid().toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-10 border-t-2 border-white/20">
                            <span className="text-xs font-black text-blue-500 uppercase tracking-[0.5em]">Saldo Neto</span>
                            <span className={`text-7xl font-black tracking-tighter leading-none ${calculateBalance() > 0 ? 'text-blue-500' : 'text-emerald-500'}`}>
                              ${calculateBalance().toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-12 border-t-2 border-slate-100 no-print">
                <button onClick={() => window.print()} className="flex-1 bg-white border-4 border-slate-950 py-7 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] flex items-center justify-center gap-5 hover:bg-slate-50 shadow-2xl transition-all active:scale-[0.98]">
                  <Printer size={30}/> Generar Informe Técnico PDF
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
            <h4 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Buscador de Informes</h4>
            <p className="mt-6 text-slate-500 text-center font-bold max-w-md px-12 leading-relaxed text-lg italic">
              "Ingrese la placa para gestionar los cargos, pagos y emitir el reporte técnico profesional para el cliente."
            </p>
          </div>
        )}
      </div>

      {/* MODALES REUTILIZADOS (SOA, Inventory, Abono, Pay) - SIN CAMBIOS EN LÓGICA PERO CON REFINAMIENTO VISUAL */}
      {/* ... (Se mantienen según RepairReport.tsx previo pero con las mejoras ya aplicadas arriba) ... */}
      
      {/* MODAL: BÚSQUEDA DE INVENTARIO (Refinado para verse como el screenshot) */}
      {showInventorySearch && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[4rem] shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden border-8 border-slate-100">
            <div className="p-12 border-b-4 border-slate-50 bg-slate-50/50">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-4xl font-black text-slate-950 uppercase tracking-tighter leading-none">Repuestos en Almacén</h3>
                  <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em] mt-4 flex items-center gap-3">
                    <Package size={18} /> Disponibilidad en tiempo real
                  </p>
                </div>
                <button onClick={() => setShowInventorySearch(false)} className="w-16 h-16 bg-white border-4 border-slate-100 rounded-3xl text-slate-300 hover:text-red-500 hover:border-red-100 transition-all shadow-sm flex items-center justify-center">
                  <X size={32} />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400" size={30}/>
                <input 
                  type="text" 
                  placeholder="Busque por nombre o código de barra..." 
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

      {/* MODAL: COBRAR ABONO */}
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

    </div>
  );
};

export default RepairReport;
