import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useVersionHistory } from '@/composables/useVersionHistory'

export const usePayrollStore = defineStore('payroll', () => {
  const payrollRecords = ref([
    {
      id: 1,
      employeeNo: 'GEAMH-001',
      employeeName: 'Dela Cruz, Juan S.',
      position: 'Nurse II',
      department: 'Nursing',
      period: '2026-04',
      periodLabel: 'April 2026',
      basicSalary: 35000,
      pera: 2000,
      rata: 0,
      overtime: 1500,
      nightDiff: 800,
      grossPay: 39300,
      withholdingTax: 3200,
      gsis: 2450,
      philhealth: 700,
      pagibig: 100,
      totalDeductions: 6450,
      netPay: 32850,
      status: 'Released',
      remarks: '',
    },
    {
      id: 2,
      employeeNo: 'GEAMH-002',
      employeeName: 'Reyes, Maria G.',
      position: 'Medical Officer III',
      department: 'Medicine',
      period: '2026-04',
      periodLabel: 'April 2026',
      basicSalary: 65000,
      pera: 2000,
      rata: 5000,
      overtime: 0,
      nightDiff: 0,
      grossPay: 72000,
      withholdingTax: 12000,
      gsis: 4550,
      philhealth: 1300,
      pagibig: 100,
      totalDeductions: 17950,
      netPay: 54050,
      status: 'Released',
      remarks: '',
    },
    {
      id: 3,
      employeeNo: 'GEAMH-003',
      employeeName: 'Santos, Pedro L.',
      position: 'Administrative Aide VI',
      department: 'Administrative',
      period: '2026-04',
      periodLabel: 'April 2026',
      basicSalary: 18000,
      pera: 2000,
      rata: 0,
      overtime: 0,
      nightDiff: 0,
      grossPay: 20000,
      withholdingTax: 0,
      gsis: 1260,
      philhealth: 360,
      pagibig: 100,
      totalDeductions: 1720,
      netPay: 18280,
      status: 'Pending',
      remarks: 'Awaiting DTR confirmation',
    },
  ])

  const nextId = ref(4)

  const payPeriods = ['2026-04', '2026-03', '2026-02', '2026-01',
    '2025-12', '2025-11', '2025-10',
  ]

  const { trackCreate, trackUpdate, trackDelete } = useVersionHistory()

  function addRecord(record) {
    const newRec = { ...record, id: nextId.value++ }
    payrollRecords.value.push(newRec)
    trackCreate('Payroll', newRec, newRec.employeeName)
  }

  function updateRecord(id, data) {
    const idx = payrollRecords.value.findIndex(r => r.id === id)
    if (idx !== -1) {
      const old = { ...payrollRecords.value[idx] }
      payrollRecords.value[idx] = { ...old, ...data }
      trackUpdate('Payroll', old, payrollRecords.value[idx], data.employeeName ?? old.employeeName)
    }
  }

  function deleteRecord(id) {
    const rec = payrollRecords.value.find(r => r.id === id)
    if (rec) trackDelete('Payroll', rec, rec.employeeName)
    payrollRecords.value = payrollRecords.value.filter(r => r.id !== id)
  }

  function getById(id) {
    return payrollRecords.value.find(r => r.id === Number(id))
  }

  function computeDeductions(basic) {
    const gsis = Math.round(basic * 0.09)
    const philhealth = Math.round(basic * 0.02)
    const pagibig = 100
    return { gsis, philhealth, pagibig, total: gsis + philhealth + pagibig }
  }

  return {
    payrollRecords,
    payPeriods,
    addRecord,
    updateRecord,
    deleteRecord,
    getById,
    computeDeductions,
  }
})
