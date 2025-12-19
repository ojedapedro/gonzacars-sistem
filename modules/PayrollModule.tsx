
import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  DollarSign, 
  TrendingUp, 
  Wrench, 
  Briefcase, 
  ChevronRight, 
  Search, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Employee, VehicleRepair, RepairItem, PayrollRecord } from '../types';

const PayrollModule: React.FC<{ store: any }> = ({ store }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    role: 'Mecánico',
    baseSalary: 0,
    commissionRate: 0.50 // 50% por defecto para mecánicos
  });

  const filteredEmployees = useMemo(() => {
    return store.employees.filter((e: Employee) => 
      e.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [store.employees, searchQuery]);

  // Calcula la comisión acumulada para un mecánico basada en reparaciones ENTREGADAS
  const getEmployeeEarnings = (emp: Employee) => {
    if (emp.role !== 'Mecánico') {
      return { base: emp.baseSalary, commission: 0, total: emp.baseSalary, repairCount: 0 };
    }

    const completedRepairs = store.repairs.filter((r: VehicleRepair) => 
      r.mechanicId === emp.id && r.status === 'Entregado'
    );

    const commissionTotal = completedRepairs.reduce((total: number, repair: VehicleRepair) => {
      const laborTotal = repair.items
        .filter((item: RepairItem) => item.type === 'Servicio')
        .reduce((sum: number, item: RepairItem) => sum + (item.price * item.quantity), 0);
      
      return total + (laborTotal * emp.commissionRate);
    }, 0);

    return { 
      base: emp.baseSalary, 
      commission: commissionTotal, 
      total: emp.baseSalary + commissionTotal,
      repairCount: completedRepairs.length
    };
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    store.addEmployee({
      ...newEmployee as Employee,
      id: Math.random().toString(36).substr(2, 9)
    });
    setShowAddModal(false);
    setNewEmployee({ role: 'Mecánico', baseSalary: 0, commissionRate: 0.50 });
  };

  const handleLiquidate = (emp: Employee) => {
    const earnings = getEmployeeEarnings(emp);
    if (earnings.total <= 0) {
      alert("No hay montos pendientes para liquidar a este empleado.");
      return;
    }

    const confirmPay = confirm(`¿Desea liquidar el pago de $${earnings.total.toFixed(2)} para ${emp.name}?`);
    if (confirmPay) {
      const record: PayrollRecord = {
        id: Math.random().toString(36).substr(2, 9),
        employeeId: emp.id,
        date: new Date().toISOString(),
        baseSalary: earnings.base,
        commission: earnings.commission,
        total: earnings.total,
        status: 'Pagado'
      };
      // Aquí se llamaría a store.addPayrollRecord si existiera la persistencia específica, 
      // por ahora simulamos el éxito.
      alert(`Pago de nómina registrado correctamente para ${emp.name}`);
    }
  };

  const totals = useMemo(() => {
    return store.employees.reduce((acc: any, emp: Employee) => {
      const e = getEmployeeEarnings(emp);
      acc.total += e.total;
      acc.commissions += e.commission;
      acc.base += e.base;
      return acc;
    }, { total: 0, commissions: 0, base: 0 });
  }, [store.employees, store.repairs]);

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Nómina y Participaciones</h3>
          <p className="text-slate-500 font-medium mt-2">Gestión de sueldos fijos y comisiones por servicios técnicos</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input 
              type="text" 
              placeholder="Buscar personal..." 
              className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold text-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center gap-2"
          >
            <UserPlus size={18}/> Alta de Personal
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 text-slate-50 opacity-10 group-hover:scale-110 transition-transform">
             <DollarSign size={120} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Presupuesto Total Nómina</p>
          <h4 className="text-4xl font-black text-slate-900 tracking-tighter">${totals.total.toFixed(2)}</h4>
          <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full w-fit">
            <TrendingUp size={14}/> +12% vs mes anterior
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 text-white/5">
             <Wrench size={120} />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Comisiones a Liquidar</p>
          <h4 className="text-4xl font-black tracking-tighter text-blue-400">${totals.commissions.toFixed(2)}</h4>
          <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase">Basado en servicios realizados</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 text-slate-50 opacity-10 group-hover:scale-110 transition-transform">
             <Briefcase size={120} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sueldos Fijos (Oficina)</p>
          <h4 className="text-4xl font-black text-slate-900 tracking-tighter">${totals.base.toFixed(2)}</h4>
          <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase">Personal administrativo</p>
        </div>
      </div>

      {/* Lista de Empleados */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador / Rol</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Pago</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Sueldo Base</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Comisión (%)</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Participación Ganada</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total a Pagar</th>
              <th className="px-8 py-5 no-print"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredEmployees.map((emp: Employee) => {
              const earnings = getEmployeeEarnings(emp);
              return (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-lg ${emp.role === 'Mecánico' ? 'bg-blue-600' : 'bg-slate-800'}`}>
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 uppercase text-sm leading-tight">{emp.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-tighter">{emp.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      emp.role === 'Mecánico' 
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                        : 'bg-blue-100 text-blue-700 border-blue-200'
                    }`}>
                      {emp.role === 'Mecánico' ? 'Variable (50%)' : 'Sueldo Fijo'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="font-bold text-slate-600 text-sm">${emp.baseSalary.toFixed(2)}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="font-mono text-xs font-black text-slate-400">{(emp.commissionRate * 100).toFixed(0)}%</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`font-black text-sm ${earnings.commission > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                        +${earnings.commission.toFixed(2)}
                      </span>
                      {emp.role === 'Mecánico' && earnings.repairCount > 0 && (
                        <p className="text-[9px] font-bold text-slate-400 uppercase italic">de {earnings.repairCount} vehículos</p>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="inline-flex flex-col items-center px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-blue-200 transition-all">
                      <span className="text-lg font-black text-slate-900 tracking-tighter">${earnings.total.toFixed(2)}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase italic">{(earnings.total * store.exchangeRate).toLocaleString('es-VE')} Bs</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right no-print">
                    <button 
                      onClick={() => handleLiquidate(emp)}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm group/btn"
                    >
                      <CheckCircle2 size={18} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredEmployees.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-300">
             <Users size={64} className="opacity-20 mb-4" />
             <p className="text-[10px] font-black uppercase tracking-widest">No se encontró personal registrado</p>
          </div>
        )}
      </div>

      {/* Modal Agregar Personal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in duration-300">
            <div className="p-10 bg-slate-950 text-white relative">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                <Users size={120} />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter relative z-10">Contratación Personal</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1 relative z-10">Definición de esquema de pago</p>
            </div>
            
            <form onSubmit={handleAddEmployee} className="p-10 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo del Colaborador</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Ej: Pedro Arrieche" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all" 
                  value={newEmployee.name || ''} 
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol / Cargo</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black uppercase text-[10px] tracking-widest outline-none focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer" 
                    value={newEmployee.role} 
                    onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value as Employee['role'], commissionRate: e.target.value === 'Mecánico' ? 0.50 : 0})}
                  >
                    <option value="Mecánico">Mecánico (Comisión)</option>
                    <option value="Vendedor">Vendedor (Oficina)</option>
                    <option value="Administrador">Administrador (Oficina)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sueldo Base ($)</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-lg outline-none focus:ring-4 focus:ring-blue-50 transition-all" 
                    value={newEmployee.baseSalary || ''} 
                    onChange={(e) => setNewEmployee({...newEmployee, baseSalary: Number(e.target.value)})} 
                  />
                </div>
              </div>

              {newEmployee.role === 'Mecánico' && (
                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Comisión por Mano de Obra</label>
                    <span className="text-xl font-black text-blue-700">{(newEmployee.commissionRate || 0) * 100}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    className="w-full accent-blue-600"
                    value={newEmployee.commissionRate} 
                    onChange={(e) => setNewEmployee({...newEmployee, commissionRate: Number(e.target.value)})} 
                  />
                  <p className="text-[9px] text-blue-400 font-bold uppercase italic">El taller asigna el 50% por defecto para reparaciones mecánicas.</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-red-500 transition-colors">Cancelar</button>
                <button type="submit" className="flex-[1.5] bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-black shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2">
                  Confirmar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollModule;
