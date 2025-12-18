
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
  X
} from 'lucide-react';
import { Customer, VehicleRepair, Sale } from '../types';

const CustomerModule: React.FC<{ store: any }> = ({ store }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'repairs' | 'sales' | 'vehicles'>('repairs');
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
          <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Clientes</h3>
          <p className="text-slate-500 font-medium">Directorio estratégico y analíticas de lealtad de Gonzacars</p>
        </div>
        <div className="flex gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input 
              type="text" 
              placeholder="Buscar por nombre o teléfono..." 
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all text-sm shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            <Plus size={20}/> Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center">
            <span className="font-bold text-slate-700 text-xs uppercase tracking-widest">Base de Datos ({filteredCustomers.length})</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
            {filteredCustomers.map((c: Customer) => (
              <button 
                key={c.id} 
                onClick={() => { setSelectedCustomer(c); setPlateFilter(null); }}
                className={`w-full p-5 flex items-center gap-4 text-left transition-all hover:bg-blue-50/50 ${selectedCustomer?.id === c.id ? 'bg-blue-50 border-r-4 border-blue-600' : ''}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold uppercase transition-colors ${selectedCustomer?.id === c.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 truncate">{c.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                    <Phone size={12}/> {c.phone}
                  </div>
                </div>
                <ArrowRight size={16} className={`text-slate-300 transition-transform ${selectedCustomer?.id === c.id ? 'translate-x-1 text-blue-400' : ''}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
          {selectedCustomer ? (
            <>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
                  <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-4xl font-black shadow-xl shadow-blue-100">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-black text-slate-900 leading-tight">{selectedCustomer.name}</h2>
                    <div className="flex flex-wrap gap-4 mt-3">
                      <span className="flex items-center gap-1.5 text-slate-500 text-sm font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Phone size={14} className="text-blue-500"/> {selectedCustomer.phone}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-500 text-sm font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Mail size={14} className="text-blue-500"/> {selectedCustomer.email || 'Sin correo'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
                   <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Valor de Vida (LTV)</p>
                      <p className="text-2xl font-black text-blue-700">${calculateTotalLTV(selectedCustomer.id).toFixed(2)}</p>
                   </div>
                   <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100/50">
                      <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Vehículos</p>
                      <p className="text-2xl font-black text-purple-700">{getCustomerVehicles(selectedCustomer.id).length}</p>
                   </div>
                   <div className="bg-green-50/50 p-5 rounded-2xl border border-green-100/50">
                      <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-2">Registro</p>
                      <p className="text-xl font-black text-green-700">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                   </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="flex p-2 bg-slate-50/50 border-b">
                  <button onClick={() => setActiveTab('repairs')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'repairs' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                    <History size={16}/> Historial Taller
                  </button>
                  <button onClick={() => setActiveTab('sales')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'sales' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                    <ShoppingBag size={16}/> Compras Directas
                  </button>
                  <button onClick={() => setActiveTab('vehicles')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'vehicles' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                    <Car size={16}/> Vehículos
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  {activeTab === 'repairs' && (
                    <div className="space-y-4">
                      {plateFilter && (
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                            <Filter size={16} /> Filtrado por placa: <span className="font-mono bg-white px-2 py-0.5 rounded border border-blue-200">{plateFilter}</span>
                          </div>
                          <button onClick={() => setPlateFilter(null)} className="text-blue-500 hover:text-blue-700 p-1">
                            <X size={18} />
                          </button>
                        </div>
                      )}
                      {getCustomerRepairs(selectedCustomer.id).length > 0 ? (
                        getCustomerRepairs(selectedCustomer.id).reverse().map((r: VehicleRepair) => (
                          <div key={r.id} className="group p-5 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Wrench size={24}/>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-slate-900">{r.brand} {r.model} <span className="text-slate-400 font-medium">({r.year})</span></p>
                                  <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${r.status === 'Entregado' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{r.status}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs font-mono font-bold text-blue-600">PLACA: {r.plate}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-slate-900">${r.items.reduce((a, i) => a + (i.price * i.quantity), 0).toFixed(2)}</p>
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
                          <div key={s.id} className="p-5 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Factura #{s.id}</p>
                                <p className="text-sm text-slate-500 font-medium mt-0.5">{new Date(s.date).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-black text-blue-700">${s.total.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <EmptyState message="Sin compras registradas" icon={<ShoppingBag size={40}/>} />
                      )}
                    </div>
                  )}

                  {activeTab === 'vehicles' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {getCustomerVehicles(selectedCustomer.id).length > 0 ? (
                        getCustomerVehicles(selectedCustomer.id).map((v: VehicleRepair) => (
                          <div key={v.plate} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:border-blue-200 transition-all">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              <Car size={32} />
                            </div>
                            <h5 className="font-black text-slate-900 text-lg uppercase">{v.brand} {v.model}</h5>
                            <p className="text-slate-400 text-xs font-bold mt-1 uppercase">Año: {v.year}</p>
                            <div className="mt-4 px-4 py-1.5 bg-blue-600 text-white rounded-xl font-mono text-sm font-black tracking-widest shadow-lg shadow-blue-200">
                              {v.plate}
                            </div>
                            <button 
                              onClick={() => handleViewVehicleHistory(v.plate)}
                              className="mt-6 text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 hover:underline"
                            >
                              Ver Historial de Reparaciones <ExternalLink size={12}/>
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2">
                          <EmptyState message="No se han identificado vehículos aún" icon={<Car size={40}/>} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full bg-white rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-20 text-center animate-pulse-slow">
              <UserRound size={64} className="opacity-10 mb-6" />
              <h3 className="text-xl font-bold text-slate-800">Seleccione un Cliente</h3>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
              <h3 className="text-2xl font-black">Nuevo Cliente</h3>
            </div>
            <form onSubmit={handleAdd} className="p-8 space-y-5">
              <input required type="text" placeholder="Nombre Completo" className="w-full px-4 py-3.5 bg-slate-50 border rounded-2xl outline-none" value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} />
              <input required type="tel" placeholder="Teléfono" className="w-full px-4 py-3.5 bg-slate-50 border rounded-2xl outline-none" value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} />
              <input type="email" placeholder="Email" className="w-full px-4 py-3.5 bg-slate-50 border rounded-2xl outline-none" value={newCustomer.email} onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})} />
              <textarea placeholder="Dirección" className="w-full px-4 py-3.5 bg-slate-50 border rounded-2xl outline-none h-24 resize-none" value={newCustomer.address} onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})} />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-slate-400 font-black">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyState: React.FC<{ message: string, icon: React.ReactNode }> = ({ message, icon }) => (
  <div className="flex flex-col items-center justify-center py-20 text-slate-300 opacity-50">
    {icon}
    <p className="mt-4 font-bold text-sm">{message}</p>
  </div>
);

const Wrench: React.FC<any> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

export default CustomerModule;
