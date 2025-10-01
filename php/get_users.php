<?php
require_once 'config.php';

$payload = validateAuth();

try {
    $db = getDB();
    
    // Get all users except the current one
    $stmt = $db->prepare('SELECT id, username, email, avatar_url, last_login, 
                         (last_login > NOW() - INTERVAL 5 MINUTE) as is_online 
                         FROM users WHERE id != :user_id ORDER BY username');
    $stmt->bindValue(':user_id', $payload['userId'], PDO::PARAM_INT);
    $stmt->execute();
    
    $users = $stmt->fetchAll();
    
    // Format response
    $response = array_map(function($user) {
        return [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'avatar' => $user['avatar_url'],
            'online' => (bool)$user['is_online']
        ];
    }, $users);
    
    sendJsonResponse(['success' => true, 'users' => $response]);
    
} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
