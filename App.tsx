
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  ClipboardList, 
  ShoppingCart, 
  Package, 
  Truck, 
  BarChart3, 
  Wallet, 
  Users,
  Settings,
  DollarSign,
  UserRound,
  Database,
  RefreshCw,
  ExternalLink,
  Lock,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useGonzacarsStore } from './store';
import RepairRegistration from './modules/RepairRegistration';
import RepairReport from './modules/RepairReport';
import SalesPOS from './modules/SalesPOS';
import PurchaseRegistry from './modules/PurchaseRegistry';
import InventoryModule from './modules/InventoryModule';
import FinanceModule from './modules/FinanceModule';
import ExpenseModule from './modules/ExpenseModule';
import PayrollModule from './modules/PayrollModule';
import CustomerModule from './modules/CustomerModule';

const App: React.FC = () => {
  const store = useGonzacarsStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tempUrl, setTempUrl] = useState(store.sheetsUrl);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = store.login(username, password);
    if (!success) {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 3000);
    }
  };

  // Roles Permissions Mapping
  const hasPermission = (tab: string) => {
    const role = store.currentUser?.role;
    if (role === 'administrador') return true;
    
    if (role === 'vendedor') {
      return ['dashboard', 'customers', 'repair-reg', 'repair-rep', 'sales', 'inventory'].includes(tab);
    }
    
    if (role === 'cajero') {
      return ['dashboard', 'sales', 'expenses', 'finance'].includes(tab);
    }
    
    return false;
  };

  if (!store.currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-600 rounded-full blur-[100px]"></div>
        </div>

        <div className="w-full max-w-md p-10 bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black mx-auto mb-6 shadow-2xl shadow-blue-500/20 rotate-3">G</div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Gonzacars C.A.</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Sistema de Gestión Integral</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Usuario</label>
              <div className="relative">
                <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                <input 
                  required
                  type="text" 
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-bold"
                  placeholder="admin, vendedor, cajero..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                <input 
                  required
                  type="password" 
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-bold"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {loginError && (
              <p className="text-red-400 text-center text-xs font-black uppercase tracking-widest animate-bounce">Credenciales Inválidas</p>
            )}

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/10 transition-all active:scale-95 group">
              Acceder al Sistema <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform"/>
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Puerto Ordaz, Venezuela • v2.1</p>
          </div>
        </div>
      </div>
    );
  }

  const renderModule = () => {
    if (!store.sheetsUrl && activeTab !== 'dashboard') {
      return (
        <div className="flex flex-col items-center justify-center h-full p-20 text-center">
          <Database size={64} className="text-slate-300 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">Conexión Requerida</h2>
          <p className="text-slate-500 mt-2 max-w-md">Para utilizar los módulos, primero configura la URL de tu Google Apps Script en la sección de Escritorio.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'customers': return <CustomerModule store={store} />;
      case 'repair-reg': return <RepairRegistration store={store} />;
      case 'repair-rep': return <RepairReport store={store} />;
      case 'sales': return <SalesPOS store={store} />;
      case 'purchases': return <PurchaseRegistry store={store} />;
      case 'inventory': return <InventoryModule store={store} />;
      case 'finance': return <FinanceModule store={store} />;
      case 'expenses': return <ExpenseModule store={store} />;
      case 'payroll': return <PayrollModule store={store} />;
      default: return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Panel de Control</h1>
              <p className="text-slate-500 font-medium mt-2 capitalize">Bienvenido, {store.currentUser?.name} ({store.currentUser?.role})</p>
            </div>
            <button 
                onClick={() => store.refreshData()} 
                disabled={store.loading}
                className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
                <RefreshCw size={16} className={store.loading ? 'animate-spin' : ''}/> 
                Sincronizar Datos
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard 
              title="Ventas Hoy" 
              value={`$ ${store.sales.filter(s => s.date === new Date().toISOString().split('T')[0]).reduce((acc, s) => acc + s.total, 0).toFixed(2)}`}
              icon={<DollarSign className="text-emerald-500" />}
            />
            <DashboardCard 
              title="Vehículos Taller" 
              value={store.repairs.filter(r => r.status !== 'Entregado').length.toString()}
              icon={<Wrench className="text-blue-500" />}
            />
            <DashboardCard 
              title="Directorio Clientes" 
              value={store.customers.length.toString()}
              icon={<UserRound className="text-purple-500" />}
            />
          </div>

          {store.currentUser?.role === 'administrador' && (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm max-w-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5">
                <Database size={150} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-tighter relative z-10">
                  <Database className="text-blue-600" size={20}/> Cloud Database Config
              </h3>
              <p className="text-sm text-slate-500 mb-6 font-medium relative z-10">Conecte el sistema a Google Sheets mediante la URL de implementación del Apps Script.</p>
              
              <div className="space-y-4 relative z-10">
                  <input 
                      type="text" 
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 text-xs font-bold"
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                  />
                  <div className="flex gap-3">
                      <button 
                          onClick={() => store.saveUrl(tempUrl)}
                          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
                      >
                          Vincular y Guardar
                      </button>
                      <a 
                          href="https://docs.google.com/spreadsheets/d/1L-Fmfey-8ZR6vgF5DVR6B5fiSLbVYo7YDs7pIuBxmEU" 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-2 text-blue-600 font-black uppercase text-[10px] tracking-widest hover:underline px-4"
                      >
                          Explorar Sheet <ExternalLink size={14}/>
                      </a>
                  </div>
              </div>

              <div className="mt-10 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Conexión en Tiempo Real</h4>
                  <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full animate-pulse ${store.sheetsUrl ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'}`}></div>
                      <span className="text-xs font-black text-slate-700 uppercase tracking-widest">
                          {store.sheetsUrl ? 'Sincronizado con Google Cloud' : 'Operando en Modo Caché Local'}
                      </span>
                  </div>
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      <aside className="w-72 bg-slate-950 text-white flex flex-col no-print border-r border-white/5 relative">
        <div className="p-8 flex items-center gap-4 border-b border-white/5">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-600/20 rotate-3">G</div>
          <div>
            <span className="font-black text-lg tracking-tighter uppercase leading-none block">Gonzacars</span>
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mt-1 block">Taller y Repuestos</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Escritorio" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} visible={hasPermission('dashboard')} />
          
          <MenuHeader label="Base de Datos" />
          <NavItem icon={<UserRound size={20}/>} label="Clientes" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} visible={hasPermission('customers')} />
          
          <MenuHeader label="Servicio Técnico" />
          <NavItem icon={<Wrench size={20}/>} label="Reg. Vehículo" active={activeTab === 'repair-reg'} onClick={() => setActiveTab('repair-reg')} visible={hasPermission('repair-reg')} />
          <NavItem icon={<ClipboardList size={20}/>} label="Informes" active={activeTab === 'repair-rep'} onClick={() => setActiveTab('repair-rep')} visible={hasPermission('repair-rep')} />
          
          <MenuHeader label="Unidad Comercial" />
          <NavItem icon={<ShoppingCart size={20}/>} label="Punto de Venta" active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} visible={hasPermission('sales')} />
          <NavItem icon={<Package size={20}/>} label="Inventario" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} visible={hasPermission('inventory')} />
          <NavItem icon={<Truck size={20}/>} label="Compras" active={activeTab === 'purchases'} onClick={() => setActiveTab('purchases')} visible={hasPermission('purchases')} />
          
          <MenuHeader label="Administración" />
          <NavItem icon={<BarChart3 size={20}/>} label="Finanzas" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} visible={hasPermission('finance')} />
          <NavItem icon={<Wallet size={20}/>} label="Gastos" active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} visible={hasPermission('expenses')} />
          <NavItem icon={<Users size={20}/>} label="Nómina" active={activeTab === 'payroll'} onClick={() => setActiveTab('payroll')} visible={hasPermission('payroll')} />
        </nav>

        <div className="p-6 border-t border-white/5 space-y-4 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black">
              {store.currentUser?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase text-white tracking-tight truncate">{store.currentUser?.name}</p>
              <p className="text-[8px] font-black uppercase text-blue-500 tracking-[0.2em]">{store.currentUser?.role}</p>
            </div>
            <button onClick={() => store.logout()} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
              <LogOut size={16}/>
            </button>
          </div>

          <div className="bg-blue-600/10 p-4 rounded-2xl text-center border border-blue-600/20">
            <label className="block text-[9px] text-blue-400 mb-1.5 font-black uppercase tracking-widest">Tasa del día</label>
            <div className="flex items-center justify-center gap-2">
              <span className="text-white font-black text-lg">{store.exchangeRate}</span>
              <span className="text-blue-400 text-[10px] font-bold">Bs/$</span>
            </div>
            {store.currentUser?.role === 'administrador' && (
              <input 
                type="range" 
                min="30" max="70" step="0.5"
                value={store.exchangeRate} 
                onChange={(e) => store.setExchangeRate(Number(e.target.value))}
                className="w-full mt-3 h-1.5 bg-blue-900 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 no-print z-10 shadow-sm shadow-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none">
                {activeTab.replace('-', ' ')}
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado: Operativo</span>
              </div>
            </div>
            {store.loading && <RefreshCw size={16} className="animate-spin text-blue-500 ml-4" />}
          </div>
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tasa Bancaria</span>
              <span className="text-sm font-black text-blue-600 tracking-tight">{store.exchangeRate} Bs</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200 font-black text-sm">
              {store.currentUser?.name.charAt(0)}
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto bg-slate-50/30 custom-scrollbar">
          {renderModule()}
        </div>
      </main>
    </div>
  );
};

const MenuHeader: React.FC<{ label: string }> = ({ label }) => (
  <div className="pt-6 pb-2 px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.25em]">{label}</div>
);

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void, visible?: boolean }> = ({ icon, label, active, onClick, visible = true }) => {
  if (!visible) return null;
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 font-black' : 'text-slate-400 hover:bg-white/5 hover:text-white font-bold'}`}
    >
      <div className={`transition-transform duration-300 ${active ? 'scale-110' : ''}`}>{icon}</div>
      <span className="text-xs uppercase tracking-tight">{label}</span>
    </button>
  );
};

const DashboardCard: React.FC<{ title: string, value: string, icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex justify-between items-start group hover:border-blue-200 transition-all hover:shadow-xl hover:shadow-blue-500/5">
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 group-hover:text-slate-600 transition-colors">{title}</p>
      <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3>
    </div>
    <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
      {icon}
    </div>
  </div>
);

export default App;
