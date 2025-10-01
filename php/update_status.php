<?php
require_once 'config.php';

$payload = validateAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'Invalid request method'], 405);
}

$data = getJsonInput();
$userId = $payload['userId'];

try {
    $db = getDB();
    
    // Update user's last activity time
    $stmt = $db->prepare('UPDATE users SET last_login = NOW() WHERE id = :user_id');
    $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    sendJsonResponse(['success' => true, 'message' => 'Status updated']);
    
} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
