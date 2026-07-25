// Mock data for the bewoman dashboard. Replace with real Supabase queries later.

export type AppointmentStatus = "confirmado" | "pendiente" | "cancelado" | "completado";

export interface Appointment {
  id: string;
  clientName: string;
  clientId: string;
  service: string;
  staff: string;
  date: string; // ISO
  duration: number; // minutes
  price: number;
  status: AppointmentStatus;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalVisits: number;
  lastVisit: string;
  totalSpent: number;
  tags: string[];
}

export interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  active: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  services: string[];
  active: boolean;
}

const today = new Date();
const iso = (d: number, h: number, m = 0) => {
  const date = new Date(today);
  date.setDate(today.getDate() + d);
  date.setHours(h, m, 0, 0);
  return date.toISOString();
};

export const mockAppointments: Appointment[] = [
  {
    id: "a1",
    clientName: "María González",
    clientId: "c1",
    service: "Depilación láser piernas",
    staff: "Laura",
    date: iso(0, 9),
    duration: 60,
    price: 15000,
    status: "confirmado",
  },
  {
    id: "a2",
    clientName: "Sofía Pérez",
    clientId: "c2",
    service: "Limpieza facial profunda",
    staff: "Carla",
    date: iso(0, 10, 30),
    duration: 75,
    price: 12000,
    status: "confirmado",
  },
  {
    id: "a3",
    clientName: "Julieta Ramos",
    clientId: "c3",
    service: "Manicura semi",
    staff: "Ana",
    date: iso(0, 12),
    duration: 45,
    price: 6000,
    status: "pendiente",
  },
  {
    id: "a4",
    clientName: "Camila Torres",
    clientId: "c4",
    service: "Masaje descontracturante",
    staff: "Laura",
    date: iso(0, 14),
    duration: 60,
    price: 10000,
    status: "confirmado",
  },
  {
    id: "a5",
    clientName: "Lucía Fernández",
    clientId: "c5",
    service: "Depilación láser axilas",
    staff: "Carla",
    date: iso(0, 16),
    duration: 30,
    price: 8000,
    status: "confirmado",
  },
  {
    id: "a6",
    clientName: "Valentina Ruiz",
    clientId: "c6",
    service: "Pestañas pelo a pelo",
    staff: "Ana",
    date: iso(1, 10),
    duration: 120,
    price: 20000,
    status: "confirmado",
  },
  {
    id: "a7",
    clientName: "Martina López",
    clientId: "c7",
    service: "Cejas HD",
    staff: "Carla",
    date: iso(1, 15),
    duration: 45,
    price: 7000,
    status: "pendiente",
  },
  {
    id: "a8",
    clientName: "Delfina Ríos",
    clientId: "c8",
    service: "Radiofrecuencia abdomen",
    staff: "Laura",
    date: iso(2, 11),
    duration: 60,
    price: 18000,
    status: "confirmado",
  },
  {
    id: "a9",
    clientName: "Renata Silva",
    clientId: "c9",
    service: "Limpieza facial",
    staff: "Carla",
    date: iso(-1, 10),
    duration: 60,
    price: 12000,
    status: "completado",
  },
  {
    id: "a10",
    clientName: "Antonella Vega",
    clientId: "c10",
    service: "Manicura tradicional",
    staff: "Ana",
    date: iso(-1, 14),
    duration: 40,
    price: 5000,
    status: "completado",
  },
];

export const mockClients: Client[] = [
  {
    id: "c1",
    name: "María González",
    phone: "+54 11 5555-0001",
    email: "maria@example.com",
    totalVisits: 12,
    lastVisit: iso(-3, 10),
    totalSpent: 180000,
    tags: ["VIP", "Láser"],
  },
  {
    id: "c2",
    name: "Sofía Pérez",
    phone: "+54 11 5555-0002",
    email: "sofia@example.com",
    totalVisits: 8,
    lastVisit: iso(-7, 15),
    totalSpent: 96000,
    tags: ["Facial"],
  },
  {
    id: "c3",
    name: "Julieta Ramos",
    phone: "+54 11 5555-0003",
    email: "julieta@example.com",
    totalVisits: 25,
    lastVisit: iso(-1, 12),
    totalSpent: 150000,
    tags: ["VIP", "Manos"],
  },
  {
    id: "c4",
    name: "Camila Torres",
    phone: "+54 11 5555-0004",
    email: "camila@example.com",
    totalVisits: 4,
    lastVisit: iso(-14, 11),
    totalSpent: 40000,
    tags: ["Nueva"],
  },
  {
    id: "c5",
    name: "Lucía Fernández",
    phone: "+54 11 5555-0005",
    email: "lucia@example.com",
    totalVisits: 18,
    lastVisit: iso(-5, 16),
    totalSpent: 144000,
    tags: ["Láser"],
  },
  {
    id: "c6",
    name: "Valentina Ruiz",
    phone: "+54 11 5555-0006",
    email: "valen@example.com",
    totalVisits: 6,
    lastVisit: iso(-10, 10),
    totalSpent: 120000,
    tags: ["Pestañas"],
  },
  {
    id: "c7",
    name: "Martina López",
    phone: "+54 11 5555-0007",
    email: "martina@example.com",
    totalVisits: 3,
    lastVisit: iso(-20, 15),
    totalSpent: 21000,
    tags: ["Nueva"],
  },
  {
    id: "c8",
    name: "Delfina Ríos",
    phone: "+54 11 5555-0008",
    email: "delfina@example.com",
    totalVisits: 15,
    lastVisit: iso(-2, 11),
    totalSpent: 270000,
    tags: ["VIP", "Corporal"],
  },
];

export const mockServices: Service[] = [
  {
    id: "s1",
    name: "Depilación láser piernas completas",
    category: "Depilación",
    duration: 60,
    price: 15000,
    active: true,
  },
  {
    id: "s2",
    name: "Depilación láser axilas",
    category: "Depilación",
    duration: 30,
    price: 8000,
    active: true,
  },
  {
    id: "s3",
    name: "Limpieza facial profunda",
    category: "Facial",
    duration: 75,
    price: 12000,
    active: true,
  },
  {
    id: "s4",
    name: "Radiofrecuencia abdomen",
    category: "Corporal",
    duration: 60,
    price: 18000,
    active: true,
  },
  {
    id: "s5",
    name: "Manicura semipermanente",
    category: "Manos",
    duration: 45,
    price: 6000,
    active: true,
  },
  {
    id: "s6",
    name: "Manicura tradicional",
    category: "Manos",
    duration: 40,
    price: 5000,
    active: true,
  },
  {
    id: "s7",
    name: "Pestañas pelo a pelo",
    category: "Cejas y pestañas",
    duration: 120,
    price: 20000,
    active: true,
  },
  {
    id: "s8",
    name: "Cejas HD",
    category: "Cejas y pestañas",
    duration: 45,
    price: 7000,
    active: true,
  },
  {
    id: "s9",
    name: "Masaje descontracturante",
    category: "Corporal",
    duration: 60,
    price: 10000,
    active: false,
  },
];

export const mockStaff: StaffMember[] = [
  {
    id: "st1",
    name: "Laura Méndez",
    role: "Cosmetóloga",
    email: "laura@bewoman.com",
    services: ["Depilación", "Corporal"],
    active: true,
  },
  {
    id: "st2",
    name: "Carla Ibáñez",
    role: "Esteticista",
    email: "carla@bewoman.com",
    services: ["Facial", "Cejas y pestañas"],
    active: true,
  },
  {
    id: "st3",
    name: "Ana Sosa",
    role: "Manicurista",
    email: "ana@bewoman.com",
    services: ["Manos", "Cejas y pestañas"],
    active: true,
  },
  {
    id: "st4",
    name: "Paula Duarte",
    role: "Recepcionista",
    email: "paula@bewoman.com",
    services: [],
    active: true,
  },
];

export const revenueByMonth = [
  { month: "Ene", revenue: 420000, appointments: 78 },
  { month: "Feb", revenue: 480000, appointments: 89 },
  { month: "Mar", revenue: 530000, appointments: 96 },
  { month: "Abr", revenue: 610000, appointments: 108 },
  { month: "May", revenue: 580000, appointments: 102 },
  { month: "Jun", revenue: 720000, appointments: 128 },
];

export const topServices = [
  { name: "Depilación láser", value: 42 },
  { name: "Facial", value: 28 },
  { name: "Manos", value: 18 },
  { name: "Corporal", value: 12 },
];

export const currency = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
