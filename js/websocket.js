// WebSocket functionality for real-time messaging
class ChatWebSocket {
    constructor(url) {
        this.url = url;
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000; // 3 seconds
        this.messageHandlers = [];
        
        this.connect();
    }
    
    connect() {
        try {
            this.socket = new WebSocket(this.url);
            
            this.socket.onopen = () => {
                console.log('WebSocket connection established');
                this.reconnectAttempts = 0;
                this.onConnected();
            };
            
            this.socket.onmessage = (event) => {
                this.handleMessage(event);
            };
            
            this.socket.onclose = (event) => {
                console.log('WebSocket connection closed', event);
                this.onDisconnected();
                
                // Attempt to reconnect
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    setTimeout(() => {
                        this.reconnectAttempts++;
                        this.connect();
                    }, this.reconnectInterval);
                }
            };
            
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.onError(error);
            };
            
        } catch (error) {
            console.error('Failed to establish WebSocket connection:', error);
        }
    }
    
    onConnected() {
        // Notify all handlers that connection is established
        this.notifyHandlers('connected', null);
    }
    
    onDisconnected() {
        // Notify all handlers that connection is lost
        this.notifyHandlers('disconnected', null);
    }
    
    onError(error) {
        // Notify all handlers about error
        this.notifyHandlers('error', error);
    }
    
    handleMessage(event) {
        try {
            const message = JSON.parse(event.data);
            this.notifyHandlers('message', message);
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }
    
    send(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
            return true;
        } else {
            console.warn('WebSocket is not connected');
            return false;
        }
    }
    
    close() {
        if (this.socket) {
            this.socket.close();
        }
    }
    
    addMessageHandler(handler) {
        this.messageHandlers.push(handler);
    }
    
    removeMessageHandler(handler) {
        const index = this.messageHandlers.indexOf(handler);
        if (index !== -1) {
            this.messageHandlers.splice(index, 1);
        }
    }
    
    notifyHandlers(type, data) {
        this.messageHandlers.forEach(handler => {
            try {
                handler(type, data);
            } catch (error) {
                console.error('Error in message handler:', error);
            }
        });
    }
}

// WebSocket message types
const MessageType = {
    TEXT: 'text',
    IMAGE: 'image',
    FILE: 'file',
    TYPING_START: 'typing_start',
    TYPING_STOP: 'typing_stop',
    USER_JOINED: 'user_joined',
    USER_LEFT: 'user_left',
    MESSAGE_READ: 'message_read'
};

// WebSocket event types
const EventType = {
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error',
    MESSAGE: 'message'
};

// Create a global WebSocket instance
// In a real application, you would use your server's WebSocket URL
// const webSocket = new ChatWebSocket('wss://your-websocket-server.com/chat');
