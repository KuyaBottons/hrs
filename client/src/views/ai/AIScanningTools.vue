<script setup>
import { ref, onMounted } from 'vue'

// Load Tesseract.js from CDN for real OCR
let Tesseract = null
onMounted(async () => {
  if (!window.Tesseract) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
  Tesseract = window.Tesseract
})

const svgIcons = {
  robot: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zm-9 7H9v-2h2v2zm4 0h-2v-2h2v2zm1-5H8V7h8v4z"/></svg>`,
  document: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`,
  leave: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>`,
  money: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>`,
  delete: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
  upload: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
}

const dragOver = ref(false)
const scannedFiles = ref([
  {
    id: 1, name: 'DTR_April2026_NursingDept.pdf', type: 'DTR',
    size: '245 KB', uploadDate: '2026-04-16', status: 'Processed',
    extractedData: {
      employeeName: 'Dela Cruz, Juan S.',
      period: 'April 1-15, 2026',
      department: 'Nursing',
      totalHours: 80,
      overtime: 4,
    },
    confidence: 94,
  },
  {
    id: 2, name: 'LeaveForm_Santos_April.jpg', type: 'Leave Form',
    size: '128 KB', uploadDate: '2026-04-15', status: 'Processed',
    extractedData: {
      employeeName: 'Santos, Pedro L.',
      leaveType: 'Sick Leave',
      dateFrom: '2026-04-10',
      dateTo: '2026-04-11',
      days: 2,
    },
    confidence: 88,
  },
  {
    id: 3, name: 'Payslip_March2026.pdf', type: 'Payslip',
    size: '312 KB', uploadDate: '2026-04-14', status: 'Review Needed',
    extractedData: {
      employeeName: 'Reyes, Maria G.',
      period: 'March 2026',
      grossPay: 72000,
      netPay: 54050,
    },
    confidence: 72,
  },
])
const nextId = ref(4)
const selectedFile = ref(null)
const processing = ref(false)

function fileTypeIcon(type) {
  if (type === 'DTR') return svgIcons.document
  if (type === 'Leave Form') return svgIcons.leave
  if (type === 'Payslip') return svgIcons.money
  return svgIcons.document
}

function onDrop(e) {
  dragOver.value = false
  const files = e.dataTransfer?.files || e.target?.files
  if (files && files.length > 0) {
    processFiles(files)
  }
}

function onFileInput(e) {
  processFiles(e.target.files)
}

function processFiles(files) {
  processing.value = true
  Array.from(files).forEach(file => {
    const docType = detectDocType(file.name)
    const entry = {
      id: nextId.value++,
      name: file.name,
      type: docType,
      size: formatSize(file.size),
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'Processing...',
      extractedData: {},
      confidence: 0,
      rawText: '',
    }
    scannedFiles.value.unshift(entry)
    const entryId = entry.id

    const isImage = file.type.startsWith('image/')

    if (isImage && Tesseract) {
      // Real OCR via Tesseract.js
      Tesseract.recognize(file, 'eng', {
        logger: () => {},
      }).then(({ data }) => {
        const idx = scannedFiles.value.findIndex(f => f.id === entryId)
        if (idx !== -1) {
          const confidence = Math.round(data.confidence)
          scannedFiles.value[idx].rawText = data.text
          scannedFiles.value[idx].confidence = confidence
          scannedFiles.value[idx].status = confidence >= 60 ? 'Processed' : 'Review Needed'
          scannedFiles.value[idx].extractedData = parseOCRText(data.text, docType)
        }
        processing.value = false
      }).catch(() => {
        const idx = scannedFiles.value.findIndex(f => f.id === entryId)
        if (idx !== -1) {
          scannedFiles.value[idx].status = 'Review Needed'
          scannedFiles.value[idx].extractedData = { error: 'OCR failed. Please try again.' }
        }
        processing.value = false
      })
    } else {
      // Simulate for PDFs / DOCX (no native browser OCR)
      setTimeout(() => {
        const idx = scannedFiles.value.findIndex(f => f.id === entryId)
        if (idx !== -1) {
          scannedFiles.value[idx].status = 'Processed'
          scannedFiles.value[idx].confidence = Math.floor(Math.random() * 20) + 75
          scannedFiles.value[idx].extractedData = simulateExtraction(docType)
        }
        processing.value = false
      }, 1800)
    }
  })
}

function parseOCRText(text, docType) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const result = {}

  // Try to extract employee name (look for "Name:" or "Employee:")
  const nameLine = lines.find(l => /name[:\s]/i.test(l))
  if (nameLine) result.employeeName = nameLine.replace(/.*name[:\s]*/i, '').trim()

  // Try to extract date patterns
  const dateLine = lines.find(l => /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(l))
  if (dateLine) result.date = dateLine.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)?.[0]

  // Try to extract department
  const deptLine = lines.find(l => /department[:\s]/i.test(l))
  if (deptLine) result.department = deptLine.replace(/.*department[:\s]*/i, '').trim()

  // Type-specific extraction
  if (docType === 'DTR') {
    const hoursLine = lines.find(l => /hours?[:\s]/i.test(l))
    if (hoursLine) result.totalHours = hoursLine.replace(/.*hours?[:\s]*/i, '').trim()
  }
  if (docType === 'Leave Form') {
    const leaveLine = lines.find(l => /leave type[:\s]/i.test(l))
    if (leaveLine) result.leaveType = leaveLine.replace(/.*leave type[:\s]*/i, '').trim()
  }

  // If nothing extracted, show raw text preview
  if (Object.keys(result).length === 0) {
    result.rawTextPreview = text.substring(0, 200) + (text.length > 200 ? '...' : '')
  }

  return result
}

function detectDocType(name) {
  const lower = name.toLowerCase()
  if (lower.includes('dtr')) return 'DTR'
  if (lower.includes('leave')) return 'Leave Form'
  if (lower.includes('payslip') || lower.includes('payroll')) return 'Payslip'
  if (lower.includes('to') || lower.includes('travel')) return 'Travel Order'
  return 'Unknown'
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function simulateExtraction(type) {
  const samples = {
    DTR: { employeeName: 'Extracted Employee', period: 'April 2026', totalHours: 80 },
    'Leave Form': { employeeName: 'Extracted Employee', leaveType: 'Vacation Leave', days: 1 },
    Payslip: { employeeName: 'Extracted Employee', grossPay: 35000, netPay: 28000 },
    'Travel Order': { employeeName: 'Extracted Employee', destination: 'Manila', days: 1 },
  }
  return samples[type] || {}
}

function deleteFile(id) {
  scannedFiles.value = scannedFiles.value.filter(f => f.id !== id)
  if (selectedFile.value?.id === id) selectedFile.value = null
}

function confidenceColor(c) {
  if (c >= 90) return '#27ae60'
  if (c >= 75) return '#e67e22'
  return '#c0392b'
}

function statusClass(s) {
  if (s === 'Processed') return 'badge-green'
  if (s === 'Review Needed') return 'badge-orange'
  if (s === 'Processing...') return 'badge-blue'
  return 'badge-gray'
}
</script>

<template>
  <div class="page">
    <div class="ai-header">
      <div class="ai-title">
        <span class="icon-svg ai-icon" v-html="svgIcons.robot"></span>
        <div>
          <h2>AI Document Scanning Tools</h2>
          <p>Upload DTR, Leave Forms, Payslips, and other HR documents for automatic data extraction.</p>
        </div>
      </div>
    </div>

    <!-- Upload Zone -->
    <div
      class="upload-zone"
      :class="{ 'drag-over': dragOver }"
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop.prevent="onDrop"
    >
      <div class="upload-content">
        <div class="upload-icon"><span class="icon-svg upload-svg" v-html="svgIcons.upload"></span></div>
        <div class="upload-text">
          <strong>Drag & Drop files here</strong>
          <span>or</span>
          <label class="upload-btn">
            Browse Files
            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.docx" @change="onFileInput" hidden />
          </label>
        </div>
        <div class="upload-hint">📷 Images (JPG, PNG) → Real OCR via Tesseract.js &nbsp;|&nbsp; 📄 PDF, DOCX → Simulated extraction</div>
      </div>
      <div v-if="processing" class="processing-overlay">
        <div class="spinner">⚙️</div>
        <span>AI Processing...</span>
      </div>
    </div>

    <div class="content-grid">
      <!-- File List -->
      <div class="file-list-section">
        <h3 class="section-title">
          <span class="icon-svg" v-html="svgIcons.document"></span>
          Scanned Documents ({{ scannedFiles.length }})
        </h3>
        <div class="file-list">
          <div
            v-for="f in scannedFiles"
            :key="f.id"
            class="file-item"
            :class="{ selected: selectedFile?.id === f.id }"
            @click="selectedFile = f"
          >
            <div class="file-icon">
              <span class="icon-svg file-type-icon" v-html="fileTypeIcon(f.type)"></span>
            </div>
            <div class="file-info">
              <strong>{{ f.name }}</strong>
              <div class="file-meta">
                <span class="badge" :class="statusClass(f.status)">{{ f.status }}</span>
                <span class="file-size">{{ f.size }}</span>
                <span class="file-date">{{ f.uploadDate }}</span>
              </div>
              <div v-if="f.confidence > 0" class="confidence-bar">
                <div class="conf-label">AI Confidence: {{ f.confidence }}%</div>
                <div class="conf-track">
                  <div class="conf-fill" :style="{ width: f.confidence + '%', background: confidenceColor(f.confidence) }"></div>
                </div>
              </div>
            </div>
            <button class="btn-icon danger" @click.stop="deleteFile(f.id)">
              <span class="icon-svg" v-html="svgIcons.delete"></span>
            </button>
          </div>
          <div v-if="scannedFiles.length === 0" class="empty-state">
            No documents scanned yet. Upload files above.
          </div>
        </div>
      </div>

      <!-- Extracted Data Preview -->
      <div class="preview-section">
        <h3 class="section-title">
          <span class="icon-svg" v-html="svgIcons.search"></span>
          Extracted Data Preview
        </h3>
        <div v-if="!selectedFile" class="empty-preview">
          <span>👆</span>
          <p>Select a document to view extracted data</p>
        </div>
        <div v-else class="preview-card">
          <div class="preview-header">
            <div class="preview-type">{{ selectedFile.type }}</div>
            <div class="preview-name">{{ selectedFile.name }}</div>
            <div class="preview-conf" :style="{ color: confidenceColor(selectedFile.confidence) }">
              🎯 {{ selectedFile.confidence }}% confidence
            </div>
          </div>
          <div class="extracted-fields">
            <div v-for="(val, key) in selectedFile.extractedData" :key="key" class="field-row">
              <span class="field-key">{{ key.replace(/([A-Z])/g, ' $1').trim() }}</span>
              <span class="field-val">{{ val }}</span>
            </div>
            <div v-if="Object.keys(selectedFile.extractedData).length === 0" class="no-data">
              No data extracted yet.
            </div>
          </div>
          <div class="preview-actions">
            <button class="btn btn-primary">
              <span class="icon-svg" v-html="svgIcons.check"></span> Confirm & Save to System
            </button>
            <button class="btn btn-secondary">
              <span class="icon-svg" v-html="svgIcons.edit"></span> Edit Extracted Data
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-svg { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; }
.icon-svg :deep(svg) { width:100%; height:100%; fill:currentColor; }
.page { padding: 24px; }
.ai-header { display: flex; align-items: center; margin-bottom: 20px; }
.ai-title { display: flex; align-items: center; gap: 16px; }
.ai-icon { width: 40px; height: 40px; color: #1a3a5c; }
.ai-icon :deep(svg) { width: 100%; height: 100%; }
.ai-title h2 { margin: 0 0 4px; color: #1a3a5c; font-size: 20px; }
.ai-title p { margin: 0; color: #666; font-size: 13px; }
.upload-zone {
  border: 2px dashed #a9cce3; border-radius: 12px; padding: 40px;
  text-align: center; background: #f8fbff; margin-bottom: 24px;
  transition: all 0.2s; position: relative; cursor: pointer;
}
.upload-zone.drag-over { border-color: #1a3a5c; background: #ebf5fb; }
.upload-content { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.upload-icon { display: flex; align-items: center; justify-content: center; }
.upload-svg { width: 48px; height: 48px; color: #a9cce3; }
.upload-svg :deep(svg) { width: 100%; height: 100%; }
.upload-text { display: flex; align-items: center; gap: 8px; font-size: 15px; color: #555; }
.upload-text strong { color: #1a3a5c; }
.upload-btn {
  background: #1a3a5c; color: #fff; padding: 6px 16px;
  border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;
}
.upload-hint { font-size: 12px; color: #aaa; }
.processing-overlay {
  position: absolute; inset: 0; background: rgba(255,255,255,0.85);
  display: flex; align-items: center; justify-content: center;
  gap: 10px; font-size: 16px; font-weight: 600; color: #1a3a5c;
  border-radius: 12px;
}
.spinner { animation: spin 1s linear infinite; display: inline-block; font-size: 24px; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } }
.section-title { font-size: 15px; font-weight: 700; color: #1a3a5c; margin: 0 0 14px; display: flex; align-items: center; gap: 6px; }
.file-list-section, .preview-section {
  background: #fff; border-radius: 12px; padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
}
.file-list { display: flex; flex-direction: column; gap: 8px; max-height: 500px; overflow-y: auto; }
.file-item {
  display: flex; align-items: flex-start; gap: 12px; padding: 12px;
  border: 1px solid #f0f4f8; border-radius: 8px; cursor: pointer; transition: all 0.2s;
}
.file-item:hover { background: #f9fafb; }
.file-item.selected { border-color: #1a3a5c; background: #ebf5fb; }
.file-icon { display: flex; align-items: center; flex-shrink: 0; }
.file-type-icon { width: 24px; height: 24px; color: #1a3a5c; }
.file-type-icon :deep(svg) { width: 100%; height: 100%; }
.file-info { flex: 1; }
.file-info strong { font-size: 13px; color: #1a3a5c; display: block; margin-bottom: 4px; }
.file-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
.file-size, .file-date { font-size: 11px; color: #888; }
.confidence-bar { margin-top: 4px; }
.conf-label { font-size: 11px; color: #555; margin-bottom: 3px; }
.conf-track { height: 6px; background: #f0f4f8; border-radius: 3px; overflow: hidden; }
.conf-fill { height: 100%; border-radius: 3px; transition: width 0.5s; }
.badge { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
.badge-green { background: #eafaf1; color: #27ae60; }
.badge-orange { background: #fef3e2; color: #e67e22; }
.badge-blue { background: #ebf5fb; color: #2980b9; }
.badge-gray { background: #f4f4f4; color: #666; }
.btn-icon { background: none; border: none; cursor: pointer; padding: 3px; border-radius: 4px; flex-shrink: 0; display: inline-flex; align-items: center; }
.btn-icon.danger:hover { background: #fdecea; }
.empty-state { text-align: center; color: #aaa; padding: 40px; font-size: 13px; }
.empty-preview { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: #aaa; }
.empty-preview span { font-size: 40px; }
.empty-preview p { font-size: 14px; }
.preview-card { border: 1px solid #f0f4f8; border-radius: 10px; overflow: hidden; }
.preview-header { background: #1a3a5c; color: #fff; padding: 14px 16px; }
.preview-type { font-size: 11px; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; }
.preview-name { font-size: 14px; font-weight: 600; margin: 4px 0; }
.preview-conf { font-size: 13px; font-weight: 700; }
.extracted-fields { padding: 16px; }
.field-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px solid #f0f4f8; font-size: 13px;
}
.field-key { color: #888; text-transform: capitalize; }
.field-val { font-weight: 600; color: #1a3a5c; }
.no-data { text-align: center; color: #aaa; padding: 20px; }
.preview-actions { display: flex; gap: 10px; padding: 14px 16px; border-top: 1px solid #f0f4f8; }
.btn { padding: 8px 14px; border-radius: 8px; border: none; cursor: pointer; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
.btn-primary { background: #1a3a5c; color: #fff; }
.btn-secondary { background: #f0f4f8; color: #1a3a5c; border: 1px solid #ddd; }
</style>
