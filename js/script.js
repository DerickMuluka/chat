$(document).ready(function() {
    // Authentication Toggle
    $('#switch-to-register').click(function(e) {
        e.preventDefault();
        $('#login-form').addClass('hidden');
        $('#register-form').removeClass('hidden');
        $('.auth-tabs .tab-btn').removeClass('active');
        $('.auth-tabs .tab-btn[data-tab="register"]').addClass('active');
    });

    $('#switch-to-login').click(function(e) {
        e.preventDefault();
        $('#register-form').addClass('hidden');
        $('#login-form').removeClass('hidden');
        $('.auth-tabs .tab-btn').removeClass('active');
        $('.auth-tabs .tab-btn[data-tab="login"]').addClass('active');
    });

    $('.auth-tabs .tab-btn').click(function() {
        const tab = $(this).data('tab');
        $('.auth-tabs .tab-btn').removeClass('active');
        $(this).addClass('active');
        
        if (tab === 'login') {
            $('#register-form').addClass('hidden');
            $('#login-form').removeClass('hidden');
        } else {
            $('#login-form').addClass('hidden');
            $('#register-form').removeClass('hidden');
        }
    });

    // Password Visibility Toggle
    $('.toggle-password').click(function() {
        const input = $(this).siblings('input');
        const icon = $(this).find('i');
        
        if (input.attr('type') === 'password') {
            input.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            input.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });

    // Login Form Submission
    $('#login-form-data').submit(function(e) {
        e.preventDefault();
        const username = $('#login-username').val().trim();
        const password = $('#login-password').val();
        
        if (!username || !password) {
            showNotification('Error', 'Please fill in all fields', 'error');
            return;
        }
        
        $('#loading-overlay').removeClass('hidden');
        
        // Simulate API call
        setTimeout(() => {
            $('#loading-overlay').addClass('hidden');
            $('#auth-modal').addClass('hidden');
            $('.chat-container').removeClass('hidden');
            
            // Set user data (in a real app, this would come from the server)
            $('#username-display').text(username);
            $('#user-avatar').attr('src', `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`);
            
            // Load conversations
            loadConversations();
            
            showNotification('Success', 'You have successfully logged in', 'success');
        }, 1500);
    });

    // Register Form Submission
    $('#register-form-data').submit(function(e) {
        e.preventDefault();
        const username = $('#register-username').val().trim();
        const email = $('#register-email').val().trim();
        const password = $('#register-password').val();
        const confirmPassword = $('#register-confirm-password').val();
        
        if (!username || !email || !password || !confirmPassword) {
            showNotification('Error', 'Please fill in all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('Error', 'Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            showNotification('Error', 'Password must be at least 6 characters', 'error');
            return;
        }
        
        $('#loading-overlay').removeClass('hidden');
        
        // Simulate API call
        setTimeout(() => {
            $('#loading-overlay').addClass('hidden');
            
            // Switch to login form after successful registration
            $('#switch-to-login').click();
            $('#login-username').val(email);
            $('#login-password').val(password);
            
            showNotification('Success', 'Account created successfully. Please log in.', 'success');
        }, 1500);
    });

    // Logout
    $('#logout-btn').click(function() {
        $('.chat-container').addClass('hidden');
        $('#auth-modal').removeClass('hidden');
        
        // Clear any existing data
        $('#conversation-list').empty();
        $('#messages').html(`
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <p>Select a conversation to start messaging</p>
            </div>
        `);
        
        showNotification('Info', 'You have been logged out', 'info');
    });

    // Conversation Tabs
    $('.conversation-tabs .tab-btn').click(function() {
        const tab = $(this).data('tab');
        $('.conversation-tabs .tab-btn').removeClass('active');
        $(this).addClass('active');
        
        // In a real app, this would load different content based on the tab
        loadConversations();
    });

    // New Conversation Button
    $('#new-chat-btn').click(function() {
        $('#new-chat-modal').removeClass('hidden');
        loadUsers();
    });

    // Close Modals
    $('.close-modal').click(function() {
        $(this).closest('.modal').addClass('hidden');
    });

    // Info Panel Toggle
    $('#info-btn').click(function() {
        $('#info-panel').toggleClass('hidden');
    });

    $('#close-info-panel').click(function() {
        $('#info-panel').addClass('hidden');
    });

    // Emoji Picker
    $('#emoji-btn').click(function() {
        $('#emoji-picker').toggleClass('hidden');
    });

    // Sample emojis
    const emojis = ['😀', '😂', '😍', '🤔', '😎', '🥳', '😭', '😡', '👍', '❤️', '🔥', '🎉'];
    const emojiPicker = $('#emoji-picker');
    
    emojis.forEach(emoji => {
        emojiPicker.append(`<div class="emoji">${emoji}</div>`);
    });
    
    $('.emoji').click(function() {
        const emoji = $(this).text();
        const messageInput = $('#message-input');
        messageInput.val(messageInput.val() + emoji);
        $('#emoji-picker').addClass('hidden');
        messageInput.focus();
    });

    // File Upload
    $('#upload-btn').click(function() {
        $('#file-input').click();
    });

    $('#file-input').change(function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            const fileName = file.name;
            const fileSize = formatFileSize(file.size);
            const fileType = file.type.split('/')[0];
            
            let fileIcon = 'fa-file';
            if (fileType === 'image') fileIcon = 'fa-file-image';
            else if (fileType === 'video') fileIcon = 'fa-file-video';
            else if (fileType === 'audio') fileIcon = 'fa-file-audio';
            else if (fileName.endsWith('.pdf')) fileIcon = 'fa-file-pdf';
            
            // Show file preview
            const filePreview = `
                <div class="file-preview">
                    <i class="fas ${fileIcon}"></i>
                    <div class="file-info">
                        <h5>${fileName}</h5>
                        <p>${fileSize}</p>
                    </div>
                    <i class="fas fa-times remove-file"></i>
                </div>
            `;
            
            // Check if there's already a file preview
            if ($('.file-preview').length) {
                $('.file-preview').replaceWith(filePreview);
            } else {
                $('#messages').append(filePreview);
                $('#messages').animate({ scrollTop: $('#messages')[0].scrollHeight }, 300);
            }
            
            // Remove file handler
            $('.remove-file').click(function() {
                $('.file-preview').remove();
                $('#file-input').val('');
            });
        }
    });

    // Send Message
    $('#send-btn').click(sendMessage);
    $('#message-input').keypress(function(e) {
        if (e.which === 13 && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    function sendMessage() {
        const messageText = $('#message-input').val().trim();
        const fileInput = $('#file-input')[0];
        
        if (!messageText && !fileInput.files.length) return;
        
        // If there's a file, upload it
        if (fileInput.files.length) {
            // Simulate file upload
            $('#loading-overlay').removeClass('hidden');
            
            setTimeout(() => {
                $('#loading-overlay').addClass('hidden');
                
                const file = fileInput.files[0];
                const fileName = file.name;
                const fileType = file.type.split('/')[0];
                
                // Add message with file
                addMessage('You', messageText, new Date(), true, fileType === 'image' ? fileName : null);
                
                // Clear inputs
                $('#message-input').val('');
                $('.file-preview').remove();
                fileInput.value = '';
            }, 1000);
        } else {
            // Add text message
            addMessage('You', messageText, new Date(), true);
            $('#message-input').val('').height('auto');
        }
    }

    // Load sample conversations
    function loadConversations() {
        const conversations = [
            {
                id: 1,
                name: 'John Doe',
                avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
                lastMessage: 'Hey, how are you doing?',
                time: '10:30 AM',
                unread: 2,
                online: true
            },
            {
                id: 2,
                name: 'Jane Smith',
                avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random',
                lastMessage: 'Can we meet tomorrow?',
                time: 'Yesterday',
                unread: 0,
                online: false
            },
            {
                id: 3,
                name: 'Work Group',
                avatar: 'https://ui-avatars.com/api/?name=Work+Group&background=random',
                lastMessage: 'Alice: The meeting is scheduled for 3 PM',
                time: '12/15/2023',
                unread: 5,
                online: true,
                isGroup: true
            }
        ];
        
        const conversationList = $('#conversation-list');
        conversationList.empty();
        
        conversations.forEach(convo => {
            const convoItem = `
                <div class="conversation-item" data-id="${convo.id}">
                    <img src="${convo.avatar}" alt="${convo.name}">
                    <div class="conversation-info">
                        <h4>${convo.name}</h4>
                        <p>${convo.lastMessage}</p>
                    </div>
                    <div class="conversation-meta">
                        <time>${convo.time}</time>
                        ${convo.unread > 0 ? `<div class="unread-count">${convo.unread}</div>` : ''}
                    </div>
                </div>
            `;
            
            conversationList.append(convoItem);
        });
        
        // Conversation click handler
        $('.conversation-item').click(function() {
            $('.conversation-item').removeClass('active');
            $(this).addClass('active');
            
            const convoId = $(this).data('id');
            const conversation = conversations.find(c => c.id === convoId);
            
            if (conversation) {
                // Update chat header
                $('#chat-partner-name').text(conversation.name);
                $('#chat-partner-avatar').attr('src', conversation.avatar);
                $('#chat-partner-status').text(conversation.online ? 'Online' : 'Offline');
                
                // Load messages
                loadMessages(convoId);
            }
        });
    }
    
    // Load sample users for new conversation modal
    function loadUsers() {
        const users = [
            {
                id: 4,
                name: 'Mike Johnson',
                avatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=random',
                status: 'Online'
            },
            {
                id: 5,
                name: 'Sarah Williams',
                avatar: 'https://ui-avatars.com/api/?name=Sarah+Williams&background=random',
                status: 'Offline'
            },
            {
                id: 6,
                name: 'David Brown',
                avatar: 'https://ui-avatars.com/api/?name=David+Brown&background=random',
                status: 'Online'
            }
        ];
        
        const userList = $('#user-list');
        userList.empty();
        
        users.forEach(user => {
            const userItem = `
                <div class="conversation-item" data-id="${user.id}">
                    <img src="${user.avatar}" alt="${user.name}">
                    <div class="conversation-info">
                        <h4>${user.name}</h4>
                        <p>${user.status}</p>
                    </div>
                </div>
            `;
            
            userList.append(userItem);
        });
        
        // User click handler
        $('.conversation-item', userList).click(function() {
            const userId = $(this).data('id');
            const user = users.find(u => u.id === userId);
            
            if (user) {
                // Create a new conversation
                $('#new-chat-modal').addClass('hidden');
                
                // Update chat header
                $('#chat-partner-name').text(user.name);
                $('#chat-partner-avatar').attr('src', user.avatar);
                $('#chat-partner-status').text(user.status);
                
                // Clear messages for new conversation
                $('#messages').html(`
                    <div class="empty-state">
                        <i class="fas fa-comments"></i>
                        <p>Start a conversation with ${user.name}</p>
                    </div>
                `);
            }
        });
    }
    
    // Load sample messages
    function loadMessages(conversationId) {
        const messages = [
            {
                id: 1,
                sender: 'John Doe',
                text: 'Hey, how are you doing?',
                time: new Date(Date.now() - 3600000),
                isSent: false
            },
            {
                id: 2,
                sender: 'You',
                text: 'I\'m good, thanks! How about you?',
                time: new Date(Date.now() - 3500000),
                isSent: true
            },
            {
                id: 3,
                sender: 'John Doe',
                text: 'I\'m doing great! Just finished the project we were working on.',
                time: new Date(Date.now() - 3400000),
                isSent: false
            },
            {
                id: 4,
                sender: 'John Doe',
                text: 'What do you think if we grab lunch tomorrow?',
                time: new Date(Date.now() - 3300000),
                isSent: false
            }
        ];
        
        const messagesContainer = $('#messages');
        messagesContainer.empty();
        
        if (messages.length === 0) {
            messagesContainer.html(`
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `);
            return;
        }
        
        messages.forEach(msg => {
            addMessage(msg.sender, msg.text, msg.time, msg.isSent);
        });
        
        // Scroll to bottom
        messagesContainer.animate({ scrollTop: messagesContainer[0].scrollHeight }, 300);
    }
    
    // Add a message to the chat
    function addMessage(sender, text, time, isSent, attachment = null) {
        const messagesContainer = $('#messages');
        
        // Remove empty state if it exists
        $('.empty-state').remove();
        
        const timeString = formatTime(time);
        let messageHtml = '';
        
        if (attachment) {
            if (attachment.startsWith('http') || attachment.endsWith('.jpg') || attachment.endsWith('.png')) {
                // Image attachment
                messageHtml = `
                    <div class="message ${isSent ? 'sent' : 'received'}">
                        <div class="message-content">
                            <img src="${attachment}" alt="Attachment" style="max-width: 200px; border-radius: 8px; margin-bottom: 0.5rem;">
                            ${text ? `<p>${text}</p>` : ''}
                        </div>
                        <div class="message-time">${timeString}</div>
                    </div>
                `;
            } else {
                // File attachment
                messageHtml = `
                    <div class="message ${isSent ? 'sent' : 'received'}">
                        <div class="message-content">
                            <div class="file-message">
                                <i class="fas fa-file"></i>
                                <div>
                                    <p><strong>${attachment}</strong></p>
                                    ${text ? `<p>${text}</p>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="message-time">${timeString}</div>
                    </div>
                `;
            }
        } else {
            // Text message
            messageHtml = `
                <div class="message ${isSent ? 'sent' : 'received'}">
                    <div class="message-content">
                        <p>${text}</p>
                    </div>
                    <div class="message-time">${timeString}</div>
                </div>
            `;
        }
        
        messagesContainer.append(messageHtml);
        
        // Scroll to bottom
        messagesContainer.animate({ scrollTop: messagesContainer[0].scrollHeight }, 300);
    }
    
    // Utility function to format time
    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Utility function to format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Show notification
    function showNotification(title, message, type = 'info') {
        const icon = type === 'success' ? 'fa-check-circle' : 
                     type === 'error' ? 'fa-exclamation-circle' : 
                     type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
        
        const notification = $(`
            <div class="notification ${type}">
                <i class="fas ${icon}"></i>
                <div class="notification-content">
                    <h4>${title}</h4>
                    <p>${message}</p>
                </div>
            </div>
        `);
        
        $('body').append(notification);
        
        setTimeout(() => {
            notification.addClass('show');
        }, 100);
        
        setTimeout(() => {
            notification.removeClass('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Initialize the app
    function init() {
        // Check if user is logged in (in a real app, this would check localStorage or a cookie)
        const isLoggedIn = false; // Change to true to skip login
        
        if (isLoggedIn) {
            $('#auth-modal').addClass('hidden');
            $('.chat-container').removeClass('hidden');
            loadConversations();
        } else {
            $('#auth-modal').removeClass('hidden');
            $('.chat-container').addClass('hidden');
        }
    }
    
    // Start the app
    init();
});
