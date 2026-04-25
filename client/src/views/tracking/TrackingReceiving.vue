<script setup>
import { ref, computed } from 'vue'

const svgIcons = {
  search: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
  add: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
  receive: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z"/></svg>`,
  save: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
}

const records = ref([
  {
    id: 1, docType: 'DTR Transmittal', docNo: 'DTR-2026-04-001',
    from: 'Nursing Department', to: 'HR Office',
    dateForwarded: '2026-04-16', dateReceived: '2026-04-16',
    receivedBy: 'HR Clerk', status: 'Received', remarks: '',
  },
  {
    id: 2, docType: 'Leave Form', docNo: 'LF-2026-04-003',
    from: 'Administrative Dept', to: 'HR Office',
    dateForwarded: '2026-04-15', dateReceived: '',
    receivedBy: '', status: 'In Transit', remarks: 'Sent via messenger',
  },
  {
    id: 3, docType: 'DTR Transmittal', docNo: 'DTR-2026-04-002',
    from: 'Medicine Department', to: 'Payroll Section',
    dateForwarded: '2026-04-16', dateReceived: '',
    receivedBy: '', status: 'Pending', remarks: '',
  },
])
const nextId = ref(4)
const search = ref('')
const filterType = ref('')
const filterStatus = ref('')
const showForm = ref(false)
const editId = ref(null)

const docTypes = ['DTR Transmittal', 'Leave Form', 'Travel Order', 'Payroll Document', 'Memorandum', 'Other']
const statuses = ['Pending', 'In Transit', 'Received', 'Returned', 'Lost']

const blankForm = () => ({
  docType: 'DTR Transmittal', docNo: '', from: '', to: '',
  dateForwarded: new Date().toISOString().split('T')[0], dateReceived: '',
  receivedBy: '', status: 'Pending', remarks: '',
})
const form = ref(blankForm())

function openAdd() { editId.value = null; form.value = blankForm(); showForm.value = true }
function openEdit(r) { editId.value = r.id; form.value = { ...r }; showForm.value = true }
function save() {
  if (editId.value) {
    const idx = records.value.findIndex(r => r.id === editId.value)
    if (idx !== -1) records.value[idx] = { ...records.value[idx], ...form.value }
  } else {
    records.value.push({ ...form.value, id: nextId.value++ })
  }
  showForm.value = false
}
function markReceived(r) {
  const receiver = prompt('Received by:')
  if (receiver) {
    const idx = records.value.findIndex(x => x.id === r.id)
    if (idx !== -1) {
      records.value[idx].status = 'Received'
      records.value[idx].receivedBy = receiver
      records.value[idx].dateReceived = new Date().toISOString().split('T')[0]
    }
  }
}

const filtered = computed(() => records.value.filter(r => {
  const q = search.value.toLowerCase()
  const matchSearch = !q || r.docNo.toLowerCase().includes(q) || r.from.toLowerCase().includes(q)
  const matchType = !filterType.value || r.docType === filterType.value
  const matchStatus = !filterStatus.value || r.status === filterStatus.value
  return matchSearch && matchType && matchStatus
}))

function statusClass(s) {
  const map = { Pending: 'badge-orange', 'In Transit': 'badge-blue', Received: 'badge-green', Returned: 'badge-purple', Lost: 'badge-red' }
  return map[s] || 'badge-gray'
}
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-wrap">
          <span class="icon-svg search-icon" v-html="svgIcons.search"></span>
          <input v-model="search" class="search-input" placeholder="Search doc no, from..." />
        </div>
        <AppSelect
          v-model="filterType"
          :options="[{ label: 'All Doc Types', value: '' }, ...docTypes.map(t => ({ label: t, value: t }))]"
          placeholder="All Doc Types"
        />
        <AppSelect
          v-model="filterStatus"
          :options="[{ label: 'All Status', value: '' }, ...statuses.map(s => ({ label: s, value: s }))]"
          placeholder="All Status"
        />
      </div>
      <div class="toolbar-right">
        <span class="record-count">{{ filtered.length }} record(s)</span>
        <button class="btn btn-primary" @click="openAdd">
          <span class="icon-svg" v-html="svgIcons.add"></span> Add Tracking
        </button>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Doc Type</th><th>Doc No.</th><th>From</th><th>To</th>
            <th>Date Forwarded</th><th>Date Received</th>
            <th>Received By</th><th>Status</th><th>Remarks</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filtered.length === 0"><td colspan="10" class="empty-row">No tracking records found.</td></tr>
          <tr v-for="r in filtered" :key="r.id">
            <td><span class="doc-type">{{ r.docType }}</span></td>
            <td><span class="doc-no">{{ r.docNo }}</span></td>
            <td>{{ r.from }}</td>
            <td>{{ r.to }}</td>
            <td>{{ r.dateForwarded }}</td>
            <td>{{ r.dateReceived || '—' }}</td>
            <td>{{ r.receivedBy || '—' }}</td>
            <td><span class="badge" :class="statusClass(r.status)">{{ r.status }}</span></td>
            <td class="remarks-cell">{{ r.remarks || '—' }}</td>
            <td>
              <div class="action-btns">
                <button v-if="r.status !== 'Received'" class="btn btn-receive" @click="markReceived(r)">
                  <span class="icon-svg" v-html="svgIcons.receive"></span> Receive
                </button>
                <button class="btn-icon" @click="openEdit(r)">
                  <span class="icon-svg" v-html="svgIcons.edit"></span>
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
          <h3>{{ editId ? 'Edit Tracking' : 'Add Tracking Record' }}</h3>
          <button class="close-btn" @click="showForm = false">
            <span class="icon-svg" v-html="svgIcons.close"></span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group"><label>Document Type</label>
              <AppSelect v-model="form.docType" :options="docTypes" />
            </div>
            <div class="form-group"><label>Document No.</label><input v-model="form.docNo" /></div>
            <div class="form-group"><label>From</label><input v-model="form.from" /></div>
            <div class="form-group"><label>To</label><input v-model="form.to" /></div>
            <div class="form-group"><label>Date Forwarded</label><input v-model="form.dateForwarded" type="date" /></div>
            <div class="form-group"><label>Date Received</label><input v-model="form.dateReceived" type="date" /></div>
            <div class="form-group"><label>Received By</label><input v-model="form.receivedBy" /></div>
            <div class="form-group"><label>Status</label>
              <AppSelect v-model="form.status" :options="statuses" />
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
.btn { padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
.btn-primary { background: #1a3a5c; color: #fff; padding: 8px 16px; font-size: 13px; }
.btn-secondary { background: #f0f4f8; color: #1a3a5c; border: 1px solid #ddd; padding: 8px 16px; font-size: 13px; }
.btn-receive { background: #27ae60; color: #fff; }
.table-wrapper { overflow-x: auto; overflow-y: auto; max-height: 60vh; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
.data-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 12px; }
.data-table thead tr { background: #1a3a5c; color: #fff; }
.data-table thead tr th { position: sticky; top: 0; z-index: 2; background: #1a3a5c; }
.data-table th { padding: 11px 12px; text-align: left; font-weight: 600; white-space: nowrap; }
.data-table td { padding: 9px 12px; border-bottom: 1px solid #f0f4f8; vertical-align: middle; }
.data-table tbody tr:hover { background: #f9fafb; }
.doc-type { font-size: 12px; color: #2980b9; font-weight: 600; }
.doc-no { font-family: monospace; font-size: 11px; color: #555; }
.remarks-cell { max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.badge { padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.badge-orange { background: #fef3e2; color: #e67e22; }
.badge-blue { background: #ebf5fb; color: #2980b9; }
.badge-green { background: #eafaf1; color: #27ae60; }
.badge-purple { background: #f5eef8; color: #8e44ad; }
.badge-red { background: #fdecea; color: #c0392b; }
.badge-gray { background: #f4f4f4; color: #666; }
.action-btns { display: flex; gap: 6px; align-items: center; }
.btn-icon { background: none; border: none; cursor: pointer; padding: 3px; border-radius: 4px; display: inline-flex; align-items: center; }
.btn-icon:hover { background: #f0f4f8; }
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
</style>
