
import { useState, useEffect } from 'react';
import { Product, VehicleRepair, Sale, Purchase, Expense, Employee, PayrollRecord, Customer, User } from './types';

const DEFAULT_SHEETS_URL = localStorage.getItem('gz_sheets_url') || '';
const STORED_USER = localStorage.getItem('gz_active_user');

export const useGonzacarsStore = () => {
  const [loading, setLoading] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false); // Nuevo estado para indicar carga masiva
  const [sheetsUrl, setSheetsUrl] = useState(DEFAULT_SHEETS_URL);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      return STORED_USER ? JSON.parse(STORED_USER) : null;
    } catch (e) {
      return null;
    }
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(45.0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [repairs, setRepairs] = useState<VehicleRepair[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);

  // Detectar configuración por URL (para abrir en otros dispositivos fácilmente)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const configUrl = params.get('config_db');
    if (configUrl) {
      const decoded = decodeURIComponent(configUrl);
      if (decoded.startsWith('https://script.google.com')) {
        saveUrl(decoded);
        // Limpiar URL para estética
        window.history.replaceState({}, document.title, window.location.pathname);
        alert("¡Configuración de base de datos importada con éxito!");
      }
    }
  }, []);

  const saveUrl = (url: string) => {
    const cleanUrl = url.trim();
    localStorage.setItem('gz_sheets_url', cleanUrl);
    setSheetsUrl(cleanUrl);
  };

  const login = (username: string, pass: string): boolean => {
    const found = users.find(u => 
      u.username && 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === pass
    );

    if (found) {
      const { password, ...userWithoutPass } = found;
      setCurrentUser(userWithoutPass as User);
      localStorage.setItem('gz_active_user', JSON.stringify(userWithoutPass));
      return true;
    }

    if ((users.length === 0 || !sheetsUrl) && username.toLowerCase() === 'admin' && pass === 'admin') {
       const adminUser: User = { 
         id: 'default-admin', 
         username: 'admin', 
         name: 'Administrador de Recuperación', 
         role: 'administrador' 
       };
       setCurrentUser(adminUser);
       localStorage.setItem('gz_active_user', JSON.stringify(adminUser));
       return true;
    }

    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gz_active_user');
  };

  // --- HELPER FUNCTIONS ROBUSTAS ---

  const getVal = (item: any, possibleKeys: string[]): any => {
    if (!item || typeof item !== 'object') return undefined;
    for (const key of possibleKeys) {
      if (item[key] !== undefined && item[key] !== null && item[key] !== '') return item[key];
    }
    const objectKeys = Object.keys(item);
    for (const key of possibleKeys) {
      const foundKey = objectKeys.find(k => k.toLowerCase() === key.toLowerCase());
      if (foundKey && item[foundKey] !== undefined && item[foundKey] !== null && item[foundKey] !== '') {
        return item[foundKey];
      }
    }
    return undefined;
  };

  const safeString = (val: any): string => {
    if (val === null || val === undefined) return '';
    return String(val).trim();
  };

  const safeNumber = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const str = String(val).replace(/[$ Bs]/g, '').trim(); 
    if (str.includes(',') && !str.includes('.')) {
      return parseFloat(str.replace(',', '.')) || 0;
    }
    return parseFloat(str) || 0;
  };

  const normalizeText = (text: string) => {
    return String(text || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  };

  const refreshData = async () => {
    if (!sheetsUrl || !sheetsUrl.startsWith('http')) return;
    if (isProcessingBatch) return; // Evitar refrescar mientras se procesa un lote crítico

    setLoading(true);
    try {
      const response = await fetch(sheetsUrl);
      if (!response.ok) throw new Error("Error en red");
      const data = await response.json();
      
      if (Array.isArray(data.Users)) {
        setUsers(data.Users.map((u: any) => ({
          ...u,
          id: safeString(getVal(u, ['id', 'ID', 'Id'])),
          username: safeString(getVal(u, ['username', 'usuario', 'user'])),
          password: safeString(getVal(u, ['password', 'clave', 'pass'])),
          name: safeString(getVal(u, ['name', 'nombre'])),
          role: safeString(getVal(u, ['role', 'rol', 'cargo']))
        })));
      }
      
      if (Array.isArray(data.Customers)) setCustomers(data.Customers);
      
      if (Array.isArray(data.Inventory)) {
        const mappedInventory = data.Inventory.map((p: any) => {
          const rawName = getVal(p, ['name', 'nombre', 'producto', 'product', 'descripcion']);
          const rawBarcode = getVal(p, ['barcode', 'codigo', 'code', 'id', 'referencia']);
          const rawCategory = getVal(p, ['category', 'categoria', 'cat', 'rubro']);
          const rawQty = getVal(p, ['quantity', 'cantidad', 'stock', 'cant', 'existencia']);
          const rawCost = getVal(p, ['cost', 'costo', 'compra']);
          const rawPrice = getVal(p, ['price', 'precio', 'venta', 'pvp']);
          const rawId = getVal(p, ['id', 'ID', 'uuid']);

          return {
            ...p,
            id: safeString(rawId) || Math.random().toString(36).substr(2, 9),
            barcode: safeString(rawBarcode),
            name: safeString(rawName),
            category: safeString(rawCategory) || 'General',
            quantity: safeNumber(rawQty),
            cost: safeNumber(rawCost),
            price: safeNumber(rawPrice)
          };
        });
        // Filtrado más permisivo para evitar ocultar productos válidos
        setInventory(mappedInventory.filter((p: Product) => p.name.length > 0));
      }
      
      if (Array.isArray(data.Repairs)) {
        setRepairs(data.Repairs.map((r: any) => ({
          ...r,
          year: safeNumber(r.year),
          items: (Array.isArray(r.items) ? r.items : []).map((i: any) => ({ ...i, quantity: safeNumber(i.quantity), price: safeNumber(i.price) })),
          installments: (Array.isArray(r.installments) ? r.installments : []).map((inst: any) => ({ ...inst, amount: safeNumber(inst.amount) }))
        })));
      }
      
      if (Array.isArray(data.Sales)) {
        setSales(data.Sales.map((s: any) => ({
          ...s,
          total: safeNumber(s.total),
          items: (Array.isArray(s.items) ? s.items : []).map((i: any) => ({ ...i, quantity: safeNumber(i.quantity), price: safeNumber(i.price) }))
        })));
      }
      
      if (Array.isArray(data.Purchases)) {
        setPurchases(data.Purchases.map((p: any) => ({
          ...p,
          price: safeNumber(p.price),
          quantity: safeNumber(p.quantity),
          total: safeNumber(p.total)
        })));
      }
      
      if (Array.isArray(data.Expenses)) {
        setExpenses(data.Expenses.map((e: any) => ({
          ...e,
          amount: safeNumber(e.amount)
        })));
      }
      
      if (Array.isArray(data.Employees)) {
        setEmployees(data.Employees.map((e: any) => ({
          ...e,
          baseSalary: safeNumber(e.baseSalary),
          commissionRate: safeNumber(e.commissionRate)
        })));
      }

      if (Array.isArray(data.Payroll)) {
        setPayroll(data.Payroll.map((pr: any) => ({
          ...pr,
          baseSalary: safeNumber(pr.baseSalary),
          commission: safeNumber(pr.commission),
          total: safeNumber(pr.total)
        })));
      }
      
      if (Array.isArray(data.Settings)) {
        const rateSetting = data.Settings.find((s: any) => {
           const k = getVal(s, ['key', 'clave', 'parametro']);
           return k === 'exchangeRate';
        });
        if (rateSetting) {
            const val = getVal(rateSetting, ['value', 'valor']);
            setExchangeRate(safeNumber(val));
        }
      }
      
    } catch (error) {
      console.error("Error cargando datos de Sheets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [sheetsUrl]);

  // SYSTEMA DE REINTENTOS PARA CONEXIÓN ROBUSTA
  const syncRow = async (sheet: string, action: 'add' | 'update' | 'delete', data: any, retries = 3) => {
    if (!sheetsUrl || !sheetsUrl.startsWith('http')) return;
    
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(sheetsUrl, {
                method: 'POST',
                redirect: 'follow', // Vital para Google Apps Script
                body: JSON.stringify({ sheet, action, data })
            });
            
            // Apps Script suele devolver 200 incluso con errores lógicos, pero verificamos el texto
            if (response.ok) {
                const text = await response.text();
                // Si el script devuelve "Error: ..." es que falló lógicamente
                if (!text.includes("Error") && !text.includes("Exception")) {
                    return true; // Éxito confirmado
                } else {
                    throw new Error("Apps Script Error: " + text);
                }
            }
            throw new Error("Network response not ok: " + response.status);
        } catch (e) {
            console.warn(`Intento de sincronización ${i + 1}/${retries} fallido para ${sheet}:`, e);
            
            if (i === retries - 1) {
                // Si es el último intento, lanzamos el error para que la UI lo sepa
                throw e; 
            }
            // Espera exponencial: 1s, 2s, 3s...
            await new Promise(r => setTimeout(r, 1000 * (i + 1))); 
        }
    }
  };

  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
    syncRow('Users', 'add', user);
  };

  const updateUser = (updated: User) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    syncRow('Users', 'update', updated);
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    syncRow('Users', 'delete', { id });
  };

  const updateExchangeRate = (val: number) => {
    setExchangeRate(val);
    syncRow('Settings', 'update', { key: 'exchangeRate', value: val.toString() });
  };

  const addCustomer = (customer: Customer) => {
    setCustomers(prev => [...prev, customer]);
    syncRow('Customers', 'add', customer);
  };

  const addRepair = (repair: VehicleRepair) => {
    setRepairs(prev => [...prev, repair]);
    syncRow('Repairs', 'add', repair);
  };

  const updateRepair = (updated: VehicleRepair) => {
    setRepairs(prev => prev.map(r => r.id === updated.id ? updated : r));
    syncRow('Repairs', 'update', updated);
  };
  
  const addSale = (sale: Sale) => {
    setSales(prev => [...prev, sale]);
    syncRow('Sales', 'add', sale);
    
    // Para ventas (salida de stock), también debería ser secuencial idealmente,
    // pero como suele ser 1 venta = pocos items, lo dejamos así por ahora.
    // Si hay problemas, aplicar misma lógica que en compras.
    const updatedInventory = inventory.map(item => {
      const soldItem = sale.items.find(si => si.productId === item.id);
      if (soldItem) {
        const newItem = { ...item, quantity: item.quantity - soldItem.quantity };
        syncRow('Inventory', 'update', newItem);
        return newItem;
      }
      return item;
    });
    setInventory(updatedInventory);
  };

  // --- LOGICA DE COMPRAS OPTIMIZADA: SECUENCIAL Y CON VERIFICACIÓN DE ERRORES ---
  const registerPurchaseBatch = async (newPurchases: Purchase[]) => {
    setIsProcessingBatch(true);
    
    const currentInventory = [...inventory];
    let successCount = 0;
    
    try {
        // Procesamos UNO POR UNO con espera activa
        for (const p of newPurchases) {
            let targetProductId = p.productId;
            let productIndex = -1;

            // 1. Buscar producto en el array local actualizado
            if (targetProductId) {
                productIndex = currentInventory.findIndex(i => i.id === targetProductId);
            }

            if (productIndex === -1) {
                const pNameNormalized = normalizeText(p.productName);
                productIndex = currentInventory.findIndex(i => normalizeText(i.name) === pNameNormalized);
            }

            // 2. Procesar Inventario (Paso Crítico 1)
            try {
                if (productIndex > -1) {
                    // -- ACTUALIZAR --
                    const existingItem = currentInventory[productIndex];
                    targetProductId = existingItem.id;

                    const updatedItem = {
                        ...existingItem,
                        quantity: existingItem.quantity + p.quantity,
                        cost: p.price,
                        lastEntry: p.date
                    };
                    
                    currentInventory[productIndex] = updatedItem;
                    await syncRow('Inventory', 'update', updatedItem);
                } else {
                    // -- CREAR --
                    if (!targetProductId) {
                        targetProductId = Math.random().toString(36).substr(2, 9);
                    }

                    const newItem: Product = {
                        id: targetProductId,
                        barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString(),
                        name: p.productName,
                        category: p.category,
                        quantity: p.quantity,
                        cost: p.price,
                        price: p.price * 1.35, 
                        lastEntry: p.date
                    };
                    
                    currentInventory.push(newItem);
                    await syncRow('Inventory', 'add', newItem);
                }
            } catch (invError) {
                // Si falla el inventario, NO registramos la compra para evitar inconsistencia
                console.error(`Fallo crítico en inventario para ${p.productName}`, invError);
                throw new Error(`Error al guardar en Inventario el producto: ${p.productName}. El proceso se detuvo.`);
            }

            // 3. Registrar la Compra (Paso Crítico 2)
            try {
                const finalPurchaseRecord = {
                    ...p,
                    productId: targetProductId 
                };
                await syncRow('Purchases', 'add', finalPurchaseRecord);
            } catch (purchError) {
                // Si falla el registro de compra pero el inventario pasó, es un problema menor pero igual paramos
                console.error(`Fallo registro compra para ${p.productName}`, purchError);
                throw new Error(`El inventario se actualizó pero falló el registro de compra para: ${p.productName}.`);
            }

            successCount++;
            // Pequeño delay adicional para dar respiro al servidor
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    } catch (error: any) {
        // Alerta visible al usuario
        alert(`ATENCIÓN: El proceso se interrumpió.\n\nMotivo: ${error.message}\n\nSe procesaron correctamente ${successCount} de ${newPurchases.length} productos.`);
    } finally {
        await refreshData();
        setIsProcessingBatch(false);
    }
  };

  const addExpense = (expense: Expense) => {
    setExpenses(prev => [...prev, expense]);
    syncRow('Expenses', 'add', expense);
  };

  const addEmployee = (emp: Employee) => {
    setEmployees(prev => [...prev, emp]);
    syncRow('Employees', 'add', emp);
  };

  const updateEmployee = (emp: Employee) => {
    setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e));
    syncRow('Employees', 'update', emp);
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    syncRow('Employees', 'delete', { id });
  };

  const addPayrollRecord = (record: PayrollRecord) => {
    setPayroll(prev => [...prev, record]);
    syncRow('Payroll', 'add', record);
  };

  const updateInventoryPrice = (id: string, newPrice: number) => {
    const item = inventory.find(p => p.id === id);
    if (item) {
        const updated = { ...item, price: newPrice };
        setInventory(inventory.map(p => p.id === id ? updated : p));
        syncRow('Inventory', 'update', updated);
    }
  };

  const updateProductName = (id: string, name: string) => {
    const item = inventory.find(p => p.id === id);
    if (item) {
        const updated = { ...item, name };
        setInventory(inventory.map(p => p.id === id ? updated : p));
        syncRow('Inventory', 'update', updated);
    }
  };

  const updateInventoryQuantity = (id: string, newQuantity: number) => {
    const item = inventory.find(p => p.id === id);
    if (item) {
        const updated = { ...item, quantity: newQuantity };
        setInventory(inventory.map(p => p.id === id ? updated : p));
        syncRow('Inventory', 'update', updated);
    }
  };
  
  const updateStockBatch = (updates: { id: string; quantity: number }[]) => {
    const currentInventory = [...inventory];
    updates.forEach(update => {
        const index = currentInventory.findIndex(p => p.id === update.id);
        if (index > -1) {
            const updatedItem = { ...currentInventory[index], quantity: update.quantity };
            currentInventory[index] = updatedItem;
            syncRow('Inventory', 'update', updatedItem);
        }
    });
    setInventory(currentInventory);
  };

  const updateBarcode = (id: string, barcode: string) => {
    const item = inventory.find(p => p.id === id);
    if (item) {
        const updated = { ...item, barcode };
        setInventory(inventory.map(p => p.id === id ? updated : p));
        syncRow('Inventory', 'update', updated);
    }
  };

  return {
    loading, isProcessingBatch, sheetsUrl, saveUrl, refreshData,
    currentUser, login, logout,
    users, addUser, updateUser, deleteUser,
    exchangeRate, setExchangeRate: updateExchangeRate,
    customers, addCustomer,
    inventory, setInventory, updateInventoryPrice, updateProductName, updateInventoryQuantity, updateStockBatch, updateBarcode, 
    generateBarcode: () => Math.floor(100000000000 + Math.random() * 900000000000).toString(),
    repairs, setRepairs, addRepair, updateRepair,
    sales, setSales, addSale,
    purchases, setPurchases, registerPurchaseBatch,
    expenses, setExpenses, addExpense,
    employees, setEmployees, addEmployee, updateEmployee, deleteEmployee,
    payroll, setPayroll, addPayrollRecord
  };
};
