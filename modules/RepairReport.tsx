
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
  Ticket
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

  // Calcula el saldo después de un abono específico
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

  // Genera el historial de saldos para el Estado de Cuenta
  const accountStatementLedger = useMemo(() => {
    if (!currentRepair) return [];
    
    const totalCost = calculateTotal();
    const ledger = [];
    
    // Entrada 1: Cargo Inicial por la Orden
    ledger.push({
      date: currentRepair.createdAt,
      description: 'CARGO POR SERVICIO / REPARACIÓN',
      debit: totalCost,
      credit: 0,
      balance: totalCost
    });

    // Entradas subsiguientes: Abonos
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
    
    // Abrir automáticamente el recibo del nuevo abono
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
      <div className="hidden print:block print-only p-12 bg-white text-slate-900 font-serif">
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
          <div className="flex items-center gap-6">
            <img src={LOGO_URL} alt="Logo" className="w-20 h-20 grayscale" />
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">Gonzacars C.A.</h1>
              <p className="text-sm font-bold">ESTADO DE CUENTA DE CLIENTE</p>
              <p className="text-[10px]">Valencia, Edo. Carabobo | RIF: J-50030426-9</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-black">ORDEN REF: #{currentRepair?.id.toUpperCase()}</p>
            <p className="text-[10px]">FECHA REPORTE: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 mb-8 text-xs">
          <div className="border border-slate-300 p-4">
            <p className="font-bold border-b mb-2">TITULAR DE LA CUENTA</p>
            <p className="font-black text-sm">{currentRepair?.ownerName}</p>
            <p>ID: {currentRepair?.customerId}</p>
          </div>
          <div className="border border-slate-300 p-4">
            <p className="font-bold border-b mb-2">DETALLE VEHÍCULO</p>
            <p className="font-mono font-black">{currentRepair?.plate}</p>
            <p className="uppercase">{currentRepair?.brand} {currentRepair?.model}</p>
          </div>
        </div>

        <table className="w-full text-[11px] mb-10 border-collapse">
          <thead>
            <tr className="bg-slate-100 border-y border-black">
              <th className="p-2 text-left">FECHA</th>
              <th className="p-2 text-left">CONCEPTO / DESCRIPCIÓN</th>
              <th className="p-2 text-right">DÉBITO (+)</th>
              <th className="p-2 text-right">CRÉDITO (-)</th>
              <th className="p-2 text-right">SALDO ACUM.</th>
            </tr>
          </thead>
          <tbody>
            {accountStatementLedger.map((entry, idx) => (
              <tr key={idx} className="border-b border-slate-200">
                <td className="p-2">{new Date(entry.date).toLocaleDateString()}</td>
                <td className="p-2 font-bold uppercase">{entry.description}</td>
                <td className="p-2 text-right">{entry.debit > 0 ? `$${entry.debit.toFixed(2)}` : '-'}</td>
                <td className="p-2 text-right">{entry.credit > 0 ? `$${entry.credit.toFixed(2)}` : '-'}</td>
                <td className="p-2 text-right font-black">${entry.balance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end gap-10">
          <div className="w-64 border-2 border-black p-4 text-right">
            <p className="text-[10px] font-black uppercase mb-1">Total Saldo Pendiente</p>
            <p className="text-2xl font-black">${calculateBalance().toFixed(2)} USD</p>
            <p className="text-sm font-bold mt-2 text-slate-600 border-t pt-2">
              Equiv: {(calculateBalance() * store.exchangeRate).toLocaleString('es-VE')} Bs
            </p>
            <p className="text-[8px] italic">Tasa Ref: {store.exchangeRate} Bs/$</p>
          </div>
        </div>

        <div className="mt-24 flex justify-between px-20 text-[10px]">
          <div className="border-t border-black w-48 pt-2 text-center font-bold">FIRMA AUTORIZADA</div>
          <div className="border-t border-black w-48 pt-2 text-center font-bold">CONFORMIDAD CLIENTE</div>
        </div>
      </div>

      {/* SECCIÓN DE IMPRESIÓN DE RECIBO DE ABONO (TICKET) */}
      {selectedInstallment && (
        <div className="hidden print:block print-only bg-white text-slate-900 p-8 w-full max-w-[80mm] mx-auto text-center border border-slate-200">
           <img src={LOGO_URL} alt="Logo" className="w-16 h-16 mx-auto mb-2 object-contain grayscale" />
           <h2 className="text-lg font-black uppercase tracking-tighter">Gonzacars C.A.</h2>
           <p className="text-[10px] font-bold">RIF: J-50030426-9</p>
           <p className="text-[9px] mb-4">Av. Bolivar norte; Calle Miranda, Valencia, Carabobo</p>
           
           <div className="border-y-2 border-dashed border-slate-400 py-3 mb-4 text-[11px] text-left">
              <p className="font-black text-center mb-2 underline">COMPROBANTE DE ABONO</p>
              <div className="flex justify-between">
                 <span className="font-bold">Fecha:</span>
                 <span>{new Date(selectedInstallment.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                 <span className="font-bold">Referencia:</span>
                 <span className="font-mono">#{currentRepair?.id.toUpperCase().slice(-6)}</span>
              </div>
              <div className="flex justify-between mt-1">
                 <span className="font-bold">Cliente:</span>
                 <span className="uppercase truncate max-w-[120px]">{currentRepair?.ownerName}</span>
              </div>
              <div className="flex justify-between mt-1">
                 <span className="font-bold">Vehículo:</span>
                 <span className="font-mono">{currentRepair?.plate}</span>
              </div>
           </div>

           <div className="mb-6">
              <p className="text-[10px] font-black uppercase text-slate-400">Monto Abonado</p>
              <h3 className="text-3xl font-black tracking-tighter">${Number(selectedInstallment.amount).toFixed(2)}</h3>
              <p className="text-sm font-bold text-slate-600">{(selectedInstallment.amount * store.exchangeRate).toLocaleString('es-VE')} Bs</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Método: {selectedInstallment.method}</p>
           </div>

           <div className="bg-slate-50 p-3 border border-slate-200 rounded-lg text-left mb-6">
              <div className="flex justify-between text-[10px]">
                 <span className="font-bold">Subtotal Orden:</span>
                 <span>${calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-black border-t border-slate-200 mt-1 pt-1">
                 <span className="uppercase">Saldo Deudor:</span>
                 <span>${getBalanceAfterInstallment(selectedInstallment.id).toFixed(2)}</span>
              </div>
           </div>

           <div className="text-[9px] italic border-t border-slate-200 pt-4">
              <p>Gracias por su confianza.</p>
              <p className="mt-1 font-bold">Gonzacars - Calidad Garantizada</p>
           </div>
        </div>
      )}

      {/* HEADER COMPACTO PARA IMPRESIÓN DE INFORME TÉCNICO (PDF EXISTENTE) */}
      {currentRepair && (
        <div className="hidden print:block text-slate-900 text-xs">
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-4">
            <div className="flex gap-4 items-center">
              <img src={LOGO_URL} alt="Logo" className="w-16 h-16 object-contain" />
              <div>
                <h1 className="text-xl font-black uppercase tracking-tighter">Gonzacars C.A.</h1>
                <p className="font-bold">RIF: J-50030426-9</p>
                <p>Av. Bolivar norte; Calle Miranda, Local 113-109C, Valencia 2001, Carabobo.</p>
                <p>Tel: (0412) 000-0000 | @gonzacars.ca</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-black bg-slate-100 px-4 py-1 rounded-lg">ORDEN DE SERVICIO #{currentRepair.id.toUpperCase()}</h2>
              <p className="mt-1 font-bold">Fecha de Emisión: {new Date(currentRepair.createdAt).toLocaleDateString()}</p>
              {currentRepair.finishedAt && (
                <p className="font-bold text-emerald-600">Fecha de Entrega: {new Date(currentRepair.finishedAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h3 className="font-black border-b border-slate-300 mb-2 uppercase text-[10px]">Datos del Cliente</h3>
              <p><span className="font-bold">Nombre:</span> {currentRepair.ownerName}</p>
              <p><span className="font-bold">ID Cliente:</span> {currentRepair.customerId}</p>
              <p><span className="font-bold">Responsable:</span> {currentRepair.responsible}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h3 className="font-black border-b border-slate-300 mb-2 uppercase text-[10px]">Datos del Vehículo</h3>
              <p><span className="font-bold">Placa:</span> <span className="font-mono">{currentRepair.plate}</span></p>
              <p><span className="font-bold">Vehículo:</span> {currentRepair.brand} {currentRepair.model} ({currentRepair.year})</p>
              <p><span className="font-bold">Status:</span> {currentRepair.status}</p>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-black uppercase text-[10px] mb-1">Diagnóstico / Motivo del Servicio</h3>
            <div className="p-3 bg-white border border-slate-200 italic min-h-[60px]">
              {currentRepair.diagnosis || "Sin observaciones adicionales."}
            </div>
          </div>

          <table className="w-full mb-6 text-xs">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="p-2 text-left uppercase text-[9px]">Tipo</th>
                <th className="p-2 text-left uppercase text-[9px]">Descripción de Item/Servicio</th>
                <th className="p-2 text-center uppercase text-[9px]">Cant</th>
                <th className="p-2 text-right uppercase text-[9px]">Precio Unit. ($)</th>
                <th className="p-2 text-right uppercase text-[9px]">Subtotal ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b border-slate-300">
              {currentRepair.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-2 font-bold">{item.type}</td>
                  <td className="p-2 uppercase">{item.description}</td>
                  <td className="p-2 text-center">{item.quantity}</td>
                  <td className="p-2 text-right">${item.price.toFixed(2)}</td>
                  <td className="p-2 text-right font-black">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-start gap-10">
            <div className="flex-1">
              <h3 className="font-black uppercase text-[10px] mb-2">Historial de Pagos / Abonos</h3>
              <table className="w-full text-[10px] border border-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-1 text-left">Fecha</th>
                    <th className="p-1 text-left">Método</th>
                    <th className="p-1 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentRepair.installments?.map((inst, idx) => (
                    <tr key={idx}>
                      <td className="p-1">{new Date(inst.date).toLocaleDateString()}</td>
                      <td className="p-1 uppercase">{inst.method}</td>
                      <td className="p-1 text-right font-bold">${inst.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  {!currentRepair.installments?.length && (
                    <tr><td colSpan={3} className="p-1 text-center italic text-slate-400">Sin abonos previos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="w-64 bg-slate-50 p-4 border-2 border-slate-800 rounded-lg">
              <div className="flex justify-between mb-1">
                <span className="uppercase font-bold text-[9px]">Subtotal Orden:</span>
                <span className="font-black">${calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1 text-emerald-600 border-b border-slate-300 pb-1">
                <span className="uppercase font-bold text-[9px]">Total Abonado:</span>
                <span className="font-black">-${calculatePaid().toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 items-center">
                <span className="uppercase font-black text-[10px]">Saldo Deudor:</span>
                <span className="text-xl font-black">${calculateBalance().toFixed(2)}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-300 text-right">
                <p className="text-[10px] font-black text-slate-600 uppercase">A Pagar en Bolívares</p>
                <p className="text-sm font-black text-blue-700">{(calculateBalance() * store.exchangeRate).toLocaleString('es-VE')} Bs</p>
                <p className="text-[8px] font-bold italic text-slate-400">Tasa: {store.exchangeRate} Bs/$</p>
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-20 px-10">
            <div className="border-t border-slate-800 pt-2 text-center">
              <p className="font-black uppercase text-[9px]">Recibido por (Taller)</p>
            </div>
            <div className="border-t border-slate-800 pt-2 text-center">
              <p className="font-black uppercase text-[9px]">Conforme (Cliente)</p>
              <p className="text-[8px] mt-1 text-slate-400 italic">Al firmar acepta los términos y condiciones del servicio.</p>
            </div>
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
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
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
               {/* Resumen Superior */}
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

               {/* Libro Mayor */}
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
