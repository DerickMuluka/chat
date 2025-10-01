<?php
require_once 'config.php';

$payload = validateAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'Invalid request method'], 405);
}

$data = getJsonInput();

if (!isset($data['name']) || !isset($data['participants'])) {
    sendJsonResponse(['error' => 'Group name and participants are required'], 400);
}

$name = $data['name'];
$participants = $data['participants'];
$userId = $payload['userId'];

// Add current user to participants if not already included
if (!in_array($userId, $participants)) {
    $participants[] = $userId;
}

try {
    $db = getDB();
    
    // Start transaction
    $db->beginTransaction();
    
    // Create conversation
    $stmt = $db->prepare('INSERT INTO conversations (name, is_group, created_by, created_at) 
                         VALUES (:name, 1, :created_by, NOW())');
    $stmt->bindValue(':name', $name, PDO::PARAM_STR);
    $stmt->bindValue(':created_by', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    $conversationId = $db->lastInsertId();
    
    // Add participants
    foreach ($participants as $participantId) {
        $stmt = $db->prepare('INSERT INTO conversation_participants (conversation_id, user_id, joined_at) 
                             VALUES (:conversation_id, :user_id, NOW())');
        $stmt->bindValue(':conversation_id', $conversationId, PDO::PARAM_INT);
        $stmt->bindValue(':user_id', $participantId, PDO::PARAM_INT);
        $stmt->execute();
    }
    
    // Commit transaction
    $db->commit();
    
    sendJsonResponse([
        'success' => true,
        'conversation' => [
            'id' => $conversationId,
            'name' => $name,
            'isGroup' => true
        ]
    ], 201);
    
} catch (PDOException $e) {
    $db->rollBack();
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
