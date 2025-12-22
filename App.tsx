
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
  DollarSign,
  UserRound,
  Database,
  RefreshCw,
  Lock,
  LogOut,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Coins,
  Share2,
  Copy,
  Smartphone,
  ExternalLink,
  CheckCircle2
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
import UserManagement from './modules/UserManagement';

const LOGO_URL = "https://i.ibb.co/MDhy5tzK/image-2.png";

const App: React.FC = () => {
  const store = useGonzacarsStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tempUrl, setTempUrl] = useState(store.sheetsUrl);
  const [localRate, setLocalRate] = useState(store.exchangeRate);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = store.login(username, password);
    if (!success) {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 3000);
    }
  };

  const handleRateUpdate = () => {
    store.setExchangeRate(localRate);
    alert("Tasa de cambio actualizada correctamente");
  };

  const hasPermission = (tab: string) => {
    const role = store.currentUser?.role;
    if (role === 'administrador') return true;
    if (role === 'vendedor') {
      return ['dashboard', 'customers', 'repair-reg', 'repair-rep', 'sales', 'inventory'].includes(tab);
    }
    if (role === 'cajero') {
      return ['dashboard', 'sales', 'expenses', 'finance', 'payroll'].includes(tab);
    }
    return false;
  };

  const getShareLink = () => {
    const baseUrl = window.location.href.split('?')[0];
    return `${baseUrl}?config_db=${encodeURIComponent(store.sheetsUrl)}`;
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(getShareLink());
    alert("¡Enlace de configuración copiado! Envíalo a tu otro dispositivo para abrir la app con tus datos.");
  };

  if (!store.sheetsUrl) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 p-6 overflow-y-auto">
        <div className="w-full max-w-2xl bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 p-12 text-white animate-in zoom-in duration-500">
           <div className="text-center mb-10">
              <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-600/20">
                <Database size={40} />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter">Bienvenido a Gonzacars</h2>
              <p className="text-slate-400 mt-4 font-bold uppercase text-xs tracking-widest leading-relaxed">
                Para comenzar en este dispositivo, necesitamos vincular tu base de datos de Google Sheets.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                 <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-blue-400">
                    <Smartphone size={20} />
                 </div>
                 <h3 className="font-black uppercase text-sm tracking-tight">Si ya lo usas en otro PC</h3>
                 <p className="text-xs text-slate-400 leading-relaxed">Entra en el Escritorio desde el otro PC, haz clic en <b>"Compartir Acceso"</b> y copia el enlace aquí.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                 <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-purple-400">
                    <ExternalLink size={20} />
                 </div>
                 <h3 className="font-black uppercase text-sm tracking-tight">Si eres nuevo</h3>
                 <p className="text-xs text-slate-400 leading-relaxed">Crea un Google Sheet, pega el script de la documentación y publica como "Aplicación Web".</p>
              </div>
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">URL de tu Apps Script</label>
              <input 
                type="text" 
                className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-4 focus:ring-blue-500/50 transition-all text-sm"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
              />
              <button 
                onClick={() => store.saveUrl(tempUrl)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-[0.2em] py-5 rounded-2xl shadow-2xl shadow-blue-600/30 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                Vincular Dispositivo <ChevronRight size={18}/>
              </button>
              <p className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-6">Tu privacidad es total. No almacenamos tus credenciales en ningún servidor externo.</p>
           </div>
        </div>
      </div>
    );
  }

  if (!store.currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-600 rounded-full blur-[100px]"></div>
        </div>

        <div className="w-full max-w-md p-10 bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-10">
            <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/10 p-2">
              <img src={LOGO_URL} alt="Gonzacars Logo" className="w-full h-full object-contain" />
            </div>
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

            <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/10 transition-all active:scale-95 group">
              Acceder al Sistema <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform"/>
            </button>
            <button 
              type="button"
              onClick={() => store.saveUrl('')}
              className="w-full text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
            >
              Cambiar Base de Datos
            </button>
          </form>
        </div>
      </div>
    );
  }

  const renderModule = () => {
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
      case 'user-mgmt': return <UserManagement store={store} />;
      default: return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Panel de Control</h1>
              <p className="text-slate-500 font-medium mt-2 capitalize">Bienvenido, {store.currentUser?.name} ({store.currentUser?.role})</p>
            </div>
            <div className="flex gap-3">
              <button 
                  onClick={() => setShowShareModal(true)} 
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors"
              >
                  <Share2 size={16}/> 
                  Compartir Acceso
              </button>
              <button 
                  onClick={() => store.refreshData()} 
                  disabled={store.loading}
                  className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                  <RefreshCw size={16} className={store.loading ? 'animate-spin' : ''}/> 
                  Sincronizar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard 
              title="Ventas Hoy" 
              value={`$ ${Number(store.sales.filter(s => s.date === new Date().toISOString().split('T')[0]).reduce((acc, s) => acc + Number(s.total || 0), 0)).toFixed(2)}`}
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
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
              <Coins className="absolute -bottom-6 -right-6 text-white/5 group-hover:scale-110 transition-transform" size={120} />
              <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Tasa de Cambio Manual (Bs/$)</p>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-2xl font-black outline-none focus:border-blue-500 transition-all"
                    value={localRate}
                    onChange={(e) => setLocalRate(Number(e.target.value))}
                  />
                  <button 
                    onClick={handleRateUpdate}
                    className="p-3 bg-blue-600 rounded-2xl hover:bg-blue-700 transition-all shadow-lg"
                    title="Actualizar Tasa"
                  >
                    <RefreshCw size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
               <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                        <TrendingUp className="text-blue-600" size={24}/> Resumen Mensual de Operaciones
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">Histórico de actividad reciente del taller</p>
                  </div>
               </div>
               <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-300 font-black uppercase text-xs tracking-widest italic">
                  Gráfico Estadístico en Tiempo Real
               </div>
            </div>

            <div className="lg:col-span-4 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
              <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-tighter relative z-10">
                  <Database className="text-blue-600" size={20}/> Cloud DB Config
              </h3>
              <p className="text-xs text-slate-500 mb-6 font-medium relative z-10">URL de Apps Script para sincronización en la nube.</p>
              
              <div className="space-y-4 relative z-10">
                  <input 
                      type="text" 
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 text-xs font-bold"
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                  />
                  <button 
                      onClick={() => store.saveUrl(tempUrl)}
                      className="w-full bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black shadow-xl shadow-slate-200 transition-all active:scale-95"
                  >
                      Guardar Configuración
                  </button>
                  <button 
                      onClick={() => store.saveUrl('')}
                      className="w-full py-4 text-red-500 font-black uppercase text-[9px] tracking-widest hover:bg-red-50 rounded-2xl transition-all"
                  >
                      Desvincular Base de Datos
                  </button>
              </div>
            </div>
          </div>

          {/* Modal de Compartir Acceso */}
          {showShareModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-6 no-print">
               <div className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-300">
                  <div className="p-10 bg-blue-600 text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 backdrop-blur-md">
                      <Share2 size={32} />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Compartir Acceso</h3>
                    <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mt-2">Sincroniza otros dispositivos</p>
                  </div>
                  <div className="p-10 space-y-6">
                    <p className="text-xs text-slate-500 font-bold leading-relaxed text-center">
                      Copia este enlace y ábrelo en tu teléfono móvil o en el navegador de otro computador. La aplicación se configurará automáticamente con tu dirección actual.
                    </p>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 break-all text-[10px] font-mono text-blue-600">
                       {getShareLink()}
                    </div>
                    <button 
                      onClick={copyShareLink}
                      className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3"
                    >
                      <Copy size={18}/> Copiar Enlace Mágico
                    </button>
                    <button 
                      onClick={() => setShowShareModal(false)}
                      className="w-full text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600"
                    >
                      Cerrar Ventana
                    </button>
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
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center p-2 shadow-xl border border-white/5">
            <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
          </div>
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
          <NavItem icon={<ShieldCheck size={20}/>} label="Usuarios" active={activeTab === 'user-mgmt'} onClick={() => setActiveTab('user-mgmt')} visible={hasPermission('user-mgmt')} />
        </nav>

        <div className="p-6 border-t border-white/5 bg-slate-900/50">
          <button onClick={() => store.logout()} className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 rounded-2xl hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all text-[10px] font-black uppercase tracking-widest">
            <LogOut size={16}/> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 no-print z-10">
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none">{activeTab.replace('-', ' ')}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado: Operativo</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tasa Bancaria</span>
            <span className="text-sm font-black text-blue-600 tracking-tight">{store.exchangeRate.toFixed(2)} Bs</span>
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
      {icon}
      <span className="text-xs uppercase tracking-tight">{label}</span>
    </button>
  );
};

const DashboardCard: React.FC<{ title: string, value: string, icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex justify-between items-start group hover:border-blue-200 transition-all">
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
