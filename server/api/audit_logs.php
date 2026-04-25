<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn   = getConnection();

switch ($method) {

    case 'GET':
        $result = $conn->query(
            'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500'
        );
        sendJson($result->fetch_all(MYSQLI_ASSOC));
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) sendError('Invalid JSON body');

        $stmt = $conn->prepare(
            'INSERT INTO audit_logs (user_id, user_name, action, module, details, status)
             VALUES (?,?,?,?,?,?)'
        );
        $status = $data['status'] ?? 'OK';
        $stmt->bind_param(
            'isssss',
            $data['user_id'],
            $data['user_name'],
            $data['action'],
            $data['module'],
            $data['details'],
            $status
        );
        $stmt->execute();
        sendJson(['id' => $conn->insert_id, 'message' => 'Log entry created'], 201);
        break;

    // Archive a log (soft-delete)
    case 'PUT':
        $id   = (int) ($_GET['id'] ?? 0);
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$id || !$data) sendError('Invalid request');

        $stmt = $conn->prepare('UPDATE audit_logs SET archived=? WHERE id=?');
        $archived = (int)($data['archived'] ?? 1);
        $stmt->bind_param('ii', $archived, $id);
        $stmt->execute();
        sendJson(['message' => 'Log entry updated']);
        break;

    default:
        sendError('Method not allowed', 405);
}

$conn->close();
