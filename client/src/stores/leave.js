import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useVersionHistory } from '@/composables/useVersionHistory'

export const useLeaveStore = defineStore('leave', () => {
  const leaveRecords = ref([
    {
      id: 1,
      employeeNo: 'GEAMH-001',
      employeeName: 'Dela Cruz, Juan S.',
      department: 'Nursing',
      leaveType: 'Vacation Leave',
      dateFrom: '2026-04-20',
      dateTo: '2026-04-22',
      days: 3,
      reason: 'Family vacation',
      status: 'Approved',
      approvedBy: 'Dr. Reyes',
      dateApproved: '2026-04-15',
      remarks: '',
    },
    {
      id: 2,
      employeeNo: 'GEAMH-003',
      employeeName: 'Santos, Pedro L.',
      department: 'Administrative',
      leaveType: 'Sick Leave',
      dateFrom: '2026-04-10',
      dateTo: '2026-04-11',
      days: 2,
      reason: 'Fever and flu',
      status: 'Approved',
      approvedBy: 'Admin Head',
      dateApproved: '2026-04-10',
      remarks: 'With medical certificate',
    },
    {
      id: 3,
      employeeNo: 'GEAMH-004',
      employeeName: 'Bautista, Ana C.',
      department: 'Nursing',
      leaveType: 'Vacation Leave',
      dateFrom: '2026-04-25',
      dateTo: '2026-04-25',
      days: 1,
      reason: 'Personal errand',
      status: 'Pending',
      approvedBy: '',
      dateApproved: '',
      remarks: '',
    },
  ])

  const nextId = ref(4)

  const leaveTypes = ['Vacation Leave', 'Sick Leave', 'Maternity Leave', 'Paternity Leave',
    'Special Privilege Leave', 'Forced Leave', 'Emergency Leave',
    'Study Leave', 'VAWC Leave',
  ]

  const statuses = ['Pending', 'Approved', 'Disapproved', 'Cancelled']

  const { trackCreate, trackUpdate, trackDelete } = useVersionHistory()

  function addRecord(record) {
    const newRec = { ...record, id: nextId.value++ }
    leaveRecords.value.push(newRec)
    trackCreate('Leave', newRec, newRec.employeeName)
  }

  function updateRecord(id, data) {
    const idx = leaveRecords.value.findIndex(r => r.id === id)
    if (idx !== -1) {
      const old = { ...leaveRecords.value[idx] }
      leaveRecords.value[idx] = { ...old, ...data }
      trackUpdate('Leave', old, leaveRecords.value[idx], data.employeeName ?? old.employeeName)
    }
  }

  function deleteRecord(id) {
    const rec = leaveRecords.value.find(r => r.id === id)
    if (rec) trackDelete('Leave', rec, rec.employeeName)
    leaveRecords.value = leaveRecords.value.filter(r => r.id !== id)
  }

  return { leaveRecords, leaveTypes, statuses, addRecord, updateRecord, deleteRecord }
})
