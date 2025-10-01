CREATE DATABASE message_app;
USE message_app;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    last_login DATETIME,
    created_at DATETIME NOT NULL
);

CREATE TABLE conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    is_group BOOLEAN DEFAULT FALSE,
    avatar_url VARCHAR(255),
    last_message TEXT,
    last_message_at DATETIME,
    created_by INT,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE conversation_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    user_id INT NOT NULL,
    last_read DATETIME,
    joined_at DATETIME NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY (conversation_id, user_id)
);

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_text TEXT,
    attachment_url VARCHAR(255),
    created_at DATETIME NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type VARCHAR(20) NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);