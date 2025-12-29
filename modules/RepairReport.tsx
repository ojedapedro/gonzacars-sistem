
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
  Receipt,
  FileText,
  ArrowDownCircle,
  ArrowUpCircle,
  Ticket,
  ChevronRight,
  ShieldCheck,
  Info
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
      description: 'CARGO POR SERVICIO / REPARACIÓN',
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
      
      {/* SECCIÓN DE IMPRESIÓN DEL ESTADO DE CUENTA (Contabilidad) */}
      <div className="hidden print:block print-only p-12 bg-white text-slate-900 font-sans">
        <div className="flex justify-between items-start border-b-4 border-slate-950 pb-6 mb-8">
          <div className="flex items-center gap-6">
            <img src={LOGO_URL} alt="Logo" className="w-20 h-20 grayscale" />
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">Gonzacars C.A.</h1>
              <p className="text-sm font-black text-slate-500 tracking-widest uppercase">Estado de Cuenta de Cliente</p>
              <p className="text-[10px] font-bold mt-1">RIF: J-50030426-9 | Valencia, Carabobo</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-slate-900">ORDEN: #{currentRepair?.id.toUpperCase()}</p>
            <p className="text-[11px] font-bold text-slate-500 uppercase mt-1">Emitido: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 mb-8 text-xs">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="font-black text-slate-400 uppercase tracking-widest text-[9px] mb-3 border-b pb-2">Información del Titular</p>
            <p className="font-black text-lg text-slate-900 uppercase leading-none">{currentRepair?.ownerName}</p>
            <p className="font-bold text-slate-500 mt-2">ID Fiscal/Cédula: {currentRepair?.customerId}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="font-black text-slate-400 uppercase tracking-widest text-[9px] mb-3 border-b pb-2">Datos de la Unidad</p>
            <div className="flex items-center gap-3">
               <div className="bg-slate-900 text-white px-3 py-1 rounded-lg font-mono font-black text-base">{currentRepair?.plate}</div>
               <p className="font-black text-slate-800 uppercase text-sm">{currentRepair?.brand} {currentRepair?.model}</p>
            </div>
          </div>
        </div>

        <table className="w-full text-xs mb-10 border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-4 text-left uppercase tracking-widest text-[10px]">Fecha</th>
              <th className="p-4 text-left uppercase tracking-widest text-[10px]">Concepto de Operación</th>
              <th className="p-4 text-right uppercase tracking-widest text-[10px]">Débito (+)</th>
              <th className="p-4 text-right uppercase tracking-widest text-[10px]">Crédito (-)</th>
              <th className="p-4 text-right uppercase tracking-widest text-[10px]">Balance USD</th>
            </tr>
          </thead>
          <tbody>
            {accountStatementLedger.map((entry, idx) => (
              <tr key={idx} className="border-b border-slate-200 odd:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-500">{new Date(entry.date).toLocaleDateString()}</td>
                <td className="p-4 font-black text-slate-800 uppercase">{entry.description}</td>
                <td className="p-4 text-right font-bold">{entry.debit > 0 ? `$${entry.debit.toFixed(2)}` : '-'}</td>
                <td className="p-4 text-right font-black text-emerald-600">{entry.credit > 0 ? `$${entry.credit.toFixed(2)}` : '-'}</td>
                <td className="p-4 text-right font-black text-base text-slate-900">${entry.balance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="bg-slate-900 text-white p-8 rounded-[2rem] w-80 shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 text-slate-500">Saldo Total Deudor</p>
            <p className="text-4xl font-black tracking-tighter">${calculateBalance().toFixed(2)}</p>
            <div className="mt-6 pt-6 border-t border-white/10">
               <p className="text-[10px] font-black uppercase text-slate-400">Equivalente en Bolívares</p>
               <p className="text-xl font-black text-emerald-400">{(calculateBalance() * store.exchangeRate).toLocaleString('es-VE')} Bs</p>
               <p className="text-[9px] font-bold text-slate-500 mt-2 italic">Tasa Ref: {store.exchangeRate} Bs/$</p>
            </div>
          </div>
        </div>

        <div className="mt-32 flex justify-between px-20 text-[10px] font-black uppercase tracking-widest">
          <div className="border-t-2 border-slate-950 w-64 pt-4 text-center">Autorización Taller</div>
          <div className="border-t-2 border-slate-950 w-64 pt-4 text-center">Recibido Conforme Cliente</div>
        </div>
      </div>

      {/* SECCIÓN DE IMPRESIÓN DE INFORME TÉCNICO DETALLADO (EL REQUERIDO) */}
      {currentRepair && (
        <div className="hidden print:block print-only p-12 bg-white text-slate-900 font-sans">
          {/* Header Corporativo */}
          <div className="flex justify-between items-start border-b-4 border-slate-950 pb-8 mb-10">
            <div className="flex gap-8 items-center">
              <img src={LOGO_URL} alt="Logo" className="w-24 h-24 object-contain grayscale" />
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">Gonzacars C.A.</h1>
                <p className="text-sm font-black text-slate-500 tracking-[0.2em] uppercase mt-2">Servicios y Repuestos Automotrices</p>
                <div className="mt-4 text-[11px] font-bold text-slate-600 space-y-0.5">
                  <p>RIF: J-50030426-9</p>
                  <p>Av. Bolivar norte; Calle Miranda, Local 113-109C, Valencia, Carabobo.</p>
                  <p>WhatsApp: (0412) 000-0000 | @gonzacars.ca</p>
                </div>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="bg-slate-950 text-white px-8 py-3 rounded-2xl mb-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 opacity-60 text-center">Orden de Servicio</h2>
                <p className="text-2xl font-black text-center">#{currentRepair.id.toUpperCase().slice(-8)}</p>
              </div>
              <div className="space-y-1 text-[11px] font-black uppercase text-slate-400">
                <p>Ingreso: {new Date(currentRepair.createdAt).toLocaleDateString()}</p>
                {currentRepair.finishedAt && (
                  <p className="text-emerald-600">Entrega: {new Date(currentRepair.finishedAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </div>

          {/* Bloque Informativo Cliente/Vehículo */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
              <h3 className="font-black text-slate-400 uppercase tracking-widest text-[9px] mb-4 border-b border-slate-200 pb-2">Identificación del Cliente</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500 text-[10px] uppercase">Nombre:</span>
                  <span className="font-black text-slate-900 uppercase">{currentRepair.ownerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500 text-[10px] uppercase">ID Cliente:</span>
                  <span className="font-black text-slate-900">{currentRepair.customerId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500 text-[10px] uppercase">Responsable:</span>
                  <span className="font-black text-slate-900 uppercase">{currentRepair.responsible}</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
              <h3 className="font-black text-slate-400 uppercase tracking-widest text-[9px] mb-4 border-b border-slate-200 pb-2">Especificaciones de la Unidad</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500 text-[10px] uppercase">Placa:</span>
                  <span className="bg-slate-950 text-white px-3 py-0.5 rounded-lg font-mono font-black text-base">{currentRepair.plate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500 text-[10px] uppercase">Vehículo:</span>
                  <span className="font-black text-slate-900 uppercase">{currentRepair.brand} {currentRepair.model} ({currentRepair.year})</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500 text-[10px] uppercase">Status Final:</span>
                  <span className="font-black text-blue-600 uppercase">{currentRepair.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnóstico Técnico */}
          <div className="mb-10">
            <h3 className="font-black text-slate-950 uppercase text-[11px] tracking-widest mb-3 flex items-center gap-2">
              <ClipboardList size={16} /> Diagnóstico Técnico / Motivo del Servicio
            </h3>
            <div className="p-8 bg-slate-50 border-2 border-slate-200 rounded-[2rem] text-sm leading-relaxed text-slate-700 italic font-medium min-h-[100px] relative">
               <div className="absolute top-4 right-6 text-slate-200"><Wrench size={40} /></div>
               {currentRepair.diagnosis || "No se registraron observaciones adicionales en la apertura de orden."}
            </div>
          </div>

          {/* Tabla Detallada de Cargos */}
          <div className="mb-10 overflow-hidden border-2 border-slate-950 rounded-[2rem]">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-950 text-white text-left">
                  <th className="p-4 uppercase tracking-[0.2em] font-black text-[9px]">Categoría</th>
                  <th className="p-4 uppercase tracking-[0.2em] font-black text-[9px]">Descripción Detallada de Item / Servicio Realizado</th>
                  <th className="p-4 uppercase tracking-[0.2em] font-black text-[9px] text-center">Cant.</th>
                  <th className="p-4 uppercase tracking-[0.2em] font-black text-[9px] text-right">Unit. ($)</th>
                  <th className="p-4 uppercase tracking-[0.2em] font-black text-[9px] text-right">Subtotal ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentRepair.items.map((item, idx) => (
                  <tr key={idx} className="odd:bg-slate-50/50">
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border-2 ${
                        item.type === 'Repuesto' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        item.type === 'Servicio' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4 font-black text-slate-800 uppercase text-xs">{item.description}</td>
                    <td className="p-4 text-center font-bold">{item.quantity}</td>
                    <td className="p-4 text-right font-bold text-slate-500">${item.price.toFixed(2)}</td>
                    <td className="p-4 text-right font-black text-slate-950 text-sm">${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumen Financiero de la Orden */}
          <div className="flex justify-between items-start gap-12 mb-12">
            <div className="flex-1">
              <h3 className="font-black text-slate-950 uppercase text-[10px] tracking-widest mb-3 flex items-center gap-2">
                <History size={14} /> Relación de Pagos y Abonos
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="p-2 text-left uppercase">Fecha</th>
                      <th className="p-2 text-left uppercase">Método</th>
                      <th className="p-2 text-right uppercase">Monto ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentRepair.installments?.map((inst, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold">{new Date(inst.date).toLocaleDateString()}</td>
                        <td className="p-2 uppercase font-bold text-slate-500">{inst.method}</td>
                        <td className="p-2 text-right font-black text-emerald-600">${inst.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    {!currentRepair.installments?.length && (
                      <tr><td colSpan={3} className="p-4 text-center italic text-slate-300 font-bold uppercase text-[9px]">No se han registrado abonos a esta orden</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="w-80 bg-slate-950 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 opacity-10 p-4"><DollarSign size={80} /></div>
               <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="uppercase font-black text-[9px] tracking-widest">Presupuesto Orden</span>
                    <span className="font-black text-sm">${calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-500">
                    <span className="uppercase font-black text-[9px] tracking-widest">Total Abonado</span>
                    <span className="font-black text-sm">-${calculatePaid().toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/20 pt-6 flex justify-between items-center">
                    <span className="uppercase font-black text-[11px] tracking-[0.2em] text-blue-500">Saldo Neto</span>
                    <span className="text-4xl font-black tracking-tighter">${calculateBalance().toFixed(2)}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 text-right">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Monto en Bs (Ref)</p>
                    <p className="text-xl font-black text-emerald-400">{(calculateBalance() * store.exchangeRate).toLocaleString('es-VE')} Bs</p>
                    <p className="text-[8px] font-bold text-slate-600 italic">Tasa: {store.exchangeRate} Bs/$</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Firmas y Conformidad */}
          <div className="mt-20 grid grid-cols-2 gap-32 px-12 text-center font-black uppercase text-[10px] tracking-widest">
            <div className="border-t-2 border-slate-950 pt-4">
              <p className="mb-1">Control de Calidad</p>
              <p className="text-[8px] font-bold text-slate-400">GONZACARS C.A.</p>
            </div>
            <div className="border-t-2 border-slate-950 pt-4">
              <p className="mb-1">Recibido y Conforme</p>
              <p className="text-[8px] font-bold text-slate-400">FIRMA DEL CLIENTE</p>
            </div>
          </div>

          <div className="mt-16 text-center text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">
             Este documento es una orden de servicio técnico para fines informativos y de control interno.
          </div>
        </div>
      )}

      {/* UI DE LA APLICACIÓN (NO-PRINT) */}
      <div className="print:hidden h-full flex flex-col">
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
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all cursor-pointer outline-none ${getStatusStyles(currentRepair.status)}`}
                  >
                    {['Ingresado', 'En Diagnóstico', 'En Reparación', 'Esperando Repuestos', 'Finalizado', 'Entregado'].map(s => (
                      <option key={s} value={s} className="bg-white text-slate-900">{s}</option>
                    ))}
                  </select>
                </div>
                <p className="text-slate-400 font-bold text-xl uppercase tracking-tight flex items-center gap-3">
                  {currentRepair.brand} {currentRepair.model} ({currentRepair.year})
                  <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                  <span className="text-blue-400 font-mono tracking-[0.2em]">{currentRepair.plate}</span>
                </p>
              </div>
              <div className="text-right relative z-10 flex flex-col items-end gap-3">
                <div className="bg-white/10 backdrop-blur-md p-5 rounded-[2rem] border border-white/10 inline-block">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-right">Costo Estimado</p>
                    <p className="text-3xl font-black tracking-tighter text-blue-400">${calculateTotal().toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => setShowSOAModal(true)}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-950/20"
                >
                  <FileText size={14} /> Ver Estado de Cuenta
                </button>
              </div>
            </div>

            <div className="p-10 space-y-12 overflow-y-auto custom-scrollbar flex-1">
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 relative">
                <div className="absolute -top-4 left-10 bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                    Diagnóstico Técnico Inicial
                </div>
                <p className="text-slate-700 italic leading-relaxed font-semibold text-lg pt-2">"{currentRepair.diagnosis || 'No se registró un diagnóstico detallado.'}"</p>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
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

                <div className="overflow-hidden border-2 border-slate-950 rounded-[3rem] shadow-2xl bg-white">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-white text-left">
                        <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] border-r border-slate-900">Categoría</th>
                        <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] border-r border-slate-900">Descripción del Item</th>
                        <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-center border-r border-slate-900">Cant.</th>
                        <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-right border-r border-slate-900">Precio Unit. ($)</th>
                        <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-right">Subtotal</th>
                        <th className="px-8 py-6"></th>
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
                              <button onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 shadow-sm"><Minus size={12}/></button>
                              <span className="font-black text-slate-900 min-w-[20px] text-center">{item.quantity}</span>
                              <button onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 shadow-sm"><Plus size={12}/></button>
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
                          <td className="px-8 py-6 text-right">
                            <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 p-2 rounded-xl transition-all hover:bg-red-50">
                              <Trash2 size={20}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                          <History size={18} className="text-blue-600" /> Historial de Abonos
                      </h3>
                      <button onClick={() => setShowAbonoModal(true)} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all">
                          + Registrar Abono
                      </button>
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                      {currentRepair.installments?.map((inst, idx) => (
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
                           <div className="flex items-center gap-4">
                              <p className="text-2xl font-black text-emerald-600 tracking-tighter">+ ${Number(inst.amount).toFixed(2)}</p>
                              <button 
                                onClick={() => { setSelectedInstallment(inst); setShowReceiptModal(true); }}
                                className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 hover:bg-blue-50 transition-all"
                                title="Imprimir Recibo de Abono"
                              >
                                <Ticket size={18} />
                              </button>
                           </div>
                        </div>
                      ))}
                      {!currentRepair.installments?.length && (
                         <div className="py-12 text-center text-slate-300">
                            <Wallet size={32} className="mx-auto mb-3 opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Aún no se han registrado abonos</p>
                         </div>
                      )}
                    </div>
                </div>

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
                            <span className="text-xs font-black text-blue-500 uppercase tracking-[0.4em]">Saldo Pendiente</span>
                            <span className={`text-6xl font-black tracking-tighter ${calculateBalance() > 0 ? 'text-blue-500' : 'text-emerald-500'}`}>
                              ${calculateBalance().toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-10 border-t border-slate-200 no-print">
                <button onClick={() => window.print()} className="flex-1 bg-white border-4 border-slate-950 py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-slate-50 shadow-xl transition-all">
                  <Printer size={24}/> Imprimir PDF Informe Técnico
                </button>
                {currentRepair.status !== 'Entregado' && (
                  <button onClick={() => setShowPayModal(true)} className="flex-1 bg-blue-600 text-white py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-blue-700 shadow-2xl shadow-blue-100 transition-all active:scale-95">
                    <CheckCircle size={24}/> Liquidar y Entregar
                  </button>
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
            <p className="mt-4 text-slate-500 text-center font-bold max-w-md px-10 leading-relaxed">Ingrese la placa del vehículo para cargar el historial.</p>
          </div>
        )}
      </div>

      {/* MODAL: RECIBO DE ABONO INDIVIDUAL (UI) */}
      {showReceiptModal && selectedInstallment && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[120] p-4 no-print">
          <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300 border border-slate-200">
            <div className="p-8 bg-slate-900 text-white text-center">
               <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 p-2 backdrop-blur-md">
                  <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
               </div>
               <h3 className="text-2xl font-black uppercase tracking-tighter">Comprobante de Abono</h3>
               <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] mt-2">Transacción Exitosa</p>
            </div>
            <div className="p-10 space-y-8">
               <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-center space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto Pagado</p>
                    <p className="text-5xl font-black text-slate-900 tracking-tighter">${selectedInstallment.amount.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Método</span>
                    <span className="text-[10px] font-black text-slate-900 uppercase bg-white px-3 py-1 rounded-lg border border-slate-200">{selectedInstallment.method}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Saldo Restante</span>
                    <span className="text-lg font-black text-blue-600 tracking-tighter">${getBalanceAfterInstallment(selectedInstallment.id).toFixed(2)}</span>
                  </div>
               </div>
               <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => window.print()}
                    className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
                  >
                    <Printer size={18}/> Imprimir Recibo
                  </button>
                  <button 
                    onClick={() => setShowReceiptModal(false)}
                    className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors"
                  >
                    Cerrar Ventana
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ESTADO DE CUENTA (SOA) */}
      {showSOAModal && currentRepair && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center z-[110] p-4 no-print overflow-y-auto">
          <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-300 border border-slate-200">
            <div className="p-10 bg-emerald-700 text-white flex justify-between items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-10">
                  <FileText size={180} />
               </div>
               <div className="relative z-10">
                  <h3 className="text-4xl font-black uppercase tracking-tighter leading-none">Estado de Cuenta</h3>
                  <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Balance de Transacciones - Orden #{currentRepair.id.toUpperCase()}</p>
               </div>
               <button onClick={() => setShowSOAModal(false)} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all relative z-10 text-white border border-white/20">
                 <X size={24} />
               </button>
            </div>

            <div className="p-10 overflow-y-auto custom-scrollbar flex-1 space-y-8 bg-slate-50/50">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total de la Orden</p>
                     <p className="text-3xl font-black text-slate-900 tracking-tighter">${calculateTotal().toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Pagado</p>
                     <p className="text-3xl font-black text-emerald-600 tracking-tighter">${calculatePaid().toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border-2 border-emerald-600 shadow-xl shadow-emerald-900/5">
                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Saldo Pendiente</p>
                     <p className="text-3xl font-black text-slate-900 tracking-tighter">${calculateBalance().toFixed(2)}</p>
                  </div>
               </div>

               <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Concepto</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Debito (+)</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Crédito (-)</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo Progresivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {accountStatementLedger.map((entry, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                           <td className="px-8 py-5 text-xs font-bold text-slate-500">{new Date(entry.date).toLocaleDateString()}</td>
                           <td className="px-8 py-5 text-[11px] font-black text-slate-800 uppercase tracking-tight">{entry.description}</td>
                           <td className="px-8 py-5 text-right font-bold text-slate-500">
                              {entry.debit > 0 ? (
                                <span className="flex items-center justify-end gap-1 text-slate-900">
                                  <ArrowUpCircle size={12} className="text-slate-400" /> ${entry.debit.toFixed(2)}
                                </span>
                              ) : '-'}
                           </td>
                           <td className="px-8 py-5 text-right font-bold">
                              {entry.credit > 0 ? (
                                <span className="flex items-center justify-end gap-1 text-emerald-600">
                                  <ArrowDownCircle size={12} className="text-emerald-500" /> ${entry.credit.toFixed(2)}
                                </span>
                              ) : '-'}
                           </td>
                           <td className="px-8 py-5 text-right font-black text-slate-950 text-base tracking-tighter">
                              ${entry.balance.toFixed(2)}
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-white flex justify-between items-center">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo en Bolívares (Ref)</span>
                  <span className="text-xl font-black text-emerald-700 tracking-tight">{(calculateBalance() * store.exchangeRate).toLocaleString('es-VE')} Bs</span>
               </div>
               <div className="flex gap-4">
                  <button 
                    onClick={() => window.print()}
                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
                  >
                    <Printer size={18}/> Imprimir Estado de Cuenta
                  </button>
                  <button 
                    onClick={() => setShowSOAModal(false)}
                    className="bg-slate-100 text-slate-500 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cerrar
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BÚSQUEDA DE INVENTARIO */}
      {showInventorySearch && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-3xl w-full flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-8 duration-500 border-4 border-slate-100">
            <div className="p-10 border-b-2 border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter leading-none">Catálogo de Repuestos</h3>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                    <Package size={14} /> Inventario en Tiempo Real
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
                  placeholder="Buscar repuesto..." 
                  className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-200 rounded-[2rem] outline-none focus:ring-4 focus:ring-blue-50 font-bold text-lg transition-all"
                  value={invSearchTerm}
                  onChange={(e) => setInvSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-4 bg-white custom-scrollbar">
              {filteredInventory.map((p: Product) => (
                <button 
                  key={p.id}
                  onClick={() => addFromInventory(p)}
                  className="w-full p-6 flex items-center justify-between bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] hover:border-blue-500 hover:bg-blue-50 transition-all text-left group shadow-sm"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 group-hover:text-blue-700 uppercase text-lg tracking-tight">{p.name}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{p.category} • STOCK: {p.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-blue-600 tracking-tighter">${Number(p.price).toFixed(2)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRO DE ABONO */}
      {showAbonoModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[4rem] shadow-2xl max-w-md w-full p-12 animate-in zoom-in duration-300 border-4 border-slate-100 text-center">
            <h3 className="text-4xl font-black text-slate-950 mb-2 uppercase tracking-tighter">Registrar Abono</h3>
            <div className="space-y-8 mt-10">
              <input 
                type="number" 
                className="w-full py-6 bg-slate-50 border-2 border-slate-200 rounded-[2rem] font-black text-5xl text-slate-950 outline-none text-center"
                value={abonoAmount || ''}
                onChange={(e) => setAbonoAmount(Number(e.target.value))}
                placeholder="0.00"
                autoFocus
              />
              <select 
                className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-200 rounded-[2rem] font-black uppercase text-xs outline-none text-center"
                value={abonoMethod}
                onChange={(e) => setAbonoMethod(e.target.value as PaymentMethod)}
              >
                {['Efectivo $', 'Efectivo Bs', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <button onClick={registerAbono} className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-blue-700 transition-all">
                Confirmar Cobro
              </button>
              <button onClick={() => setShowAbonoModal(false)} className="w-full py-2 text-slate-400 font-black uppercase text-[10px]">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LIQUIDAR Y ENTREGAR */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[4rem] shadow-2xl max-w-lg w-full p-12 text-center border-4 border-slate-100 animate-in zoom-in duration-300">
            <h3 className="text-4xl font-black mb-10 text-slate-950 uppercase tracking-tighter">Liquidar Orden</h3>
            <p className="text-slate-500 mb-10 font-bold">
              Se registrará el pago final de <span className="text-blue-600 font-black text-2xl tracking-tighter block my-2">${calculateBalance().toFixed(2)}</span>
            </p>
            <button onClick={finalizeRepair} className="w-full py-6 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.3em] hover:bg-black shadow-2xl transition-all">
              Confirmar Entrega
            </button>
            <button onClick={() => setShowPayModal(false)} className="w-full py-4 text-slate-400 font-black uppercase text-[11px]">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairReport;
