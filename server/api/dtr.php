<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn   = getConnection();

switch ($method) {

    case 'GET':
        if (isset($_GET['id'])) {
            $id   = (int) $_GET['id'];
            $stmt = $conn->prepare('SELECT * FROM dtr_records WHERE id = ?');
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            $row ? sendJson($row) : sendError('Record not found', 404);
        } else {
            $result = $conn->query('SELECT * FROM dtr_records ORDER BY date_submitted DESC');
            sendJson($result->fetch_all(MYSQLI_ASSOC));
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) sendError('Invalid JSON body');

        $stmt = $conn->prepare(
            'INSERT INTO dtr_records
             (employee_id, employee_no, employee_name, department, period,
              transmittal_type, submitted_by, date_submitted, date_received,
              verified_by, verification_date, status, remarks)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'
        );
        $stmt->bind_param(
            'isssssssssss s',
            $data['employee_id'],
            $data['employee_no'],
            $data['employee_name'],
            $data['department'],
            $data['period'],
            $data['transmittal_type'],
            $data['submitted_by'],
            $data['date_submitted'],
            $data['date_received'],
            $data['verified_by'],
            $data['verification_date'],
            $data['status'],
            $data['remarks']
        );
        $stmt->execute();
        sendJson(['id' => $conn->insert_id, 'message' => 'DTR record created'], 201);
        break;

    case 'PUT':
        $id   = (int) ($_GET['id'] ?? 0);
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$id || !$data) sendError('Invalid request');

        $stmt = $conn->prepare(
            'UPDATE dtr_records SET
             employee_id=?, employee_no=?, employee_name=?, department=?, period=?,
             transmittal_type=?, submitted_by=?, date_submitted=?, date_received=?,
             verified_by=?, verification_date=?, status=?, remarks=?
             WHERE id=?'
        );
        $stmt->bind_param(
            'isssssssssssi',
            $data['employee_id'],
            $data['employee_no'],
            $data['employee_name'],
            $data['department'],
            $data['period'],
            $data['transmittal_type'],
            $data['submitted_by'],
            $data['date_submitted'],
            $data['date_received'],
            $data['verified_by'],
            $data['verification_date'],
            $data['status'],
            $data['remarks'],
            $id
        );
        $stmt->execute();
        sendJson(['message' => 'DTR record updated']);
        break;

    case 'DELETE':
        $id = (int) ($_GET['id'] ?? 0);
        if (!$id) sendError('ID required');
        $stmt = $conn->prepare('DELETE FROM dtr_records WHERE id = ?');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        sendJson(['message' => 'DTR record deleted']);
        break;

    default:
        sendError('Method not allowed', 405);
}

$conn->close();
