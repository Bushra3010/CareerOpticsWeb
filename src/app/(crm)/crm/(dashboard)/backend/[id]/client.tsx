'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/crm/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/crm/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/crm/components/ui/card'
import { StudentRecord } from '@/crm/components/backend/StudentRecord'
import { FeeTracker } from '@/crm/components/backend/FeeTracker'
import { StudentCredentials } from '@/crm/components/backend/StudentCredentials'
import { categoryMeta } from '@/crm/lib/categories'
import { createClient } from '@/crm/lib/supabase/client'
import type { Student, Payment } from '@/crm/types/app.types'

interface Props {
  student: Student
  payments: Payment[]
}

export function StudentDetailClient({ student: initialStudent, payments: initialPayments }: Props) {
  const router = useRouter()
  const [student] = useState(initialStudent)
  const [payments, setPayments] = useState(initialPayments)
  const supabase = createClient()

  async function refreshPayments() {
    const { data } = await supabase
      .from('payments')
      .select('*, recorder:profiles(id, email, full_name, role, is_active, created_at)')
      .eq('student_id', student.id)
      .order('payment_date', { ascending: false })
    setPayments((data ?? []) as never)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h1 className="text-xl font-bold flex-1">
          {student.full_name}
          {categoryMeta(student.category) && (
            <span className={`ml-2 align-middle rounded border px-2 py-0.5 text-xs font-semibold ${categoryMeta(student.category)!.color}`}>
              {categoryMeta(student.category)!.label}
            </span>
          )}
        </h1>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="fees">Fee Tracker</TabsTrigger>
          <TabsTrigger value="credentials">ID Cards & Marksheets</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>Student Profile</CardTitle></CardHeader>
            <CardContent>
              <StudentRecord student={student} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials">
          <Card>
            <CardHeader><CardTitle>ID Cards & Marksheets</CardTitle></CardHeader>
            <CardContent>
              <StudentCredentials studentId={student.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <FeeTracker
            student={student}
            payments={payments as never}
            onPaymentAdded={refreshPayments}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
