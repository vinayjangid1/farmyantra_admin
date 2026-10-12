import { lazy } from 'react'
import {
  LayoutDashboard, PhoneCall, FileText, Package, Users, Boxes, FolderTree, Star, Tag, BookOpen, Globe, Mail, UserCog,
  History, Settings, BarChart3, ListChecks, Sun, Factory, Truck, PackageCheck, Receipt, Gift, Image, ShieldCheck, ShoppingCart, Layers, IdCard,
} from 'lucide-react'

import Login from '@/pages/Login/Login'
import LandingRedirect from '@/app/LandingRedirect'

const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard'))
const Enquiries = lazy(() => import('@/pages/Enquiries/Enquiries'))
const EnquiryDetail = lazy(() => import('@/pages/Enquiries/EnquiryDetail'))
const ContactMessages = lazy(() => import('@/pages/Enquiries/ContactMessages'))
const Quotations = lazy(() => import('@/pages/Quotations/Quotations'))
const QuotationEditor = lazy(() => import('@/pages/Quotations/QuotationEditor'))
const Orders = lazy(() => import('@/pages/Orders/Orders'))
const OrderDetail = lazy(() => import('@/pages/Orders/OrderDetail'))
const Customers = lazy(() => import('@/pages/Customers/Customers'))
const Products = lazy(() => import('@/pages/Products/Products'))
const ProductEditor = lazy(() => import('@/pages/Products/ProductEditor'))
const Categories = lazy(() => import('@/pages/Categories/Categories'))
const Reviews = lazy(() => import('@/pages/Reviews/Reviews'))
const Promotions = lazy(() => import('@/pages/Promotions/Promotions'))
const Catalogues = lazy(() => import('@/pages/Catalogues/Catalogues'))
const ContentPages = lazy(() => import('@/pages/Content/ContentPages'))
const TeamMembers = lazy(() => import('@/pages/TeamMembers/TeamMembers'))
const AuditLog = lazy(() => import('@/pages/AuditLog/AuditLog'))
const SettingsPage = lazy(() => import('@/pages/Settings/Settings'))
const Reports = lazy(() => import('@/pages/Reports/Reports'))
const Today = lazy(() => import('@/pages/Today/Today'))
const CreateOrder = lazy(() => import('@/pages/Orders/CreateOrder'))
const ProductionBoard = lazy(() => import('@/pages/Production/ProductionBoard'))
const ManufacturingTemplates = lazy(() => import('@/pages/Production/ManufacturingTemplates'))
const Shipments = lazy(() => import('@/pages/Logistics/Shipments'))
const DeliveryQueue = lazy(() => import('@/pages/Logistics/DeliveryQueue'))
const Drivers = lazy(() => import('@/pages/Logistics/Drivers'))
const Invoices = lazy(() => import('@/pages/Invoices/Invoices'))
const InvoiceEditor = lazy(() => import('@/pages/Invoices/InvoiceEditor'))
const Rewards = lazy(() => import('@/pages/Rewards/Rewards'))
const Banners = lazy(() => import('@/pages/Marketing/Banners'))
const TrustContent = lazy(() => import('@/pages/Marketing/TrustContent'))
const AbandonedCarts = lazy(() => import('@/pages/Carts/AbandonedCarts'))

/** `admin:<feature>:read` — the backend enforces the same strings on every resolver. */
const read = (feature) => `admin:${feature}:read`

/** Sidebar navigation — single source of truth (same shape as the Raddiwalla admin). */
export const navigationConfig = [
  { title: 'Today', path: '/today', icon: Sun },
  { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: read('dashboard') },
  {
    title: 'Sales',
    icon: PhoneCall,
    children: [
      { title: 'Enquiries & call-backs', path: '/enquiries', icon: PhoneCall, permission: read('enquiries') },
      { title: 'Quotations', path: '/quotations', icon: FileText, permission: read('quotations') },
      { title: 'Orders', path: '/orders', icon: Package, permission: read('orders') },
      { title: 'Customers', path: '/customers', icon: Users, permission: read('customers') },
      { title: 'Unsent request lists', path: '/carts', icon: ShoppingCart, permission: read('carts') },
      { title: 'Contact messages', path: '/contact-messages', icon: Mail, permission: read('enquiries') },
    ],
  },
  {
    title: 'Fulfilment',
    icon: Factory,
    children: [
      { title: 'Production', path: '/production', icon: Factory, permission: read('manufacturing') },
      { title: 'Production stages', path: '/production/templates', icon: Layers, permission: read('manufacturing') },
      { title: 'Shipments', path: '/shipments', icon: Truck, permission: read('shipments') },
      { title: 'Deliveries & issues', path: '/deliveries', icon: PackageCheck, permission: read('delivery_issues') },
      { title: 'Drivers & vehicles', path: '/drivers', icon: IdCard, permission: read('drivers') },
    ],
  },
  {
    title: 'Billing',
    icon: Receipt,
    children: [
      { title: 'Tax invoices', path: '/invoices', icon: Receipt, permission: read('invoices') },
      { title: 'Reward points', path: '/rewards', icon: Gift, permission: read('rewards') },
    ],
  },
  {
    title: 'Catalogue',
    icon: Boxes,
    children: [
      { title: 'Products', path: '/products', icon: Boxes, permission: read('products') },
      { title: 'Categories', path: '/categories', icon: FolderTree, permission: read('products') },
      { title: 'Catalogue PDFs', path: '/catalogues', icon: BookOpen, permission: read('catalogues') },
    ],
  },
  {
    title: 'Marketing',
    icon: Tag,
    children: [
      { title: 'Offers & coupons', path: '/promotions', icon: Tag, permission: read('promotions') },
      { title: 'Reviews', path: '/reviews', icon: Star, permission: read('reviews') },
      { title: 'Banners', path: '/banners', icon: Image, permission: read('banners') },
      { title: 'Trust & proof', path: '/trust', icon: ShieldCheck, permission: read('content') },
      { title: 'Website content', path: '/content', icon: Globe, permission: read('content') },
    ],
  },
  { title: 'Reports', path: '/reports', icon: BarChart3, permission: read('reports') },
  {
    title: 'Administration',
    icon: Settings,
    children: [
      { title: 'Team & roles', path: '/team', icon: UserCog, permission: read('team_members') },
      { title: 'Audit log', path: '/audit-log', icon: History, permission: read('audit_logs') },
      { title: 'Settings & tax', path: '/settings', icon: ListChecks, permission: read('settings') },
    ],
  },
]

export const protectedRoutes = [
  { path: '/', element: LandingRedirect },
  { path: '/today', element: Today },
  { path: '/dashboard', element: Dashboard, permission: read('dashboard') },
  { path: '/enquiries', element: Enquiries, permission: read('enquiries') },
  { path: '/enquiries/:id', element: EnquiryDetail, permission: read('enquiries') },
  { path: '/contact-messages', element: ContactMessages, permission: read('enquiries') },
  { path: '/quotations', element: Quotations, permission: read('quotations') },
  { path: '/quotations/:id', element: QuotationEditor, permission: read('quotations') },
  { path: '/orders', element: Orders, permission: read('orders') },
  { path: '/orders/new', element: CreateOrder, permission: 'admin:orders:write' },
  { path: '/orders/:id', element: OrderDetail, permission: read('orders') },
  { path: '/carts', element: AbandonedCarts, permission: read('carts') },
  { path: '/production', element: ProductionBoard, permission: read('manufacturing') },
  { path: '/production/templates', element: ManufacturingTemplates, permission: read('manufacturing') },
  { path: '/shipments', element: Shipments, permission: read('shipments') },
  { path: '/deliveries', element: DeliveryQueue, permission: read('delivery_issues') },
  { path: '/drivers', element: Drivers, permission: read('drivers') },
  { path: '/invoices', element: Invoices, permission: read('invoices') },
  { path: '/invoices/:id', element: InvoiceEditor, permission: read('invoices') },
  { path: '/rewards', element: Rewards, permission: read('rewards') },
  { path: '/banners', element: Banners, permission: read('banners') },
  { path: '/trust', element: TrustContent, permission: read('content') },
  { path: '/customers', element: Customers, permission: read('customers') },
  { path: '/products', element: Products, permission: read('products') },
  { path: '/products/:id', element: ProductEditor, permission: read('products') },
  { path: '/categories', element: Categories, permission: read('products') },
  { path: '/catalogues', element: Catalogues, permission: read('catalogues') },
  { path: '/promotions', element: Promotions, permission: read('promotions') },
  { path: '/reviews', element: Reviews, permission: read('reviews') },
  { path: '/content', element: ContentPages, permission: read('content') },
  { path: '/reports', element: Reports, permission: read('reports') },
  { path: '/team', element: TeamMembers, permission: read('team_members') },
  { path: '/audit-log', element: AuditLog, permission: read('audit_logs') },
  { path: '/settings', element: SettingsPage, permission: read('settings') },
]

export const publicRoutes = [{ path: '/login', element: Login }]
