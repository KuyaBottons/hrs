<script setup>
import { ref, onMounted } from 'vue'

const API     = 'http://localhost/hrs/server/api/ai_scan.php'
const SAVE_API = API + '?action=save'

// -- Tesseract for image OCR ---------------------------------------------------
let Tesseract = null
onMounted(async () => {
  await loadSavedScans()
  if (!window.Tesseract) {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
    await new Promise((res, rej) => { s.onload = res; s.onerror = rej; document.head.appendChild(s) })
  }
  Tesseract = window.Tesseract
})

// -- Icons ---------------------------------------------------------------------
const icons = {
  robot:    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zm-9 7H9v-2h2v2zm4 0h-2v-2h2v2zm1-5H8V7h8v4z"/></svg>',
  upload:   '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>',
  doc:      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>',
  delete:   '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
  save:     '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>',
  edit:     '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
  close:    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
  check:    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
  spinner:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/></svg>',
  eye:      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>',
}

// -- State ---------------------------------------------------------------------
const dragOver      = ref(false)
const uploading     = ref(false)
const uploadProgress = ref('')
const savedScans    = ref([])
const pendingScans  = ref([])   // scanned but not yet saved to DB
const selectedScan  = ref(null)
const showPreview   = ref(false)
const editMode      = ref(false)
const saving        = ref(false)
const errorMsg      = ref('')

// -- Load saved scans from DB --------------------------------------------------
async function loadSavedScans() {
  try {
    const res  = await fetch(API)
    const data = await res.json()
    savedScans.value = Array.isArray(data) ? data : []
  } catch (e) { console.warn('Could not load saved scans:', e.message) }
}

// -- File drop / input ---------------------------------------------------------
function onDrop(e) {
  dragOver.value = false
  const files = e.dataTransfer?.files || e.target?.files
  if (files?.length) processFiles(files)
}

function onFileInput(e) {
  processFiles(e.target.files)
  e.target.value = ''
}

async function processFiles(files) {
  uploading.value = true
  errorMsg.value  = ''
  for (const file of Array.from(files)) {
    uploadProgress.value = `Uploading ${file.name}...`
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch(API, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      const scan = { ...data, _saved: false, _editing: false }

      // If image, run client-side Tesseract OCR
      if (data.needs_ocr && Tesseract) {
        try {
          uploadProgress.value = `Preprocessing image...`
          const preprocessed = await preprocessImage(file)

          // Run OCR with PSM 6 (uniform block) â€” best for dense document tables
          uploadProgress.value = `Scanning text (this may take 30-60 seconds)...`
          const { data: ocrData } = await Tesseract.recognize(preprocessed, 'eng', {
            logger: m => {
              if (m.status === 'recognizing text') {
                uploadProgress.value = `OCR progress: ${Math.round((m.progress || 0) * 100)}%`
              }
            },
            tessedit_pageseg_mode:    '6',  // PSM 6 = uniform block of text (best for tables)
            tessedit_ocr_engine_mode: '1',  // OEM 1 = LSTM neural net only
            preserve_interword_spaces: '1',
          })

          const rawText = (ocrData.text || '').trim()
          scan.confidence     = Math.round(ocrData.confidence)
          scan.raw_text       = rawText
          scan.html_table     = buildOcrHtml(rawText)
          scan.extracted_data = parseOCRText(rawText, scan.doc_type)
          scan.status         = scan.confidence >= 40 ? 'Processed' : 'Review Needed'
        } catch (e) {
          console.error('OCR error:', e)
          scan.status     = 'Review Needed'
          scan.raw_text   = 'OCR failed. Try uploading the original digital file (Excel/PDF) for better results.'
        }
      }

      pendingScans.value.unshift(scan)
      selectedScan.value = scan
      showPreview.value  = true
    } catch (e) {
      errorMsg.value = e.message
    }
  }
  uploading.value      = false
  uploadProgress.value = ''
}

// -- Image pre-processing for better OCR --------------------------------------
async function preprocessImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      // â”€â”€ Step 1: Upscale to 3000px on longest side â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const TARGET = 3000
      const maxDim = Math.max(img.width, img.height)
      const scale  = maxDim < TARGET ? TARGET / maxDim : 1
      const W = Math.round(img.width  * scale)
      const H = Math.round(img.height * scale)

      const canvas = document.createElement('canvas')
      const ctx    = canvas.getContext('2d')
      canvas.width  = W
      canvas.height = H
      ctx.drawImage(img, 0, 0, W, H)
      URL.revokeObjectURL(url)

      const imageData = ctx.getImageData(0, 0, W, H)
      const d = imageData.data
      const N = W * H

      // â”€â”€ Step 2: Grayscale â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const gray = new Float32Array(N)
      for (let i = 0; i < N; i++) {
        gray[i] = 0.299 * d[i*4] + 0.587 * d[i*4+1] + 0.114 * d[i*4+2]
      }

      // â”€â”€ Step 3: Gaussian blur (3x3) to reduce noise â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const blurred = new Float32Array(N)
      const kernel  = [1,2,1, 2,4,2, 1,2,1]  // sum=16
      for (let y = 1; y < H-1; y++) {
        for (let x = 1; x < W-1; x++) {
          let sum = 0
          let ki  = 0
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              sum += gray[(y+dy)*W + (x+dx)] * kernel[ki++]
            }
          }
          blurred[y*W+x] = sum / 16
        }
      }

      // â”€â”€ Step 4: Unsharp mask â€” sharpen edges â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const sharp = new Float32Array(N)
      const AMOUNT = 2.0
      for (let i = 0; i < N; i++) {
        sharp[i] = Math.min(255, Math.max(0, gray[i] + AMOUNT * (gray[i] - blurred[i])))
      }

      // â”€â”€ Step 5: Adaptive threshold (Sauvola) â€” handles uneven lighting â”€â”€â”€â”€â”€
      // Block size ~2% of image, minimum 15px
      const BLOCK = Math.max(15, Math.round(Math.min(W, H) * 0.02)) | 1
      const K = 0.2
      const R = 128
      const out = new Uint8Array(N)
      const half = BLOCK >> 1

      // Build integral image for fast local mean
      const integral = new Float64Array((W+1) * (H+1))
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          integral[(y+1)*(W+1)+(x+1)] = sharp[y*W+x]
            + integral[y*(W+1)+(x+1)]
            + integral[(y+1)*(W+1)+x]
            - integral[y*(W+1)+x]
        }
      }

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const x1 = Math.max(0, x-half), x2 = Math.min(W-1, x+half)
          const y1 = Math.max(0, y-half), y2 = Math.min(H-1, y+half)
          const count = (x2-x1+1) * (y2-y1+1)
          const sum   = integral[(y2+1)*(W+1)+(x2+1)]
                      - integral[y1*(W+1)+(x2+1)]
                      - integral[(y2+1)*(W+1)+x1]
                      + integral[y1*(W+1)+x1]
          const mean  = sum / count

          // Compute local std via second pass (simplified)
          let sumSq = 0
          for (let dy = y1; dy <= y2; dy++) {
            for (let dx = x1; dx <= x2; dx++) {
              const v = sharp[dy*W+dx] - mean
              sumSq += v * v
            }
          }
          const std = Math.sqrt(sumSq / count)
          const threshold = mean * (1 + K * (std / R - 1))
          out[y*W+x] = sharp[y*W+x] >= threshold ? 255 : 0
        }
      }

      // â”€â”€ Step 6: Write back as black-on-white â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      for (let i = 0; i < N; i++) {
        d[i*4] = d[i*4+1] = d[i*4+2] = out[i]
        d[i*4+3] = 255
      }
      ctx.putImageData(imageData, 0, 0)
      canvas.toBlob(blob => resolve(blob || file), 'image/png')
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

// -- Build formatted HTML from OCR raw text ------------------------------------
function buildOcrHtml(text) {
  if (!text || !text.trim()) return ''
  const lines = text.split('\n')
  let html = '<div class="docx-body">'
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) { html += '<br>'; continue }
    // Detect if line looks like a table row (multiple whitespace-separated columns)
    const cols = trimmed.split(/\s{2,}/).filter(c => c.trim())
    if (cols.length >= 3) {
      html += '<p class="docx-p ocr-row">' +
        cols.map(c => `<span class="ocr-cell">${escHtml(c)}</span>`).join('') +
        '</p>'
    } else {
      html += `<p class="docx-p">${escHtml(trimmed)}</p>`
    }
  }
  html += '</div>'
  return html
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

// -- OCR text parser -----------------------------------------------------------
function parseOCRText(text, docType) {
  const lines  = text.split('\n').map(l => l.trim()).filter(Boolean)
  const result = {}
  for (const line of lines) {
    if (/name[:\s]/i.test(line))        result.employeeName  = line.replace(/.*name[:\s]*/i, '').trim()
    if (/department[:\s]/i.test(line))  result.department    = line.replace(/.*department[:\s]*/i, '').trim()
    if (/period[:\s]/i.test(line))      result.period        = line.replace(/.*period[:\s]*/i, '').trim()
    if (/position[:\s]/i.test(line))    result.position      = line.replace(/.*position[:\s]*/i, '').trim()
    if (/leave type[:\s]/i.test(line))  result.leaveType     = line.replace(/.*leave type[:\s]*/i, '').trim()
    if (/total hours?[:\s]/i.test(line)) result.totalHours   = line.replace(/.*total hours?[:\s]*/i, '').trim()
    if (/gross pay[:\s]/i.test(line))   result.grossPay      = line.replace(/.*gross pay[:\s]*/i, '').trim()
    if (/net pay[:\s]/i.test(line))     result.netPay        = line.replace(/.*net pay[:\s]*/i, '').trim()
    const dateMatch = line.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)
    if (dateMatch && !result.date)      result.date          = dateMatch[0]
  }
  if (!Object.keys(result).length) result.textPreview = text.substring(0, 300)
  return result
}

// -- Preview / select ----------------------------------------------------------
function openPreview(scan) {
  selectedScan.value = scan
  showPreview.value  = true
  editMode.value     = false
}

function closePreview() {
  showPreview.value = false
  editMode.value    = false
}

// -- Save to DB ----------------------------------------------------------------
async function saveScan(scan) {
  saving.value = true
  try {
    const res  = await fetch(SAVE_API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_name:      scan.file_name,
        file_path:      scan.file_path,
        doc_type:       scan.doc_type,
        file_size:      scan.file_size,
        confidence:     scan.confidence,
        extracted_data: scan.extracted_data,
        raw_text:       scan.raw_text,
        status:         scan.status,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Save failed')
    scan._saved = true
    scan.id     = data.id
    savedScans.value.unshift({ ...scan })
    pendingScans.value = pendingScans.value.filter(s => s !== scan)
    showPreview.value  = false
    alert('Saved successfully!')
  } catch (e) { alert('Save failed: ' + e.message) }
  finally { saving.value = false }
}

// -- Delete --------------------------------------------------------------------
async function deleteScan(scan) {
  if (!confirm(`Delete "${scan.file_name}"?`)) return
  if (scan.id) {
    await fetch(`${API}?id=${scan.id}`, { method: 'DELETE' })
    savedScans.value = savedScans.value.filter(s => s.id !== scan.id)
  } else {
    pendingScans.value = pendingScans.value.filter(s => s !== scan)
  }
  if (selectedScan.value === scan) { selectedScan.value = null; showPreview.value = false }
}

// -- Export functions ----------------------------------------------------------
function exportToExcel(scan) {
  const rows = []
  rows.push(['GEAMH HRIS ï¿½ AI Scan Export'])
  rows.push(['File Name', scan.file_name || ''])
  rows.push(['Document Type', scan.doc_type || ''])
  rows.push(['File Size', scan.file_size || ''])
  rows.push(['AI Confidence', (scan.confidence || 0) + '%'])
  rows.push(['Status', scan.status || ''])
  rows.push([])

  if (scan.table_rows && scan.table_rows.length) {
    rows.push(['--- Extracted Table ---'])
    scan.table_rows.forEach(r => rows.push(Array.isArray(r) ? r : Object.values(r)))
  } else if (scan.extracted_data && Object.keys(scan.extracted_data).length) {
    rows.push(['Field', 'Value'])
    Object.entries(scan.extracted_data).forEach(([k, v]) =>
      rows.push([k.replace(/([A-Z])/g, ' $1').trim(), String(v)])
    )
  }

  if (scan.raw_text) {
    rows.push([])
    rows.push(['--- Raw Text ---'])
    scan.raw_text.split('\n').forEach(line => rows.push([line]))
  }

  const csv  = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, (scan.file_name || 'scan').replace(/\.[^.]+$/, '') + '_extracted.csv')
}

function exportToWord(scan) {
  const title = scan.file_name || 'Scanned Document'

  let tableHtml = ''
  if (scan.html_table) {
    tableHtml = scan.html_table
      .replace(/<table/g, '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:10pt"')
      .replace(/<th/g, '<th style="background:#1a3a5c;color:#fff;padding:6px;text-align:left"')
      .replace(/<td/g, '<td style="padding:5px;border:1px solid #ccc"')
  } else if (scan.extracted_data && Object.keys(scan.extracted_data).length) {
    tableHtml = `<table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:10pt">
      <tr style="background:#1a3a5c;color:#fff"><th>Field</th><th>Value</th></tr>`
    Object.entries(scan.extracted_data).forEach(([k, v]) => {
      tableHtml += `<tr><td><b>${k.replace(/([A-Z])/g, ' $1').trim()}</b></td><td>${v}</td></tr>`
    })
    tableHtml += '</table>'
  }

  const rawSection = scan.raw_text
    ? `<h3>Raw Extracted Text</h3>
       <pre style="font-size:9pt;background:#f5f5f5;padding:10px;border:1px solid #ddd;white-space:pre-wrap">${
         scan.raw_text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
       }</pre>`
    : ''

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:w="urn:schemas-microsoft-com:office:word"
    xmlns="http://www.w3.org/TR/REC-html40">
  <head><meta charset="utf-8"><title>${title}</title>
  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
  <style>body{font-family:Calibri,sans-serif;margin:2cm}h1{color:#1a3a5c}h2,h3{color:#1a3a5c}</style>
  </head>
  <body>
    <h1>${title}</h1>
    <table border="0" cellpadding="4" style="font-size:10pt;margin-bottom:12pt">
      <tr><td><b>Document Type</b></td><td>${scan.doc_type || ''}</td></tr>
      <tr><td><b>File Size</b></td><td>${scan.file_size || ''}</td></tr>
      <tr><td><b>AI Confidence</b></td><td>${scan.confidence || 0}%</td></tr>
      <tr><td><b>Status</b></td><td>${scan.status || ''}</td></tr>
    </table>
    <hr/>
    <h2>Extracted Data</h2>
    ${tableHtml || '<p><i>No structured data extracted.</i></p>'}
    ${rawSection}
  </body></html>`

  const blob = new Blob([html], { type: 'application/msword' })
  triggerDownload(blob, (scan.file_name || 'scan').replace(/\.[^.]+$/, '') + '_extracted.doc')
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href    = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// -- Helpers -------------------------------------------------------------------
function confidenceColor(c) {
  if (c >= 85) return '#27ae60'
  if (c >= 65) return '#e67e22'
  return '#c0392b'
}
function statusClass(s) {
  return { 'Processed':'badge-green','Review Needed':'badge-orange','Processing...':'badge-blue' }[s] || 'badge-gray'
}
function isImage(scan) {
  return ['jpg','jpeg','png','gif','bmp','webp'].includes(scan.ext || '')
}
function isPdf(scan) { return scan.ext === 'pdf' }
function docTypeColor(t) {
  return { 'DTR':'#1a3a5c','Leave Form':'#27ae60','Payslip':'#8e44ad','Travel Order':'#e67e22','Schedule':'#2980b9' }[t] || '#666'
}
</script>

<template>
  <div class="page">

    <!-- Header -->
    <div class="ai-header">
      <span class="ai-icon" v-html="icons.robot"></span>
      <div>
        <h2>AI Document Scanning</h2>
        <p>Upload HR documents for automatic data extraction. Preview before saving.</p>
      </div>
    </div>

    <!-- Error banner -->
    <div v-if="errorMsg" class="error-banner">
      ?? {{ errorMsg }}
      <button @click="errorMsg = ''" class="err-close">?</button>
    </div>

    <!-- Upload Zone -->
    <div class="upload-zone" :class="{ 'drag-over': dragOver }"
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop.prevent="onDrop">
      <div class="upload-inner">
        <span class="upload-svg" v-html="icons.upload"></span>
        <div class="upload-text">
          <strong>Drag & Drop files here</strong>
          <span>or</span>
          <label class="browse-btn">
            Browse Files
            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp,.xlsx,.xls,.csv,.docx,.doc" @change="onFileInput" hidden />
          </label>
        </div>
         <div class="upload-hint">
           Supported: <strong>PDF · JPG · PNG · Excel (XLSX/CSV) · Word (DOCX)</strong> — Max 20 MB<br>
           <span class="upload-tip">�� For best accuracy, upload the original digital file (Excel/PDF) instead of a photo of a document.</span>
         </div>
      </div>
      <div v-if="uploading" class="processing-overlay">
        <span class="spin-icon" v-html="icons.spinner"></span>
        <span>{{ uploadProgress || 'Processing...' }}</span>
      </div>
    </div>

    <!-- Main layout -->
    <div class="main-layout">

      <!-- Left: file lists -->
      <div class="file-col">

        <!-- Pending (not yet saved) -->
        <div v-if="pendingScans.length" class="list-section">
          <div class="list-header pending-header">
            <span>? Pending Review ({{ pendingScans.length }})</span>
          </div>
          <div v-for="scan in pendingScans" :key="scan.file_path"
            class="file-row" :class="{ active: selectedScan === scan }"
            @click="openPreview(scan)">
            <span class="doc-type-dot" :style="{ background: docTypeColor(scan.doc_type) }"></span>
            <div class="file-row-info">
              <strong>{{ scan.file_name }}</strong>
              <div class="file-row-meta">
                <span class="badge" :class="statusClass(scan.status)">{{ scan.status }}</span>
                <span class="fmeta">{{ scan.file_size }}</span>
                <span class="fmeta doc-type-tag" :style="{ color: docTypeColor(scan.doc_type) }">{{ scan.doc_type }}</span>
              </div>
              <div v-if="scan.confidence > 0" class="mini-bar">
                <div class="mini-fill" :style="{ width: scan.confidence + '%', background: confidenceColor(scan.confidence) }"></div>
              </div>
            </div>
            <div class="file-row-actions" @click.stop>
              <button class="btn-icon" title="Preview" @click="openPreview(scan)"><span v-html="icons.eye"></span></button>
              <button class="btn-icon danger" title="Remove" @click="deleteScan(scan)"><span v-html="icons.delete"></span></button>
            </div>
          </div>
        </div>

        <!-- Saved scans -->
        <div class="list-section">
          <div class="list-header saved-header">
            <span>? Saved Scans ({{ savedScans.length }})</span>
          </div>
          <div v-if="savedScans.length === 0" class="list-empty">No saved scans yet.</div>
          <div v-for="scan in savedScans" :key="scan.id"
            class="file-row" :class="{ active: selectedScan === scan }"
            @click="openPreview(scan)">
            <span class="doc-type-dot" :style="{ background: docTypeColor(scan.doc_type) }"></span>
            <div class="file-row-info">
              <strong>{{ scan.file_name }}</strong>
              <div class="file-row-meta">
                <span class="badge" :class="statusClass(scan.status)">{{ scan.status }}</span>
                <span class="fmeta">{{ scan.file_size }}</span>
                <span class="fmeta doc-type-tag" :style="{ color: docTypeColor(scan.doc_type) }">{{ scan.doc_type }}</span>
              </div>
            </div>
            <div class="file-row-actions" @click.stop>
              <button class="btn-icon" title="Preview" @click="openPreview(scan)"><span v-html="icons.eye"></span></button>
              <button class="btn-icon danger" title="Delete" @click="deleteScan(scan)"><span v-html="icons.delete"></span></button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: preview panel -->
      <div class="preview-col" v-if="showPreview && selectedScan">
        <div class="preview-panel">
          <div class="preview-panel-header">
            <div>
              <span class="preview-doc-type" :style="{ background: docTypeColor(selectedScan.doc_type) + '22', color: docTypeColor(selectedScan.doc_type) }">
                {{ selectedScan.doc_type }}
              </span>
              <h3>{{ selectedScan.file_name }}</h3>
              <span class="preview-meta">{{ selectedScan.file_size }}</span>
            </div>
            <button class="btn-icon" @click="closePreview"><span v-html="icons.close"></span></button>
          </div>

          <!-- File preview -->
          <div class="file-preview-box">
            <img v-if="isImage(selectedScan) && selectedScan.preview_url"
              :src="selectedScan.preview_url" class="preview-img" alt="Document preview" />
            <iframe v-else-if="isPdf(selectedScan) && selectedScan.preview_url"
              :src="selectedScan.preview_url" class="preview-iframe"></iframe>
            <div v-else class="preview-placeholder">
              <span v-html="icons.doc" class="placeholder-icon"></span>
              <p>{{ selectedScan.file_name }}</p>
              <small>See extracted data below</small>
            </div>
          </div>

          <!-- Confidence -->
          <div v-if="selectedScan.confidence > 0" class="confidence-row">
            <span>AI Confidence</span>
            <div class="conf-track">
              <div class="conf-fill" :style="{ width: selectedScan.confidence + '%', background: confidenceColor(selectedScan.confidence) }"></div>
            </div>
            <strong :style="{ color: confidenceColor(selectedScan.confidence) }">{{ selectedScan.confidence }}%</strong>
          </div>

          <!-- Extracted data -->
          <div class="extracted-section">
            <div class="extracted-header">
              <span>Extracted Data</span>
              <button v-if="!selectedScan._saved && !selectedScan.html_table" class="btn-edit-toggle" @click="editMode = !editMode">
                <span v-html="icons.edit"></span> {{ editMode ? 'Done' : 'Edit' }}
              </button>
            </div>

            <!-- Spreadsheet / Word: show same table format as the file -->
            <div v-if="selectedScan.html_table" class="extracted-table-wrap">
              <div class="table-preview" v-html="selectedScan.html_table"></div>
            </div>

            <!-- Image / PDF OCR: show key-value pairs -->
            <template v-else>
              <div class="extracted-grid" v-if="selectedScan.extracted_data && Object.keys(selectedScan.extracted_data).length">
                <div v-for="(val, key) in selectedScan.extracted_data" :key="key" class="ext-row">
                  <span class="ext-key">{{ key.replace(/([A-Z])/g, ' $1').trim() }}</span>
                  <input v-if="editMode" v-model="selectedScan.extracted_data[key]" class="ext-input" />
                  <span v-else class="ext-val">{{ val }}</span>
                </div>
              </div>
              <div v-else class="no-data">No data extracted. Try editing manually.</div>
            </template>
          </div>

          <!-- Raw text -->
          <details v-if="selectedScan.raw_text" class="raw-text-details">
            <summary>Raw extracted text</summary>
            <pre class="raw-text">{{ selectedScan.raw_text }}</pre>
          </details>

          <!-- Actions -->
          <div class="preview-actions">
            <button v-if="!selectedScan._saved" class="btn btn-primary" @click="saveScan(selectedScan)" :disabled="saving">
              <span v-html="icons.save"></span>
              {{ saving ? 'Saving...' : 'Save to System' }}
            </button>
            <span v-else class="saved-badge">? Saved to database</span>
            <button class="btn btn-export-excel" @click="exportToExcel(selectedScan)">? Export Excel</button>
            <button class="btn btn-export-word" @click="exportToWord(selectedScan)">? Export Word</button>
            <button class="btn btn-secondary" @click="closePreview">Close</button>
          </div>
        </div>
      </div>

      <div v-else class="preview-col empty-preview-col">
        <div class="empty-preview">
          <span v-html="icons.eye" class="empty-icon"></span>
          <p>Select a document to preview extracted data</p>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* -- Base -- */
.page { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.ai-header { display: flex; align-items: center; gap: 14px; }
.ai-icon { width: 40px; height: 40px; color: #1a3a5c; display: inline-flex; }
.ai-icon :deep(svg) { width: 100%; height: 100%; fill: #1a3a5c; }
.ai-header h2 { margin: 0 0 4px; color: #1a3a5c; font-size: 20px; }
.ai-header p  { margin: 0; color: #666; font-size: 13px; }

/* -- Error banner -- */
.error-banner { background: #fdecea; border: 1px solid #f5b7b1; color: #c0392b; padding: 10px 16px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; }
.err-close { background: none; border: none; cursor: pointer; color: #c0392b; font-size: 16px; }

/* -- Upload zone -- */
.upload-zone {
  border: 2px dashed #a9cce3; border-radius: 12px; padding: 36px;
  background: #f8fbff; position: relative; transition: all 0.2s;
}
.upload-zone.drag-over { border-color: #1a3a5c; background: #ebf5fb; }
.upload-inner { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.upload-svg { width: 48px; height: 48px; color: #a9cce3; display: inline-flex; }
.upload-svg :deep(svg) { width: 100%; height: 100%; fill: #a9cce3; }
.upload-text { display: flex; align-items: center; gap: 8px; font-size: 15px; color: #555; }
.upload-text strong { color: #1a3a5c; }
.browse-btn { background: #1a3a5c; color: #fff; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; }
.upload-hint { font-size: 12px; color: #aaa; text-align: center; }
.upload-tip  { font-size: 11px; color: #e67e22; font-weight: 600; display: block; margin-top: 4px; }
.processing-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.88); display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 15px; font-weight: 600; color: #1a3a5c; border-radius: 12px; }
.spin-icon { display: inline-flex; animation: spin 0.8s linear infinite; }
.spin-icon :deep(svg) { width: 22px; height: 22px; fill: #1a3a5c; }
@keyframes spin { to { transform: rotate(360deg); } }

/* -- Main layout -- */
.main-layout { display: grid; grid-template-columns: 340px 1fr; gap: 20px; align-items: flex-start; }
@media (max-width: 1000px) { .main-layout { grid-template-columns: 1fr; } }

/* -- File list -- */
.file-col { display: flex; flex-direction: column; gap: 12px; }
.list-section { background: #fff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.07); overflow: hidden; }
.list-header { padding: 10px 14px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.pending-header { background: #fff8e1; color: #b8860b; border-bottom: 1px solid #fde8a0; }
.saved-header   { background: #e8f5ee; color: #1a6b3c; border-bottom: 1px solid #c3e6cb; }
.list-empty { padding: 20px; text-align: center; color: #aaa; font-size: 13px; }
.file-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid #f5f5f5; cursor: pointer; transition: background 0.15s; }
.file-row:last-child { border-bottom: none; }
.file-row:hover { background: #f9fafb; }
.file-row.active { background: #ebf5fb; }
.doc-type-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.file-row-info { flex: 1; min-width: 0; }
.file-row-info strong { font-size: 12px; color: #1a1a2e; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-row-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 3px; }
.fmeta { font-size: 10px; color: #aaa; }
.doc-type-tag { font-weight: 600; font-size: 10px; }
.badge { padding: 1px 7px; border-radius: 8px; font-size: 10px; font-weight: 600; }
.badge-green  { background: #eafaf1; color: #27ae60; }
.badge-orange { background: #fef3e2; color: #e67e22; }
.badge-blue   { background: #ebf5fb; color: #2980b9; }
.badge-gray   { background: #f4f4f4; color: #666; }
.mini-bar { height: 3px; background: #f0f4f8; border-radius: 2px; margin-top: 4px; overflow: hidden; }
.mini-fill { height: 100%; border-radius: 2px; }
.file-row-actions { display: flex; gap: 2px; flex-shrink: 0; }
.btn-icon { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; display: inline-flex; align-items: center; color: #555; }
.btn-icon :deep(svg) { width: 16px; height: 16px; fill: currentColor; }
.btn-icon:hover { background: #f0f4f8; }
.btn-icon.danger:hover { background: #fdecea; color: #e74c3c; }

/* -- Preview panel -- */
.preview-col { min-width: 0; }
.preview-panel { background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.09); overflow: hidden; }
.preview-panel-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid #f0f4f8; }
.preview-doc-type { padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 700; display: inline-block; margin-bottom: 4px; }
.preview-panel-header h3 { margin: 0 0 2px; font-size: 14px; color: #1a1a2e; word-break: break-all; }
.preview-meta { font-size: 11px; color: #aaa; }

/* File preview area */
.file-preview-box { background: #f8f9fa; border-bottom: 1px solid #f0f4f8; display: flex; align-items: center; justify-content: center; min-height: 200px; max-height: 320px; overflow: hidden; }
.preview-img { max-width: 100%; max-height: 320px; object-fit: contain; }
.preview-iframe { width: 100%; height: 320px; border: none; }
.preview-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #aaa; padding: 40px; }

/* -- Table preview (Excel/CSV/Word) -- */
.table-preview-wrap {
  width: 100%;
  max-height: 420px;
  overflow: auto;
  background: #fff;
}
.table-preview :deep(.scan-table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  font-family: 'Segoe UI', sans-serif;
}
.table-preview :deep(.scan-table thead tr) {
  background: #1a3a5c;
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 1;
}
.table-preview :deep(.scan-table th) {
  padding: 8px 10px;
  text-align: left;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid #2980b9;
}
.table-preview :deep(.scan-table td) {
  padding: 6px 10px;
  border: 1px solid #e9ecef;
  white-space: nowrap;
  color: #333;
}
.table-preview :deep(.scan-table tbody tr:nth-child(even)) {
  background: #f8f9fa;
}
.table-preview :deep(.scan-table tbody tr:hover) {
  background: #ebf5fb;
}
.placeholder-icon { width: 48px; height: 48px; }
.placeholder-icon :deep(svg) { width: 48px; height: 48px; fill: #ccc; }
.preview-placeholder p { margin: 0; font-size: 13px; font-weight: 600; color: #555; }
.preview-placeholder small { font-size: 11px; }

/* Confidence */
.confidence-row { display: flex; align-items: center; gap: 10px; padding: 10px 18px; border-bottom: 1px solid #f0f4f8; font-size: 12px; color: #555; }
.conf-track { flex: 1; height: 6px; background: #f0f4f8; border-radius: 3px; overflow: hidden; }
.conf-fill { height: 100%; border-radius: 3px; transition: width 0.4s; }

/* Extracted data */
.extracted-section { padding: 14px 18px; border-bottom: 1px solid #f0f4f8; }
.extracted-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; font-size: 12px; font-weight: 700; color: #1a3a5c; text-transform: uppercase; letter-spacing: 0.4px; }
.btn-edit-toggle { background: none; border: 1px solid #ddd; border-radius: 6px; padding: 3px 10px; font-size: 11px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; color: #555; }
.btn-edit-toggle :deep(svg) { width: 12px; height: 12px; fill: currentColor; }
.btn-edit-toggle:hover { background: #f0f4f8; }
.extracted-grid { display: flex; flex-direction: column; gap: 6px; }
.ext-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid #f9fafb; font-size: 13px; }
.ext-key { min-width: 130px; color: #888; font-size: 11px; text-transform: capitalize; flex-shrink: 0; }
.ext-val { color: #1a1a2e; font-weight: 600; flex: 1; }
.ext-input { flex: 1; padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; outline: none; }

/* Extracted table (spreadsheet/word) ï¿½ same style as file preview */
.extracted-table-wrap {
  max-height: 360px;
  overflow: auto;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

/* DOCX formatted output */
.extracted-table-wrap :deep(.docx-body) {
  padding: 16px 20px;
  font-family: 'Segoe UI', Calibri, sans-serif;
  font-size: 13px;
  color: #1a1a2e;
  line-height: 1.7;
}
.extracted-table-wrap :deep(.docx-title) {
  font-size: 18px;
  font-weight: 800;
  color: #1a3a5c;
  margin: 0 0 8px;
  text-align: center;
}
.extracted-table-wrap :deep(.docx-h) {
  font-size: 14px;
  font-weight: 700;
  color: #1a3a5c;
  margin: 14px 0 6px;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 4px;
}
.extracted-table-wrap :deep(.docx-p) {
  margin: 4px 0;
  text-align: justify;
}
.extracted-table-wrap :deep(.docx-li) {
  margin: 2px 0 2px 20px;
  list-style-type: disc;
  display: list-item;
}
.extracted-table-wrap :deep(br) {
  display: block;
  margin: 4px 0;
  content: '';
}

/* OCR multi-column row */
.extracted-table-wrap :deep(.ocr-row) {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #f0f4f8;
  padding: 3px 0;
}
.extracted-table-wrap :deep(.ocr-cell) {
  flex: 1;
  padding: 2px 8px;
  font-size: 12px;
  border-right: 1px solid #e9ecef;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.extracted-table-wrap :deep(.ocr-cell:last-child) {
  border-right: none;
}
.ext-input:focus { border-color: #1a3a5c; }
.no-data { color: #aaa; font-size: 13px; text-align: center; padding: 16px; }

/* Raw text */
.raw-text-details { padding: 0 18px 10px; }
.raw-text-details summary { font-size: 12px; color: #888; cursor: pointer; padding: 6px 0; }
.raw-text { font-size: 11px; color: #555; background: #f8f9fa; border-radius: 6px; padding: 10px; max-height: 150px; overflow-y: auto; white-space: pre-wrap; word-break: break-word; margin: 6px 0 0; }

/* Actions */
.preview-actions { display: flex; align-items: center; gap: 10px; padding: 14px 18px; }
.btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
.btn-primary { background: #1a6b3c; color: #fff; }
.btn-primary:hover:not(:disabled) { background: #27ae60; }
.btn-primary:disabled { background: #a0c4b0; cursor: not-allowed; }
.btn-secondary { background: #f0f4f8; color: #555; border: 1px solid #ddd; }
.btn-export-excel { background: #217346; color: #fff; }
.btn-export-excel:hover { background: #1a5c38; }
.btn-export-word { background: #2b579a; color: #fff; }
.btn-export-word:hover { background: #1e3f73; }
.saved-badge { font-size: 13px; color: #27ae60; font-weight: 600; }

/* Empty preview */
.empty-preview-col { display: flex; align-items: center; justify-content: center; min-height: 300px; }
.empty-preview { display: flex; flex-direction: column; align-items: center; gap: 10px; color: #aaa; }
.empty-icon { width: 48px; height: 48px; }
.empty-icon :deep(svg) { width: 48px; height: 48px; fill: #ccc; }
.empty-preview p { font-size: 14px; margin: 0; }
</style>
