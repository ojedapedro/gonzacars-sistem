
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
  Download, 
  Wallet, 
  History, 
  AlertCircle,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight
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
  
  // Lightbox State
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  
  const [tempPaymentMethod, setTempPaymentMethod] = useState<PaymentMethod>('Efectivo $');
  const [abonoAmount, setAbonoAmount] = useState<number>(0);
  const [abonoMethod, setAbonoMethod] = useState<PaymentMethod>('Efectivo $');

  const handleSearch = () => {
    const plateRegex = /^[A-Z0-9]+$/i;
    
    if (!searchPlate.trim()) {
      alert('Por favor ingrese una placa');
      return;
    }

    if (!plateRegex.test(searchPlate.replace(/\s/g, ''))) {
      alert('La placa debe contener solo letras y números (ej: PED123OJ)');
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
    return currentRepair.installments.reduce((acc, inst) => acc + inst.amount, 0);
  };

  const calculateBalance = () => {
    return calculateTotal() - calculatePaid();
  };

  const registerAbono = () => {
    if (!currentRepair || abonoAmount <= 0) return;
    
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
        id: 'final-payment',
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

  const navigateLightbox = (direction: 'next' | 'prev') => {
    if (activePhotoIndex === null || !currentRepair?.evidencePhotos) return;
    const photos = currentRepair.evidencePhotos;
    if (direction === 'next') {
      setActivePhotoIndex((activePhotoIndex + 1) % photos.length);
    } else {
      setActivePhotoIndex((activePhotoIndex - 1 + photos.length) % photos.length);
    }
  };

  return (
    <div className="p-8">
      {/* Cabecera de Impresión - Solo visible al imprimir */}
      <div className="print-only mb-10 text-center border-b-2 border-slate-900 pb-6">
        <img src={LOGO_URL} alt="Logo Gonzacars" className="w-24 h-24 mx-auto mb-4 object-contain" />
        <h1 className="text-3xl font-black uppercase tracking-tighter">Gonzacars C.A.</h1>
        <p className="text-xs font-bold uppercase tracking-widest mt-1">R.I.F. J-12345678-9 | Taller Mecánico & Repuestos</p>
        <p className="text-[10px] font-medium mt-1">Puerto Ordaz, Edo. Bolívar, Venezuela</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 flex gap-4 no-print">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
          <input 
            type="text" 
            placeholder="Ingrese Placa (ej: PED123OJ)" 
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
          <div className="p-8 bg-slate-900 text-white flex justify-between items-start">
            <div>
              <div className="flex flex-wrap items-center gap-4 mb-2">
                <h2 className="text-3xl font-black uppercase tracking-tight">{currentRepair.ownerName}</h2>
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
              <div className="lg:col-span-7 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ClipboardList size={16} /> Diagnóstico Técnico
                </h3>
                <p className="text-slate-700 italic leading-relaxed font-medium">"{currentRepair.diagnosis}"</p>
              </div>

              {currentRepair.evidencePhotos && currentRepair.evidencePhotos.length > 0 && (
                <div className="lg:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-100 no-print">
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Camera size={16} /> Evidencias de Taller
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {currentRepair.evidencePhotos.map((photo, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setActivePhotoIndex(idx)}
                        className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-white cursor-zoom-in shadow-sm hover:shadow-md transition-all"
                      >
                        <img src={photo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                           <div className="bg-white/90 p-2 rounded-xl text-slate-900 shadow-xl">
                              <Maximize2 size={16} />
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 text-center">Haga clic en una foto para ampliar</p>
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6 no-print">
                <h3 className="text-lg font-black text-slate-800 border-l-4 border-blue-600 pl-3 uppercase tracking-tighter">Detalle de Cargos</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setShowInventorySearch(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all">
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
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3 font-mono">
                            <button onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))} className="p-1 hover:text-blue-600 no-print"><Minus size={12}/></button>
                            <span className="font-black text-slate-800">{item.quantity}</span>
                            <button onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)} className="p-1 hover:text-blue-600 no-print"><Plus size={12}/></button>
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
                          <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500">
                            <Trash2 size={16}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <History size={16} className="text-blue-500" /> Seguimiento de Pagos / Abonos
                  </h3>
                  <button 
                    onClick={() => setShowAbonoModal(true)}
                    className="no-print px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                  >
                    + Registrar Abono
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    {currentRepair.installments && currentRepair.installments.length > 0 ? (
                      currentRepair.installments.map((inst) => (
                        <div key={inst.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(inst.date).toLocaleDateString()} - {new Date(inst.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              <p className="text-xs font-bold text-slate-700 uppercase mt-1">Metodo: {inst.method}</p>
                           </div>
                           <p className="text-lg font-black text-blue-600 tracking-tighter">+ ${inst.amount.toFixed(2)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic font-medium py-4">No se han registrado pagos parciales aún.</p>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Presupuesto</span>
                      <span className="text-lg font-black text-slate-800">${calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Abonado a la fecha</span>
                      <span className="text-lg font-black text-emerald-600">${calculatePaid().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Saldo Pendiente</span>
                      <div className="text-right">
                        <span className={`text-3xl font-black tracking-tighter ${calculateBalance() > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                          ${calculateBalance().toFixed(2)}
                        </span>
                        {calculateBalance() > 0 && (
                          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Deuda por cancelar</p>
                        )}
                      </div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="flex flex-col items-end gap-2 bg-slate-900 text-white p-8 rounded-[2.5rem]">
              <div className="flex justify-between w-72 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-white/10 pb-3 mb-1">
                <span>Total General</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-72 text-xs font-black text-emerald-400 uppercase tracking-widest pt-1">
                <span>Total Abonado</span>
                <span>-${calculatePaid().toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-72 items-center mt-6 border-t border-white/20 pt-5">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle size={14}/> {calculateBalance() > 0 ? 'Por Pagar' : 'Cancelado'}
                </span>
                <span className={`text-5xl font-black tracking-tighter ${calculateBalance() > 0 ? 'text-blue-400' : 'text-green-400'}`}>
                  ${calculateBalance().toFixed(2)}
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 italic">Tasa: {store.exchangeRate} Bs/$ ({(calculateBalance() * store.exchangeRate).toLocaleString('es-VE')} Bs)</p>
            </div>

            <div className="flex flex-wrap gap-4 pt-8 no-print border-t border-slate-100">
              <button onClick={() => window.print()} className="flex-1 min-w-[200px] border-2 border-slate-200 py-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
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
                  <button onClick={() => setShowPayModal(true)} className="flex-[1.5] bg-green-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-green-700 shadow-xl shadow-green-100 transition-all">
                    <CheckCircle size={18}/> {calculateBalance() > 0 ? 'Liquidar y Entregar' : 'Finalizar Entrega'}
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
          <p className="mt-2 text-slate-500 text-center font-medium max-w-sm px-6">Localice un vehículo por placa para gestionar sus estados, cargos, abonos y cierre definitivo.</p>
        </div>
      )}

      {/* Visor de Fotos - Lightbox */}
      {activePhotoIndex !== null && currentRepair?.evidencePhotos && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center z-[200] p-6 no-print animate-in fade-in duration-300">
           <button 
            onClick={() => setActivePhotoIndex(null)}
            className="absolute top-6 right-6 w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-all z-[210] border border-white/10"
           >
              <X size={28} />
           </button>

           <div className="relative w-full h-full flex items-center justify-center">
              {/* Botón Anterior */}
              <button 
                onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
                className="absolute left-0 w-16 h-16 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex items-center justify-center transition-all border border-white/5"
              >
                <ChevronLeft size={32} />
              </button>

              <div className="max-w-[85%] max-h-[85%] relative group">
                <img 
                  src={currentRepair.evidencePhotos[activePhotoIndex]} 
                  className="w-full h-full object-contain rounded-3xl shadow-2xl animate-in zoom-in-95 duration-500"
                  alt={`Evidencia ${activePhotoIndex + 1}`}
                />
                
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white/60 text-xs font-black uppercase tracking-[0.3em]">
                  Foto {activePhotoIndex + 1} de {currentRepair.evidencePhotos.length}
                </div>
              </div>

              {/* Botón Siguiente */}
              <button 
                onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
                className="absolute right-0 w-16 h-16 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex items-center justify-center transition-all border border-white/5"
              >
                <ChevronRight size={32} />
              </button>
           </div>
        </div>
      )}

      {showAbonoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10">
            <h3 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-tighter">Registrar Abono</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto del Abono ($)</label>
                 <input 
                  type="number" 
                  step="0.01"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-2xl text-blue-600 outline-none focus:ring-4 focus:ring-blue-50"
                  value={abonoAmount}
                  onChange={(e) => setAbonoAmount(Number(e.target.value))}
                  autoFocus
                />
                <p className="text-[10px] font-bold text-slate-400 uppercase">Saldo Pendiente: ${calculateBalance().toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Método de Pago</label>
                 <select 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black uppercase text-[10px] tracking-widest outline-none"
                  value={abonoMethod}
                  onChange={(e) => setAbonoMethod(e.target.value as PaymentMethod)}
                >
                  {['Efectivo $', 'Efectivo Bs', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                 <button onClick={() => setShowAbonoModal(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                 <button onClick={registerAbono} className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100">Confirmar Pago</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 font-bold"
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
              <button onClick={() => setShowInventorySearch(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 text-center">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
              <CheckCircle size={48} />
            </div>
            <h3 className="text-3xl font-black mb-2 text-slate-800 uppercase tracking-tighter">Cierre de Orden</h3>
            <p className="text-slate-500 mb-8 font-medium italic">
              Se registrará el pago final de <strong>${calculateBalance().toFixed(2)}</strong> por <strong>{tempPaymentMethod}</strong> y se entregará el vehículo.
            </p>
            <button onClick={finalizeRepair} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all mb-4">
              Confirmar Liquidación y Entrega
            </button>
            <button onClick={() => setShowPayModal(false)} className="w-full py-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-all">Regresar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairReport;
