
export type ServiceStatus = 'Ingresado' | 'En Diagnóstico' | 'En Reparación' | 'Esperando Repuestos' | 'Finalizado' | 'Entregado';

export type PaymentMethod = 'Efectivo Bs' | 'Efectivo $' | 'Pago Móvil' | 'TDD' | 'TDC' | 'Zelle';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  quantity: number;
  cost: number;
  price: number;
  lastEntry: string;
}

export interface RepairItem {
  id: string;
  type: 'Repuesto' | 'Consumible' | 'Servicio';
  description: string;
  quantity: number;
  price: number;
}

export interface VehicleRepair {
  id: string;
  customerId: string; // Vinculación con cliente
  plate: string;
  brand: string;
  model: string;
  year: number;
  ownerName: string; // Para compatibilidad rápida
  responsible: string;
  status: ServiceStatus;
  diagnosis: string;
  serviceType: string;
  mechanicId: string;
  evidencePhoto?: string;
  items: RepairItem[];
  createdAt: string;
  finishedAt?: string;
  paymentMethod?: PaymentMethod;
}

export interface Sale {
  id: string;
  customerId?: string; // Vinculación con cliente
  date: string;
  customerName: string;
  items: { productId: string; name: string; price: number; quantity: number }[];
  total: number;
  iva: boolean;
  paymentMethod: PaymentMethod;
}

export interface Purchase {
  id: string;
  date: string;
  provider: string;
  invoiceNumber: string;
  productId: string;
  productName: string;
  category: string;
  price: number;
  quantity: number;
  total: number;
  type: 'Contado' | 'Crédito';
}

export interface Expense {
  id: string;
  date: string;
  category: 'Limpieza' | 'Oficina' | 'Víveres' | 'Impuesto' | 'Aseo Urbano' | 'Internet';
  description: string;
  amount: number;
}

export interface Employee {
  id: string;
  name: string;
  role: 'Mecánico' | 'Vendedor' | 'Administrador';
  baseSalary: number;
  commissionRate: number;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  date: string;
  baseSalary: number;
  commission: number;
  total: number;
  status: 'Pendiente' | 'Pagado';
}
