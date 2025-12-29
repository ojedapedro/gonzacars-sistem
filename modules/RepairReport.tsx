
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
  Fuel,
  ArrowDownCircle,
  Receipt,
  History
} from 'lucide-react';
import { VehicleRepair, RepairItem, PaymentMethod, Product, ServiceStatus, Installment } from '../types';

const LOGO_URL = "https://i.ibb.co/MDhy5tzK/image-2.png";

const RepairReport: React.FC<{ store: any }> = ({ store }) => {
  const [searchPlate, setSearchPlate] = useState('');
  const [currentRepair, setCurrentRepair] = useState<VehicleRepair | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [showSOAModal, setShowSOAModal] = useState(false);
  const [showInventorySearch, setShowInventorySearch] = useState(false);
  const [invSearchTerm, setInvSearchTerm] = useState('');
  
  const [tempPaymentMethod, setTempPaymentMethod] = useState<PaymentMethod>('Efectivo $');
  const [abonoAmount, setAbonoAmount] = useState<number>(0);
  const [abonoMethod, setAbonoMethod] = useState<PaymentMethod>('Efectivo $');
  const [lastInstallment, setLastInstallment] = useState<Installment | null>(null);
  const [showAbonoReceipt, setShowAbonoReceipt] = useState(false);

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
    setLastInstallment(newInstallment);
    setShowAbonoModal(false);
    setShowAbonoReceipt(true);
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
    
    // Registrar la venta en la tienda
    store.addSale({
      id: `REP-${Date.now().toString().slice(-6)}`,
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

    // Acción de imprimir antes de limpiar la pantalla
    setTimeout(() => {
      window.print();
      // Limpiar y liberar la vista para el siguiente vehículo
      setCurrentRepair(null);
      setSearchPlate('');
      setShowPayModal(false);
      alert('Servicio finalizado. La pantalla ha sido liberada para una nueva consulta.');
    }, 500);
  };

  const getItemTypeStyles = (type: RepairItem['type']) => {
    switch (type) {
      case 'Repuesto': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Servicio': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Consumible': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getStatusStyles = (status: ServiceStatus) => {
    switch (status) {
      case 'Entregado': return 'bg-emerald-600 text-white border-emerald-700';
      case 'Finalizado': return 'bg-blue-600 text-white border-blue-700';
      case 'En Reparación': return 'bg-amber-600 text-white border-amber-700';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      
      {/* SECCIÓN DE IMPRESIÓN DE INFORME (ESTILO PDF ÚLTIMA REFERENCIA) */}
      {currentRepair && (
        <div className="hidden print:block print-only p-12 bg-white text-slate-950 font-sans min-h-screen">
          {/* Header Superior Lateral */}
          <div className="flex justify-between items-start mb-16">
            <div className="flex gap-10 items-center">
              <img src={LOGO_URL} alt="Logo" className="w-28 h-28 object-contain grayscale" />
              <div className="border-l-[3px] border-slate-100 pl-10">
                <h1 className="text-5xl font-black uppercase tracking-tighter leading-none mb-1 text-slate-950">GONZACARS C.A.</h1>
                <p className="text-xl font-black text-slate-800 tracking-tight leading-tight uppercase max-w-sm">INFORME TÉCNICO Y ESTADO DE CUENTA</p>
                <p className="text-[11px] font-bold text-slate-400 mt-5 tracking-widest uppercase">Valencia, Edo. Carabobo | RIF: J-50030426-9</p>
              </div>
            </div>
            <div className="text-right">
              <div className="mb-4">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">ORDEN REF:</p>
                <p className="text-3xl font-black text-blue-600">#{currentRepair.id.toUpperCase().slice(-8)}</p>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">FECHA REPORTE: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Bloques de Datos Cliente / Vehículo */}
          <div className="grid grid-cols-2 gap-12 mb-16">
            <div className="border-[2px] border-slate-100 p-10 relative">
              <h3 className="absolute -top-3 left-6 bg-white px-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">TITULAR DE LA CUENTA</h3>
              <div className="space-y-1">
                <p className="font-black text-3xl text-slate-950 uppercase leading-none">{currentRepair.ownerName}</p>
                <p className="text-sm font-bold text-slate-400 mt-2 tracking-widest">ID: {currentRepair.customerId}</p>
              </div>
            </div>
            <div className="border-[2px] border-slate-100 p-10 relative">
              <h3 className="absolute -top-3 left-6 bg-white px-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">DETALLE VEHÍCULO</h3>
              <div className="space-y-1">
                <p className="font-black text-3xl text-slate-950 uppercase leading-none">{currentRepair.brand} {currentRepair.model}</p>
                <p className="text-sm font-black text-blue-600 tracking-[0.3em] uppercase mt-2">{currentRepair.plate.toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Diagnóstico con barra lateral */}
          <div className="mb-16">
             <div className="flex items-center gap-3 mb-6">
                <div className="bg-slate-950 p-2 rounded-lg text-white">
                  <ClipboardList size={18} />
                </div>
                <h4 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em]">DIAGNÓSTICO Y REQUERIMIENTO</h4>
             </div>
             <div className="p-10 border-l-[8px] border-slate-950 bg-slate-50/50 text-2xl italic text-slate-700 leading-relaxed font-semibold">
                {currentRepair.diagnosis || "No se especificaron requerimientos adicionales por parte del cliente."}
             </div>
          </div>

          {/* Tabla de Cargos Maestra */}
          <div className="mb-16">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b-4 border-slate-950">
                  <th className="py-6 px-4 uppercase tracking-[0.2em] font-black text-[10px] text-slate-400">FECHA</th>
                  <th className="py-6 px-4 uppercase tracking-[0.2em] font-black text-[10px] text-slate-400">CONCEPTO / DESCRIPCIÓN</th>
                  <th className="py-6 px-4 uppercase tracking-[0.2em] font-black text-[10px] text-slate-400 text-center">CANT.</th>
                  <th className="py-6 px-4 uppercase tracking-[0.2em] font-black text-[10px] text-slate-400 text-right">DÉBITO (+)</th>
                  <th className="py-6 px-4 uppercase tracking-[0.2em] font-black text-[10px] text-slate-400 text-right">SALDO USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Productos y Servicios Listados */}
                {currentRepair.items.map((item, idx) => (
                  <tr key={idx} className="group">
                    <td className="py-8 px-4 text-xs font-bold text-slate-400">{new Date(currentRepair.createdAt).toLocaleDateString()}</td>
                    <td className="py-8 px-4">
                      <p className="font-black text-slate-900 uppercase text-base leading-tight mb-1">{item.description}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.type} {item.productId ? `| REF: ${item.productId}` : ''}</p>
                    </td>
                    <td className="py-8 px-4 text-center font-black text-slate-900 text-lg">{item.quantity}</td>
                    <td className="py-8 px-4 text-right font-black text-slate-900 text-lg">${item.price.toFixed(2)}</td>
                    <td className="py-8 px-4 text-right font-black text-slate-950 text-xl tracking-tighter">${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
                
                {/* Registro de Abonos con estilo de Crédito */}
                {currentRepair.installments?.map((inst, idx) => (
                  <tr key={`inst-${idx}`} className="bg-emerald-50/20">
                    <td className="py-8 px-4 text-xs font-bold text-slate-400">{new Date(inst.date).toLocaleDateString()}</td>
                    <td className="py-8 px-4">
                      <p className="font-black text-emerald-700 uppercase text-base leading-tight">ABONO RECIBIDO ({inst.method})</p>
                    </td>
                    <td className="py-8 px-4 text-center font-bold text-slate-300">-</td>
                    <td className="py-8 px-4 text-right font-black text-emerald-600 text-lg">-${inst.amount.toFixed(2)}</td>
                    <td className="py-8 px-4 text-right font-black text-slate-400 uppercase text-[11px] tracking-widest">CRÉDITO</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recuadro de Balance Total */}
          <div className="flex justify-end mb-24">
             <div className="w-[480px] border-[5px] border-slate-950 p-12 text-right relative overflow-hidden bg-white shadow-2xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-950 rotate-45 translate-x-12 -translate-y-12"></div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-3">TOTAL SALDO PENDIENTE</p>
                <p className="text-7xl font-black text-slate-950 tracking-tighter leading-none mb-8">${calculateBalance().toFixed(2)} USD</p>
                
                <div className="pt-8 border-t-2 border-slate-100">
                  <p className="text-3xl font-black text-slate-800 tracking-tight">Equiv: {(calculateBalance() * store.exchangeRate).toLocaleString('es-VE')} Bs</p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Tasa Referencial: {store.exchangeRate} Bs/$</p>
                </div>
             </div>
          </div>

          {/* Firmas y Formalidades */}
          <div className="grid grid-cols-2 gap-32 px-10 text-center font-black uppercase text-[11px] tracking-[0.4em] mt-auto">
            <div className="border-t-[3px] border-slate-950 pt-8">
              FIRMA AUTORIZADA
            </div>
            <div className="border-t-[3px] border-slate-950 pt-8">
              CONFORMIDAD CLIENTE
            </div>
          </div>

          <div className="mt-32 pt-10 border-t border-slate-100 flex justify-between items-center opacity-40">
             <div className="text-[11px] font-black uppercase text-slate-500 tracking-widest">https://gonzacars-sistem.vercel.app</div>
             <div className="text-[11px] font-black uppercase text-slate-500 italic">Documento con Validez Administrativa Interna</div>
          </div>
        </div>
      )}

      {/* UI DE LA APLICACIÓN (NO-PRINT) */}
      <div className="print:hidden h-full flex flex-col animate-in fade-in duration-500">
        {/* Buscador de Órdenes */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 mb-8 flex gap-4 no-print shadow-xl shadow-slate-200/20">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24}/>
            <input 
              type="text" 
              placeholder="Ingrese placa del vehículo (Ej: AC302PV)..." 
              className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] uppercase outline-none focus:ring-4 focus:ring-blue-50 font-black tracking-widest transition-all shadow-inner"
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} className="bg-slate-950 text-white px-12 py-5 rounded-[2rem] hover:bg-black flex items-center gap-4 font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-2xl">
            <Search size={22}/> Localizar Orden
          </button>
        </div>

        {currentRepair ? (
          <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col relative">
            {/* Header Visual App */}
            <div className="p-12 bg-slate-950 text-white flex justify-between items-start relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12">
                <Wrench size={240} />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-6">
                  <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">{currentRepair.ownerName}</h2>
                  <select 
                    value={currentRepair.status}
                    onChange={(e) => handleStatusChange(e.target.value as ServiceStatus)}
                    className={`px-8 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border-2 transition-all cursor-pointer outline-none shadow-lg ${getStatusStyles(currentRepair.status)}`}
                  >
                    {['Ingresado', 'En Diagnóstico', 'En Reparación', 'Esperando Repuestos', 'Finalizado', 'Entregado'].map(s => (
                      <option key={s} value={s} className="bg-white text-slate-900 font-bold">{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-slate-400 font-bold text-2xl uppercase tracking-tight flex items-center gap-4">
                    {currentRepair.brand} {currentRepair.model} ({currentRepair.year})
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                    <span className="text-blue-500 font-mono tracking-[0.2em] bg-blue-500/10 px-5 py-1.5 rounded-xl border border-blue-500/20">{currentRepair.plate}</span>
                  </p>
                </div>
              </div>
              
              <div className="text-right relative z-10 flex flex-col items-end gap-6">
                <div className="bg-white/10 backdrop-blur-2xl p-10 rounded-[3.5rem] border border-white/10 shadow-2xl flex flex-col items-end min-w-[300px]">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Total Presupuestado</p>
                    <p className="text-6xl font-black tracking-tighter text-blue-400 leading-none">${calculateTotal().toFixed(2)}</p>
                    <div className="mt-5 pt-5 border-t border-white/10 w-full text-right">
                       <p className="text-xs font-black text-emerald-400 tracking-wide">{(calculateTotal() * store.exchangeRate).toLocaleString('es-VE')} Bs (Ref)</p>
                    </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowAbonoModal(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-950/40">
                    <DollarSign size={20} /> Registrar Abono
                  </button>
                  <button onClick={() => setShowSOAModal(true)} className="bg-slate-800 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-slate-700 transition-all">
                    <FileText size={20} /> Ver Historial
                  </button>
                </div>
              </div>
            </div>

            {/* Panel de Contenido */}
            <div className="p-12 space-y-12 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/20">
              <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 relative shadow-sm">
                <div className="absolute -top-6 left-12 bg-blue-600 text-white px-10 py-3 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] shadow-2xl">
                    Diagnóstico y Requerimientos Técnicos
                </div>
                <p className="text-slate-700 italic leading-relaxed font-semibold text-2xl pt-6">"{currentRepair.diagnosis || 'Pendiente por definir diagnóstico oficial.'}"</p>
              </div>

              <div className="space-y-8">
                <div className="flex justify-between items-center px-4">
                  <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter flex items-center gap-4">
                    <Layers size={36} className="text-blue-600" /> Cargos Cargados a la Orden
                  </h3>
                  <div className="flex gap-4">
                    <button onClick={() => setShowInventorySearch(true)} className="px-8 py-4 bg-blue-600 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-blue-700 shadow-xl">
                      <Plus size={20}/> + Repuesto
                    </button>
                    <button onClick={() => addItemManually('Servicio')} className="px-8 py-4 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black shadow-xl">
                      <Wrench size={20}/> + Mano de Obra
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden border-4 border-slate-950 rounded-[4rem] shadow-2xl bg-white">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-white text-left">
                        <th className="px-10 py-8 text-[12px] font-black uppercase tracking-[0.3em]">Tipo</th>
                        <th className="px-10 py-8 text-[12px] font-black uppercase tracking-[0.3em]">Descripción del Item</th>
                        <th className="px-10 py-8 text-[12px] font-black uppercase tracking-[0.3em] text-center">Cant.</th>
                        <th className="px-10 py-8 text-[12px] font-black uppercase tracking-[0.3em] text-right">P. Unit ($)</th>
                        <th className="px-10 py-8 text-[12px] font-black uppercase tracking-[0.3em] text-right">Subtotal</th>
                        <th className="px-10 py-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentRepair.items.map(item => (
                        <tr key={item.id} className="group transition-all hover:bg-blue-50/40 even:bg-slate-50/50">
                          <td className="px-10 py-8">
                            <span className={`text-[10px] px-5 py-2 rounded-full font-black uppercase border-2 shadow-sm ${getItemTypeStyles(item.type)}`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-10 py-8">
                            <input 
                              type="text" 
                              className="w-full bg-transparent font-black text-slate-800 uppercase outline-none focus:text-blue-700 text-lg"
                              value={item.description}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            />
                          </td>
                          <td className="px-10 py-8">
                            <div className="flex items-center justify-center gap-5">
                              <button onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))} className="w-10 h-10 flex items-center justify-center bg-white border-2 border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-500 shadow-sm transition-all"><Minus size={14}/></button>
                              <span className="font-black text-slate-900 text-2xl min-w-[40px] text-center">{item.quantity}</span>
                              <button onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)} className="w-10 h-10 flex items-center justify-center bg-white border-2 border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-500 shadow-sm transition-all"><Plus size={14}/></button>
                            </div>
                          </td>
                          <td className="px-10 py-8 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <span className="text-slate-300 font-black text-lg">$</span>
                              <input 
                                type="number" 
                                className="w-28 text-right bg-transparent font-black text-slate-800 outline-none focus:text-blue-700 text-2xl"
                                value={item.price}
                                onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                              />
                            </div>
                          </td>
                          <td className="px-10 py-8 text-right">
                            <span className="font-black text-slate-950 text-3xl tracking-tighter">${(item.price * item.quantity).toFixed(2)}</span>
                          </td>
                          <td className="px-10 py-8 text-right">
                            <button onClick={() => removeItem(item.id)} className="text-slate-200 hover:text-red-500 p-4 rounded-2xl transition-all hover:bg-red-50">
                              <Trash2 size={28}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Acciones de Cierre */}
              <div className="flex flex-wrap gap-8 pt-12 border-t-4 border-slate-100 no-print">
                <button onClick={() => window.print()} className="flex-1 bg-white border-4 border-slate-950 py-8 rounded-[3rem] font-black uppercase text-xs tracking-[0.5em] flex items-center justify-center gap-6 hover:bg-slate-50 shadow-2xl transition-all active:scale-[0.98]">
                  <Printer size={36}/> Imprimir Reporte PDF
                </button>
                {currentRepair.status !== 'Entregado' && (
                  <button onClick={() => setShowPayModal(true)} className="flex-1 bg-blue-600 text-white py-8 rounded-[3rem] font-black uppercase text-xs tracking-[0.5em] flex items-center justify-center gap-6 hover:bg-blue-700 shadow-2xl transition-all active:scale-[0.98]">
                    <CheckCircle size={36}/> Procesar Salida y Entrega
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-[700px] text-slate-300 border-[8px] border-dashed border-slate-200 rounded-[5rem] bg-white animate-pulse-slow">
            <div className="p-24 bg-slate-50 rounded-full mb-12 shadow-inner">
              <ClipboardList size={160} className="text-slate-200" />
            </div>
            <h4 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Gestor de Informes Técnicos</h4>
            <p className="mt-8 text-slate-500 text-center font-bold max-w-xl px-12 leading-relaxed text-xl italic">
              "Introduzca la placa del vehículo para gestionar la liquidación de la orden, añadir repuestos faltantes y generar el informe oficial."
            </p>
          </div>
        )}
      </div>

      {/* MODALES TÉCNICOS */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center z-[100] p-4 no-print">
          <div className="bg-white rounded-[5rem] shadow-2xl max-w-2xl w-full p-20 text-center border-[12px] border-slate-100 animate-in zoom-in duration-300">
            <div className="w-32 h-32 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-12 shadow-inner">
               <CheckCircle size={80} />
            </div>
            <h3 className="text-6xl font-black mb-8 text-slate-950 uppercase tracking-tighter leading-none">Cerrar Orden</h3>
            <p className="text-slate-500 mb-14 font-bold text-2xl leading-relaxed">
              Está procesando la entrega final. El saldo remanente a liquidar es:
              <span className="text-emerald-600 font-black text-7xl tracking-tighter block mt-6 animate-pulse">${calculateBalance().toFixed(2)}</span>
            </p>
            <div className="space-y-6">
               <div className="flex flex-col items-center mb-12">
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Canal de Pago Final:</p>
                  <select 
                    className="w-full px-12 py-6 bg-slate-50 border-4 border-slate-100 rounded-[3rem] font-black uppercase text-sm outline-none text-center appearance-none cursor-pointer"
                    value={tempPaymentMethod}
                    onChange={(e) => setTempPaymentMethod(e.target.value as PaymentMethod)}
                  >
                    {['Efectivo $', 'Efectivo Bs', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
               </div>
               <button onClick={finalizeRepair} className="w-full py-10 bg-slate-950 text-white rounded-[3.5rem] font-black uppercase text-sm tracking-[0.5em] hover:bg-black shadow-2xl transition-all active:scale-95">
                 Liquidar e Imprimir Reporte
               </button>
               <button onClick={() => setShowPayModal(false)} className="w-full py-6 text-slate-400 font-black uppercase text-[12px] tracking-[0.3em] hover:text-red-500 transition-colors">Abortar Operación</button>
            </div>
          </div>
        </div>
      )}

      {showInventorySearch && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center z-[100] p-4 no-print">
          <div className="bg-white rounded-[4rem] shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh] overflow-hidden border-8 border-slate-100">
            <div className="p-12 border-b-4 border-slate-50 bg-slate-50/50">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h3 className="text-5xl font-black text-slate-950 uppercase tracking-tighter leading-none">Catálogo de Repuestos</h3>
                  <p className="text-[12px] font-black text-blue-600 uppercase tracking-[0.5em] mt-5 flex items-center gap-4">
                    <Package size={22} /> Sincronización en Tiempo Real
                  </p>
                </div>
                <button onClick={() => setShowInventorySearch(false)} className="w-20 h-20 bg-white border-4 border-slate-100 rounded-[2rem] text-slate-300 hover:text-red-500 transition-all flex items-center justify-center group">
                  <X size={40} className="group-hover:rotate-90 transition-transform duration-500" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400" size={36}/>
                <input 
                  type="text" 
                  placeholder="Escriba nombre, código o categoría..." 
                  className="w-full pl-24 pr-12 py-8 bg-white border-4 border-slate-200 rounded-[3rem] outline-none focus:ring-12 focus:ring-blue-50 font-black text-2xl transition-all shadow-inner"
                  value={invSearchTerm}
                  onChange={(e) => setInvSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-12 space-y-6 bg-white custom-scrollbar">
              {filteredInventory.map((p: Product) => (
                <button 
                  key={p.id}
                  onClick={() => addFromInventory(p)}
                  className="w-full p-10 flex items-center justify-between bg-slate-50 border-4 border-slate-100 rounded-[3.5rem] hover:border-blue-600 hover:bg-blue-50 transition-all text-left group shadow-sm active:scale-[0.99]"
                >
                  <div className="flex items-center gap-10">
                    <div className="w-20 h-20 bg-slate-950 text-white rounded-[2rem] flex items-center justify-center font-black text-3xl group-hover:bg-blue-600 transition-colors shadow-2xl">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 group-hover:text-blue-700 uppercase text-3xl tracking-tighter leading-none mb-2">{p.name}</p>
                      <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                         {p.category} <span className="w-2 h-2 rounded-full bg-slate-200"></span> STOCK: {p.quantity} UNID.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-black text-blue-600 tracking-tighter leading-none mb-2">${Number(p.price).toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Precio Unitario</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAbonoModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4 no-print">
          <div className="bg-white rounded-[5rem] shadow-2xl max-w-md w-full p-16 animate-in zoom-in duration-300 border-[10px] border-slate-100 text-center">
            <h3 className="text-5xl font-black text-slate-950 mb-6 uppercase tracking-tighter leading-none">Registrar Abono</h3>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-14">Ingreso de fondos parciales</p>
            <div className="space-y-12">
              <div className="relative">
                <span className="absolute left-10 top-1/2 -translate-y-1/2 text-4xl font-black text-slate-300">$</span>
                <input 
                  type="number" 
                  className="w-full pl-20 pr-10 py-10 bg-slate-50 border-4 border-slate-100 rounded-[3rem] font-black text-7xl text-slate-950 outline-none text-center shadow-inner focus:border-emerald-600 transition-all"
                  value={abonoAmount || ''}
                  onChange={(e) => setAbonoAmount(Number(e.target.value))}
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <select 
                className="w-full px-12 py-6 bg-slate-50 border-4 border-slate-100 rounded-[3rem] font-black uppercase text-sm outline-none text-center appearance-none cursor-pointer hover:border-emerald-200 transition-all"
                value={abonoMethod}
                onChange={(e) => setAbonoMethod(e.target.value as PaymentMethod)}
              >
                {['Efectivo $', 'Efectivo Bs', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <button onClick={registerAbono} className="w-full bg-emerald-600 text-white py-10 rounded-[3rem] font-black uppercase text-sm tracking-[0.4em] hover:bg-emerald-700 transition-all shadow-2xl active:scale-95">
                Confirmar Ingreso
              </button>
              <button onClick={() => setShowAbonoModal(false)} className="w-full py-4 text-slate-400 font-black uppercase text-[12px] tracking-widest hover:text-slate-900 transition-colors">Volver</button>
            </div>
          </div>
        </div>
      )}

      {showAbonoReceipt && lastInstallment && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[200] p-4 no-print">
          <div className="bg-white rounded-[4rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-500 border-8 border-white/50">
            <div className="bg-emerald-600 p-12 text-white text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-10 rotate-45 scale-150">
                  <Receipt size={200} />
               </div>
               <div className="w-24 h-24 bg-white/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 backdrop-blur-xl border border-white/30 p-4">
                  <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
               </div>
               <h3 className="text-4xl font-black uppercase tracking-tighter leading-none">Pago Recibido</h3>
               <p className="text-emerald-100 text-[12px] font-black uppercase tracking-[0.3em] mt-4 opacity-90 italic">Comprobante de Caja</p>
            </div>
            <div className="p-12">
              <div className="bg-slate-50 rounded-[3rem] p-10 border-2 border-slate-100 space-y-6 mb-12 shadow-inner">
                 <div className="flex justify-between items-center">
                    <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Importe Recibido</span>
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">${lastInstallment.amount.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center border-t-2 border-slate-200 pt-8">
                    <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Saldo Residual</span>
                    <span className="text-2xl font-black text-blue-600 tracking-tight">${calculateBalance().toFixed(2)}</span>
                 </div>
              </div>
              <div className="flex flex-col gap-4">
                 <button onClick={() => { window.print(); setShowAbonoReceipt(false); }} className="bg-slate-950 text-white py-6 rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-black transition-all shadow-2xl">
                    <Printer size={22}/> Imprimir Comprobante de Abono
                 </button>
                 <button onClick={() => setShowAbonoReceipt(false)} className="py-5 text-slate-400 font-black uppercase text-[12px] tracking-widest hover:text-slate-600 transition-colors">Continuar a Orden</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairReport;
