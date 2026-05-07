<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn   = getConnection();
$action = $_GET['action'] ?? '';

switch ($method) {

    case 'GET':
        if (isset($_GET['id'])) {
            $id   = (int)$_GET['id'];
            $stmt = $conn->prepare('SELECT * FROM ai_scanned_docs WHERE id = ?');
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            if (!$row) sendError('Scan not found', 404);
            $row['extracted_data'] = $row['extracted_data'] ? json_decode($row['extracted_data'], true) : null;
            sendJson($row);
        } else {
            $result = $conn->query('SELECT * FROM ai_scanned_docs ORDER BY created_at DESC LIMIT 200');
            $rows   = $result->fetch_all(MYSQLI_ASSOC);
            foreach ($rows as &$r) {
                $r['extracted_data'] = $r['extracted_data'] ? json_decode($r['extracted_data'], true) : null;
            }
            sendJson($rows);
        }
        break;

    case 'POST':
        if ($action === 'save') {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) sendError('Invalid JSON body');

            $file_name      = $data['file_name']      ?? '';
            $doc_type       = $data['doc_type']        ?? 'Unknown';
            $file_size      = $data['file_size']       ?? '';
            $confidence     = (int)($data['confidence'] ?? 0);
            $extracted_data = json_encode($data['extracted_data'] ?? []);
            $raw_text       = $data['raw_text']        ?? '';
            $status         = $data['status']          ?? 'Processed';
            $uploaded_by    = isset($data['uploaded_by']) ? (int)$data['uploaded_by'] : null;
            $file_path      = $data['file_path']       ?? '';

            $stmt = $conn->prepare(
                'INSERT INTO ai_scanned_docs
                 (file_name, doc_type, file_size, confidence, extracted_data, raw_text, status, uploaded_by, file_path)
                 VALUES (?,?,?,?,?,?,?,?,?)'
            );
            $stmt->bind_param('sssisssss',
                $file_name, $doc_type, $file_size, $confidence,
                $extracted_data, $raw_text, $status, $uploaded_by, $file_path
            );
            if (!$stmt->execute()) sendError('Save failed: ' . $stmt->error, 500);
            sendJson(['id' => $conn->insert_id, 'message' => 'Scan saved'], 201);

        } else {
            if (empty($_FILES['file'])) sendError('No file uploaded');

            $file     = $_FILES['file'];
            $origName = basename($file['name']);
            $ext      = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
            $allowed  = ['pdf','jpg','jpeg','png','gif','bmp','webp','xlsx','xls','csv','docx','doc'];

            if (!in_array($ext, $allowed)) sendError('File type not allowed');
            if ($file['size'] > 20 * 1024 * 1024) sendError('File too large. Max 20 MB.');

            $uploadDir = __DIR__ . '/../uploads/ai_scans/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

            $safeName = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $origName);
            $destPath = $uploadDir . $safeName;
            $webPath  = 'uploads/ai_scans/' . $safeName;

            if (!move_uploaded_file($file['tmp_name'], $destPath)) sendError('Failed to save file', 500);

            $fileSize  = formatBytes($file['size']);
            $docType   = detectDocType($origName);
            $extracted = [];
            $rawText   = '';
            $confidence = 0;
            $previewUrl = null;
            $htmlTable  = '';

            if (in_array($ext, ['jpg','jpeg','png','gif','bmp','webp'])) {
                $previewUrl = $webPath;

            } elseif ($ext === 'pdf') {
                $previewUrl = $webPath;
                if (function_exists('exec')) {
                    $escaped = escapeshellarg($destPath);
                    exec("pdftotext $escaped -", $lines, $ret);
                    if ($ret === 0) {
                        $rawText    = implode("\n", $lines);
                        $extracted  = parseText($rawText, $docType);
                        $confidence = estimateConfidence($extracted);
                    }
                }

            } elseif (in_array($ext, ['xlsx','xls','csv'])) {
                $result     = parseSpreadsheet($destPath, $ext);
                $rawText    = $result['raw'];
                $extracted  = $result['data'];
                $htmlTable  = $result['html_table'];
                $confidence = 95;

            } elseif (in_array($ext, ['docx','doc'])) {
                $result     = extractDocx($destPath);
                $rawText    = $result['text'];
                $htmlTable  = $result['html_table'];
                $extracted  = parseText($rawText, $docType);
                $confidence = estimateConfidence($extracted);
            }

            sendJson([
                'file_name'      => $origName,
                'file_path'      => $webPath,
                'preview_url'    => $previewUrl ? 'http://localhost/hrs/server/' . $previewUrl : null,
                'doc_type'       => $docType,
                'file_size'      => $fileSize,
                'ext'            => $ext,
                'confidence'     => $confidence,
                'extracted_data' => $extracted,
                'raw_text'       => substr($rawText, 0, 5000),
                'html_table'     => $htmlTable,
                'status'         => $confidence >= 60 ? 'Processed' : 'Review Needed',
                'needs_ocr'      => in_array($ext, ['jpg','jpeg','png','gif','bmp','webp']),
            ]);
        }
        break;

    case 'DELETE':
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) sendError('ID required');
        $stmt = $conn->prepare('SELECT file_path FROM ai_scanned_docs WHERE id = ?');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if ($row && $row['file_path']) {
            $fp = __DIR__ . '/../' . $row['file_path'];
            if (file_exists($fp)) @unlink($fp);
        }
        $stmt = $conn->prepare('DELETE FROM ai_scanned_docs WHERE id = ?');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        sendJson(['message' => 'Scan deleted']);
        break;

    default:
        sendError('Method not allowed', 405);
}

$conn->close();

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(int $bytes): string {
    if ($bytes < 1024)    return $bytes . ' B';
    if ($bytes < 1048576) return round($bytes / 1024, 1) . ' KB';
    return round($bytes / 1048576, 2) . ' MB';
}

function detectDocType(string $name): string {
    $l = strtolower($name);
    if (strpos($l, 'dtr')      !== false) return 'DTR';
    if (strpos($l, 'leave')    !== false) return 'Leave Form';
    if (strpos($l, 'payslip')  !== false || strpos($l, 'payroll') !== false) return 'Payslip';
    if (strpos($l, 'travel')   !== false) return 'Travel Order';
    if (strpos($l, 'schedule') !== false) return 'Schedule';
    return 'Unknown';
}

function parseText(string $text, string $docType): array {
    $lines  = array_filter(array_map('trim', explode("\n", $text)));
    $result = [];
    foreach ($lines as $line) {
        if (preg_match('/(?:employee\s*name|name)[:\s]+(.+)/i',   $line, $m)) $result['employeeName'] = trim($m[1]);
        if (preg_match('/(?:department|dept)[:\s]+(.+)/i',        $line, $m)) $result['department']   = trim($m[1]);
        if (preg_match('/(?:period|month)[:\s]+(.+)/i',           $line, $m)) $result['period']       = trim($m[1]);
        if (preg_match('/(?:position|designation)[:\s]+(.+)/i',   $line, $m)) $result['position']     = trim($m[1]);
        if (preg_match('/(?:leave\s*type)[:\s]+(.+)/i',           $line, $m)) $result['leaveType']    = trim($m[1]);
        if (preg_match('/(?:total\s*hours?)[:\s]+([\d.]+)/i',     $line, $m)) $result['totalHours']   = $m[1];
        if (preg_match('/(?:gross\s*pay)[:\s]+([\d,]+\.?\d*)/i',  $line, $m)) $result['grossPay']     = $m[1];
        if (preg_match('/(?:net\s*pay)[:\s]+([\d,]+\.?\d*)/i',    $line, $m)) $result['netPay']       = $m[1];
        if (preg_match('/(?:destination)[:\s]+(.+)/i',            $line, $m)) $result['destination']  = trim($m[1]);
        if (preg_match('/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/',    $line, $m) && empty($result['date'])) $result['date'] = $m[0];
    }
    if (empty($result)) {
        $result['textPreview'] = substr(implode(' ', array_slice(array_values($lines), 0, 5)), 0, 300);
    }
    return $result;
}

function estimateConfidence(array $extracted): int {
    $count = count(array_filter($extracted, function($v) { return !empty($v); }));
    if ($count === 0) return 30;
    if ($count >= 5)  return 90;
    if ($count >= 3)  return 78;
    return 60;
}

function colLetterToIndex(string $col): int {
    $col   = strtoupper($col);
    $index = 0;
    for ($i = 0; $i < strlen($col); $i++) {
        $index = $index * 26 + (ord($col[$i]) - ord('A') + 1);
    }
    return $index;
}

function buildHtmlTable(array $rows): string {
    if (empty($rows)) return '<p style="color:#aaa;padding:20px;text-align:center">No data found</p>';
    $maxCols = 0;
    foreach ($rows as $r) { $maxCols = max($maxCols, count($r)); }
    $html  = '<table class="scan-table">';
    $first = true;
    foreach ($rows as $row) {
        while (count($row) < $maxCols) $row[] = '';
        if ($first) {
            $html .= '<thead><tr>';
            foreach ($row as $cell) $html .= '<th>' . htmlspecialchars((string)$cell, ENT_QUOTES, 'UTF-8') . '</th>';
            $html .= '</tr></thead><tbody>';
            $first = false;
        } else {
            $html .= '<tr>';
            foreach ($row as $cell) $html .= '<td>' . htmlspecialchars((string)$cell, ENT_QUOTES, 'UTF-8') . '</td>';
            $html .= '</tr>';
        }
    }
    $html .= '</tbody></table>';
    return $html;
}

function parseSpreadsheet(string $path, string $ext): array {
    $rows = [];
    $raw  = '';

    if ($ext === 'csv') {
        if (($fh = fopen($path, 'r')) !== false) {
            while (($row = fgetcsv($fh)) !== false) $rows[] = $row;
            fclose($fh);
        }
        $raw = implode("\n", array_map(function($r) { return implode(', ', (array)$r); }, $rows));
        return ['data' => ['rowCount' => count($rows)], 'raw' => $raw, 'html_table' => buildHtmlTable($rows)];
    }

    if (in_array($ext, ['xlsx','xls']) && class_exists('ZipArchive')) {
        $zip = new ZipArchive();
        if ($zip->open($path) === true) {
            $sharedStrings = [];
            $ssXml = $zip->getFromName('xl/sharedStrings.xml');
            if ($ssXml) {
                $xml = @simplexml_load_string($ssXml);
                if ($xml) {
                    foreach ($xml->si as $si) {
                        if (isset($si->t)) {
                            $sharedStrings[] = (string)$si->t;
                        } else {
                            $parts = [];
                            foreach ($si->r as $r) { if (isset($r->t)) $parts[] = (string)$r->t; }
                            $sharedStrings[] = implode('', $parts);
                        }
                    }
                }
            }
            $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
            if ($sheetXml) {
                $xml = @simplexml_load_string($sheetXml);
                if ($xml) {
                    foreach ($xml->sheetData->row as $row) {
                        $rowData = [];
                        $prevCol = 0;
                        foreach ($row->c as $cell) {
                            $colRef = preg_replace('/[0-9]/', '', (string)$cell['r']);
                            $colIdx = colLetterToIndex($colRef);
                            while ($prevCol < $colIdx - 1) { $rowData[] = ''; $prevCol++; }
                            $t = (string)($cell['t'] ?? '');
                            $v = (string)($cell->v ?? '');
                            if ($t === 's' && isset($sharedStrings[(int)$v])) {
                                $rowData[] = $sharedStrings[(int)$v];
                            } elseif ($t === 'b') {
                                $rowData[] = $v === '1' ? 'TRUE' : 'FALSE';
                            } else {
                                $rowData[] = $v;
                            }
                            $prevCol = $colIdx;
                        }
                        $rows[] = $rowData;
                        $raw   .= implode("\t", $rowData) . "\n";
                    }
                }
                $zip->close();
                return ['data' => ['rowCount' => count($rows)], 'raw' => $raw, 'html_table' => buildHtmlTable($rows)];
            }
            $zip->close();
        }
    }
    return ['data' => ['note' => 'Could not parse file'], 'raw' => '', 'html_table' => ''];
}

function extractDocx(string $path): array {
    if (!class_exists('ZipArchive')) return ['text' => '', 'html_table' => ''];
    $zip = new ZipArchive();
    if ($zip->open($path) !== true) return ['text' => '', 'html_table' => ''];
    $xmlContent = $zip->getFromName('word/document.xml');
    $zip->close();
    if (!$xmlContent) return ['text' => '', 'html_table' => ''];

    $dom = new DOMDocument();
    @$dom->loadXML($xmlContent);
    $ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

    $html    = '<div class="docx-body">';
    $rawText = '';

    // Walk the document body children (paragraphs and tables)
    $body = $dom->getElementsByTagNameNS($ns, 'body')->item(0);
    if (!$body) return ['text' => '', 'html_table' => $html . '</div>'];

    foreach ($body->childNodes as $node) {
        $localName = $node->localName;

        // ── Paragraph ────────────────────────────────────────────────────────
        if ($localName === 'p') {
            $paraText = '';
            $isBold   = false;
            $styleId  = '';

            // Get paragraph style (heading detection)
            $pPr = $node->getElementsByTagNameNS($ns, 'pPr')->item(0);
            if ($pPr) {
                $pStyle = $pPr->getElementsByTagNameNS($ns, 'pStyle')->item(0);
                if ($pStyle) $styleId = strtolower($pStyle->getAttribute('w:val'));
            }

            // Collect run text
            foreach ($node->getElementsByTagNameNS($ns, 'r') as $run) {
                $rPr    = $run->getElementsByTagNameNS($ns, 'rPr')->item(0);
                $runBold = $rPr && $rPr->getElementsByTagNameNS($ns, 'b')->length > 0;
                $runText = '';
                foreach ($run->getElementsByTagNameNS($ns, 't') as $t) {
                    $runText .= $t->nodeValue;
                }
                if ($runBold && $runText) {
                    $paraText .= '<strong>' . htmlspecialchars($runText, ENT_QUOTES, 'UTF-8') . '</strong>';
                } else {
                    $paraText .= htmlspecialchars($runText, ENT_QUOTES, 'UTF-8');
                }
                $rawText .= $runText;
            }

            if (trim(strip_tags($paraText)) === '') {
                $html .= '<br>';
                $rawText .= "\n";
                continue;
            }

            $rawText .= "\n";

            // Render as heading or paragraph
            if (preg_match('/^heading(\d)$/i', $styleId, $hm)) {
                $level = min((int)$hm[1], 6);
                $html .= "<h{$level} class=\"docx-h\">{$paraText}</h{$level}>";
            } elseif (in_array($styleId, ['title','subtitle'])) {
                $html .= "<h1 class=\"docx-title\">{$paraText}</h1>";
            } else {
                // Check if it looks like a numbered/bulleted list item
                $numPr = $pPr ? $pPr->getElementsByTagNameNS($ns, 'numPr')->item(0) : null;
                if ($numPr) {
                    $html .= "<li class=\"docx-li\">{$paraText}</li>";
                } else {
                    $html .= "<p class=\"docx-p\">{$paraText}</p>";
                }
            }
        }

        // ── Table ─────────────────────────────────────────────────────────────
        elseif ($localName === 'tbl') {
            $tableRows = [];
            foreach ($node->getElementsByTagNameNS($ns, 'tr') as $tr) {
                $rowData = [];
                foreach ($tr->getElementsByTagNameNS($ns, 'tc') as $tc) {
                    $cellText = '';
                    foreach ($tc->getElementsByTagNameNS($ns, 't') as $t) {
                        $cellText .= $t->nodeValue;
                    }
                    $rowData[] = $cellText;
                    $rawText  .= $cellText . "\t";
                }
                $tableRows[] = $rowData;
                $rawText .= "\n";
            }
            if (!empty($tableRows)) {
                $html .= buildHtmlTable($tableRows);
            }
        }
    }

    $html .= '</div>';
    return ['text' => trim($rawText), 'html_table' => $html];
}
