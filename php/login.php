<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'Invalid request method'], 405);
}

$data = getJsonInput();

if (!isset($data['username']) || !isset($data['password'])) {
    sendJsonResponse(['error' => 'Username and password are required'], 400);
}

$username = $data['username'];
$password = $data['password'];

try {
    $db = getDB();
    
    // Check if user exists
    $stmt = $db->prepare('SELECT * FROM users WHERE username = :username OR email = :username');
    $stmt->bindValue(':username', $username, PDO::PARAM_STR);
    $stmt->execute();
    
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password'])) {
        sendJsonResponse(['error' => 'Invalid username or password'], 401);
    }
    
    // Generate JWT token
    $payload = [
        'userId' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'exp' => time() + (60 * 60 * 24) // 24 hours
    ];
    
    $token = generateJWT($payload);
    
    // Update last login time
    $stmt = $db->prepare('UPDATE users SET last_login = NOW() WHERE id = :id');
    $stmt->bindValue(':id', $user['id'], PDO::PARAM_INT);
    $stmt->execute();
    
    sendJsonResponse([
        'success' => true,
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'avatar' => $user['avatar_url']
        ]
    ]);
    
} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => 'Server error: ' . $e->getMessage()], 500);
}
?>
