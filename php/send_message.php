<?php
require_once 'config.php';

$payload = validateAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'Invalid request method'], 405);
}

$data = getJsonInput();

if (!isset($data['conversation_id']) || (!isset($data['text']) && !isset($data['attachment']))) {
    sendJsonResponse(['error' => 'Conversation ID and message content or attachment are required'], 400);
}

$conversationId = $data['conversation_id'];
$text = $data['text'] ?? '';
$attachment = $data['attachment'] ?? null;
$userId = $payload['userId'];

try {
    $db = getDB();
    
    // Verify user has access to this conversation
    $stmt = $db->prepare('SELECT id FROM conversation_participants 
                         WHERE conversation_id = :conversation_id AND user_id = :user_id');
    $stmt->bindValue(':conversation_id', $conversationId, PDO::PARAM_INT);
    $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    if (!$stmt->fetch()) {
        sendJsonResponse(['error' => 'Access denied to this conversation'], 403);
    }
    
    // Insert message
    $stmt = $db->prepare('INSERT INTO messages (conversation_id, sender_id, message_text, attachment_url, created_at) 
                         VALUES (:conversation_id, :sender_id, :message_text, :attachment_url, NOW())');
    $stmt->bindValue(':conversation_id', $conversationId, PDO::PARAM_INT);
    $stmt->bindValue(':sender_id', $userId, PDO::PARAM_INT);
    $stmt->bindValue(':message_text', $text, PDO::PARAM_STR);
    $stmt->bindValue(':attachment_url', $attachment, PDO::PARAM_STR);
    $stmt->execute();
    
    $messageId = $db->lastInsertId();
    
    // Get the complete message details
    $stmt = $db->prepare('SELECT m.*, u.username, u.avatar_url 
                         FROM messages m 
                         JOIN users u ON m.sender_id = u.id 
                         WHERE m.id = :message_id');
    $stmt->bindValue(':message_id', $messageId, PDO::PARAM_INT);
    $stmt->execute();
    
    $message = $stmt->fetch();
    
    // Update conversation last message timestamp
    $stmt = $db->prepare('UPDATE conversations SET last_message_at = NOW() WHERE id = :conversation_id');
    $stmt->bindValue(':conversation_id', $conversationId, PDO::PARAM_INT);
    $stmt->execute();
    
    // Format response
    $response = [
        'id' => $message['id'],
        'text' => $message['message_text'],
        'senderId' => $message['sender_id'],
        'senderName' => $message['username'],
        'senderAvatar' => $message['avatar_url'],
        'timestamp' => $message['created_at'],
        'isSent' => true,
        'attachment' => $message['attachment_url']
    ];
    
    sendJsonResponse(['success' => true, 'message' => $response], 201);
    
} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
