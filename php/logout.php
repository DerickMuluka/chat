<?php
require_once 'config.php';

// In a stateless JWT system, logout is handled on the client side by discarding the token
// This endpoint can be used for logging activities or blacklisting tokens if needed

$payload = validateAuth();

try {
    $db = getDB();
    
    // Record logout activity (optional)
    $stmt = $db->prepare('INSERT INTO user_activities (user_id, activity_type, created_at) 
                         VALUES (:user_id, "logout", NOW())');
    $stmt->bindValue(':user_id', $payload['userId'], PDO::PARAM_INT);
    $stmt->execute();
    
    sendJsonResponse(['success' => true, 'message' => 'Logged out successfully']);
    
} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
