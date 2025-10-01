<?php
require_once 'config.php';

$payload = validateAuth();

if (!isset($_GET['conversation_id'])) {
    sendJsonResponse(['error' => 'Conversation ID is required'], 400);
}

$conversationId = $_GET['conversation_id'];
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
    
    // Get messages
    $stmt = $db->prepare('SELECT m.*, u.username, u.avatar_url 
                         FROM messages m 
                         JOIN users u ON m.sender_id = u.id 
                         WHERE m.conversation_id = :conversation_id 
                         ORDER BY m.created_at ASC');
    $stmt->bindValue(':conversation_id', $conversationId, PDO::PARAM_INT);
    $stmt->execute();
    
    $messages = $stmt->fetchAll();
    
    // Format messages
    $formattedMessages = array_map(function($message) use ($userId) {
        return [
            'id' => $message['id'],
            'text' => $message['message_text'],
            'senderId' => $message['sender_id'],
            'senderName' => $message['username'],
            'senderAvatar' => $message['avatar_url'],
            'timestamp' => $message['created_at'],
            'isSent' => $message['sender_id'] == $userId,
            'attachment' => $message['attachment_url']
        ];
    }, $messages);
    
    // Mark messages as read
    $stmt = $db->prepare('UPDATE conversation_participants 
                         SET last_read = NOW() 
                         WHERE conversation_id = :conversation_id AND user_id = :user_id');
    $stmt->bindValue(':conversation_id', $conversationId, PDO::PARAM_INT);
    $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    sendJsonResponse(['success' => true, 'messages' => $formattedMessages]);
    
} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
