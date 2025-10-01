<?php	
require_once 'config.php';

$payload = validateAuth();
$userId = $payload['userId'];

try {
    $db = getDB();
    
    // Get group conversations for the user
    $stmt = $db->prepare('SELECT c.* 
                         FROM conversations c 
                         JOIN conversation_participants cp ON c.id = cp.conversation_id 
                         WHERE cp.user_id = :user_id AND c.is_group = 1 
                         ORDER BY c.last_message_at DESC');
    $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    $groups = $stmt->fetchAll();
    
    // Format response
    $response = array_map(function($group) {
        return [
            'id' => $group['id'],
            'name' => $group['name'],
            'avatar' => $group['avatar_url'] ?? 'https://ui-avatars.com/api/?name=' . urlencode($group['name']) . '&background=random',
            'lastMessage' => $group['last_message'],
            'lastMessageTime' => $group['last_message_at'],
            'unreadCount' => 0 // You would calculate this based on user's read status
        ];
    }, $groups);
    
    sendJsonResponse(['success' => true, 'groups' => $response]);
    
} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
