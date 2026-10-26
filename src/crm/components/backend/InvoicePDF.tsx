'use client'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { Student, Payment } from '@/crm/types/app.types'

const BRAND = '#082c6b'
const ACCENT = '#0e7c8f'
const LIGHT = '#f1f5f9'
const MUTED = '#64748b'

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 10,
    color: '#1e293b',
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  // Top colored bar
  topBar: {
    backgroundColor: BRAND,
    height: 6,
  },
  // Main content area
  content: {
    padding: 36,
  },
  // Header row
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  logoBlock: {
    flexDirection: 'column',
  },
  logo: {
    width: 90,
    height: 50,
    objectFit: 'contain',
    marginBottom: 8,
  },
  companyName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: BRAND,
    marginBottom: 3,
  },
  companyDetail: {
    fontSize: 9,
    color: MUTED,
    marginBottom: 2,
    lineHeight: 1.4,
  },
  invoiceBlock: {
    alignItems: 'flex-end',
  },
  invoiceBadge: {
    backgroundColor: BRAND,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 4,
    marginBottom: 10,
  },
  invoiceTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 3,
  },
  invoiceMeta: {
    fontSize: 9,
    color: MUTED,
    marginBottom: 3,
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: BRAND,
    textAlign: 'right',
  },
  // Two-column info row
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  infoBox: {
    flex: 1,
    backgroundColor: LIGHT,
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
  },
  infoBoxTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  infoField: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    width: 85,
    fontSize: 9,
    color: MUTED,
    fontFamily: 'Helvetica-Bold',
  },
  infoValue: {
    flex: 1,
    fontSize: 9,
    color: '#1e293b',
  },
  // Table
  tableTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: BRAND,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9,
    color: '#334155',
  },
  cSno:    { width: '6%' },
  cDate:   { width: '18%' },
  cDesc:   { width: '36%' },
  cMode:   { width: '18%' },
  cReceipt: { width: '10%' },
  cAmt:    { width: '12%', textAlign: 'right' },
  // Summary
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  summaryBox: {
    width: 220,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  summaryHeader: {
    backgroundColor: BRAND,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  summaryHeaderText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  summaryLabel: {
    fontSize: 9,
    color: MUTED,
  },
  summaryValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: LIGHT,
  },
  summaryTotalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: BRAND,
  },
  summaryTotalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
  },
  summaryPaidValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#16a34a',
  },
  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 30,
    paddingTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLeft: {
    fontSize: 8,
    color: MUTED,
    lineHeight: 1.5,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  signatureLine: {
    width: 120,
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: MUTED,
  },
  bottomBar: {
    backgroundColor: BRAND,
    height: 4,
    marginTop: 20,
  },
})

/** A one-off receipt for whatever amount was received; not tied to the fee plan. */
export interface ReceiptDetails {
  amount: number
  date: string
  mode: string
  description: string
  reference?: string
}

interface InvoiceProps {
  student: Student
  payments: Payment[]
  logoBase64?: string
  /** When set, renders a RECEIPT for this amount instead of the full invoice. */
  receipt?: ReceiptDetails
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigits(n: number): string {
  return n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`
}

/** Indian numbering: 1,25,000 -> "One Lakh Twenty Five Thousand Rupees Only". */
export function amountInWords(amount: number): string {
  let n = Math.floor(amount)
  if (n === 0) return 'Zero Rupees Only'
  const parts: string[] = []
  for (const [size, name] of [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand'], [100, 'Hundred']] as const) {
    if (n >= size) {
      parts.push(`${size === 10000000 ? amountInWords(Math.floor(n / size)).replace(' Rupees Only', '') : twoDigits(Math.floor(n / size))} ${name}`)
      n %= size
    }
  }
  if (n) parts.push(twoDigits(n))
  const paise = Math.round((amount - Math.floor(amount)) * 100)
  return `${parts.join(' ')} Rupees${paise ? ` and ${twoDigits(paise)} Paise` : ''} Only`
}

export const InvoicePDF = ({ student, payments, logoBase64, receipt }: InvoiceProps) => {
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const balance = (student.total_fee || 0) - totalPaid
  const invoiceNo = `HD-${student.enrollment_date ? format(new Date(student.enrollment_date), 'yyyyMM') : format(new Date(), 'yyyyMM')}-${student.id.slice(-4).toUpperCase()}`
  const receiptNo = receipt ? `HDR-${format(new Date(receipt.date), 'yyyyMMdd')}-${student.id.slice(-4).toUpperCase()}` : ''

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBlock}>
              {logoBase64 ? (
                <Image src={logoBase64} style={styles.logo} />
              ) : null}
              <Text style={styles.companyName}>CAREEROPTICS</Text>
              <Text style={styles.companyDetail}>Arrah, Bihar 802301</Text>
              <Text style={styles.companyDetail}>India</Text>
              <Text style={styles.companyDetail}>Ph: +91 73678 78422</Text>
              <Text style={styles.companyDetail}>Email: info@careeroptics.in</Text>
            </View>
            <View style={styles.invoiceBlock}>
              <View style={styles.invoiceBadge}>
                <Text style={styles.invoiceTitle}>{receipt ? 'RECEIPT' : 'INVOICE'}</Text>
              </View>
              <Text style={styles.invoiceNumber}>{receipt ? receiptNo : invoiceNo}</Text>
              <Text style={styles.invoiceMeta}>Date: {format(receipt ? new Date(receipt.date) : new Date(), 'dd MMMM yyyy')}</Text>
              {student.enrollment_date && (
                <Text style={styles.invoiceMeta}>Enrolled: {format(new Date(student.enrollment_date), 'dd MMM yyyy')}</Text>
              )}
            </View>
          </View>

          {/* Student + Course Info */}
          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>Student Information</Text>
              <View style={styles.infoField}>
                <Text style={styles.infoLabel}>Full Name:</Text>
                <Text style={styles.infoValue}>{student.full_name}</Text>
              </View>
              {student.guardian_name ? (
                <View style={styles.infoField}>
                  <Text style={styles.infoLabel}>Father's Name:</Text>
                  <Text style={styles.infoValue}>{student.guardian_name}</Text>
                </View>
              ) : null}
              <View style={styles.infoField}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{student.phone}</Text>
              </View>
              {student.email ? (
                <View style={styles.infoField}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{student.email}</Text>
                </View>
              ) : null}
              {student.city ? (
                <View style={styles.infoField}>
                  <Text style={styles.infoLabel}>City:</Text>
                  <Text style={styles.infoValue}>{student.city}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>Course Information</Text>
              <View style={styles.infoField}>
                <Text style={styles.infoLabel}>Department:</Text>
                <Text style={styles.infoValue}>{student.department?.name || 'N/A'}</Text>
              </View>
              <View style={styles.infoField}>
                <Text style={styles.infoLabel}>Board/Univ:</Text>
                <Text style={styles.infoValue}>{student.sub_section?.name || 'N/A'}</Text>
              </View>
              <View style={styles.infoField}>
                <Text style={styles.infoLabel}>Course:</Text>
                <Text style={styles.infoValue}>{student.course?.name || 'N/A'}</Text>
              </View>
              <View style={styles.infoField}>
                <Text style={styles.infoLabel}>Sub Course:</Text>
                <Text style={styles.infoValue}>{student.sub_course?.name || 'N/A'}</Text>
              </View>
              <View style={styles.infoField}>
                <Text style={styles.infoLabel}>Mode:</Text>
                <Text style={styles.infoValue}>{student.mode ? student.mode.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'N/A'}</Text>
              </View>
              <View style={styles.infoField}>
                <Text style={styles.infoLabel}>Session:</Text>
                <Text style={styles.infoValue}>{student.session?.name || 'N/A'}</Text>
              </View>
            </View>
          </View>

{receipt ? (
          <>
          {/* Payment Received */}
          <Text style={styles.tableTitle}>Payment Received</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.cSno]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.cDate]}>Date</Text>
            <Text style={[styles.tableHeaderText, styles.cDesc]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.cMode]}>Mode</Text>
            <Text style={[styles.tableHeaderText, styles.cReceipt]}>Ref.</Text>
            <Text style={[styles.tableHeaderText, styles.cAmt]}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.cSno]}>1</Text>
            <Text style={[styles.tableCell, styles.cDate]}>{format(new Date(receipt.date), 'dd MMM yyyy')}</Text>
            <Text style={[styles.tableCell, styles.cDesc]}>{receipt.description || 'Course Fee Payment'}</Text>
            <Text style={[styles.tableCell, styles.cMode]}>{receipt.mode.toUpperCase()}</Text>
            <Text style={[styles.tableCell, styles.cReceipt]}>{receipt.reference || '-'}</Text>
            <Text style={[styles.tableCell, styles.cAmt]}>₹{receipt.amount.toLocaleString('en-IN')}</Text>
          </View>

          {/* Summary */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryBox, { width: 260 }]}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryHeaderText}>Receipt Summary</Text>
              </View>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>Payment Mode</Text>
                <Text style={styles.summaryValue}>{receipt.mode}</Text>
              </View>
              <View style={styles.summaryLine}>
                <Text style={[styles.summaryLabel, { flex: 1 }]}>{amountInWords(receipt.amount)}</Text>
              </View>
              <View style={styles.summaryTotal}>
                <Text style={styles.summaryTotalLabel}>Amount Received</Text>
                <Text style={[styles.summaryTotalValue, { color: '#16a34a' }]}>₹{receipt.amount.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>

          </>
          ) : (
          <>
          {/* Payment Table */}
          <Text style={styles.tableTitle}>Payment History</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.cSno]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.cDate]}>Date</Text>
            <Text style={[styles.tableHeaderText, styles.cDesc]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.cMode]}>Mode</Text>
            <Text style={[styles.tableHeaderText, styles.cReceipt]}>Receipt</Text>
            <Text style={[styles.tableHeaderText, styles.cAmt]}>Amount</Text>
          </View>
          {payments.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1, color: MUTED }]}>No payments recorded</Text>
            </View>
          ) : (
            payments.map((p, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, styles.cSno]}>{i + 1}</Text>
                <Text style={[styles.tableCell, styles.cDate]}>{format(new Date(p.payment_date), 'dd MMM yyyy')}</Text>
                <Text style={[styles.tableCell, styles.cDesc]}>{p.notes || 'Course Fee Payment'}</Text>
                <Text style={[styles.tableCell, styles.cMode]}>{p.payment_mode.replace(/_/g, ' ').toUpperCase()}</Text>
                <Text style={[styles.tableCell, styles.cReceipt]}>{p.receipt_number || '-'}</Text>
                <Text style={[styles.tableCell, styles.cAmt]}>₹{p.amount.toLocaleString('en-IN')}</Text>
              </View>
            ))
          )}

          {/* Summary */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryHeaderText}>Fee Summary</Text>
              </View>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>Total Course Fee</Text>
                <Text style={styles.summaryValue}>₹{(student.total_fee || 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>Total Paid</Text>
                <Text style={styles.summaryPaidValue}>₹{totalPaid.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.summaryTotal}>
                <Text style={styles.summaryTotalLabel}>Balance Due</Text>
                <Text style={balance > 0 ? styles.summaryTotalValue : [styles.summaryTotalValue, { color: '#16a34a' }]}>
                  ₹{balance.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>

          </>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.footerLeft}>This is a computer-generated {receipt ? 'receipt' : 'invoice'} and is valid without a physical signature.</Text>
              <Text style={styles.footerLeft}>For queries: +91 73678 78422 | info@careeroptics.in</Text>
              <Text style={[styles.footerLeft, { marginTop: 4, color: ACCENT }]}>Thank you for choosing CareerOptics!</Text>
            </View>
            <View style={styles.footerRight}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Authorised Signatory</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomBar} />
      </Page>
    </Document>
  )
}
