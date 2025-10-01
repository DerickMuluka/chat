<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'Invalid request method'], 405);
}

$data = getJsonInput();

if (!isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
    sendJsonResponse(['error' => 'Username, email, and password are required'], 400);
}

$username = $data['username'];
$email = $data['email'];
$password = $data['password'];

// Validate input
if (strlen($username) < 3) {
    sendJsonResponse(['error' => 'Username must be at least 3 characters'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJsonResponse(['error' => 'Invalid email address'], 400);
}

if (strlen($password) < 6) {
    sendJsonResponse(['error' => 'Password must be at least 6 characters'], 400);
}

try {
    $db = getDB();
    
    // Check if username or email already exists
    $stmt = $db->prepare('SELECT id FROM users WHERE username = :username OR email = :email');
    $stmt->bindValue(':username', $username, PDO::PARAM_STR);
    $stmt->bindValue(':email', $email, PDO::PARAM_STR);
    $stmt->execute();
    
    if ($stmt->fetch()) {
        sendJsonResponse(['error' => 'Username or email already exists'], 409);
    }
    
    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Generate avatar URL
    $avatarUrl = 'https://ui-avatars.com/api/?name=' . urlencode($username) . '&background=random';
    
    // Insert new user
    $stmt = $db->prepare('INSERT INTO users (username, email, password, avatar_url, created_at) 
                         VALUES (:username, :email, :password, :avatar_url, NOW())');
    $stmt->bindValue(':username', $username, PDO::PARAM_STR);
    $stmt->bindValue(':email', $email, PDO::PARAM_STR);
    $stmt->bindValue(':password', $hashedPassword, PDO::PARAM_STR);
    $stmt->bindValue(':avatar_url', $avatarUrl, PDO::PARAM_STR);
    $stmt->execute();
    
    $userId = $db->lastInsertId();
    
    // Generate JWT token
    $payload = [
        'userId' => $userId,
        'username' => $username,
        'email' => $email,
        'exp' => time() + (60 * 60 * 24) // 24 hours
    ];
    
    $token = generateJWT($payload);
    
    sendJsonResponse([
        'success' => true,
        'token' => $token,
        'user' => [
            'id' => $userId,
            'username' => $username,
            'email' => $email,
            'avatar' => $avatarUrl
        ]
    ], 201);
    
} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => 'Server error: ' . $e->getMessage()], 500);
}
?>
