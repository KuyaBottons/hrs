<script setup>
import { ref, computed } from 'vue'
import { useLeaveStore } from '@/stores/leave'
import AppModal from '@/components/AppModal.vue'

const store = useLeaveStore()

const svgIcons = {
  search: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
  add:    `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
  edit:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
  delete: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
  save:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>`,
  close:  `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
}

const search = ref('')
const filterType = ref('')
const filterStatus = ref('')
const showForm = ref(false)
const editId = ref(null)

// ── AppModal state ────────────────────────────────────────────────────────────
const showDeleteModal = ref(false)
const showSaveModal   = ref(false)
const deleteTarget    = ref(null)

function promptDelete(id) {
  deleteTarget.value = store.leaveRecords.find(r => r.id === id)
  showDeleteModal.value = true
}
function confirmDelete() {
  if (deleteTarget.value) store.deleteRecord(deleteTarget.value.id)
  showDeleteModal.value = false
  deleteTarget.value = null
}

const blankForm = () => ({
  employeeNo: '', employeeName: '', department: '',
  leaveType: 'Vacation Leave', dateFrom: '', dateTo: '', days: 1,
  reason: '', status: 'Pending', approvedBy: '', dateApproved: '', remarks: '',
})
const form = ref(blankForm())
const formErrors = ref({ employeeNo: '', employeeName: '' })

function onEmployeeNoInput(e) {
  e.target.value = e.target.value.replace(/[^0-9\-]/g, '')
  form.value.employeeNo = e.target.value
}
function onEmployeeNameInput(e) {
  e.target.value = e.target.value.replace(/[0-9]/g, '')
  form.value.employeeName = e.target.value
}

function openAdd() {
  editId.value = null
  form.value = blankForm()
  formErrors.value = { employeeNo: '', employeeName: '' }
  showForm.value = true
}
function openEdit(rec) {
  editId.value = rec.id
  form.value = { ...rec }
  formErrors.value = { employeeNo: '', employeeName: '' }
  showForm.value = true
}

function save() {
  formErrors.value = { employeeNo: '', employeeName: '' }
  let valid = true
  if (!form.value.employeeNo.trim()) { formErrors.value.employeeNo = 'Employee No. is required.'; valid = false }
  if (!form.value.employeeName.trim()) { formErrors.value.employeeName = 'Employee Name is required.'; valid = false }
  if (!valid) return
  showSaveModal.value = true
}
function confirmSave() {
  if (editId.value) store.updateRecord(editId.value, { ...form.value })
  else store.addRecord({ ...form.value })
  showSaveModal.value = false
  showForm.value = false
}

const filtered = computed(() => store.leaveRecords.filter(r => {
  const q = search.value.toLowerCase()
  const matchSearch = !q || r.employeeName.toLowerCase().includes(q)
  const matchType   = !filterType.value   || r.leaveType === filterType.value
  const matchStatus = !filterStatus.value || r.status    === filterStatus.value
  return matchSearch && matchType && matchStatus
}))

function statusClass(s) {
  return { Pending: 'badge-orange', Approved: 'badge-green', Disapproved: 'badge-red', Cancelled: 'badge-gray' }[s] || 'badge-gray'
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
        <AppSelect v-model="filterType"   :options="[{ label: 'All Leave Types', value: '' }, ...store.leaveTypes.map(t => ({ label: t, value: t }))]" placeholder="All Leave Types" />
        <AppSelect v-model="filterStatus" :options="[{ label: 'All Status', value: '' }, ...store.statuses.map(s => ({ label: s, value: s }))]" placeholder="All Status" />
      </div>
      <div class="toolbar-right">
        <span class="record-count">{{ filtered.length }} record(s)</span>
        <button class="btn btn-primary" @click="openAdd">
          <span class="icon-svg" v-html="svgIcons.add"></span> Add Leave
        </button>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Employee</th><th>Department</th><th>Leave Type</th>
            <th>Date From</th><th>Date To</th><th>Days</th>
            <th>Reason</th><th>Status</th><th>Approved By</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filtered.length === 0"><td colspan="10" class="empty-row">No leave records found.</td></tr>
          <tr v-for="r in filtered" :key="r.id">
            <td><strong>{{ r.employeeName }}</strong><div class="sub-text">{{ r.employeeNo }}</div></td>
            <td>{{ r.department }}</td>
            <td><span class="leave-type">{{ r.leaveType }}</span></td>
            <td>{{ r.dateFrom }}</td><td>{{ r.dateTo }}</td>
            <td class="days-cell">{{ r.days }}</td>
            <td class="reason-cell">{{ r.reason }}</td>
            <td><span class="badge" :class="statusClass(r.status)">{{ r.status }}</span></td>
            <td>{{ r.approvedBy || '—' }}</td>
            <td>
              <div class="action-btns">
                <button class="btn-icon" @click="openEdit(r)"><span class="icon-svg" v-html="svgIcons.edit"></span></button>
                <button class="btn-icon danger" @click="promptDelete(r.id)"><span class="icon-svg" v-html="svgIcons.delete"></span></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editId ? 'Edit Leave Record' : 'Add Leave Request' }}</h3>
          <button class="close-btn" @click="showForm = false"><span class="icon-svg" v-html="svgIcons.close"></span></button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Employee No.</label>
              <input v-model="form.employeeNo" @input="onEmployeeNoInput" placeholder="e.g. GEAMH-001" />
              <span v-if="formErrors.employeeNo" class="field-error">{{ formErrors.employeeNo }}</span>
            </div>
            <div class="form-group">
              <label>Employee Name</label>
              <input v-model="form.employeeName" @input="onEmployeeNameInput" placeholder="e.g. Dela Cruz, Juan" />
              <span v-if="formErrors.employeeName" class="field-error">{{ formErrors.employeeName }}</span>
            </div>
            <div class="form-group"><label>Department</label><input v-model="form.department" /></div>
            <div class="form-group"><label>Leave Type</label><AppSelect v-model="form.leaveType" :options="store.leaveTypes" /></div>
            <div class="form-group"><label>Date From</label><input v-model="form.dateFrom" type="date" /></div>
            <div class="form-group"><label>Date To</label><input v-model="form.dateTo" type="date" /></div>
            <div class="form-group"><label>No. of Days</label><input v-model.number="form.days" type="number" min="1" /></div>
            <div class="form-group"><label>Status</label><AppSelect v-model="form.status" :options="store.statuses" /></div>
            <div class="form-group"><label>Approved By</label><input v-model="form.approvedBy" /></div>
            <div class="form-group"><label>Date Approved</label><input v-model="form.dateApproved" type="date" /></div>
            <div class="form-group full"><label>Reason</label><textarea v-model="form.reason" rows="2"></textarea></div>
            <div class="form-group full"><label>Remarks</label><textarea v-model="form.remarks" rows="2"></textarea></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showForm = false">Cancel</button>
          <button class="btn btn-primary" @click="save"><span class="icon-svg" v-html="svgIcons.save"></span> Save</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <AppModal
      v-if="showDeleteModal"
      type="delete"
      title="Delete Leave Record"
      message="Are you sure you want to delete this leave record?"
      :detail="deleteTarget?.employeeName + ' — ' + deleteTarget?.leaveType"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />

    <!-- Save Confirmation -->
    <AppModal
      v-if="showSaveModal"
      type="confirm"
      :title="editId ? 'Update Leave Record' : 'Add Leave Record'"
      :message="editId ? 'Save changes to this leave record?' : 'Add this new leave record?'"
      :detail="form.employeeName + ' — ' + form.leaveType"
      :confirmLabel="editId ? 'Yes, Update' : 'Yes, Add'"
      @confirm="confirmSave"
      @cancel="showSaveModal = false"
    />
  </div>
</template>

<style scoped>
.icon-svg { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; }
.icon-svg :deep(svg) { width:100%; height:100%; fill:currentColor; }
.page { padding: 24px; }
.toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
.toolbar-left, .toolbar-right { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.search-wrap { position:relative; display:inline-flex; align-items:center; }
.search-icon { position:absolute; left:10px; color:#aaa; pointer-events:none; }
.search-input { padding:8px 14px 8px 34px; border:1px solid #ddd; border-radius:8px; font-size:13px; width:240px; outline:none; }
.record-count { font-size:13px; color:#888; }
.btn { padding:8px 16px; border-radius:8px; border:none; cursor:pointer; font-size:13px; font-weight:600; display:inline-flex; align-items:center; gap:6px; }
.btn-primary { background:#1a3a5c; color:#fff; }
.btn-secondary { background:#f0f4f8; color:#1a3a5c; border:1px solid #ddd; }
.table-wrapper { overflow-x:auto; overflow-y:auto; max-height:60vh; background:#fff; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.07); }
.data-table { width:100%; border-collapse:separate; border-spacing:0; font-size:12px; }
.data-table thead tr { background:#1a3a5c; color:#fff; }
.data-table thead tr th { position:sticky; top:0; z-index:2; background:#1a3a5c; }
.data-table th { padding:11px 12px; text-align:left; font-weight:600; white-space:nowrap; }
.data-table td { padding:9px 12px; border-bottom:1px solid #f0f4f8; vertical-align:middle; }
.data-table tbody tr:hover { background:#f9fafb; }
.sub-text { font-size:11px; color:#888; }
.leave-type { font-size:12px; color:#2980b9; font-weight:600; }
.days-cell { font-weight:700; color:#1a3a5c; text-align:center; }
.reason-cell { max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.badge { padding:3px 10px; border-radius:12px; font-size:11px; font-weight:600; }
.badge-orange { background:#fef3e2; color:#e67e22; }
.badge-green  { background:#eafaf1; color:#27ae60; }
.badge-red    { background:#fdecea; color:#c0392b; }
.badge-gray   { background:#f4f4f4; color:#666; }
.action-btns { display:flex; gap:4px; }
.btn-icon { background:none; border:none; cursor:pointer; padding:3px; border-radius:4px; display:inline-flex; align-items:center; }
.btn-icon:hover { background:#f0f4f8; }
.btn-icon.danger:hover { background:#fdecea; }
.empty-row { text-align:center; color:#aaa; padding:40px; }
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000; }
.modal { background:#fff; border-radius:12px; width:700px; max-width:95vw; max-height:90vh; overflow-y:auto; }
.modal-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #f0f4f8; }
.modal-header h3 { margin:0; color:#1a3a5c; }
.close-btn { background:none; border:none; cursor:pointer; color:#888; display:inline-flex; align-items:center; padding:4px; border-radius:4px; }
.close-btn:hover { background:#f0f4f8; }
.modal-body { padding:20px; }
.modal-footer { display:flex; justify-content:flex-end; gap:10px; padding:16px 20px; border-top:1px solid #f0f4f8; }
.form-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:14px; }
.form-group { display:flex; flex-direction:column; gap:4px; }
.form-group.full { grid-column:1 / -1; }
.form-group label { font-size:12px; font-weight:600; color:#555; }
.form-group input, .form-group select, .form-group textarea { padding:8px 12px; border:1px solid #ddd; border-radius:6px; font-size:13px; outline:none; }
.field-error { font-size:11px; color:#c0392b; margin-top:2px; }
</style>
