
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
  X,
  FileText,
  Layers,
  ArrowDownCircle,
  Receipt,
  PenTool,
  Check
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
  
  // Estado para servicio manual
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [newService, setNewService] = useState({ description: '', price: 0, quantity: 1 });

  const [tempPaymentMethod, setTempPaymentMethod] = useState<PaymentMethod>('Efectivo $');
  const [abonoAmount, setAbonoAmount] = useState<number>(0);
  const [abonoMethod, setAbonoMethod] = useState<PaymentMethod>('Efectivo $');
  const [lastInstallment, setLastInstallment] = useState<Installment | null>(null);
  const [showAbonoReceipt, setShowAbonoReceipt] = useState(false);

  // Nuevos estados para el flujo de finalización
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [printMode, setPrintMode] = useState<'none' | 'report' | 'receipt' | 'abono'>('none');

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
      alert('Placa no encontrada');
      setCurrentRepair(null);
    }
  };

  const saveManualService = () => {
    if (!currentRepair || !newService.description) {
        alert("La descripción es obligatoria");
        return;
    }
    const newItem: RepairItem = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'Servicio',
      description: newService.description,
      quantity: newService.quantity,
      price: newService.price
    };
    const updated = { ...currentRepair, items: [...currentRepair.items, newItem] };
    setCurrentRepair(updated);
    store.updateRepair(updated);
    
    // Resetear y cerrar modal
    setNewService({ description: '', price: 0, quantity: 1 });
    setShowServiceModal(false);
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
    if (!currentRepair || abonoAmount <= 0) return;
    const newInstallment: Installment = {
      id: `ab-${Date.now()}`,
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
    setLastInstallment(newInstallment);
    setShowAbonoModal(false);
    setShowAbonoReceipt(true);
    setAbonoAmount(0);
  };

  const finalizeRepair = () => {
    if (!currentRepair) return;
    
    // 1. Calcular Saldo Restante para liquidar
    const pendingBalance = calculateBalance();
    
    // 2. Crear lista de abonos actualizada (Agregando el pago final si existe deuda)
    let updatedInstallments = [...(currentRepair.installments || [])];
    
    if (pendingBalance > 0.01) {
      updatedInstallments.push({
        id: `final-${Date.now()}`,
        date: new Date().toISOString(),
        amount: pendingBalance,
        method: tempPaymentMethod // El método seleccionado en el modal
      });
    }

    // 3. Crear objeto actualizado
    const updated: VehicleRepair = {
      ...currentRepair,
      status: 'Entregado',
      finishedAt: new Date().toISOString(),
      paymentMethod: tempPaymentMethod,
      installments: updatedInstallments
    };

    // 4. Guardar en Store y Actualizar Estado Local
    store.updateRepair(updated);
    setCurrentRepair(updated);
    
    // 5. Cerrar modal de pago y abrir modal de éxito/impresión
    setShowPayModal(false);
    setShowSuccessModal(true);
  };

  const handlePrint = (mode: 'report' | 'receipt' | 'abono') => {
    setPrintMode(mode);
    // Pequeño delay para asegurar que el DOM se actualice antes de imprimir
    setTimeout(() => {
        window.print();
    }, 100);
  };

  const handleFinishProcess = () => {
    setShowSuccessModal(false);
    setCurrentRepair(null);
    setSearchPlate('');
    setPrintMode('none');
    setTempPaymentMethod('Efectivo $');
  };

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'Entregado': return 'bg-emerald-600 text-white';
      case 'Finalizado': return 'bg-blue-600 text-white';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      
      {/* 1. INFORME CORPORATIVO TAMAÑO CARTA (PRINT ONLY - REPORT MODE) */}
      {currentRepair && printMode === 'report' && (
        <div className="hidden print:block print-only bg-white text-slate-900 p-10 font-sans min-h-screen max-w-[216mm] mx-auto">
          {/* Header Compacto */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex gap-4 items-center">
              <img src={LOGO_URL} alt="Logo" className="w-14 h-14 object-contain grayscale opacity-80" />
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-none">Gonzacars C.A.</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">RIF: J-50030426-9</p>
                <p className="text-[9px] font-medium text-slate-400 max-w-[250px] leading-tight mt-1">
                  Valencia, Edo. Carabobo | Taller Mecánico & Repuestos
                </p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-black uppercase text-slate-900 tracking-tight leading-none">
                {currentRepair.status === 'Entregado' ? 'INFORME DE SERVICIO' : 'PRESUPUESTO'}
              </h2>
              <p className="text-xl font-black text-slate-500">#{currentRepair.id.toUpperCase().slice(-6)}</p>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                EMISIÓN: {new Date().toLocaleString()}
              </p>
            </div>
          </div>

          {/* Datos Cliente y Vehículo (Compacto) */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6 text-xs">
            <div>
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Cliente</h3>
              <p className="font-bold text-slate-900 uppercase text-sm">{currentRepair.ownerName}</p>
              <p className="font-medium text-slate-500">ID / CI: {currentRepair.customerId}</p>
            </div>
            <div>
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Vehículo</h3>
              <div className="flex justify-between items-end">
                <div>
                   <p className="font-bold text-slate-900 uppercase text-sm">{currentRepair.brand} {currentRepair.model}</p>
                   <p className="font-medium text-slate-500">Año: {currentRepair.year}</p>
                </div>
                <span className="font-mono font-black text-sm bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {currentRepair.plate.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Tabla de Items (Estilo Minimalista) */}
          <div className="mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-[9px] font-black uppercase tracking-widest text-slate-600">
                  <th className="py-2 text-center w-12">Cant.</th>
                  <th className="py-2">Descripción del Item</th>
                  <th className="py-2 text-center w-24">Tipo</th>
                  <th className="py-2 text-right w-24">Precio Unit.</th>
                  <th className="py-2 text-right w-24">Importe</th>
                </tr>
              </thead>
              <tbody className="text-[11px] divide-y divide-slate-100 leading-none">
                {currentRepair.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 text-center font-bold text-slate-500">{item.quantity}</td>
                    <td className="py-2 font-bold text-slate-800 uppercase tracking-tight">
                      {item.description}
                    </td>
                    <td className="py-2 text-center text-[9px] uppercase font-medium text-slate-400">{item.type}</td>
                    <td className="py-2 text-right font-medium text-slate-600">${item.price.toFixed(2)}</td>
                    <td className="py-2 text-right font-black text-slate-900">${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Historial de Pagos (Compacto) */}
          <div className="flex gap-8 mb-8">
            <div className="flex-1">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">Desglose de Pagos</h4>
              {currentRepair.installments && currentRepair.installments.length > 0 ? (
                <table className="w-full text-[10px]">
                  <tbody>
                    {currentRepair.installments.map((inst, idx) => (
                      <tr key={idx} className="border-b border-slate-50 last:border-0">
                        <td className="py-1 text-slate-500">{new Date(inst.date).toLocaleDateString()}</td>
                        <td className="py-1 font-bold text-slate-700 uppercase">{inst.method}</td>
                        <td className="py-1 text-right font-black text-emerald-600">${inst.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-[9px] text-slate-400 italic">No hay pagos registrados.</p>
              )}
            </div>

            {/* Totales */}
            <div className="w-64">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                  <span>Total Servicio:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-emerald-600 uppercase">
                  <span>Total Pagado:</span>
                  <span>-${calculatePaid().toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-300 pt-2 mt-1 flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-900">Saldo Pendiente:</span>
                  <span className="text-xl font-black text-slate-900 leading-none">${Math.max(0, calculateBalance()).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer / Firmas */}
          <div className="mt-auto grid grid-cols-2 gap-16 pt-8 pb-4">
            <div className="text-center">
              <div className="border-t border-slate-300 w-3/4 mx-auto mb-2"></div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Recibí Conforme (Cliente)</p>
            </div>
            <div className="text-center">
              <div className="border-t border-slate-300 w-3/4 mx-auto mb-2"></div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Autorizado Por (Taller)</p>
            </div>
          </div>
          <div className="text-center text-[8px] font-medium text-slate-300 uppercase tracking-widest">
            Gonzacars C.A. - Garantía de Servicio
          </div>
        </div>
      )}

      {/* 2. RECIBO DE COBRO - FORMATO TICKET (PRINT ONLY - RECEIPT MODE) */}
      {currentRepair && printMode === 'receipt' && (
        <div className="hidden print:block print-only bg-white text-slate-900 p-6 font-mono text-[11px] leading-tight w-full max-w-[80mm] mx-auto">
          <div className="text-center mb-4">
            <img src={LOGO_URL} alt="Logo" className="w-12 h-12 mx-auto mb-2 object-contain grayscale" />
            <h3 className="font-black text-sm uppercase">Recibo de Cobro</h3>
            <p className="font-bold">Gonzacars C.A.</p>
            <p>RIF: J-50030426-9</p>
            <p className="text-[9px] mt-1">Av. Bolivar, Valencia</p>
          </div>
          
          <div className="border-y border-dashed border-slate-400 py-3 my-4 space-y-1 text-[10px]">
            <div className="flex justify-between">
               <span>ORDEN:</span>
               <span className="font-bold">#{currentRepair.id.substring(0,6).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
               <span>FECHA:</span>
               <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
               <span>PLACA:</span>
               <span className="font-bold">{currentRepair.plate.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
               <span>CLIENTE:</span>
               <span className="uppercase truncate max-w-[100px]">{currentRepair.ownerName.split(' ')[0]}</span>
            </div>
          </div>

          <div className="mb-4">
             <p className="text-[9px] font-bold uppercase border-b border-slate-200 mb-1">Conceptos</p>
             {currentRepair.items.map((item, i) => (
               <div key={i} className="flex justify-between text-[10px]">
                  <span className="truncate max-w-[140px] uppercase">{item.quantity} x {item.description}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
               </div>
             ))}
          </div>

          <div className="border-t border-dashed border-slate-900 pt-2 space-y-1 font-bold text-xs">
            <div className="flex justify-between">
              <span>TOTAL SERVICIO:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>TOTAL PAGADO:</span>
              <span>${calculatePaid().toFixed(2)}</span>
            </div>
            <div className="flex justify-between mt-2 text-sm font-black">
              <span>SALDO:</span>
              <span>${Math.max(0, calculateBalance()).toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center mt-6 pt-4 border-t border-slate-200">
            <p className="text-[9px] font-black uppercase">¡Gracias por su preferencia!</p>
            <p className="text-[8px] mt-1">Conserve este ticket como comprobante.</p>
          </div>
        </div>
      )}

      {/* 3. TICKET DE ABONO SUELTO (PRINT ONLY) - Detailed Statement */}
      {lastInstallment && currentRepair && printMode === 'abono' && (
        <div className="hidden print:block print-only bg-white text-slate-900 p-6 font-mono text-[11px] leading-tight w-full max-w-[80mm] mx-auto">
          <div className="text-center mb-4">
            <img src={LOGO_URL} alt="Logo" className="w-12 h-12 mx-auto mb-2 object-contain grayscale" />
            <h3 className="font-black text-sm uppercase">Comprobante de Abono</h3>
            <p className="font-bold">Gonzacars C.A.</p>
            <p>RIF: J-50030426-9</p>
            <p className="text-[9px] mt-1">Av. Bolivar, Valencia</p>
          </div>
          
          <div className="border-y border-dashed border-slate-400 py-3 my-4 space-y-1 text-[10px]">
            <div className="flex justify-between">
               <span>FECHA:</span>
               <span>{new Date(lastInstallment.date).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
               <span>CLIENTE:</span>
               <span className="uppercase font-bold truncate max-w-[120px]">{currentRepair.ownerName.split(' ')[0]}</span>
            </div>
            <div className="flex justify-between">
               <span>PLACA:</span>
               <span className="font-bold">{currentRepair.plate.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
               <span>MÉTODO:</span>
               <span className="uppercase">{lastInstallment.method}</span>
            </div>
          </div>

          <div className="space-y-2 mb-4">
             <div className="flex justify-between text-[10px]">
                <span>TOTAL SERVICIO:</span>
                <span>${calculateTotal().toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-[10px]">
                <span>ABONADO (PREV + ESTE):</span>
                <span>${calculatePaid().toFixed(2)}</span>
             </div>
          </div>

          <div className="flex justify-between font-black text-sm mt-2 bg-slate-100 p-2 rounded border border-slate-200">
            <span>ABONO ACTUAL:</span>
            <span>${lastInstallment.amount.toFixed(2)}</span>
          </div>
          
          <div className="border-t-2 border-dashed border-slate-900 pt-3 mt-4 flex justify-between font-black text-xs">
            <span>SALDO PENDIENTE:</span>
            <span>${Math.max(0, calculateBalance()).toFixed(2)}</span>
          </div>
          
          <div className="text-center mt-6 border-t border-slate-200 pt-4 text-[9px] uppercase font-bold">
            <p>Este documento es un comprobante de pago parcial.</p>
            <p className="mt-1">¡Gracias por su preferencia!</p>
          </div>
        </div>
      )}

      {/* UI APLICACIÓN (NO-PRINT) */}
      <div className="print:hidden flex-1 flex flex-col animate-in fade-in duration-500">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input 
              type="text" 
              placeholder="Ingrese placa del vehículo (Ej: AC302PV)..." 
              className="w-full pl-14 pr-8 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl uppercase outline-none focus:ring-4 focus:ring-blue-50 font-bold"
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} className="bg-slate-900 text-white px-10 py-4 rounded-2xl hover:bg-black font-black uppercase text-xs tracking-widest transition-all">
            Buscar
          </button>
        </div>

        {currentRepair ? (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col relative">
            <div className="p-8 bg-slate-950 text-white flex justify-between items-start shrink-0">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-4xl font-black uppercase tracking-tighter">{currentRepair.ownerName}</h2>
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusBadge(currentRepair.status)}`}>
                    {currentRepair.status}
                  </span>
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-tight text-lg">
                  {currentRepair.brand} {currentRepair.model} <span className="text-blue-500 font-mono ml-4 tracking-[0.2em]">{currentRepair.plate}</span>
                </p>
              </div>
              <div className="text-right flex flex-col items-end gap-4">
                <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Presupuesto Total</p>
                  <p className="text-4xl font-black tracking-tighter text-blue-400 leading-none">${calculateTotal().toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowAbonoModal(true)} className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700">
                    <DollarSign size={14}/> Abono
                  </button>
                  <button onClick={() => handlePrint('report')} className="bg-slate-800 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-700">
                    <Printer size={14}/> Imprimir
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/20">
              <div className="space-y-6">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                    <Layers size={24} className="text-blue-600" /> Cargos a la Orden
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => setShowInventorySearch(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700">
                      + Repuesto
                    </button>
                    <button onClick={() => setShowServiceModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black">
                      + Servicio Manual
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Descripción del Item</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-32">Cantidad</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-40">Precio Unit.</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-40">Importe</th>
                        <th className="px-6 py-4 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentRepair.items.map(item => (
                        <tr key={item.id} className="group hover:bg-blue-50/30 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <div className="relative">
                                <input 
                                  type="text" 
                                  className="w-full bg-transparent font-bold text-slate-700 uppercase outline-none border-b border-transparent focus:border-blue-500 focus:text-blue-600 transition-all placeholder:text-slate-300"
                                  value={item.description}
                                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                  placeholder="Descripción del servicio o repuesto"
                                />
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mt-1">{item.type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit mx-auto">
                              <button onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Minus size={14}/></button>
                              <input 
                                type="number" 
                                className="w-10 text-center font-black text-slate-700 bg-transparent outline-none text-sm"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                              />
                              <button onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Plus size={14}/></button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="relative">
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                <input 
                                  type="number" 
                                  className="w-full text-right bg-transparent font-bold text-slate-700 outline-none border-b border-transparent focus:border-blue-500 transition-all"
                                  value={item.price}
                                  onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                                />
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className="font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                                ${(item.price * item.quantity).toFixed(2)}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => removeItem(item.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                              <Trash2 size={16}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-10 border-t-4 border-slate-100 flex gap-4">
                <button onClick={() => handlePrint('report')} className="flex-1 bg-white border-2 border-slate-900 py-6 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all">
                  <Printer size={24}/> Imprimir Informe Preliminar
                </button>
                <button onClick={() => setShowPayModal(true)} className="flex-1 bg-blue-600 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
                  <CheckCircle size={24}/> Cerrar y Entregar Vehículo
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-[500px] text-slate-300 border-4 border-dashed border-slate-200 rounded-[3rem] bg-white">
            <ClipboardList size={80} className="opacity-10 mb-6" />
            <h4 className="text-xl font-black text-slate-400 uppercase tracking-widest">Ingrese una placa para gestionar</h4>
          </div>
        )}
      </div>

      {/* MODAL SERVICIO MANUAL */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4 print:hidden">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full p-10 animate-in zoom-in duration-300 border border-slate-100">
            <div className="text-center mb-8">
               <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                  <PenTool size={32} />
               </div>
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Agregar Servicio Manual</h3>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Detalles del cargo personalizado</p>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción del Servicio</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Mano de Obra, Revisión Eléctrica..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all uppercase"
                    value={newService.description}
                    onChange={(e) => setNewService({...newService, description: e.target.value})}
                    autoFocus
                  />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Costo Unitario ($)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-black text-lg transition-all"
                        value={newService.price || ''}
                        onChange={(e) => setNewService({...newService, price: Number(e.target.value)})}
                      />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cantidad</label>
                      <input 
                        type="number" 
                        placeholder="1"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-black text-lg transition-all text-center"
                        value={newService.quantity}
                        onChange={(e) => setNewService({...newService, quantity: Number(e.target.value)})}
                      />
                  </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowServiceModal(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-red-500 transition-colors">
                   Cancelar
                </button>
                <button onClick={saveManualService} className="flex-[1.5] bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all">
                   Agregar Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ABONO */}
      {showAbonoModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4 print:hidden">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full p-12 text-center animate-in zoom-in duration-300">
            <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Registrar Abono</h3>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-10">Monto del pago parcial</p>
            <div className="space-y-8">
              <input 
                type="number" 
                className="w-full px-6 py-8 bg-slate-50 border-4 border-slate-100 rounded-3xl font-black text-6xl text-slate-900 text-center outline-none"
                value={abonoAmount || ''}
                onChange={(e) => setAbonoAmount(Number(e.target.value))}
                autoFocus
              />
              <select className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black uppercase text-xs outline-none" value={abonoMethod} onChange={(e) => setAbonoMethod(e.target.value as any)}>
                {['Efectivo $', 'Efectivo Bs', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <button onClick={registerAbono} className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-all">
                Confirmar Pago
              </button>
              <button onClick={() => setShowAbonoModal(false)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RECIBO ABONO (RESULTADO) */}
      {showAbonoReceipt && lastInstallment && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center z-[110] p-4 print:hidden">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300 flex flex-col">
            {/* Header */}
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
               <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Comprobante de Pago</h3>
               <button onClick={() => setShowAbonoReceipt(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            {/* Content "Statement" */}
            <div className="p-8 bg-white space-y-6">
               <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{new Date(lastInstallment.date).toLocaleDateString()} - {new Date(lastInstallment.date).toLocaleTimeString()}</p>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter">${lastInstallment.amount.toFixed(2)}</h2>
                  <span className="inline-block mt-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                    Abono Recibido
                  </span>
               </div>

               <div className="space-y-3 pt-6 border-t border-dashed border-slate-200">
                  <div className="flex justify-between text-xs">
                     <span className="font-bold text-slate-500 uppercase">Total Servicio</span>
                     <span className="font-black text-slate-900">${calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                     <span className="font-bold text-slate-500 uppercase">Abonado (Inc. este pago)</span>
                     <span className="font-black text-emerald-600">-${calculatePaid().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                     <span className="font-black text-slate-800 uppercase">Saldo Restante</span>
                     <span className="font-black text-blue-600">${calculateBalance().toFixed(2)}</span>
                  </div>
               </div>

               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[10px] space-y-1">
                  <div className="flex justify-between">
                     <span className="text-slate-400 font-bold uppercase">Cliente:</span>
                     <span className="font-black text-slate-700 uppercase">{currentRepair?.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-slate-400 font-bold uppercase">Vehículo:</span>
                     <span className="font-black text-slate-700 uppercase">{currentRepair?.plate}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-slate-400 font-bold uppercase">Método:</span>
                     <span className="font-black text-slate-700 uppercase">{lastInstallment.method}</span>
                  </div>
               </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
               <button onClick={() => { handlePrint('abono'); }} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg">
                  <Printer size={16}/> Imprimir
               </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ENTREGA FINAL */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4 print:hidden">
          <div className="bg-white rounded-[4rem] shadow-2xl max-w-xl w-full p-16 text-center border-8 border-slate-100 animate-in zoom-in duration-300">
            <h3 className="text-5xl font-black mb-6 text-slate-900 uppercase tracking-tighter">Finalizar Orden</h3>
            <p className="text-slate-500 mb-10 font-bold text-xl leading-relaxed">
              Está a punto de cerrar la orden y entregar el vehículo. El saldo final a liquidar es de:
              <span className="text-emerald-600 font-black text-6xl tracking-tighter block mt-4 animate-pulse">${calculateBalance().toFixed(2)}</span>
            </p>
            <div className="space-y-4">
               <select 
                className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black uppercase text-xs outline-none text-center"
                value={tempPaymentMethod}
                onChange={(e) => setTempPaymentMethod(e.target.value as PaymentMethod)}
              >
                {['Efectivo $', 'Efectivo Bs', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <button onClick={finalizeRepair} className="w-full py-8 bg-slate-900 text-white rounded-3xl font-black uppercase text-sm tracking-[0.3em] hover:bg-black shadow-2xl shadow-slate-200 transition-all active:scale-95">
                Cerrar y Emitir Documentos
              </button>
              <button onClick={() => setShowPayModal(false)} className="w-full py-4 text-slate-400 font-black uppercase text-[11px] tracking-widest hover:text-red-500 transition-colors">Volver</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ÉXITO Y OPCIONES DE IMPRESIÓN */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center z-[120] p-4 print:hidden">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-300">
             <div className="bg-emerald-600 p-10 text-white text-center">
               <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md shadow-xl">
                 <Check size={40} className="text-white" />
               </div>
               <h3 className="text-3xl font-black uppercase tracking-tighter">¡Servicio Finalizado!</h3>
               <p className="text-emerald-100 font-bold uppercase text-xs tracking-widest mt-2">El vehículo ha sido entregado correctamente</p>
             </div>
             
             <div className="p-10 space-y-4">
               <p className="text-center text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">Seleccione el documento a imprimir:</p>
               
               <button 
                 onClick={() => handlePrint('report')}
                 className="w-full bg-white border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50 text-slate-800 py-5 rounded-2xl flex items-center justify-between px-6 transition-all group shadow-sm"
               >
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                     <FileText size={20} />
                   </div>
                   <div className="text-left">
                     <span className="block font-black uppercase text-xs tracking-wide">Informe Técnico</span>
                     <span className="text-[10px] text-slate-400 font-bold">Formato A4 / Carta (Garantía)</span>
                   </div>
                 </div>
                 <Printer size={18} className="text-slate-300 group-hover:text-blue-600" />
               </button>

               <button 
                 onClick={() => handlePrint('receipt')}
                 className="w-full bg-white border-2 border-slate-100 hover:border-emerald-600 hover:bg-emerald-50 text-slate-800 py-5 rounded-2xl flex items-center justify-between px-6 transition-all group shadow-sm"
               >
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                     <Receipt size={20} />
                   </div>
                   <div className="text-left">
                     <span className="block font-black uppercase text-xs tracking-wide">Recibo de Cobro</span>
                     <span className="text-[10px] text-slate-400 font-bold">Formato Ticket (Caja)</span>
                   </div>
                 </div>
                 <Printer size={18} className="text-slate-300 group-hover:text-emerald-600" />
               </button>

               <button 
                 onClick={handleFinishProcess}
                 className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-black transition-all shadow-xl mt-4"
               >
                 Finalizar Proceso
               </button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL BÚSQUEDA INVENTARIO */}
      {showInventorySearch && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center z-[100] p-4 no-print print:hidden">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-4xl w-full flex flex-col max-h-[85vh] overflow-hidden border-8 border-slate-100">
            <div className="p-10 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Seleccionar Repuesto</h3>
                <button onClick={() => setShowInventorySearch(false)} className="w-12 h-12 bg-white border-2 border-slate-100 rounded-2xl text-slate-300 hover:text-red-500 transition-all flex items-center justify-center">
                  <X size={28} />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24}/>
                <input 
                  type="text" 
                  placeholder="Buscar por nombre..." 
                  className="w-full pl-14 pr-8 py-5 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:ring-8 focus:ring-blue-50 font-bold transition-all shadow-inner"
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
                  className="w-full p-8 flex items-center justify-between bg-slate-50 border-2 border-slate-100 rounded-3xl hover:border-blue-600 hover:bg-blue-50 transition-all text-left group shadow-sm"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl group-hover:bg-blue-600 transition-colors">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 uppercase text-xl tracking-tight">{p.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Stock: {p.quantity} Unidades</p>
                    </div>
                  </div>
                  <p className="text-3xl font-black text-blue-600 tracking-tighter">${Number(p.price).toFixed(2)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairReport;
