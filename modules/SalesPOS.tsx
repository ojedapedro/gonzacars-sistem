
import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Printer, Search, Barcode, UserRound, ClipboardList, X, DollarSign, Wallet } from 'lucide-react';
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
    window.print();
  };

  const getDailyTotals = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = store.sales.filter((s: Sale) => s.date === today);
    
    const totalsByMethod = todaySales.reduce((acc: any, sale: Sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
      return acc;
    }, {});

    const totalUSD = todaySales.reduce((acc: number, s: Sale) => acc + s.total, 0);

    return { totalsByMethod, totalUSD, count: todaySales.length };
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
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold uppercase text-slate-500">{p.category}</span>
                </div>
                <h4 className="font-bold text-slate-800 mt-2 truncate">{p.name}</h4>
                <p className="text-xs text-slate-500">Stock: {p.quantity}</p>
              </div>
              <p className="mt-4 font-bold text-blue-600 text-lg">${p.price.toFixed(2)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="w-96 bg-white p-6 flex flex-col shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShoppingCart size={24} className="text-blue-600" />
            <h3 className="text-xl font-bold text-slate-800">Carrito</h3>
          </div>
          <button 
            onClick={() => setShowDailyReport(true)}
            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
            title="Reporte de Caja Diario"
          >
            <ClipboardList size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-6">
          {cart.length === 0 ? (
            <div className="text-center text-slate-400 py-10 italic">El carrito está vacío</div>
          ) : cart.map(item => (
            <div key={item.product.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex gap-3">
              <div className="flex-1">
                <h5 className="font-bold text-sm text-slate-800 truncate">{item.product.name}</h5>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 bg-white border rounded hover:bg-slate-100"><Minus size={12}/></button>
                  <span className="font-bold text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 bg-white border rounded hover:bg-slate-100"><Plus size={12}/></button>
                </div>
              </div>
              <div className="text-right flex flex-col justify-between">
                <button onClick={() => removeFromCart(item.product.id)} className="text-slate-300 hover:text-red-500 transition-colors ml-auto"><Trash2 size={16}/></button>
                <span className="font-bold text-blue-600">${(item.product.price * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
            <UserRound size={16} className="text-slate-400"/>
            <select 
              className="w-full bg-transparent border-none text-sm outline-none font-medium"
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

          <select 
            className="w-full px-4 py-2 bg-slate-100 border-none rounded-lg text-sm font-bold text-slate-700"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          >
            {['Efectivo $', 'Efectivo Bs', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <div className="space-y-2 py-4 border-t border-slate-100">
            <div className="flex justify-between text-xl font-bold text-slate-800"><span>Total</span><span>${total.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-slate-400"><span>A tasa {store.exchangeRate}</span><span>{(total * store.exchangeRate).toLocaleString('es-VE')} Bs</span></div>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={processSale}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:bg-slate-300 transition-all"
          >
            <Printer size={20}/> Procesar Venta
          </button>
        </div>
      </div>

      {/* Daily Cash Report Modal */}
      {showDailyReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black flex items-center gap-2 uppercase tracking-tighter">
                  <ClipboardList size={24} className="text-blue-400" /> Cierre de Caja
                </h3>
                <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">{new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
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
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Ingresos USD</p>
                        <p className="text-3xl font-black text-blue-600">${report.totalUSD.toFixed(2)}</p>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transacciones</p>
                        <p className="text-3xl font-black text-slate-800">{report.count}</p>
                      </div>
                    </div>

                    {/* Breakdown by Payment Method */}
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Wallet size={16} className="text-blue-500" /> Desglose por Método
                      </h4>
                      <div className="space-y-3">
                        {['Efectivo $', 'Efectivo Bs', 'Pago Móvil', 'TDD', 'TDC', 'Zelle'].map((method) => {
                          const amount = report.totalsByMethod[method] || 0;
                          return (
                            <div key={method} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                              <span className="font-bold text-slate-600">{method}</span>
                              <div className="text-right">
                                <p className="font-black text-slate-900">${amount.toFixed(2)}</p>
                                <p className="text-[10px] font-bold text-slate-400">{(amount * store.exchangeRate).toLocaleString('es-VE')} Bs</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100/50">
                      <p className="text-xs text-blue-700 font-medium leading-relaxed">
                        Este reporte resume las ventas realizadas únicamente el día de hoy. 
                        Los montos en Bolívares están calculados según la tasa configurada de <strong>{store.exchangeRate} Bs/$</strong>.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 no-print">
              <button 
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all shadow-lg"
              >
                Imprimir Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPOS;
