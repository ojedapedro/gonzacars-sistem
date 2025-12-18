
import React, { useState } from 'react';
import { Users, UserPlus, DollarSign, Filter, Search } from 'lucide-react';
import { Employee } from '../types';

const PayrollModule: React.FC<{ store: any }> = ({ store }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchMechanic, setSearchMechanic] = useState('');
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    role: 'Mecánico',
    baseSalary: 0,
    commissionRate: 0.1
  });

  const filteredEmployees = store.employees.filter((e: Employee) => 
    e.name.toLowerCase().includes(searchMechanic.toLowerCase())
  );

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    store.addEmployee({
      ...newEmployee as Employee,
      id: Math.random().toString(36).substr(2, 9)
    });
    setShowAddModal(false);
    setNewEmployee({ role: 'Mecánico', baseSalary: 0, commissionRate: 0.1 });
  };

  const calculateCommissions = (empId: string) => {
    // Simplified: Find finished repairs assigned to this mechanic and take a % of labor/items
    const emp = store.employees.find((e: any) => e.id === empId);
    if (!emp) return 0;
    const finishedRepairs = store.repairs.filter((r: any) => r.mechanicId === empId && r.status === 'Entregado');
    const totalLabor = finishedRepairs.reduce((acc: number, r: any) => {
      const laborOnly = r.items.filter((i: any) => i.type === 'Servicio').reduce((a: number, i: any) => a + (i.price * i.quantity), 0);
      return acc + laborOnly;
    }, 0);
    return totalLabor * emp.commissionRate;
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Nómina y Comisiones</h3>
          <p className="text-slate-500 text-sm">Control de pagos a personal de Gonzacars</p>
        </div>
        <div className="flex gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
            <input type="text" placeholder="Buscar empleado..." className="w-full pl-10 pr-4 py-2 border rounded-xl" value={searchMechanic} onChange={(e) => setSearchMechanic(e.target.value)} />
          </div>
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
            <UserPlus size={18}/> Nuevo Empleado
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-left border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nombre / Rol</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Sueldo Base ($)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Comisión (%)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Com. Ganada ($)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Total a Pagar ($)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEmployees.map((e: Employee) => {
              const comms = calculateCommissions(e.id);
              const total = e.baseSalary + comms;
              return (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{e.name}</div>
                    <div className="text-xs text-slate-500">{e.role}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">${e.baseSalary.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-medium">{(e.commissionRate * 100).toFixed(0)}%</td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">${comms.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-blue-700 text-lg">${total.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-400">{(total * store.exchangeRate).toLocaleString('es-VE')} Bs</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-blue-600 font-bold text-xs uppercase hover:underline">Liquidar Pago</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <h3 className="text-2xl font-bold mb-6 text-slate-800">Agregar Personal</h3>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                  <input required type="text" className="w-full px-4 py-2 border rounded-lg" value={newEmployee.name || ''} onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                  <select className="w-full px-4 py-2 border rounded-lg" value={newEmployee.role} onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value as Employee['role']})}>
                    <option value="Mecánico">Mecánico</option>
                    <option value="Vendedor">Vendedor</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sueldo Base ($)</label>
                  <input required type="number" className="w-full px-4 py-2 border rounded-lg" value={newEmployee.baseSalary || ''} onChange={(e) => setNewEmployee({...newEmployee, baseSalary: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Comisión (ej: 0.1 para 10%)</label>
                  <input required type="number" step="0.01" className="w-full px-4 py-2 border rounded-lg" value={newEmployee.commissionRate || ''} onChange={(e) => setNewEmployee({...newEmployee, commissionRate: Number(e.target.value)})} />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-slate-500 font-bold">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">Guardar Empleado</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollModule;
