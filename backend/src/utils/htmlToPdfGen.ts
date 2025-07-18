import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer'
import handlebars from 'handlebars'

// export interface SalesOrderItem {
//   id: string
//   salesOrderId: string
//   inventoryItemId: string
//   quantity: number
//   unitPrice: number
//   taxRate?: number
//   hsnOrSacCode?: string
//   amount: number
// }

// export interface SalesOrderData {
//   id: string
//   orderNumber: number
//   tenantId: string
//   customerId: string
//   status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
//   notes?: string
//   terms?: string
//   placeOfSupply: string
//   subTotal: number
//   taxAmount: number
//   total: number
//   createdAt: string
//   items: SalesOrderItem[]
//   tenantName: string
// }

export interface SalesOrderItem {
  id: string
  salesOrderId: string
  inventoryItemId: string
  quantity: number
  unitPrice: number
  taxRate?: number
  hsnOrSacCode?: string
  amount: number
  name?: string // Added for template display
}

export interface SalesOrderData {
  id: string
  orderNumber: number
  logoUrl: string
  tenantId: string
  customerId: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  notes?: string
  terms?: string
  placeOfSupply: string
  subTotal: number
  taxAmount: number
  total: number
  createdAt: string
  items: SalesOrderItem[]

  // Template-specific fields
  tenantName: string
  tenantName2?: string
  companyId: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  zip: string
  gstIn: string
  customerName: string

  // Computed/derived fields
  formattedOrderNumber?: string // Can be generated from orderNumber
  orderDate?: string // Formatted version of createdAt
}

export const generateSalesOrderPDF = async (salesOrderData: SalesOrderData) => {
  const templatePath = path.join(
    __dirname,
    '../',
    'templates',
    'salesOrderTemplate.hbs'
  )
  const templateHtml = fs.readFileSync(templatePath, 'utf8')
  const template = handlebars.compile(templateHtml)

  // const html = template({
  //   formattedOrderNumber: salesOrderData.orderNumber
  //     .toString()
  //     .padStart(5, '0'),
  //   orderDate: new Date(salesOrderData.createdAt).toLocaleDateString('en-IN'),
  //   customerName: 'Mr. Rakesh Kumar Singh', // you may fetch from customer relation
  //   placeOfSupply: salesOrderData.placeOfSupply,
  //   items: salesOrderData.items,
  //   subTotal: salesOrderData.subTotal.toFixed(2),
  //   taxAmount: salesOrderData.taxAmount.toFixed(2),
  //   total: salesOrderData.total.toFixed(2),
  //   tenantName: salesOrderData.tenantName,
  // })
  const html = template({
    ...salesOrderData,
    formattedOrderNumber: salesOrderData.orderNumber
      .toString()
      .padStart(5, '0'),
  })

  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
  })

  await browser.close()
  return pdfBuffer
}
