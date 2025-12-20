
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

  const saveUrl = (url: string) => {
    localStorage.setItem('gz_sheets_url', url);
    setSheetsUrl(url);
  };

  const login = (username: string, pass: string): boolean => {
    // 1. Intentar buscar en la lista de usuarios cargados desde la base de datos
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

    // 2. Fallback de recuperación: Solo si la lista está vacía o no hay URL (primer inicio)
    // También permite admin/admin si es la primera vez que se accede
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

  const refreshData = async () => {
    if (!sheetsUrl) return;
    setLoading(true);
    try {
      const response = await fetch(sheetsUrl);
      const data = await response.json();
      
      if (Array.isArray(data.Users)) {
        setUsers(data.Users.map((u: any) => ({
          ...u,
          password: u.password ? String(u.password) : '' // Asegurar que el password sea string
        })));
      }
      
      if (Array.isArray(data.Customers)) setCustomers(data.Customers);
      
      if (Array.isArray(data.Inventory)) {
        setInventory(data.Inventory.map((p: any) => ({
          ...p,
          quantity: Number(p.quantity || 0),
          cost: Number(p.cost || 0),
          price: Number(p.price || 0)
        })));
      }
      
      if (Array.isArray(data.Repairs)) {
        setRepairs(data.Repairs.map((r: any) => ({
          ...r,
          year: Number(r.year || 0),
          items: (Array.isArray(r.items) ? r.items : []).map((i: any) => ({ ...i, quantity: Number(i.quantity || 0), price: Number(i.price || 0) })),
          installments: (Array.isArray(r.installments) ? r.installments : []).map((inst: any) => ({ ...inst, amount: Number(inst.amount || 0) }))
        })));
      }
      
      if (Array.isArray(data.Sales)) {
        setSales(data.Sales.map((s: any) => ({
          ...s,
          total: Number(s.total || 0),
          items: (Array.isArray(s.items) ? s.items : []).map((i: any) => ({ ...i, quantity: Number(i.quantity || 0), price: Number(i.price || 0) }))
        })));
      }
      
      if (Array.isArray(data.Purchases)) {
        setPurchases(data.Purchases.map((p: any) => ({
          ...p,
          price: Number(p.price || 0),
          quantity: Number(p.quantity || 0),
          total: Number(p.total || 0)
        })));
      }
      
      if (Array.isArray(data.Expenses)) {
        setExpenses(data.Expenses.map((e: any) => ({
          ...e,
          amount: Number(e.amount || 0)
        })));
      }
      
      if (Array.isArray(data.Employees)) {
        setEmployees(data.Employees.map((e: any) => ({
          ...e,
          baseSalary: Number(e.baseSalary || 0),
          commissionRate: Number(e.commissionRate || 0)
        })));
      }

      if (Array.isArray(data.Payroll)) {
        setPayroll(data.Payroll.map((pr: any) => ({
          ...pr,
          baseSalary: Number(pr.baseSalary || 0),
          commission: Number(pr.commission || 0),
          total: Number(pr.total || 0)
        })));
      }
      
      if (Array.isArray(data.Settings)) {
        const rateSetting = data.Settings.find((s: any) => s.key === 'exchangeRate');
        if (rateSetting) setExchangeRate(Number(rateSetting.value));
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
    if (!sheetsUrl) return;
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
    employees, setEmployees, addEmployee, updateEmployee,
    payroll, setPayroll, addPayrollRecord
  };
};
