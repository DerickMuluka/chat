// Chat functionality
class ChatApp {
    constructor() {
        this.currentUser = null;
        this.currentConversation = null;
        this.conversations = [];
        this.messages = [];
        this.socket = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.checkAuthStatus();
    }
    
    bindEvents() {
        // Authentication events
        $('#login-form-data').on('submit', this.handleLogin.bind(this));
        $('#register-form-data').on('submit', this.handleRegister.bind(this));
        $('#logout-btn').on('click', this.handleLogout.bind(this));
        
        // Conversation events
        $('#new-chat-btn').on('click', this.showNewChatModal.bind(this));
        $(document).on('click', '.conversation-item', this.selectConversation.bind(this));
        
        // Message events
        $('#send-btn').on('click', this.sendMessage.bind(this));
        $('#message-input').on('keypress', this.handleMessageKeypress.bind(this));
        
        // UI events
        $('#info-btn').on('click', this.toggleInfoPanel.bind(this));
        $('#close-info-panel').on('click', this.toggleInfoPanel.bind(this));
        $('#emoji-btn').on('click', this.toggleEmojiPicker.bind(this));
        $('#upload-btn').on('click', this.triggerFileUpload.bind(this));
        $('#file-input').on('change', this.handleFileUpload.bind(this));
    }
    
    checkAuthStatus() {
        // Check if user is logged in (in a real app, this would verify with the server)
        const userData = localStorage.getItem('chat_user');
        
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.showChatInterface();
            this.loadConversations();
            this.connectWebSocket();
        } else {
            this.showAuthInterface();
        }
    }
    
    showAuthInterface() {
        $('#auth-modal').removeClass('hidden');
        $('.chat-container').addClass('hidden');
    }
    
    showChatInterface() {
        $('#auth-modal').addClass('hidden');
        $('.chat-container').removeClass('hidden');
        
        // Update user info in UI
        $('#username-display').text(this.currentUser.username);
        $('#user-avatar').attr('src', this.currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.username)}&background=random`);
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const username = $('#login-username').val().trim();
        const password = $('#login-password').val();
        
        if (!username || !password) {
            this.showNotification('Error', 'Please fill in all fields', 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
            // In a real app, this would be an API call
            const userData = await this.mockAPILogin(username, password);
            
            this.currentUser = userData;
            localStorage.setItem('chat_user', JSON.stringify(userData));
            
            this.showChatInterface();
            this.loadConversations();
            this.connectWebSocket();
            
            this.showNotification('Success', 'Login successful', 'success');
        } catch (error) {
            this.showNotification('Error', error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async handleRegister(e) {
        e.preventDefault();
        
        const username = $('#register-username').val().trim();
        const email = $('#register-email').val().trim();
        const password = $('#register-password').val();
        const confirmPassword = $('#register-confirm-password').val();
        
        if (!username || !email || !password || !confirmPassword) {
            this.showNotification('Error', 'Please fill in all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showNotification('Error', 'Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showNotification('Error', 'Password must be at least 6 characters', 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
            // In a real app, this would be an API call
            await this.mockAPIRegister(username, email, password);
            
            // Switch to login form after successful registration
            $('#switch-to-login').click();
            $('#login-username').val(email);
            $('#login-password').val(password);
            
            this.showNotification('Success', 'Account created successfully. Please log in.', 'success');
        } catch (error) {
            this.showNotification('Error', error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    handleLogout() {
        localStorage.removeItem('chat_user');
        this.currentUser = null;
        
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        
        this.showAuthInterface();
        this.showNotification('Info', 'You have been logged out', 'info');
    }
    
    async loadConversations() {
        try {
            // In a real app, this would be an API call
            this.conversations = await this.mockAPIGetConversations();
            this.renderConversations();
        } catch (error) {
            this.showNotification('Error', 'Failed to load conversations', 'error');
        }
    }
    
    renderConversations() {
        const conversationList = $('#conversation-list');
        conversationList.empty();
        
        if (this.conversations.length === 0) {
            conversationList.html('<div class="empty-conversations">No conversations yet</div>');
            return;
        }
        
        this.conversations.forEach(conversation => {
            const convoElement = this.createConversationElement(conversation);
            conversationList.append(convoElement);
        });
    }
    
    createConversationElement(conversation) {
        const lastMessage = conversation.lastMessage || 'No messages yet';
        const time = this.formatTime(conversation.lastMessageTime);
        const unreadBadge = conversation.unreadCount > 0 ? 
            `<div class="unread-count">${conversation.unreadCount}</div>` : '';
        
        return `
            <div class="conversation-item" data-id="${conversation.id}">
                <img src="${conversation.avatar}" alt="${conversation.name}">
                <div class="conversation-info">
                    <h4>${conversation.name}</h4>
                    <p>${lastMessage}</p>
                </div>
                <div class="conversation-meta">
                    <time>${time}</time>
                    ${unreadBadge}
                </div>
            </div>
        `;
    }
    
    async selectConversation(e) {
        const conversationId = $(e.currentTarget).data('id');
        this.currentConversation = this.conversations.find(c => c.id === conversationId);
        
        if (!this.currentConversation) return;
        
        // Update UI
        $('.conversation-item').removeClass('active');
        $(e.currentTarget).addClass('active');
        
        $('#chat-partner-name').text(this.currentConversation.name);
        $('#chat-partner-avatar').attr('src', this.currentConversation.avatar);
        $('#chat-partner-status').text(this.currentConversation.online ? 'Online' : 'Offline');
        
        // Load messages
        await this.loadMessages();
    }
    
    async loadMessages() {
        try {
            // In a real app, this would be an API call
            this.messages = await this.mockAPIGetMessages(this.currentConversation.id);
            this.renderMessages();
        } catch (error) {
            this.showNotification('Error', 'Failed to load messages', 'error');
        }
    }
    
    renderMessages() {
        const messagesContainer = $('#messages');
        messagesContainer.empty();
        
        if (this.messages.length === 0) {
            messagesContainer.html(`
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `);
            return;
        }
        
        this.messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            messagesContainer.append(messageElement);
        });
        
        // Scroll to bottom
        messagesContainer.animate({ scrollTop: messagesContainer[0].scrollHeight }, 300);
    }
    
    createMessageElement(message) {
        const isSent = message.senderId === this.currentUser.id;
        const time = this.formatTime(message.timestamp);
        
        return `
            <div class="message ${isSent ? 'sent' : 'received'}">
                <div class="message-content">
                    <p>${message.text}</p>
                </div>
                <div class="message-time">${time}</div>
            </div>
        `;
    }
    
    async sendMessage() {
        const messageText = $('#message-input').val().trim();
        const fileInput = $('#file-input')[0];
        
        if (!messageText && !fileInput.files.length) return;
        
        try {
            let messageData = {
                text: messageText,
                conversationId: this.currentConversation.id,
                senderId: this.currentUser.id,
                timestamp: new Date()
            };
            
            // Handle file upload if needed
            if (fileInput.files.length) {
                this.showLoading(true);
                
                // In a real app, this would upload the file to a server
                const fileUrl = await this.mockAPIUploadFile(fileInput.files[0]);
                messageData.attachment = fileUrl;
                
                this.showLoading(false);
            }
            
            // Send message via WebSocket or API
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({
                    type: 'message',
                    data: messageData
                }));
            } else {
                // Fallback to API
                await this.mockAPISendMessage(messageData);
            }
            
            // Add message to UI
            this.addMessageToUI(messageData);
            
            // Clear input
            $('#message-input').val('').height('auto');
            $('#file-input').val('');
            $('.file-preview').remove();
            
        } catch (error) {
            this.showNotification('Error', 'Failed to send message', 'error');
        }
    }
    
    addMessageToUI(message) {
        const messagesContainer = $('#messages');
        
        // Remove empty state if it exists
        $('.empty-state').remove();
        
        const messageElement = this.createMessageElement({
            text: message.text,
            senderId: message.senderId,
            timestamp: message.timestamp
        });
        
        messagesContainer.append(messageElement);
        
        // Scroll to bottom
        messagesContainer.animate({ scrollTop: messagesContainer[0].scrollHeight }, 300);
    }
    
    handleMessageKeypress(e) {
        if (e.which === 13 && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }
    
    toggleInfoPanel() {
        $('#info-panel').toggleClass('hidden');
    }
    
    toggleEmojiPicker() {
        $('#emoji-picker').toggleClass('hidden');
    }
    
    triggerFileUpload() {
        $('#file-input').click();
    }
    
    handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Show file preview
        this.showFilePreview(file);
    }
    
    showFilePreview(file) {
        const fileName = file.name;
        const fileSize = this.formatFileSize(file.size);
        const fileType = file.type.split('/')[0];
        
        let fileIcon = 'fa-file';
        if (fileType === 'image') fileIcon = 'fa-file-image';
        else if (fileType === 'video') fileIcon = 'fa-file-video';
        else if (fileType === 'audio') fileIcon = 'fa-file-audio';
        else if (fileName.endsWith('.pdf')) fileIcon = 'fa-file-pdf';
        
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
        }
        
        // Remove file handler
        $('.remove-file').click(() => {
            $('.file-preview').remove();
            $('#file-input').val('');
        });
    }
    
    connectWebSocket() {
        // In a real app, this would connect to your WebSocket server
        console.log('WebSocket connection would be established here');
        
        // Mock WebSocket connection
        this.socket = {
            send: function(data) {
                console.log('WebSocket message sent:', data);
            },
            close: function() {
                console.log('WebSocket connection closed');
            },
            readyState: WebSocket.OPEN
        };
    }
    
    // Mock API methods (in a real app, these would be actual API calls)
    async mockAPILogin(username, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (username && password) {
                    resolve({
                        id: 1,
                        username: username,
                        email: username.includes('@') ? username : `${username}@example.com`,
                        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`
                    });
                } else {
                    reject(new Error('Invalid credentials'));
                }
            }, 1000);
        });
    }
    
    async mockAPIRegister(username, email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (username && email && password) {
                    resolve({ success: true });
                } else {
                    reject(new Error('Registration failed'));
                }
            }, 1000);
        });
    }
    
    async mockAPIGetConversations() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        id: 1,
                        name: 'John Doe',
                        avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
                        lastMessage: 'Hey, how are you doing?',
                        lastMessageTime: new Date(Date.now() - 3600000),
                        unreadCount: 2,
                        online: true
                    },
                    {
                        id: 2,
                        name: 'Jane Smith',
                        avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random',
                        lastMessage: 'Can we meet tomorrow?',
                        lastMessageTime: new Date(Date.now() - 86400000),
                        unreadCount: 0,
                        online: false
                    },
                    {
                        id: 3,
                        name: 'Work Group',
                        avatar: 'https://ui-avatars.com/api/?name=Work+Group&background=random',
                        lastMessage: 'Alice: The meeting is scheduled for 3 PM',
                        lastMessageTime: new Date(Date.now() - 172800000),
                        unreadCount: 5,
                        online: true,
                        isGroup: true
                    }
                ]);
            }, 500);
        });
    }
    
    async mockAPIGetMessages(conversationId) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        id: 1,
                        senderId: 2,
                        text: 'Hey, how are you doing?',
                        timestamp: new Date(Date.now() - 3600000)
                    },
                    {
                        id: 2,
                        senderId: 1,
                        text: 'I\'m good, thanks! How about you?',
                        timestamp: new Date(Date.now() - 3500000)
                    },
                    {
                        id: 3,
                        senderId: 2,
                        text: 'I\'m doing great! Just finished the project we were working on.',
                        timestamp: new Date(Date.now() - 3400000)
                    },
                    {
                        id: 4,
                        senderId: 2,
                        text: 'What do you think if we grab lunch tomorrow?',
                        timestamp: new Date(Date.now() - 3300000)
                    }
                ]);
            }, 500);
        });
    }
    
    async mockAPISendMessage(message) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, message: message });
            }, 300);
        });
    }
    
    async mockAPIUploadFile(file) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Return a mock URL
                resolve(URL.createObjectURL(file));
            }, 1000);
        });
    }
    
    formatTime(date) {
        if (!date) return '';
        
        const now = new Date();
        const diff = now - new Date(date);
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        
        return date.toLocaleDateString();
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    showLoading(show) {
        if (show) {
            $('#loading-overlay').removeClass('hidden');
        } else {
            $('#loading-overlay').addClass('hidden');
        }
    }
    
    showNotification(title, message, type = 'info') {
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
}

// Initialize the chat app when the document is ready
$(document).ready(() => {
    window.chatApp = new ChatApp();
});
