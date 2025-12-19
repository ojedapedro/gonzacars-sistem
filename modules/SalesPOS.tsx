
import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Printer, Search, Barcode, UserRound, ClipboardList, X, DollarSign, Wallet, ChevronDown, TrendingUp } from 'lucide-react';
import { Product, PaymentMethod, Sale, Customer } from '../types';

const SalesPOS: React.FC<{ store: any }> = ({ store }) => {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo $');
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [ivaEnabled, setIvaEnabled] = useState(false);
  const [showDailyReport, setShowDailyReport] = useState(false);
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

  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const iva = ivaEnabled ? subtotal * 0.16 : 0;
  const total = subtotal + iva;

  const processSale = () => {
    if (cart.length === 0) return;
    
    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      customerId: selectedCustomer?.id,
      date: new Date().toISOString().split('T')[0],
      customerName: selectedCustomer?.name || 'Cliente General',
      items: cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      })),
      total,
      iva: ivaEnabled,
      paymentMethod
    };

    store.addSale(newSale);
    alert('Venta procesada con éxito.');
    setCart([]);
    setSelectedCustomer(null);
    setTimeout(() => window.print(), 500);
  };

  const getDailyTotals = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = store.sales.filter((s: Sale) => s.date === today);
    
    const totalsByMethod = todaySales.reduce((acc: any, sale: Sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
      return acc;
    }, {});

    const totalUSD = todaySales.reduce((acc: number, s: Sale) => acc + s.total, 0);
    const totalBS = totalUSD * store.exchangeRate;

    return { totalsByMethod, totalUSD, totalBS, count: todaySales.length };
  };

  return (
    <div className="flex h-full no-print">
      <div className="flex-1 p-8 border-r border-slate-200 overflow-y-auto">
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-64">
            <Barcode className="absolute left-3 top-2.5 text-blue-500" size={18}/>
            <input 
              ref={barcodeRef}
              type="text" 
              placeholder="Escanear Código..." 
              className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
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
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-black uppercase text-slate-500 tracking-widest">{p.category}</span>
                </div>
                <h4 className="font-bold text-slate-800 mt-2 truncate group-hover:text-blue-600">{p.name}</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Stock: {p.quantity}</p>
              </div>
              <p className="mt-4 font-black text-blue-600 text-xl tracking-tighter">${p.price.toFixed(2)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="w-96 bg-white p-6 flex flex-col shadow-xl border-l border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <ShoppingCart size={20} />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Carrito</h3>
          </div>
          <button 
            onClick={() => setShowDailyReport(true)}
            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
            title="Reporte de Caja Diario"
          >
            <ClipboardList size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-6 custom-scrollbar pr-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-300">
               <ShoppingCart size={48} className="opacity-10 mb-2"/>
               <p className="text-xs font-black uppercase tracking-widest italic">Vacío</p>
            </div>
          ) : cart.map(item => (
            <div key={item.product.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 group">
              <div className="flex-1 min-w-0">
                <h5 className="font-black text-xs text-slate-800 truncate uppercase tracking-tight">{item.product.name}</h5>
                <div className="flex items-center gap-3 mt-3">
                  <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded-md hover:bg-slate-100 text-slate-400"><Minus size={10}/></button>
                  <span className="font-black text-xs text-slate-700">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded-md hover:bg-slate-100 text-slate-400"><Plus size={10}/></button>
                </div>
              </div>
              <div className="text-right flex flex-col justify-between">
                <button onClick={() => removeFromCart(item.product.id)} className="text-slate-300 hover:text-red-500 transition-colors ml-auto"><Trash2 size={16}/></button>
                <span className="font-black text-blue-600 text-sm">${(item.product.price * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
            <UserRound size={16} className="text-slate-400"/>
            <select 
              className="w-full bg-transparent border-none text-xs outline-none font-black uppercase tracking-widest"
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
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 flex items-center pointer-events-none">
              <Wallet size={16} />
            </div>
            <select 
              className="w-full pl-11 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 appearance-none outline-none focus:border-blue-500 transition-all"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              {['Efectivo $', 'Efectivo Bs', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="py-6 border-y border-slate-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total a Pagar</span>
              <span className="text-3xl font-black text-blue-600 tracking-tighter">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400">Total en Bolívares</span>
              <span className="text-xs font-black text-slate-500">{(total * store.exchangeRate).toLocaleString('es-VE')} Bs</span>
            </div>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={processSale}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-black shadow-xl shadow-slate-100 disabled:bg-slate-200 disabled:shadow-none transition-all active:scale-95"
          >
            <Printer size={18}/> Procesar Venta
          </button>
        </div>
      </div>

      {/* Daily Cash Report Modal */}
      {showDailyReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black flex items-center gap-2 uppercase tracking-tighter">
                  <ClipboardList size={24} className="text-blue-400" /> Reporte de Cierre Diario
                </h3>
                <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">
                  {new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setShowDailyReport(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              {(() => {
                const report = getDailyTotals();
                return (
                  <div className="space-y-8">
                    {/* Summary Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Total Ingresos USD</p>
                        <p className="text-3xl font-black text-blue-700">${report.totalUSD.toFixed(2)}</p>
                      </div>
                      <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Ingresos BS</p>
                        <p className="text-3xl font-black text-emerald-700 leading-none">
                          <span className="text-xs block font-bold mb-1 opacity-60">Calculado a {store.exchangeRate} Bs/$</span>
                          {report.totalBS.toLocaleString('es-VE')} <span className="text-sm">Bs</span>
                        </p>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transacciones</p>
                        <p className="text-3xl font-black text-slate-800">{report.count}</p>
                      </div>
                    </div>

                    {/* Breakdown by Payment Method */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Wallet size={18} className="text-blue-500" />
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Desglose por Método de Pago</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {['Efectivo $', 'Efectivo Bs', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'].map((method) => {
                          const amount = report.totalsByMethod[method] || 0;
                          return (
                            <div key={method} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                              <div>
                                <span className="font-bold text-slate-700 block">{method}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Subtotal Neto</span>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-slate-900">${amount.toFixed(2)}</p>
                                <p className="text-[10px] font-black text-emerald-600">
                                  {(amount * store.exchangeRate).toLocaleString('es-VE')} Bs
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Operational Summary */}
                    <div className="bg-slate-900 p-6 rounded-3xl text-white relative overflow-hidden">
                       <TrendingUp className="absolute right-[-10px] bottom-[-10px] text-white/5" size={120} />
                       <h4 className="text-xs font-black uppercase tracking-widest mb-4 opacity-50">Resumen de Cierre</h4>
                       <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                         <span className="text-sm font-medium">Fondo de Caja Sugerido (USD)</span>
                         <span className="text-xl font-black">$50.00</span>
                       </div>
                       <p className="text-[10px] text-white/60 font-medium leading-relaxed italic">
                         Este reporte consolida todas las ventas realizadas hoy hasta las {new Date().toLocaleTimeString()}. 
                         Asegúrese de que el efectivo físico coincida con los montos indicados en "Efectivo $" y "Efectivo Bs".
                       </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 no-print">
              <button 
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-slate-200"
              >
                <Printer size={18} className="inline mr-2" /> Imprimir Cierre Completo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPOS;
