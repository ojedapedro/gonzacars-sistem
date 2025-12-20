
import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  Search, 
  Barcode, 
  UserRound, 
  ClipboardList, 
  X, 
  DollarSign, 
  Wallet, 
  ChevronDown, 
  TrendingUp,
  CheckCircle2,
  FileText,
  Clock,
  ArrowUpRight,
  Receipt,
  Percent,
  Tag,
  BarChart3,
  Package
} from 'lucide-react';
import { Product, PaymentMethod, Sale, Customer } from '../types';

const LOGO_URL = "https://i.ibb.co/MDhy5tzK/image-2.png";

const SalesPOS: React.FC<{ store: any }> = ({ store }) => {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo $');
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [ivaEnabled, setIvaEnabled] = useState(false);
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (barcodeInput.length >= 8) {
      const product = store.inventory.find((p: Product) => p.barcode === barcodeInput);
      if (product) {
        addToCart(product);
        setBarcodeInput('');
      }
    }
  }, [barcodeInput]);

  const filteredProducts = store.inventory.filter((p: Product) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.quantity > 0
  );

  const addToCart = (product: Product) => {
    // Si hay un carrito nuevo, limpiamos la referencia visual de la última venta del modal rápido
    if (cart.length === 0) {
      // Opcional: podríamos mantener lastSale pero aquí aseguramos que el foco sea la nueva venta
    }
    
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.quantity) return;
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === id) {
        const newQty = Math.max(1, Math.min(item.product.quantity, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => setCart(cart.filter(item => item.product.id !== id));

  const subtotal = cart.reduce((acc, item) => acc + (Number(item.product.price || 0) * item.quantity), 0);
  const iva = ivaEnabled ? subtotal * 0.16 : 0;
  const total = subtotal + iva;

  const processSale = () => {
    if (cart.length === 0) return;
    
    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      customerId: selectedCustomer?.id,
      date: new Date().toISOString().split('T')[0],
      customerName: selectedCustomer?.name || 'Cliente General',
      items: cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: Number(item.product.price || 0),
        quantity: item.quantity
      })),
      total,
      iva: ivaEnabled,
      paymentMethod
    };

    store.addSale(newSale);
    setLastSale(newSale);
    setShowReceiptModal(true);
    setCart([]);
    setSelectedCustomer(null);
  };

  const getDailyTotals = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = store.sales.filter((s: Sale) => s.date === today);
    
    const totalsByMethod = todaySales.reduce((acc: any, sale: Sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + Number(sale.total || 0);
      return acc;
    }, {});

    const totalUSD = todaySales.reduce((acc: number, s: Sale) => acc + Number(s.total || 0), 0);
    const totalBS = totalUSD * Number(store.exchangeRate || 0);

    const itemsSold = todaySales.flatMap(s => s.items).reduce((acc: number, item) => acc + item.quantity, 0);

    const itemsCount = todaySales.flatMap(s => s.items).reduce((acc: any, item) => {
      acc[item.name] = (acc[item.name] || 0) + item.quantity;
      return acc;
    }, {});

    const topItems = Object.entries(itemsCount)
      .map(([name, qty]) => ({ name, qty: qty as number }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const ticketPromedio = todaySales.length > 0 ? totalUSD / todaySales.length : 0;

    return { 
      totalsByMethod, 
      totalUSD, 
      totalBS, 
      count: todaySales.length, 
      topItems, 
      todaySales,
      itemsSold,
      ticketPromedio 
    };
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-full relative">
      <div className="flex flex-1 h-full no-print">
        <div className="flex-1 p-8 border-r border-slate-200 overflow-y-auto custom-scrollbar bg-slate-50/30">
          <div className="mb-6 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input 
                type="text" 
                placeholder="Buscar repuesto por nombre..." 
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative w-72">
              <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18}/>
              <input 
                ref={barcodeRef}
                type="text" 
                placeholder="Escanear Código..." 
                className="w-full pl-12 pr-4 py-3 border-2 border-blue-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 bg-blue-50/30 font-mono text-sm font-bold"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((p: Product) => (
              <button 
                key={p.id}
                onClick={() => addToCart(p)}
                className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-900/5 transition-all text-left flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] bg-slate-100 px-2.5 py-1 rounded-full font-black uppercase text-slate-500 tracking-widest">{p.category}</span>
                    {p.quantity <= 5 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                  </div>
                  <h4 className="font-bold text-slate-800 mt-3 truncate group-hover:text-blue-600 uppercase text-xs tracking-tight">{p.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Stock: {p.quantity} unid.</p>
                </div>
                <div className="mt-6 flex items-end justify-between relative z-10">
                  <p className="font-black text-blue-600 text-2xl tracking-tighter">${Number(p.price || 0).toFixed(2)}</p>
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Plus size={16} />
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -translate-y-12 translate-x-12 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            ))}
          </div>
        </div>

        <div className="w-[400px] bg-white p-8 flex flex-col shadow-2xl border-l border-slate-100 relative z-20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200 p-2">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Caja POS</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Facturación Directa</p>
              </div>
            </div>
            <div className="flex gap-2">
              {lastSale && (
                <button 
                  onClick={() => setShowReceiptModal(true)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all border border-blue-100"
                  title="Re-imprimir última venta"
                >
                  <FileText size={20} />
                </button>
              )}
              <button 
                onClick={() => setShowDailyReport(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all border border-slate-100"
                title="Reporte de Caja Diario"
              >
                <ClipboardList size={22} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 mb-6 custom-scrollbar pr-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 opacity-40">
                 <ShoppingCart size={64} className="mb-4 stroke-[1.5]"/>
                 <p className="text-xs font-black uppercase tracking-[0.2em] italic">Carrito Vacío</p>
              </div>
            ) : cart.map(item => (
              <div key={item.product.id} className="bg-slate-50/50 p-4 rounded-[2rem] border border-slate-100 flex gap-4 group animate-in slide-in-from-right-2 duration-300 hover:bg-white hover:shadow-md transition-all">
                <div className="flex-1 min-w-0">
                  <h5 className="font-black text-xs text-slate-800 truncate uppercase tracking-tight">{item.product.name}</h5>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-slate-100 shadow-sm">
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-blue-600"><Minus size={12}/></button>
                      <span className="font-black text-xs text-slate-700 w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-blue-600"><Plus size={12}/></button>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">x ${Number(item.product.price || 0).toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col justify-between items-end">
                  <button onClick={() => removeFromCart(item.product.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                  <span className="font-black text-slate-900 text-sm tracking-tighter">${(Number(item.product.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <UserRound size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                <select 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] outline-none font-black uppercase tracking-widest cursor-pointer appearance-none focus:border-blue-500 transition-all"
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => {
                    const customer = store.customers.find((c: Customer) => c.id === e.target.value);
                    setSelectedCustomer(customer || null);
                  }}
                >
                  <option value="">Cliente General</option>
                  {store.customers.map((c: Customer) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Wallet size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select 
                  className="w-full pl-10 pr-8 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:border-blue-500 transition-all cursor-pointer"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  {['Efectivo $', 'Efectivo Bs', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <button 
              onClick={() => setIvaEnabled(!ivaEnabled)}
              className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border ${ivaEnabled ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
            >
              <Percent size={14}/> {ivaEnabled ? 'IVA Incluido (16%)' : 'Sin IVA'}
            </button>

            <div className="py-6 border-y border-slate-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</span>
                <span className="text-sm font-bold text-slate-600">${Number(subtotal).toFixed(2)}</span>
              </div>
              {ivaEnabled && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">I.V.A (16%)</span>
                  <span className="text-sm font-bold text-slate-600">${Number(iva).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total a Pagar</span>
                <span className="text-4xl font-black text-blue-600 tracking-tighter leading-none">${Number(total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase italic">Tasa: {store.exchangeRate} Bs/$</span>
                <span className="text-xs font-black text-slate-500">{(Number(total) * Number(store.exchangeRate)).toLocaleString('es-VE')} Bs</span>
              </div>
            </div>

            <button 
              disabled={cart.length === 0}
              onClick={processSale}
              className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-black shadow-2xl shadow-slate-200 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none transition-all active:scale-95"
            >
              <Receipt size={20}/> Procesar Venta
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Invisible para Impresión */}
      {lastSale && (
        <div className="print-only p-8 bg-white text-slate-900 w-full" style={{ maxWidth: '80mm' }}>
          <div className="text-center mb-6">
            <img src={LOGO_URL} alt="Logo" className="w-16 h-16 mx-auto mb-2 object-contain" />
            <h1 className="text-xl font-black uppercase tracking-tighter">Gonzacars C.A.</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest">R.I.F. J-50030426-9</p>
            <p className="text-[8px] font-medium leading-tight">Av. Bolivar norte; Calle Miranda, Local 113-109C<br/>Valencia 2001, Carabobo</p>
          </div>

          <div className="border-y-2 border-dashed border-slate-900 py-3 mb-4 text-[10px]">
            <div className="flex justify-between">
              <span className="font-bold">Factura No:</span>
              <span className="font-black">#{lastSale.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Fecha:</span>
              <span>{new Date(lastSale.date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="font-bold">Cliente:</span>
              <span className="uppercase font-black truncate max-w-[150px]">{lastSale.customerName}</span>
            </div>
          </div>

          <table className="w-full text-[10px] mb-6">
            <thead className="border-b border-slate-900">
              <tr>
                <th className="text-left py-1 font-black uppercase">Prod</th>
                <th className="text-center py-1 font-black uppercase">Cant</th>
                <th className="text-right py-1 font-black uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {lastSale.items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="py-2 pr-2">
                    <span className="block font-bold uppercase text-[9px] leading-tight">{item.name}</span>
                    <span className="text-[8px] text-slate-500">${Number(item.price).toFixed(2)} c/u</span>
                  </td>
                  <td className="text-center py-2 font-bold">{item.quantity}</td>
                  <td className="text-right py-2 font-black">${(Number(item.price) * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1 mb-6">
            {lastSale.iva && (
               <div className="flex justify-between text-[10px]">
                <span className="uppercase">IVA (16%):</span>
                <span>${(Number(lastSale.total) * 0.16).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-black">
              <span className="uppercase">Total USD:</span>
              <span>${Number(lastSale.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-black italic text-slate-600">
              <span className="uppercase">Total BS:</span>
              <span>{(Number(lastSale.total) * Number(store.exchangeRate)).toLocaleString('es-VE')} Bs</span>
            </div>
            <div className="flex justify-between text-[9px] font-bold pt-2">
              <span className="uppercase tracking-widest">Pago:</span>
              <span className="uppercase">{lastSale.paymentMethod}</span>
            </div>
          </div>

          <div className="text-center border-t-2 border-dashed border-slate-900 pt-4">
            <p className="text-[10px] font-black uppercase tracking-tighter">¡Gracias por su compra!</p>
            <p className="text-[8px] font-medium italic mt-1">Gonzacars: Calidad y Confianza en cada repuesto.</p>
          </div>
        </div>
      )}

      {showReceiptModal && lastSale && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4 no-print">
          <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-500">
            <div className="bg-emerald-600 p-10 text-white text-center relative overflow-hidden">
               <div className="absolute top-[-20%] right-[-10%] opacity-10 rotate-12 scale-150">
                  <ShoppingCart size={180} />
               </div>
               <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/30 backdrop-blur-md rotate-6 p-3">
                  <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
               </div>
               <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Venta Procesada</h3>
               <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.3em] mt-3 opacity-80">Comprobante #{lastSale.id}</p>
            </div>
            
            <div className="p-10">
               <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 space-y-5 mb-10">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Facturado</span>
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">${Number(lastSale.total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-200 pt-5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Moneda Local</span>
                    <span className="text-xl font-black text-emerald-600 tracking-tight">{(Number(lastSale.total) * Number(store.exchangeRate)).toLocaleString('es-VE')} Bs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Método</span>
                    <span className="text-[10px] font-black uppercase bg-white px-4 py-1.5 rounded-xl border border-slate-200 shadow-sm">{lastSale.paymentMethod}</span>
                  </div>
               </div>

               <div className="flex flex-col gap-3">
                  <button 
                    onClick={handlePrint}
                    className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-blue-700 shadow-2xl shadow-blue-100 transition-all active:scale-95"
                  >
                    <Printer size={18}/> Imprimir Ticket de Venta
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

      {showDailyReport && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4 no-print">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-8 duration-500 border border-slate-200">
            {/* Header Reporte */}
            <div className="p-10 bg-slate-950 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5">
                 <BarChart3 size={160} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Arqueo de Caja Diario</h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                      <Clock size={12}/> {new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowDailyReport(false)} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all relative z-10 border border-white/5">
                <X size={24} />
              </button>
            </div>

            <div className="p-10 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
              {(() => {
                const report = getDailyTotals();
                return (
                  <div className="space-y-10">
                    {/* Tarjetas Principales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 relative group">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ingreso Bruto (USD)</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-slate-900 tracking-tighter">${Number(report.totalUSD).toFixed(2)}</span>
                          <ArrowUpRight size={20} className="text-emerald-500" />
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50">
                          <p className="text-[10px] font-black text-emerald-600 uppercase">Equivalente en Bolívares</p>
                          <p className="text-xl font-black text-emerald-700 tracking-tight">{Number(report.totalBS).toLocaleString('es-VE')} Bs</p>
                        </div>
                      </div>

                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ticket Promedio</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-blue-600 tracking-tighter">${report.ticketPromedio.toFixed(2)}</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Volumen de Transacciones</p>
                          <p className="text-xl font-black text-slate-900">{report.count} Ventas</p>
                        </div>
                      </div>

                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Artículos Vendidos</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-purple-600 tracking-tighter">{report.itemsSold}</span>
                          <Tag size={20} className="text-purple-200" />
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50">
                          <p className="text-[10px] font-black text-slate-400 uppercase">En Inventario Restado</p>
                          <p className="text-xl font-black text-slate-900">Unidades Totales</p>
                        </div>
                      </div>

                      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden flex flex-col justify-between">
                        <DollarSign className="absolute -bottom-4 -right-4 text-white/5" size={140} />
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tasa de Cambio</p>
                          <p className="text-2xl font-black tracking-tight text-blue-400">{store.exchangeRate.toFixed(2)} Bs/$</p>
                        </div>
                        <div className="mt-auto">
                           <p className="text-[9px] font-bold text-slate-400 uppercase italic leading-tight">Valor utilizado para todas las conversiones de este reporte.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                      {/* Desglose por Método */}
                      <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Wallet size={18} className="text-blue-500" /> Desglose por Método de Pago
                          </h4>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Auditoría Multi-divisa</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {['Efectivo $', 'Efectivo Bs', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'].map((method) => {
                            const amount = Number(report.totalsByMethod[method] || 0);
                            const amountBs = amount * Number(store.exchangeRate);
                            return (
                              <div key={method} className="bg-white p-6 rounded-[2rem] border border-slate-100 hover:shadow-xl transition-all group border-l-4 border-l-transparent hover:border-l-blue-600">
                                <div className="flex justify-between items-start mb-4">
                                  <span className="font-black text-slate-800 text-[11px] uppercase tracking-tighter">{method}</span>
                                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                    <Receipt size={14} />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <p className="font-black text-slate-950 text-2xl tracking-tighter">${amount.toFixed(2)}</p>
                                  <p className="text-xs font-black text-emerald-600">
                                    {amountBs.toLocaleString('es-VE')} Bs
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Top Productos Refinado */}
                      <div className="lg:col-span-5 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                            <TrendingUp size={18} className="text-blue-500" /> Repuestos Más Vendidos
                          </h4>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Top 5</span>
                        </div>
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 space-y-6 shadow-sm">
                          {report.topItems.map((item, idx) => {
                            const percentage = (item.qty / report.itemsSold) * 100;
                            return (
                              <div key={idx} className="space-y-2 group">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-[10px] font-black text-white group-hover:bg-blue-600 transition-all">
                                      {idx + 1}
                                    </div>
                                    <span className="font-black text-slate-800 text-xs uppercase truncate max-w-[200px]">{item.name}</span>
                                  </div>
                                  <span className="font-black text-blue-600 text-xs bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap">{item.qty} unid.</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                   <div 
                                    className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                                    style={{ width: `${percentage}%` }}
                                   />
                                </div>
                              </div>
                            );
                          })}
                          {report.topItems.length === 0 && (
                            <div className="text-center py-16 opacity-30 flex flex-col items-center">
                              <Package size={48} className="mb-4" />
                              <p className="text-[10px] font-black uppercase tracking-widest">Sin datos de salida hoy</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer Reporte */}
            <div className="p-8 bg-white border-t border-slate-100 flex gap-4 no-print">
              <button 
                onClick={() => window.print()}
                className="flex-1 bg-slate-950 text-white py-6 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.3em] hover:bg-black transition-all shadow-2xl shadow-slate-200 flex items-center justify-center gap-3"
              >
                <Printer size={20} /> Generar Reporte de Cierre para Contabilidad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPOS;
