<script setup>
import { ref, computed } from 'vue'

const svgIcons = {
  search: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
  add: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
  delete: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
  save: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
}

const records = ref([
  {
    id: 1, employeeNo: 'GEAMH-002', employeeName: 'Reyes, Maria G.',
    department: 'Medicine', destination: 'DOH Central Office, Manila',
    purpose: 'Seminar on Hospital Management', dateFrom: '2026-04-22',
    dateTo: '2026-04-23', days: 2, transport: 'Government Vehicle',
    approvedBy: 'Chief of Hospital', status: 'Approved', remarks: '',
  },
  {
    id: 2, employeeNo: 'GEAMH-001', employeeName: 'Dela Cruz, Juan S.',
    department: 'Nursing', destination: 'PGH, Manila',
    purpose: 'Nursing Training Program', dateFrom: '2026-04-28',
    dateTo: '2026-04-29', days: 2, transport: 'Public Transport',
    approvedBy: '', status: 'Pending', remarks: 'Awaiting approval',
  },
])
const nextId = ref(3)
const search = ref('')
const filterStatus = ref('')
const showForm = ref(false)
const editId = ref(null)

const blankForm = () => ({
  employeeNo: '', employeeName: '', department: '', destination: '',
  purpose: '', dateFrom: '', dateTo: '', days: 1,
  transport: 'Public Transport', approvedBy: '', status: 'Pending', remarks: '',
})
const form = ref(blankForm())

const formErrors = ref({ employeeNo: '', employeeName: '' })

function onEmployeeNoInput(e) {
  // Strip any non-numeric and non-hyphen characters (allow hyphens for formats like GEAMH-001)
  e.target.value = e.target.value.replace(/[^0-9\-]/g, '')
  form.value.employeeNo = e.target.value
}

function onEmployeeNameInput(e) {
  // Strip digits
  e.target.value = e.target.value.replace(/[0-9]/g, '')
  form.value.employeeName = e.target.value
}

function openAdd() { editId.value = null; form.value = blankForm(); formErrors.value = { employeeNo: '', employeeName: '' }; showForm.value = true }
function openEdit(r) { editId.value = r.id; form.value = { ...r }; formErrors.value = { employeeNo: '', employeeName: '' }; showForm.value = true }
function save() {
  formErrors.value = { employeeNo: '', employeeName: '' }
  let valid = true
  if (!form.value.employeeNo.trim()) {
    formErrors.value.employeeNo = 'Employee No. is required and must contain numbers only.'; valid = false
  }
  if (!form.value.employeeName.trim()) {
    formErrors.value.employeeName = 'Employee Name is required and must not contain numbers.'; valid = false
  }
  if (!valid) return
  if (editId.value) {
    const idx = records.value.findIndex(r => r.id === editId.value)
    if (idx !== -1) records.value[idx] = { ...records.value[idx], ...form.value }
  } else {
    records.value.push({ ...form.value, id: nextId.value++ })
  }
  showForm.value = false
}
function deleteRec(id) { if (confirm('Delete?')) records.value = records.value.filter(r => r.id !== id) }

const filtered = computed(() => records.value.filter(r => {
  const q = search.value.toLowerCase()
  const matchSearch = !q || r.employeeName.toLowerCase().includes(q)
  const matchStatus = !filterStatus.value || r.status === filterStatus.value
  return matchSearch && matchStatus
}))

function statusClass(s) {
  return s === 'Approved' ? 'badge-green' : s === 'Pending' ? 'badge-orange' : 'badge-red'
}
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-wrap">
          <span class="icon-svg search-icon" v-html="svgIcons.search"></span>
          <input v-model="search" class="search-input" placeholder="Search employee..." />
        </div>
        <AppSelect
          v-model="filterStatus"
          :options="[{ label: 'All Status', value: '' }, { label: 'Pending', value: 'Pending' }, { label: 'Approved', value: 'Approved' }, { label: 'Disapproved', value: 'Disapproved' }]"
          placeholder="All Status"
        />
      </div>
      <div class="toolbar-right">
        <span class="record-count">{{ filtered.length }} record(s)</span>
        <button class="btn btn-primary" @click="openAdd">
          <span class="icon-svg" v-html="svgIcons.add"></span> Add T.O.
        </button>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Employee</th><th>Department</th><th>Destination</th>
            <th>Purpose</th><th>Date From</th><th>Date To</th>
            <th>Days</th><th>Transport</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filtered.length === 0"><td colspan="10" class="empty-row">No T.O. records found.</td></tr>
          <tr v-for="r in filtered" :key="r.id">
            <td><strong>{{ r.employeeName }}</strong><div class="sub-text">{{ r.employeeNo }}</div></td>
            <td>{{ r.department }}</td>
            <td>{{ r.destination }}</td>
            <td class="purpose-cell">{{ r.purpose }}</td>
            <td>{{ r.dateFrom }}</td>
            <td>{{ r.dateTo }}</td>
            <td class="days-cell">{{ r.days }}</td>
            <td>{{ r.transport }}</td>
            <td><span class="badge" :class="statusClass(r.status)">{{ r.status }}</span></td>
            <td>
              <div class="action-btns">
                <button class="btn-icon" @click="openEdit(r)">
                  <span class="icon-svg" v-html="svgIcons.edit"></span>
                </button>
                <button class="btn-icon danger" @click="deleteRec(r.id)">
                  <span class="icon-svg" v-html="svgIcons.delete"></span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editId ? 'Edit T.O.' : 'Add Travel Order' }}</h3>
          <button class="close-btn" @click="showForm = false">
            <span class="icon-svg" v-html="svgIcons.close"></span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Employee No.</label>
              <input v-model="form.employeeNo" @input="onEmployeeNoInput" placeholder="Numbers only (e.g. 001 or GEAMH-001)" />
              <span v-if="formErrors.employeeNo" class="field-error">{{ formErrors.employeeNo }}</span>
            </div>
            <div class="form-group">
              <label>Employee Name</label>
              <input v-model="form.employeeName" @input="onEmployeeNameInput" placeholder="Letters only (e.g. Dela Cruz, Juan)" />
              <span v-if="formErrors.employeeName" class="field-error">{{ formErrors.employeeName }}</span>
            </div>
            <div class="form-group"><label>Department</label><input v-model="form.department" /></div>
            <div class="form-group full"><label>Destination</label><input v-model="form.destination" /></div>
            <div class="form-group full"><label>Purpose</label><textarea v-model="form.purpose" rows="2"></textarea></div>
            <div class="form-group"><label>Date From</label><input v-model="form.dateFrom" type="date" /></div>
            <div class="form-group"><label>Date To</label><input v-model="form.dateTo" type="date" /></div>
            <div class="form-group"><label>No. of Days</label><input v-model.number="form.days" type="number" min="1" /></div>
            <div class="form-group"><label>Transport</label>
              <AppSelect v-model="form.transport" :options="['Public Transport', 'Government Vehicle', 'Private Vehicle']" />
            </div>
            <div class="form-group"><label>Approved By</label><input v-model="form.approvedBy" /></div>
            <div class="form-group"><label>Status</label>
              <AppSelect v-model="form.status" :options="['Pending', 'Approved', 'Disapproved']" />
            </div>
            <div class="form-group full"><label>Remarks</label><textarea v-model="form.remarks" rows="2"></textarea></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showForm = false">Cancel</button>
          <button class="btn btn-primary" @click="save">
            <span class="icon-svg" v-html="svgIcons.save"></span> Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-svg { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; }
.icon-svg :deep(svg) { width:100%; height:100%; fill:currentColor; }
.page { padding: 24px; }
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.toolbar-left, .toolbar-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.search-wrap { position: relative; display: inline-flex; align-items: center; }
.search-icon { position: absolute; left: 10px; color: #aaa; pointer-events: none; }
.search-input { padding: 8px 14px 8px 34px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; width: 240px; outline: none; }
.filter-select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; outline: none; background: #fff; }
.record-count { font-size: 13px; color: #888; }
.btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
.btn-primary { background: #1a3a5c; color: #fff; }
.btn-secondary { background: #f0f4f8; color: #1a3a5c; border: 1px solid #ddd; }
.table-wrapper { overflow-x: auto; overflow-y: auto; max-height: 60vh; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
.data-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 12px; }
.data-table thead tr { background: #1a3a5c; color: #fff; }
.data-table thead tr th { position: sticky; top: 0; z-index: 2; background: #1a3a5c; }
.data-table th { padding: 11px 12px; text-align: left; font-weight: 600; white-space: nowrap; }
.data-table td { padding: 9px 12px; border-bottom: 1px solid #f0f4f8; vertical-align: middle; }
.data-table tbody tr:hover { background: #f9fafb; }
.sub-text { font-size: 11px; color: #888; }
.purpose-cell { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.days-cell { font-weight: 700; text-align: center; }
.badge { padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.badge-orange { background: #fef3e2; color: #e67e22; }
.badge-green { background: #eafaf1; color: #27ae60; }
.badge-red { background: #fdecea; color: #c0392b; }
.action-btns { display: flex; gap: 4px; }
.btn-icon { background: none; border: none; cursor: pointer; padding: 3px; border-radius: 4px; display: inline-flex; align-items: center; }
.btn-icon:hover { background: #f0f4f8; }
.btn-icon.danger:hover { background: #fdecea; }
.empty-row { text-align: center; color: #aaa; padding: 40px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #fff; border-radius: 12px; width: 700px; max-width: 95vw; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f0f4f8; }
.modal-header h3 { margin: 0; color: #1a3a5c; }
.close-btn { background: none; border: none; cursor: pointer; color: #888; display: inline-flex; align-items: center; padding: 4px; border-radius: 4px; }
.close-btn:hover { background: #f0f4f8; }
.modal-body { padding: 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #f0f4f8; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group.full { grid-column: 1 / -1; }
.form-group label { font-size: 12px; font-weight: 600; color: #555; }
.form-group input, .form-group select, .form-group textarea { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; outline: none; }
.field-error { font-size: 11px; color: #c0392b; margin-top: 2px; }
</style>
