import type { Category, Product, User, UserRole } from '@/types'

export const CATEGORIES_DATA: Category[] = [
  { id: 'all',         name: 'All Items',   color: '#71717A' },
  { id: 'beverages',   name: 'Beverages',   color: '#D97706' },
  { id: 'food',        name: 'Food',        color: '#16A34A' },
  { id: 'electronics', name: 'Electronics', color: '#2563EB' },
  { id: 'clothing',    name: 'Clothing',    color: '#7C3AED' },
  { id: 'health',      name: 'Health',      color: '#DC2626' },
]

export const PRODUCTS_DATA: Product[] = [
  { id:'p001', sku:'BEV-001', name:'Espresso',       category:'beverages',   price:3.50,  cost:0.80,  stock:100, unit:'cup',    taxRate:0.10, barcode:'1000000001', color:'#D97706' },
  { id:'p002', sku:'BEV-002', name:'Café Latte',     category:'beverages',   price:5.00,  cost:1.20,  stock:80,  unit:'cup',    taxRate:0.10, barcode:'1000000002', color:'#D97706' },
  { id:'p003', sku:'BEV-003', name:'Cappuccino',     category:'beverages',   price:4.50,  cost:1.00,  stock:60,  unit:'cup',    taxRate:0.10, barcode:'1000000003', color:'#D97706' },
  { id:'p004', sku:'BEV-004', name:'Iced Tea',       category:'beverages',   price:3.00,  cost:0.50,  stock:120, unit:'cup',    taxRate:0.10, barcode:'1000000004', color:'#D97706' },
  { id:'p005', sku:'BEV-005', name:'Fresh OJ',       category:'beverages',   price:4.50,  cost:1.50,  stock:40,  unit:'cup',    taxRate:0.10, barcode:'1000000005', color:'#D97706' },
  { id:'p006', sku:'BEV-006', name:'Mineral Water',  category:'beverages',   price:2.50,  cost:0.40,  stock:200, unit:'bottle', taxRate:0.10, barcode:'1000000006', color:'#D97706' },
  { id:'p007', sku:'FOOD-001', name:'Club Sandwich', category:'food',        price:12.50, cost:5.00,  stock:30,  unit:'item',   taxRate:0.10, barcode:'2000000001', color:'#16A34A' },
  { id:'p008', sku:'FOOD-002', name:'Caesar Salad',  category:'food',        price:10.00, cost:3.50,  stock:25,  unit:'item',   taxRate:0.10, barcode:'2000000002', color:'#16A34A' },
  { id:'p009', sku:'FOOD-003', name:'Cheeseburger',  category:'food',        price:14.00, cost:6.00,  stock:20,  unit:'item',   taxRate:0.10, barcode:'2000000003', color:'#16A34A' },
  { id:'p010', sku:'FOOD-004', name:'Choc Muffin',   category:'food',        price:4.50,  cost:1.20,  stock:50,  unit:'item',   taxRate:0.10, barcode:'2000000004', color:'#16A34A' },
  { id:'p011', sku:'FOOD-005', name:'Banana Bread',  category:'food',        price:3.50,  cost:0.90,  stock:35,  unit:'item',   taxRate:0.10, barcode:'2000000005', color:'#16A34A' },
  { id:'p012', sku:'ELEC-001', name:'USB-C Cable 2m',category:'electronics', price:14.99, cost:4.00,  stock:200, unit:'item',   taxRate:0.15, barcode:'3000000001', color:'#2563EB' },
  { id:'p013', sku:'ELEC-002', name:'Phone Case',    category:'electronics', price:19.99, cost:5.00,  stock:80,  unit:'item',   taxRate:0.15, barcode:'3000000002', color:'#2563EB' },
  { id:'p014', sku:'ELEC-003', name:'Wireless Buds', category:'electronics', price:49.99, cost:18.00, stock:15,  unit:'item',   taxRate:0.15, barcode:'3000000003', color:'#2563EB' },
  { id:'p015', sku:'ELEC-004', name:'Screen Guard',  category:'electronics', price:9.99,  cost:2.50,  stock:150, unit:'item',   taxRate:0.15, barcode:'3000000004', color:'#2563EB' },
  { id:'p016', sku:'CLO-001', name:'Logo T-Shirt',   category:'clothing',    price:24.99, cost:8.00,  stock:60,  unit:'item',   taxRate:0,    barcode:'4000000001', color:'#7C3AED' },
  { id:'p017', sku:'CLO-002', name:'Zip Hoodie',     category:'clothing',    price:54.99, cost:22.00, stock:30,  unit:'item',   taxRate:0,    barcode:'4000000002', color:'#7C3AED' },
  { id:'p018', sku:'CLO-003', name:'Baseball Cap',   category:'clothing',    price:19.99, cost:7.00,  stock:45,  unit:'item',   taxRate:0,    barcode:'4000000003', color:'#7C3AED' },
  { id:'p019', sku:'CLO-004', name:'Crew Socks 3pk', category:'clothing',    price:12.99, cost:4.00,  stock:90,  unit:'pack',   taxRate:0,    barcode:'4000000004', color:'#7C3AED' },
  { id:'p020', sku:'HLT-001', name:'Vitamin C 1000', category:'health',      price:12.99, cost:4.50,  stock:100, unit:'bottle', taxRate:0,    barcode:'5000000001', color:'#DC2626' },
  { id:'p021', sku:'HLT-002', name:'Hand Sanitizer', category:'health',      price:5.99,  cost:1.50,  stock:200, unit:'bottle', taxRate:0,    barcode:'5000000002', color:'#DC2626' },
  { id:'p022', sku:'HLT-003', name:'Aspirin 500mg',  category:'health',      price:8.99,  cost:3.00,  stock:120, unit:'box',    taxRate:0,    barcode:'5000000003', color:'#DC2626' },
  { id:'p023', sku:'HLT-004', name:'Face Mask 10pk', category:'health',      price:9.99,  cost:3.50,  stock:5,   unit:'pack',   taxRate:0,    barcode:'5000000004', color:'#DC2626' },
  { id:'p024', sku:'HLT-005', name:'Multivitamin',   category:'health',      price:16.99, cost:6.00,  stock:0,   unit:'bottle', taxRate:0,    barcode:'5000000005', color:'#DC2626' },
]

export const USERS_DATA: User[] = [
  { id:'u001', name:'Alex Morgan',  role:'CASHIER',         email:'alex@nexuspos.io',   initials:'AM' },
  { id:'u002', name:'Sam Chen',     role:'MANAGER',         email:'sam@nexuspos.io',    initials:'SC' },
  { id:'u003', name:'Jordan Lee',   role:'INVENTORY_STAFF', email:'jordan@nexuspos.io', initials:'JL' },
  { id:'u004', name:'Maria Santos', role:'BUSINESS_OWNER',  email:'maria@nexuspos.io',  initials:'MS' },
]

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN:     'Super Admin',
  RESELLER:        'Reseller',
  BUSINESS_OWNER:  'Owner',
  MANAGER:         'Manager',
  INVENTORY_STAFF: 'Inventory',
  CASHIER:         'Cashier',
}

export const ROLE_BADGE_STYLES: Record<UserRole, { bg: string; text: string; border: string }> = {
  SUPER_ADMIN:     { bg: '#4C0519', text: '#FB7185', border: '#9F1239' },
  RESELLER:        { bg: '#431407', text: '#FB923C', border: '#9A3412' },
  BUSINESS_OWNER:  { bg: '#451A03', text: '#FBBF24', border: '#92400E' },
  MANAGER:         { bg: '#1E3A5F', text: '#60A5FA', border: '#1D4ED8' },
  INVENTORY_STAFF: { bg: '#14532D', text: '#4ADE80', border: '#15803D' },
  CASHIER:         { bg: '#2E1065', text: '#A78BFA', border: '#6D28D9' },
}

const CAN_ACCESS: Record<string, UserRole[]> = {
  pos:       ['CASHIER','MANAGER','BUSINESS_OWNER','SUPER_ADMIN'],
  products:  ['MANAGER','BUSINESS_OWNER','SUPER_ADMIN','INVENTORY_STAFF'],
  inventory: ['MANAGER','BUSINESS_OWNER','SUPER_ADMIN','INVENTORY_STAFF'],
  sales:     ['CASHIER','MANAGER','BUSINESS_OWNER','SUPER_ADMIN'],
  sync:      ['MANAGER','BUSINESS_OWNER','SUPER_ADMIN'],
}

export function canAccess(role: UserRole, section: string): boolean {
  return (CAN_ACCESS[section] ?? []).includes(role)
}
