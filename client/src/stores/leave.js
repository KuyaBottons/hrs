import { defineStore } from 'pinia'
import { ref } from 'vue'

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

  const leaveTypes = [
    'Vacation Leave', 'Sick Leave', 'Maternity Leave', 'Paternity Leave',
    'Special Privilege Leave', 'Forced Leave', 'Emergency Leave',
    'Study Leave', 'VAWC Leave',
  ]

  const statuses = ['Pending', 'Approved', 'Disapproved', 'Cancelled']

  function addRecord(record) {
    leaveRecords.value.push({ ...record, id: nextId.value++ })
  }

  function updateRecord(id, data) {
    const idx = leaveRecords.value.findIndex(r => r.id === id)
    if (idx !== -1) leaveRecords.value[idx] = { ...leaveRecords.value[idx], ...data }
  }

  function deleteRecord(id) {
    leaveRecords.value = leaveRecords.value.filter(r => r.id !== id)
  }

  return { leaveRecords, leaveTypes, statuses, addRecord, updateRecord, deleteRecord }
})
