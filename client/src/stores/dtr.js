import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDTRStore = defineStore('dtr', () => {
  const dtrRecords = ref([
    {
      id: 1,
      employeeNo: 'GEAMH-001',
      employeeName: 'Dela Cruz, Juan S.',
      department: 'Nursing',
      period: 'April 1-15, 2026',
      transmittalType: 'Main',
      submittedBy: 'Thea Villanueva',
      dateSubmitted: '2026-04-16',
      dateReceived: '2026-04-16',
      verifiedBy: '',
      verificationDate: '',
      status: 'Received',
      remarks: '',
      signatories: ['Dept Head', 'HR Officer'],
      signedBy: ['Dept Head'],
    },
    {
      id: 2,
      employeeNo: 'GEAMH-002',
      employeeName: 'Reyes, Maria G.',
      department: 'Medicine',
      period: 'April 1-15, 2026',
      transmittalType: 'Thea',
      submittedBy: 'Thea Villanueva',
      dateSubmitted: '2026-04-16',
      dateReceived: '',
      verifiedBy: '',
      verificationDate: '',
      status: 'Pending',
      remarks: 'For verification',
      signatories: ['Dept Head', 'HR Officer', 'Chief of Hospital'],
      signedBy: [],
    },
  ])

  const nextId = ref(3)

  const transmittalTypes = ['Main', 'Thea']
  const statuses = ['Pending', 'Submitted', 'Received', 'Verified', 'Returned']

  function addRecord(record) {
    dtrRecords.value.push({ ...record, id: nextId.value++ })
  }

  function updateRecord(id, data) {
    const idx = dtrRecords.value.findIndex(r => r.id === id)
    if (idx !== -1) dtrRecords.value[idx] = { ...dtrRecords.value[idx], ...data }
  }

  function deleteRecord(id) {
    dtrRecords.value = dtrRecords.value.filter(r => r.id !== id)
  }

  return { dtrRecords, transmittalTypes, statuses, addRecord, updateRecord, deleteRecord }
})
