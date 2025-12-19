
import React, { useState } from 'react';
import { ShieldCheck, UserPlus, Search, Edit3, Trash2, Key, Shield, User as UserIcon, X, Check } from 'lucide-react';
import { User, UserRole } from '../types';

const UserManagement: React.FC<{ store: any }> = ({ store }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    password: '',
    name: '',
    role: 'vendedor'
  });

  const filteredUsers = store.users.filter((u: User) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAdd = () => {
    setEditingUser(null);
    setFormData({ username: '', password: '', name: '', role: 'vendedor' });
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ ...user });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (id === store.currentUser?.id) {
      alert("No puedes eliminar tu propio usuario mientras estás en sesión.");
      return;
    }
    if (confirm("¿Estás seguro de que deseas eliminar este usuario? Perderá el acceso de inmediato.")) {
      store.deleteUser(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      store.updateUser({ ...editingUser, ...formData } as User);
      alert("Usuario actualizado correctamente");
    } else {
      const newUser: User = {
        ...formData as User,
        id: Math.random().toString(36).substr(2, 9)
      };
      store.addUser(newUser);
      alert("Usuario creado correctamente");
    }
    setShowModal(false);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'administrador': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'vendedor': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cajero': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Gestión de Accesos</h3>
          <p className="text-slate-500 font-medium">Administre las credenciales y permisos del personal</p>
        </div>
        <div className="flex gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input 
              type="text" 
              placeholder="Buscar usuario..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 transition-all font-bold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={openAdd}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black shadow-xl shadow-slate-200 transition-all active:scale-95"
          >
            <UserPlus size={18}/> Crear Usuario
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol / Nivel</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contraseña</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((u: User) => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 uppercase group-hover:bg-blue-600 group-hover:text-white transition-all">
                      {u.name.charAt(0)}
                    </div>
                    <span className="font-black text-slate-800 uppercase text-sm tracking-tight">{u.name}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-sm font-bold text-slate-500 font-mono">{u.username}</td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getRoleBadge(u.role)}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Key size={14}/>
                    <span className="text-[8px] font-black tracking-[0.4em]">••••••••</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={() => openEdit(u)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Editar Usuario"
                    >
                      <Edit3 size={18}/>
                    </button>
                    <button 
                      onClick={() => handleDelete(u.id)}
                      className={`p-2 rounded-xl transition-all ${u.id === store.currentUser?.id ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                      title={u.id === store.currentUser?.id ? "Sesión activa" : "Eliminar Usuario"}
                      disabled={u.id === store.currentUser?.id}
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center">
             <ShieldCheck size={64} className="text-slate-100 mb-4" />
             <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No se encontraron usuarios</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in duration-300">
            <div className="p-8 bg-slate-950 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Shield size={120} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter relative z-10">
                {editingUser ? 'Editar Perfil' : 'Nuevo Colaborador'}
              </h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1 relative z-10">
                Asignación de privilegios de sistema
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                  <input 
                    required 
                    type="text" 
                    placeholder="Ej: Pedro Pérez"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="pperez"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all lowercase"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                  <input 
                    required={!editingUser}
                    type="password" 
                    placeholder="••••••••"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol en la Empresa</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['administrador', 'vendedor', 'cajero'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormData({...formData, role: r})}
                      className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${formData.role === r ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-[1.5] bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check size={18}/> {editingUser ? 'Guardar Cambios' : 'Registrar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
