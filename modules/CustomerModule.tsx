
import React, { useState } from 'react';
import { 
  UserRound, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  History, 
  Car, 
  ShoppingBag, 
  MapPin, 
  Calendar,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  Filter,
  X,
  Wrench
} from 'lucide-react';
import { Customer, VehicleRepair, Sale } from '../types';

const CustomerModule: React.FC<{ store: any }> = ({ store }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'repairs' | 'sales'>('repairs');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [plateFilter, setPlateFilter] = useState<string | null>(null);

  const filteredCustomers = store.customers.filter((c: Customer) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const customer: Customer = {
      ...newCustomer,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    store.addCustomer(customer);
    setShowAddModal(false);
    setNewCustomer({ name: '', phone: '', email: '', address: '' });
  };

  const getCustomerRepairs = (id: string) => {
    let repairs = store.repairs.filter((r: VehicleRepair) => r.customerId === id);
    if (plateFilter) {
      repairs = repairs.filter((r: VehicleRepair) => r.plate === plateFilter);
    }
    return repairs;
  };

  const getCustomerSales = (id: string) => store.sales.filter((s: Sale) => s.customerId === id);
  
  const getCustomerVehicles = (id: string) => {
    const repairs = store.repairs.filter((r: VehicleRepair) => r.customerId === id);
    const uniquePlates = new Set();
    return repairs.filter((r: VehicleRepair) => {
      const isDuplicate = uniquePlates.has(r.plate);
      uniquePlates.add(r.plate);
      return !isDuplicate;
    });
  };

  const calculateTotalLTV = (id: string) => {
    const salesTotal = getCustomerSales(id).reduce((acc: number, s: Sale) => acc + s.total, 0);
    const repairsTotal = store.repairs.filter((r: VehicleRepair) => r.customerId === id).reduce((acc: number, r: VehicleRepair) => {
      const itemsTotal = r.items.reduce((a, i) => a + (i.price * i.quantity), 0);
      return acc + itemsTotal;
    }, 0);
    return salesTotal + repairsTotal;
  };

  const handleViewVehicleHistory = (plate: string) => {
    setPlateFilter(plate);
    setActiveTab('repairs');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Gestión de Clientes</h3>
          <p className="text-slate-500 font-medium">Directorio estratégico y analíticas de lealtad de Gonzacars</p>
        </div>
        <div className="flex gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input 
              type="text" 
              placeholder="Buscar por nombre o teléfono..." 
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all text-sm shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            <Plus size={20}/> Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
        {/* Sidebar: Lista de Clientes */}
        <div className="lg:col-span-4 bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center">
            <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Base de Datos ({filteredCustomers.length})</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
            {filteredCustomers.map((c: Customer) => (
              <button 
                key={c.id} 
                onClick={() => { setSelectedCustomer(c); setPlateFilter(null); }}
                className={`w-full p-5 flex items-center gap-4 text-left transition-all hover:bg-slate-50 ${selectedCustomer?.id === c.id ? 'bg-blue-50/50 border-r-4 border-blue-600' : ''}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black uppercase transition-colors ${selectedCustomer?.id === c.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-slate-800 truncate uppercase text-sm tracking-tight">{c.name}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 font-bold mt-0.5">
                    <Phone size={12} className="text-blue-500"/> {c.phone}
                  </div>
                </div>
                <ArrowRight size={16} className={`text-slate-300 transition-transform ${selectedCustomer?.id === c.id ? 'translate-x-1 text-blue-400' : ''}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Content: Detalles del Cliente */}
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
          {selectedCustomer ? (
            <>
              {/* Header de Perfil */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-slate-900 text-white flex items-center justify-center text-4xl font-black shadow-2xl rotate-3">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-black text-slate-900 leading-tight uppercase tracking-tighter">{selectedCustomer.name}</h2>
                    <div className="flex flex-wrap gap-4 mt-3">
                      <span className="flex items-center gap-1.5 text-slate-500 text-[10px] font-black uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Phone size={14} className="text-blue-500"/> {selectedCustomer.phone}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-500 text-[10px] font-black uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Mail size={14} className="text-blue-500"/> {selectedCustomer.email || 'Sin correo'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
                   <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Valor de Vida (LTV)</p>
                      <p className="text-2xl font-black text-blue-700">${calculateTotalLTV(selectedCustomer.id).toFixed(2)}</p>
                   </div>
                   <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vehículos Totales</p>
                      <p className="text-2xl font-black text-slate-800">{getCustomerVehicles(selectedCustomer.id).length}</p>
                   </div>
                   <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha Registro</p>
                      <p className="text-xl font-black text-slate-800">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                   </div>
                </div>
              </div>

              {/* Nueva Sección: Vehículos Asociados */}
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <Car size={18} />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Vehículos Registrados</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getCustomerVehicles(selectedCustomer.id).length > 0 ? (
                    getCustomerVehicles(selectedCustomer.id).map((v: VehicleRepair) => (
                      <button 
                        key={v.plate} 
                        onClick={() => handleViewVehicleHistory(v.plate)}
                        className={`p-5 rounded-2xl border-2 transition-all text-left flex flex-col gap-3 group relative overflow-hidden ${plateFilter === v.plate ? 'border-blue-600 bg-blue-50' : 'border-slate-50 bg-slate-50/50 hover:border-blue-200 hover:bg-white'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="bg-slate-900 text-white px-3 py-1 rounded-lg font-mono text-[11px] font-black tracking-widest shadow-lg">
                            {v.plate}
                          </div>
                          <ExternalLink size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 uppercase leading-none">{v.brand} {v.model}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Año {v.year}</p>
                        </div>
                        {plateFilter === v.plate && (
                          <div className="absolute bottom-2 right-2">
                             <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full py-10 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                      <Car size={32} className="mx-auto text-slate-200 mb-2" />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No hay vehículos registrados en el historial</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pestañas de Historial */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="flex p-2 bg-slate-50/50 border-b">
                  <button onClick={() => setActiveTab('repairs')} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'repairs' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                    <History size={16}/> Historial Taller
                  </button>
                  <button onClick={() => setActiveTab('sales')} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sales' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                    <ShoppingBag size={16}/> Compras Directas
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  {activeTab === 'repairs' && (
                    <div className="space-y-6">
                      {plateFilter && (
                        <div className="bg-blue-600 p-4 rounded-2xl flex justify-between items-center shadow-lg shadow-blue-100 mb-2">
                          <div className="flex items-center gap-3 text-white">
                            <Filter size={18} /> 
                            <span className="text-[10px] font-black uppercase tracking-widest">Filtrando historial de: {plateFilter}</span>
                          </div>
                          <button onClick={() => setPlateFilter(null)} className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-xl transition-colors">
                            <X size={16} />
                          </button>
                        </div>
                      )}
                      
                      {getCustomerRepairs(selectedCustomer.id).length > 0 ? (
                        getCustomerRepairs(selectedCustomer.id).reverse().map((r: VehicleRepair) => (
                          <div key={r.id} className="p-6 border border-slate-100 rounded-[2rem] flex items-center justify-between hover:border-blue-100 hover:bg-slate-50/50 transition-all group">
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <Wrench size={24}/>
                              </div>
                              <div>
                                <div className="flex items-center gap-3">
                                  <p className="font-black text-slate-800 uppercase tracking-tight text-sm">{r.brand} {r.model} <span className="text-slate-400 font-bold ml-1">{r.year}</span></p>
                                  <span className={`text-[9px] font-black uppercase tracking-tighter px-3 py-1 rounded-full ${r.status === 'Entregado' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{r.status}</span>
                                </div>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">PLACA: {r.plate}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(r.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-slate-900">${r.items.reduce((a, i) => a + (i.price * i.quantity), 0).toFixed(2)}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase mt-1">Total Facturado</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <EmptyState message="Sin historial registrado" icon={<History size={40}/>} />
                      )}
                    </div>
                  )}

                  {activeTab === 'sales' && (
                    <div className="space-y-4">
                      {getCustomerSales(selectedCustomer.id).length > 0 ? (
                        getCustomerSales(selectedCustomer.id).reverse().map((s: Sale) => (
                          <div key={s.id} className="p-6 border border-slate-100 rounded-[2rem] hover:border-blue-100 hover:bg-slate-50/50 transition-all flex justify-between items-center">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Orden de Venta #{s.id}</p>
                              <p className="text-sm text-slate-800 font-black uppercase">{new Date(s.date).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                              <p className="text-[10px] font-bold text-blue-500 uppercase mt-1">Pago: {s.paymentMethod}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-blue-700">${s.total.toFixed(2)}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase italic">{(s.total * store.exchangeRate).toLocaleString('es-VE')} Bs</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <EmptyState message="Sin compras registradas" icon={<ShoppingBag size={40}/>} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full bg-white rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 p-20 text-center animate-pulse-slow">
              <UserRound size={80} className="opacity-10 mb-8" />
              <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">Seleccione un Cliente</h3>
              <p className="text-sm font-medium mt-2 max-w-xs">Elija un perfil del directorio para gestionar su flota, historial de servicios y analíticas de consumo.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Añadir Cliente */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="p-10 bg-slate-900 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <UserRound size={120} />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter relative z-10">Nuevo Cliente</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 relative z-10">Registro de base de datos</p>
            </div>
            <form onSubmit={handleAdd} className="p-10 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input required type="text" placeholder="Ej: Juan Pérez" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all" value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                <input required type="tel" placeholder="0412-0000000" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all" value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <input type="email" placeholder="cliente@correo.com" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all" value={newCustomer.email} onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección (Opcional)</label>
                <textarea placeholder="Ej: Urb. Los Olivos..." className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none h-24 resize-none font-bold transition-all" value={newCustomer.address} onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                <button type="submit" className="flex-[1.5] bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">Guardar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyState: React.FC<{ message: string, icon: React.ReactNode }> = ({ message, icon }) => (
  <div className="flex flex-col items-center justify-center py-20 text-slate-300 opacity-30">
    {icon}
    <p className="mt-4 font-black uppercase text-xs tracking-widest">{message}</p>
  </div>
);

export default CustomerModule;
