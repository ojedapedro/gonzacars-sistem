
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
  ExternalLink
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const store = useGonzacarsStore();
  const [tempUrl, setTempUrl] = useState(store.sheetsUrl);

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
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Panel de Control</h1>
            <button 
                onClick={() => store.refreshData()} 
                disabled={store.loading}
                className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border shadow-sm text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
                <RefreshCw size={16} className={store.loading ? 'animate-spin' : ''}/> 
                Sincronizar Nube
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard 
              title="Ventas del Día" 
              value={`$ ${store.sales.filter(s => s.date === new Date().toISOString().split('T')[0]).reduce((acc, s) => acc + s.total, 0).toFixed(2)}`}
              icon={<DollarSign className="text-green-500" />}
            />
            <DashboardCard 
              title="Vehículos en Taller" 
              value={store.repairs.filter(r => r.status !== 'Entregado').length.toString()}
              icon={<Wrench className="text-blue-500" />}
            />
            <DashboardCard 
              title="Total Clientes" 
              value={store.customers.length.toString()}
              icon={<UserRound className="text-purple-500" />}
            />
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Database className="text-blue-600" size={20}/> Configuración de Base de Datos (Cloud)
            </h3>
            <p className="text-sm text-slate-500 mb-6">Pega aquí la URL de implementación de tu Google Apps Script para habilitar la persistencia en Google Sheets.</p>
            
            <div className="space-y-4">
                <input 
                    type="text" 
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                />
                <div className="flex gap-3">
                    <button 
                        onClick={() => store.saveUrl(tempUrl)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-all"
                    >
                        Conectar y Guardar
                    </button>
                    <a 
                        href="https://docs.google.com/spreadsheets/d/1L-Fmfey-8ZR6vgF5DVR6B5fiSLbVYo7YDs7pIuBxmEU" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline"
                    >
                        Ver Sheet <ExternalLink size={14}/>
                    </a>
                </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">Estado de Conexión</h4>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${store.sheetsUrl ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium text-slate-700">
                        {store.sheetsUrl ? 'Conectado a Google Sheets' : 'Desconectado - Usando caché local'}
                    </span>
                </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white flex flex-col no-print">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">G</div>
          <span className="font-bold text-lg tracking-tight">Gonzacars C.A.</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Escritorio" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          
          <div className="pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Base de Datos</div>
          <NavItem icon={<UserRound size={20}/>} label="Clientes" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
          
          <div className="pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Servicio</div>
          <NavItem icon={<Wrench size={20}/>} label="Reg. Vehículo" active={activeTab === 'repair-reg'} onClick={() => setActiveTab('repair-reg')} />
          <NavItem icon={<ClipboardList size={20}/>} label="Informe Reparación" active={activeTab === 'repair-rep'} onClick={() => setActiveTab('repair-rep')} />
          
          <div className="pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tienda</div>
          <NavItem icon={<ShoppingCart size={20}/>} label="Ventas (POS)" active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} />
          <NavItem icon={<Package size={20}/>} label="Inventario" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
          <NavItem icon={<Truck size={20}/>} label="Compras" active={activeTab === 'purchases'} onClick={() => setActiveTab('purchases')} />
          
          <div className="pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin</div>
          <NavItem icon={<BarChart3 size={20}/>} label="Finanzas" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} />
          <NavItem icon={<Wallet size={20}/>} label="Gastos" active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} />
          <NavItem icon={<Users size={20}/>} label="Nómina" active={activeTab === 'payroll'} onClick={() => setActiveTab('payroll')} />
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="bg-slate-800 p-3 rounded-lg text-center">
            <label className="block text-xs text-slate-400 mb-1 font-bold">Tasa del día</label>
            <div className="flex items-center justify-center gap-2">
              <span className="text-white font-bold">{store.exchangeRate}</span>
              <span className="text-blue-400 text-xs">Bs/$</span>
            </div>
            <input 
              type="range" 
              min="30" max="70" step="0.5"
              value={store.exchangeRate} 
              onChange={(e) => store.setExchangeRate(Number(e.target.value))}
              className="w-full mt-2"
            />
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 no-print">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-700 capitalize">
                {activeTab.replace('-', ' ')}
            </h2>
            {store.loading && <RefreshCw size={16} className="animate-spin text-blue-500" />}
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="text-slate-500">Tasa: {store.exchangeRate} Bs</span>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">A</div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          {renderModule()}
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const DashboardCard: React.FC<{ title: string, value: string, icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-start">
    <div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold mt-1 text-slate-800">{value}</h3>
    </div>
    <div className="p-3 bg-slate-50 rounded-lg">
      {icon}
    </div>
  </div>
);

export default App;
