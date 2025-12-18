
import React, { useState } from 'react';
import { Camera, Save, Sparkles, Loader2 } from 'lucide-react';
import { VehicleRepair, ServiceStatus, Customer } from '../types';
import { improveDiagnosis } from '../lib/gemini';

const RepairRegistration: React.FC<{ store: any }> = ({ store }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<VehicleRepair>>({
    status: 'Ingresado',
    year: new Date().getFullYear(),
    items: [],
    createdAt: new Date().toISOString()
  });

  const handleAiImprove = async () => {
    if (!formData.diagnosis || formData.diagnosis.length < 5) return;
    setIsAiLoading(true);
    try {
      const improved = await improveDiagnosis(formData.diagnosis);
      if (improved) setFormData({ ...formData, diagnosis: improved });
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
        alert('Por favor seleccione un cliente');
        return;
    }
    const customer = store.customers.find((c: Customer) => c.id === formData.customerId);
    const newRepair: VehicleRepair = {
      ...formData as VehicleRepair,
      id: Math.random().toString(36).substr(2, 9),
      ownerName: customer?.name || '',
      createdAt: new Date().toISOString()
    };
    store.addRepair(newRepair);
    alert('Vehículo registrado correctamente');
    setFormData({ status: 'Ingresado', year: new Date().getFullYear(), items: [] });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, evidencePhoto: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Cliente / Propietario</label>
              <select 
                  required 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.customerId || ''}
                  onChange={(e) => setFormData({...formData, customerId: e.target.value})}
              >
                  <option value="">Seleccione un cliente...</option>
                  {store.customers.map((c: Customer) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
              </select>
            </div>
            {['plate', 'brand', 'model', 'year', 'responsible'].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-slate-700 mb-1 capitalize">
                  {field === 'plate' ? 'Placa' : field}
                </label>
                <input 
                  required 
                  type={field === 'year' ? 'number' : 'text'} 
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${field === 'plate' ? 'uppercase' : ''}`}
                  value={(formData as any)[field] || ''} 
                  onChange={(e) => setFormData({...formData, [field]: field === 'year' ? Number(e.target.value) : e.target.value})} 
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mecánico Asignado</label>
              <select required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.mechanicId || ''} onChange={(e) => setFormData({...formData, mechanicId: e.target.value})}>
                <option value="">Seleccione...</option>
                {store.employees.filter((e: any) => e.role === 'Mecánico').map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700">Diagnóstico Inicial</label>
              <button 
                type="button"
                onClick={handleAiImprove}
                disabled={isAiLoading || !formData.diagnosis}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-all disabled:opacity-50"
              >
                {isAiLoading ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} className="text-blue-500"/>}
                Mejorar con IA
              </button>
            </div>
            <textarea 
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-32 transition-all"
              value={formData.diagnosis || ''} 
              onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
              placeholder="Escribe los síntomas del vehículo..."
            ></textarea>
          </div>

          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
            <Save size={20}/> Registrar Entrada
          </button>
        </form>
      </div>
    </div>
  );
};

export default RepairRegistration;
