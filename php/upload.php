<?php
require_once 'config.php';

$payload = validateAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'Invalid request method'], 405);
}

if (!isset($_FILES['file'])) {
    sendJsonResponse(['error' => 'No file uploaded'], 400);
}

$file = $_FILES['file'];
$validation = validateFile($file);

if (!$validation['success']) {
    sendJsonResponse(['error' => $validation['error']], 400);
}

// Generate unique filename
$filename = generateFilename($file['name'], $validation['mimeType']);
$filepath = UPLOAD_DIR . $filename;

// Create upload directory if it doesn't exist
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0777, true);
}

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $filepath)) {
    sendJsonResponse(['error' => 'Failed to save file'], 500);
}

// Return file URL
$fileUrl = 'uploads/' . $filename;

sendJsonResponse([
    'success' => true,
    'fileUrl' => $fileUrl,
    'fileName' => $file['name'],
    'fileSize' => $file['size']
]);
?>
