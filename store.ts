
import { useState, useEffect } from 'react';
import { Product, VehicleRepair, Sale, Purchase, Expense, Employee, PayrollRecord, Customer } from './types';

// NOTA: El usuario debe colocar su URL de Web App desplegada aquí o en la UI
const DEFAULT_SHEETS_URL = localStorage.getItem('gz_sheets_url') || '';

export const useGonzacarsStore = () => {
  const [loading, setLoading] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState(DEFAULT_SHEETS_URL);
  
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

  // Cargar datos iniciales desde Google Sheets
  const refreshData = async () => {
    if (!sheetsUrl) return;
    setLoading(true);
    try {
      const response = await fetch(sheetsUrl);
      const data = await response.json();
      
      if (data.Customers) setCustomers(data.Customers);
      if (data.Inventory) setInventory(data.Inventory);
      if (data.Repairs) setRepairs(data.Repairs);
      if (data.Sales) setSales(data.Sales);
      if (data.Purchases) setPurchases(data.Purchases);
      if (data.Expenses) setExpenses(data.Expenses);
      if (data.Employees) setEmployees(data.Employees);
      
      const rateSetting = data.Settings?.find((s: any) => s.key === 'exchangeRate');
      if (rateSetting) setExchangeRate(Number(rateSetting.value));
      
    } catch (error) {
      console.error("Error cargando datos de Sheets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [sheetsUrl]);

  const syncRow = async (sheet: string, action: 'add' | 'update', data: any) => {
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
    
    // Deducción local y en nube de inventario
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
      const updated = { ...existing, quantity: existing.quantity + purchase.quantity, cost: purchase.price, lastEntry: purchase.date };
      setInventory(prev => prev.map(p => p.id === existing.id ? updated : p));
      syncRow('Inventory', 'update', updated);
    } else {
      const newItem = {
        id: purchase.productId || Math.random().toString(36).substr(2, 9),
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
    exchangeRate, setExchangeRate: updateExchangeRate,
    customers, addCustomer,
    inventory, setInventory, updateInventoryPrice, updateInventoryQuantity, updateBarcode, 
    generateBarcode: () => Math.floor(100000000000 + Math.random() * 900000000000).toString(),
    repairs, setRepairs, addRepair, updateRepair,
    sales, setSales, addSale,
    purchases, setPurchases, addPurchase,
    expenses, setExpenses, addExpense,
    employees, setEmployees, addEmployee, updateEmployee,
    payroll, setPayroll
  };
};
