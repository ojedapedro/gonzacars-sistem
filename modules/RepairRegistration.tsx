
import React, { useState } from 'react';
import { Camera, Save, Sparkles, Loader2, X, Plus, Image as ImageIcon } from 'lucide-react';
import { VehicleRepair, ServiceStatus, Customer } from '../types';
import { improveDiagnosis } from '../lib/gemini';

const RepairRegistration: React.FC<{ store: any }> = ({ store }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<VehicleRepair>>({
    status: 'Ingresado',
    year: new Date().getFullYear(),
    items: [],
    evidencePhotos: [],
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const currentPhotos = formData.evidencePhotos || [];
        if (currentPhotos.length < 4) {
          setFormData({ ...formData, evidencePhotos: [...currentPhotos, reader.result as string] });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    const currentPhotos = [...(formData.evidencePhotos || [])];
    currentPhotos.splice(index, 1);
    setFormData({ ...formData, evidencePhotos: currentPhotos });
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
    setFormData({ status: 'Ingresado', year: new Date().getFullYear(), items: [], evidencePhotos: [] });
  };

  const photoCount = (formData.evidencePhotos || []).length;

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
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado de Entrada</label>
              <select 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600 bg-blue-50/30"
                value={formData.status} 
                onChange={(e) => setFormData({...formData, status: e.target.value as ServiceStatus})}
              >
                {['Ingresado', 'En Diagnóstico', 'En Reparación', 'Esperando Repuestos', 'Finalizado', 'Entregado'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
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

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Camera size={16} className="text-blue-500" /> Evidencias Visuales
              </label>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${photoCount === 4 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {photoCount} / 4 Fotos
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {(formData.evidencePhotos || []).map((photo, idx) => (
                <div key={idx} className="relative aspect-square group">
                  <img src={photo} className="w-full h-full object-cover rounded-xl border border-slate-200 shadow-sm" />
                  <button 
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {photoCount < 4 && (
                <label className="cursor-pointer flex flex-col items-center justify-center aspect-square border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-white transition-all text-slate-400 hover:text-blue-500 bg-white/50">
                  <Plus size={20} />
                  <span className="text-[8px] font-black uppercase mt-1">Añadir</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                </label>
              )}
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
