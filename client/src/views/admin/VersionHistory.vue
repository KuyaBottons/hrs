<script setup>
import { ref, computed } from 'vue'

const HISTORY_KEY = 'emp_version_history'
const history = ref(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'))

const search      = ref('')
const filterType  = ref('')
const showSnapshot = ref(false)
const snapshotData = ref(null)

const WORK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return history.value.filter(h => {
    const ms = !q || h.employeeName.toLowerCase().includes(q) || (h.editedBy||'').toLowerCase().includes(q)
    const mt = !filterType.value || h.type === filterType.value
    return ms && mt
  })
})

function viewSnapshot(entry) {
  snapshotData.value = entry
  showSnapshot.value = true
}

function clearHistory() {
  if (!confirm('Clear all version history? This cannot be undone.')) return
  history.value = []
  localStorage.removeItem(HISTORY_KEY)
}

const svgClose = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2>Version History</h2>
        <p>Track all changes made to the Employee Masterlist.</p>
      </div>
      <button class="btn btn-danger" @click="clearHistory">🗑 Clear History</button>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-wrap">
          <input v-model="search" class="search-input" placeholder="Search employee or editor..." />
        </div>
        <select v-model="filterType" class="filter-select">
          <option value="">All Types</option>
          <option value="Edited">✏️ Edited (Updated)</option>
          <option value="Previous">📋 Previous (Before Edit)</option>
        </select>
      </div>
      <span class="record-count">{{ filtered.length }} record(s)</span>
    </div>

    <!-- Work schedule note -->
    <div class="work-days-note">
      <strong>Standard Work Schedule:</strong>
      <span v-for="d in WORK_DAYS" :key="d" class="work-day-chip">{{ d }}</span>
      <span class="work-day-rest">Sat–Sun: Rest Day</span>
    </div>

    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Employee</th>
            <th>Edited By</th>
            <th>Date & Time</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filtered.length === 0">
            <td colspan="5" class="empty-row">
              No version history yet. History is recorded each time an employee record is edited.
            </td>
          </tr>
          <tr v-for="entry in filtered" :key="entry.id">
            <td>
              <span class="type-badge" :class="entry.type === 'Edited' ? 'type-edited' : 'type-previous'">
                {{ entry.type === 'Edited' ? '✏️ Edited' : '📋 Previous' }}
              </span>
            </td>
            <td><strong>{{ entry.employeeName }}</strong></td>
            <td>{{ entry.editedBy }}</td>
            <td class="ts-col">{{ entry.editedAt }}</td>
            <td>
              <button class="btn-view" @click="viewSnapshot(entry)">👁 View Snapshot</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Snapshot Modal -->
    <Transition name="modal">
      <div v-if="showSnapshot" class="modal-overlay" @click.self="showSnapshot = false">
        <div class="modal">
          <div class="modal-header">
            <div>
              <span class="type-badge" :class="snapshotData?.type === 'Edited' ? 'type-edited' : 'type-previous'">
                {{ snapshotData?.type }}
              </span>
              <h3>{{ snapshotData?.employeeName }}</h3>
              <p class="snap-meta">{{ snapshotData?.editedAt }} · by {{ snapshotData?.editedBy }}</p>
            </div>
            <button class="btn-icon" @click="showSnapshot = false" v-html="svgClose"></button>
          </div>
          <div class="snap-grid" v-if="snapshotData?.snapshot">
            <div class="snap-row"><span class="snap-label">Employee No.</span><span class="snap-val">{{ snapshotData.snapshot.employeeNo }}</span></div>
            <div class="snap-row"><span class="snap-label">Last Name</span><span class="snap-val">{{ snapshotData.snapshot.lastName }}</span></div>
            <div class="snap-row"><span class="snap-label">First Name</span><span class="snap-val">{{ snapshotData.snapshot.firstName }}</span></div>
            <div class="snap-row"><span class="snap-label">Middle Name</span><span class="snap-val">{{ snapshotData.snapshot.middleName || '—' }}</span></div>
            <div class="snap-row"><span class="snap-label">Position</span><span class="snap-val">{{ snapshotData.snapshot.position || '—' }}</span></div>
            <div class="snap-row"><span class="snap-label">Department</span><span class="snap-val">{{ snapshotData.snapshot.department || '—' }}</span></div>
            <div class="snap-row"><span class="snap-label">Status</span><span class="snap-val">{{ snapshotData.snapshot.employmentStatus }}</span></div>
            <div class="snap-row"><span class="snap-label">Date Hired</span><span class="snap-val">{{ snapshotData.snapshot.dateHired || '—' }}</span></div>
            <div class="snap-row"><span class="snap-label">Birth Date</span><span class="snap-val">{{ snapshotData.snapshot.birthDate || '—' }}</span></div>
            <div class="snap-row"><span class="snap-label">Gender</span><span class="snap-val">{{ snapshotData.snapshot.gender || '—' }}</span></div>
            <div class="snap-row"><span class="snap-label">Civil Status</span><span class="snap-val">{{ snapshotData.snapshot.civilStatus || '—' }}</span></div>
            <div class="snap-row"><span class="snap-label">Contact No.</span><span class="snap-val">{{ snapshotData.snapshot.contactNo || '—' }}</span></div>
            <div class="snap-row"><span class="snap-label">Email</span><span class="snap-val">{{ snapshotData.snapshot.email || '—' }}</span></div>
            <div class="snap-row"><span class="snap-label">Salary</span><span class="snap-val">₱{{ Number(snapshotData.snapshot.salary || 0).toLocaleString() }}</span></div>
            <div class="snap-row"><span class="snap-label">SG/Step</span><span class="snap-val">{{ snapshotData.snapshot.sgStep || '—' }}</span></div>
          </div>
          <div class="work-days-note mt">
            <strong>Work Schedule (5 days/week):</strong>
            <span v-for="d in WORK_DAYS" :key="d" class="work-day-chip">{{ d }}</span>
            <span class="work-day-rest">Sat–Sun: Rest</span>
          </div>
          <button class="btn btn-primary close-btn" @click="showSnapshot = false">Close</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.page { padding: 24px; }
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-header h2 { margin:0 0 4px; color:#1a3a5c; font-size:20px; }
.page-header p  { margin:0; color:#888; font-size:13px; }
.toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; flex-wrap:wrap; }
.toolbar-left { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.search-input { padding:8px 14px; border:1px solid #ddd; border-radius:8px; font-size:13px; width:260px; outline:none; }
.filter-select { padding:8px 12px; border:1px solid #ddd; border-radius:8px; font-size:13px; outline:none; background:#fff; }
.record-count { font-size:13px; color:#888; }
.btn { padding:8px 16px; border-radius:8px; border:none; cursor:pointer; font-size:13px; font-weight:600; display:inline-flex; align-items:center; gap:6px; }
.btn-primary { background:#1a3a5c; color:#fff; }
.btn-danger  { background:#fdecea; color:#e74c3c; border:1px solid #f5b7b1; }
.btn-danger:hover { background:#e74c3c; color:#fff; }
.work-days-note { display:flex; align-items:center; gap:6px; padding:8px 14px; background:#f8f9fa; border-radius:8px; font-size:11px; color:#555; margin-bottom:14px; flex-wrap:wrap; }
.work-days-note strong { color:#1a3a5c; margin-right:4px; }
.work-days-note.mt { margin-top:12px; border:1px solid #e9ecef; }
.work-day-chip { background:#1a3a5c; color:#fff; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:600; }
.work-day-rest { font-size:10px; color:#888; }
.table-wrapper { background:#fff; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.07); overflow-x:auto; max-height:calc(100vh - 260px); overflow-y:auto; }
.data-table { width:100%; border-collapse:separate; border-spacing:0; font-size:13px; }
.data-table thead tr { background:#1a3a5c; color:#fff; }
.data-table thead tr th { position:sticky; top:0; z-index:2; background:#1a3a5c; }
.data-table th { padding:11px 14px; text-align:left; font-weight:600; white-space:nowrap; }
.data-table td { padding:10px 14px; border-bottom:1px solid #f0f4f8; vertical-align:middle; }
.data-table tbody tr:hover { background:#f9fafb; }
.ts-col { font-size:11px; color:#888; white-space:nowrap; }
.type-badge { padding:3px 10px; border-radius:8px; font-size:11px; font-weight:600; }
.type-edited   { background:#ebf5fb; color:#2980b9; }
.type-previous { background:#f4f4f4; color:#666; }
.btn-view { background:none; border:1px solid #ddd; border-radius:6px; padding:4px 10px; font-size:11px; cursor:pointer; color:#1a3a5c; }
.btn-view:hover { background:#e8f0fe; }
.empty-row { text-align:center; color:#aaa; padding:40px; font-size:13px; }
/* Modal */
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:1000; backdrop-filter:blur(2px); }
.modal { background:#fff; border-radius:16px; padding:24px; width:100%; max-width:540px; box-shadow:0 20px 60px rgba(0,0,0,0.2); max-height:90vh; overflow-y:auto; }
.modal-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:16px; }
.modal-header h3 { margin:4px 0 2px; font-size:16px; color:#1a1a2e; }
.snap-meta { font-size:11px; color:#888; margin:0; }
.btn-icon { background:none; border:none; cursor:pointer; padding:4px; border-radius:4px; display:inline-flex; align-items:center; }
.btn-icon :deep(svg) { width:18px; height:18px; fill:#555; }
.snap-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; }
.snap-row { display:flex; flex-direction:column; gap:2px; background:#f8f9fa; border-radius:6px; padding:8px 10px; }
.snap-label { font-size:10px; font-weight:600; color:#888; text-transform:uppercase; }
.snap-val { font-size:13px; color:#1a1a2e; }
.close-btn { margin-top:12px; float:right; }
.modal-enter-active, .modal-leave-active { transition:opacity 0.2s ease; }
.modal-enter-active .modal, .modal-leave-active .modal { transition:transform 0.2s ease, opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity:0; }
.modal-enter-from .modal, .modal-leave-to .modal { transform:scale(0.95); opacity:0; }
</style>
