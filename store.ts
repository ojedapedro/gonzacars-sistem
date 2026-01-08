
import { useState, useEffect } from 'react';
import { Product, VehicleRepair, Sale, Purchase, Expense, Employee, PayrollRecord, Customer, User } from './types';

const DEFAULT_SHEETS_URL = localStorage.getItem('gz_sheets_url') || '';
const STORED_USER = localStorage.getItem('gz_active_user');

export const useGonzacarsStore = () => {
  const [loading, setLoading] = useState(false);
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

  // Función auxiliar para limpiar strings
  const safeString = (val: any): string => {
    if (val === null || val === undefined) return '';
    return String(val).trim();
  };

  // Función auxiliar para limpiar números
  const safeNumber = (val: any): number => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const refreshData = async () => {
    if (!sheetsUrl || !sheetsUrl.startsWith('http')) return;
    setLoading(true);
    try {
      const response = await fetch(sheetsUrl);
      if (!response.ok) throw new Error("Error en red");
      const data = await response.json();
      
      if (Array.isArray(data.Users)) {
        setUsers(data.Users.map((u: any) => ({
          ...u,
          password: safeString(u.password)
        })));
      }
      
      if (Array.isArray(data.Customers)) setCustomers(data.Customers);
      
      if (Array.isArray(data.Inventory)) {
        setInventory(
          data.Inventory
            // Filtrar filas vacías (sin nombre Y sin código)
            .filter((p: any) => safeString(p.name) || safeString(p.barcode))
            .map((p: any) => ({
              ...p,
              // ID robusto: usa el existente o genera uno nuevo solo si está totalmente vacío
              id: safeString(p.id) || Math.random().toString(36).substr(2, 9),
              barcode: safeString(p.barcode),
              name: safeString(p.name),
              category: safeString(p.category),
              quantity: safeNumber(p.quantity),
              cost: safeNumber(p.cost),
              price: safeNumber(p.price)
            }))
        );
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
        const rateSetting = data.Settings.find((s: any) => s.key === 'exchangeRate');
        if (rateSetting) setExchangeRate(safeNumber(rateSetting.value));
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

  const syncRow = async (sheet: string, action: 'add' | 'update' | 'delete', data: any) => {
    if (!sheetsUrl || !sheetsUrl.startsWith('http')) return;
    try {
      await fetch(sheetsUrl, {
        method: 'POST',
        redirect: 'follow',
        body: JSON.stringify({ sheet, action, data })
      });
    } catch (e) {
      console.error("Error sincronizando:", e);
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

  const addPurchase = (purchase: Purchase) => {
    setPurchases(prev => [...prev, purchase]);
    syncRow('Purchases', 'add', purchase);
    
    const existing = inventory.find(p => p.id === purchase.productId || p.name === purchase.productName);
    if (existing) {
      const updated = { 
        ...existing, 
        quantity: existing.quantity + purchase.quantity, 
        cost: purchase.price, 
        lastEntry: purchase.date 
      };
      setInventory(prev => prev.map(p => p.id === existing.id ? updated : p));
      syncRow('Inventory', 'update', updated);
    } else {
      const newItem: Product = {
        id: Math.random().toString(36).substr(2, 9),
        barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString(),
        name: purchase.productName,
        category: purchase.category,
        quantity: purchase.quantity,
        cost: purchase.price,
        price: purchase.price * 1.3,
        lastEntry: purchase.date
      };
      setInventory(prev => [...prev, newItem]);
      syncRow('Inventory', 'add', newItem);
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

  const updateInventoryQuantity = (id: string, newQuantity: number) => {
    const item = inventory.find(p => p.id === id);
    if (item) {
        const updated = { ...item, quantity: newQuantity };
        setInventory(inventory.map(p => p.id === id ? updated : p));
        syncRow('Inventory', 'update', updated);
    }
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
    loading, sheetsUrl, saveUrl, refreshData,
    currentUser, login, logout,
    users, addUser, updateUser, deleteUser,
    exchangeRate, setExchangeRate: updateExchangeRate,
    customers, addCustomer,
    inventory, setInventory, updateInventoryPrice, updateInventoryQuantity, updateBarcode, 
    generateBarcode: () => Math.floor(100000000000 + Math.random() * 900000000000).toString(),
    repairs, setRepairs, addRepair, updateRepair,
    sales, setSales, addSale,
    purchases, setPurchases, addPurchase,
    expenses, setExpenses, addExpense,
    employees, setEmployees, addEmployee, updateEmployee, deleteEmployee,
    payroll, setPayroll, addPayrollRecord
  };
};
