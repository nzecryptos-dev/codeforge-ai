import React, { useState } from 'react';

const ChatInterface = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');

    const handleSendMessage = () => {
        if (inputValue.trim()) {
            const newMessage = { text: inputValue, timestamp: new Date().toISOString() };
            setMessages([...messages, newMessage]);
            setInputValue('');
        }
    };

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    };

    const handleExportConversation = () => {
        const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'conversation.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <div className="chat-window" style={{ border: '1px solid #ccc', padding: '20px', height: '400px', overflowY: 'scroll' }}>
                {messages.map((message, index) => (
                    <div key={index} className="message">
                        <span>{new Date(message.timestamp).toLocaleTimeString()}: </span>
                        <span>{message.text}</span>
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Type your message..."
                style={{ width: '70%' }}
            />
            <button onClick={handleSendMessage}>Send</button>
            <button onClick={handleExportConversation} style={{ marginLeft: '10px' }}>Export</button>
        </div>
    );
};

export default ChatInterface;