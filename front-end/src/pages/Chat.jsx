import { useRef, useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import httpClient from '../httpClient';

const Chat = () => {
    const {
        chatMessages: messages,
        setChatMessages: setMessages,
        chatVisible: isVisible,
        setChatVisible: setIsVisible,
    } = useOutletContext();
    const [message, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setInput('');
    };

    const proceed_request = async () => {
        if (message) {
            try {
                setIsVisible(false);
                setMessages((prev) => [...prev, { sender: 'user', text: message }]);
                const responce = await httpClient.post(
                    '//localhost:5000/analyze_input',
                    {
                        message,
                        history: messages,
                    }
                );
                setMessages((prev) => [...prev, { sender: 'assistant', text: responce.data['answer'] }]);
                if (
                    responce.data['answer'] !=
                    'Bot was unable to provide a satisfactory answer.'
                ) {
                    responce.data['material'].forEach((e) => {
                        setMessages((prev) => [...prev, { sender: 'assistant', text: e }]);
                    });
                }
                setInput('');
            } catch (e) {
                if (e.response) {
                    if (e.response.status === 401) {
                        alert('Invalid credentials.');
                    } else {
                        console.log('Server error.');
                    }
                } else {
                    console.error(e);
                }
            }
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="content">
            <div className="chat">
                {isVisible ? (
                    <div className="frame-4">
                        <div className="welcome">Welcome to StudyMate</div>
                        <div className="welcome-text">
                            We provide unique live chat training to help you
                            achieve your goals and learn conveniently and
                            efficiently.
                        </div>
                    </div>
                ) : (
                    <div className="chat-content-container">
                        <div className="chat-content">
                            {messages.map((msg, index) => {
                                const isUser = msg.sender === 'user';
                                return (
                                    <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`} key={index}>
                                        {typeof msg.text === 'string' && msg.text.startsWith('http') ? (
                                            <a href={msg.text} target="_blank" rel="noopener noreferrer">
                                                {msg.text}
                                            </a>
                                        ) : (
                                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                                        )}
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef}></div>
                        </div>
                    </div>
                )}
            </div>
            <div className="form-container">
                <form className="input-form" onSubmit={(e) => handleSubmit(e)}>
                    <div className="message-input">
                        <input
                            className="input"
                            type="text"
                            value={message}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="You can ask me anything! I am here to help."
                        />
                        <button
                            className="button-icon"
                            type="submit"
                            onClick={proceed_request}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <path
                                    d="M9.73088 14.2692L19.2337 4.76642M5.48667 7.99807L17.1349 4.11532C18.8344 3.54883 20.4512 5.16564 19.8847 6.8651L16.002 18.5134C15.3895 20.3507 12.8614 20.5304 11.9952 18.7981L10.0549 14.9174C9.84451 14.4967 9.50338 14.1555 9.08267 13.9452L5.20192 12.0048C3.46966 11.1387 3.64933 8.61052 5.48667 7.99807Z"
                                    stroke="#CDCECF"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Chat;
