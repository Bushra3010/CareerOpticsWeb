'use client'
import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/crm/components/ui/button'
import { Input } from '@/crm/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/crm/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/crm/components/ui/select'
import { InvoicePDF, amountInWords } from './InvoicePDF'
import { PAYMENT_MODE_LABELS, type PaymentMode, type Student } from '@/crm/types/app.types'
import { toast } from 'sonner'

interface ReceiptDialogProps {
    student: Student | null
    onClose: () => void
}

/** Receipt for any amount received — same design as the invoice, nothing is saved to the fee record. */
export function ReceiptDialog({ student, onClose }: ReceiptDialogProps) {
    const [amount, setAmount] = useState('')
    const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
    const [mode, setMode] = useState<PaymentMode>('cash')
    const [description, setDescription] = useState('Course Fee Payment')
    const [reference, setReference] = useState('')
    const [loading, setLoading] = useState(false)

    const value = Number(amount)
    const valid = amount !== '' && Number.isFinite(value) && value > 0 && !!date

    function close() {
        setAmount('')
        setReference('')
        setDescription('Course Fee Payment')
        setDate(format(new Date(), 'yyyy-MM-dd'))
        setMode('cash')
        onClose()
    }

    async function download() {
        if (!student || !valid) return
        setLoading(true)
        try {
            const logoBase64 = await fetch('/brand-logo.png').then(r => r.blob()).then(blob => new Promise<string>((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result as string)
                reader.readAsDataURL(blob)
            })).catch(() => '')
            const blob = await pdf(
                <InvoicePDF
                    student={student}
                    payments={[]}
                    logoBase64={logoBase64}
                    receipt={{ amount: value, date, mode: PAYMENT_MODE_LABELS[mode], description: description.trim(), reference: reference.trim() }}
                />
            ).toBlob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Receipt_${student.full_name.replace(/\s+/g, '_')}_${date}.pdf`
            a.click()
            URL.revokeObjectURL(url)
            toast.success('Receipt download ho gayi')
            close()
        } catch (err) {
            toast.error('Receipt banane me dikkat aayi')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={!!student} onOpenChange={(open) => !open && close()}>
            <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Generate Receipt</DialogTitle>
                </DialogHeader>
                {student && (
                    <div className="space-y-4 mt-1">
                        <p className="text-sm text-slate-600">For <span className="font-semibold text-slate-900">{student.full_name}</span></p>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Amount received (₹)</label>
                            <Input type="number" inputMode="decimal" min={1} autoFocus placeholder="e.g. 10000" value={amount} onChange={e => setAmount(e.target.value)} />
                            {valid && <p className="text-xs text-slate-500 mt-1">{amountInWords(value)}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Date</label>
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Payment mode</label>
                                <Select value={mode} onValueChange={(v) => setMode(v as PaymentMode)}>
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(PAYMENT_MODE_LABELS).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Description</label>
                            <Input value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Reference / Txn ID (optional)</label>
                            <Input placeholder="UPI ref, cheque no…" value={reference} onChange={e => setReference(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={close}>Cancel</Button>
                            <Button className="flex-1" onClick={download} disabled={!valid || loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Download Receipt
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
