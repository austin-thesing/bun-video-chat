import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

interface Message {
  id: number;
  user_id: string;
  username: string;
  content: string;
  timestamp: number;
}

interface User {
  id: string;
  username: string;
  status: 'online' | 'offline';
}

interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
}

const App = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(1);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    loginIdentifier: '', // For login - can be email or username
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    
    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
      
      // Send presence message
      if (user) {
        ws.send(JSON.stringify({
          type: 'presence',
          payload: {
            user_id: user.id,
            username: user.username,
            status: 'online'
          },
          timestamp: Date.now()
        }));
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'chat':
          setMessages(prev => [...prev, {
            id: data.payload.id,
            user_id: data.payload.user_id,
            username: data.payload.username || `User ${data.payload.user_id}`,
            content: data.payload.content,
            timestamp: data.timestamp
          }]);
          break;
        case 'presence':
          setUsers(prev => {
            const existing = prev.find(u => u.id === data.payload.user_id);
            if (existing) {
              return prev.map(u => 
                u.id === data.payload.user_id 
                  ? { ...u, status: data.payload.status }
                  : u
              );
            } else {
              return [...prev, {
                id: data.payload.user_id,
                username: data.payload.username,
                status: data.payload.status
              }];
            }
          });
          break;
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authMode === 'register' && (!formData.username.trim() || !formData.email.trim() || !formData.password.trim())) {
      alert('Please fill in all fields');
      return;
    }
    
    if (authMode === 'login' && (!formData.loginIdentifier.trim() || !formData.password.trim())) {
      alert('Please fill in email/username and password');
      return;
    }

    try {
      const endpoint = authMode === 'register' ? '/api/register' : '/api/login';
      const body = authMode === 'register' 
        ? { username: formData.username, email: formData.email, password: formData.password }
        : { email: formData.loginIdentifier, password: formData.password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        connectWebSocket();
      } else {
        const errorText = await response.text();
        alert(errorText);
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('Authentication failed');
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || !wsRef.current || !user) return;

    wsRef.current.send(JSON.stringify({
      type: 'chat',
      payload: {
        room_id: currentRoom,
        user_id: user.id,
        username: user.username,
        content: currentMessage.trim(),
        type: 'text'
      },
      timestamp: Date.now()
    }));

    setCurrentMessage('');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <div className="flex mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 px-4 text-center font-semibold ${
                authMode === 'login'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              } rounded-l-md`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 px-4 text-center font-semibold ${
                authMode === 'register'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              } rounded-r-md`}
            >
              Register
            </button>
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-6">
            {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          
          <form onSubmit={handleAuth}>
            {authMode === 'register' && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Choose a username"
                  required
                />
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                {authMode === 'login' ? 'Email or Username' : 'Email'}
              </label>
              <input
                type={authMode === 'login' ? 'text' : 'email'}
                value={authMode === 'login' ? formData.loginIdentifier : formData.email}
                onChange={(e) => setFormData({
                  ...formData, 
                  [authMode === 'login' ? 'loginIdentifier' : 'email']: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={authMode === 'login' ? 'Enter your email or username' : 'Enter your email'}
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Bun Video Chat</h2>
          <p className="text-sm text-gray-600">Welcome, {user.username}!</p>
          <div className="flex items-center mt-2">
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Online Users</h3>
          <div className="space-y-2">
            {users.filter(u => u.status === 'online').map(user => (
              <div key={user.id} className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm">{user.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white shadow-sm p-4 border-b">
          <h3 className="text-lg font-semibold">General Chat</h3>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                {message.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <span className="font-semibold text-sm">{message.username}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-800">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t p-4">
          <form onSubmit={sendMessage} className="flex">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type a message..."
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!isConnected || !currentMessage.trim()}
              className="bg-blue-500 text-white px-6 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);