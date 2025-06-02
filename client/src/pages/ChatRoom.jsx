// ChatRoom.jsx
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

function ChatRoom({ roomId, username }) {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);

  useEffect(() => {
    socket.emit('join_room', roomId);

    socket.on('receive_message', (data) => {
      setChat((prev) => [...prev, data]);
    });

    return () => socket.disconnect();
  }, [roomId]);

  const sendMessage = () => {
    const msgData = {
      room: roomId,
      sender: username,
      content: message
    };
    socket.emit('send_message', msgData);
    setChat((prev) => [...prev, msgData]);
    setMessage('');
  };

  return (
    <div>
      <h2>Room: {roomId}</h2>
      <div>
        {chat.map((msg, i) => (
          <p key={i}><strong>{msg.sender}</strong>: {msg.content}</p>
        ))}
      </div>
      <input value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
