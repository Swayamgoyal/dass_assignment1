import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { io } from 'socket.io-client'
import ParticipantNav from '../components/ParticipantNav'
import api from '../services/api'
import './TeamChat.css'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

export default function TeamChat() {
    const { teamId } = useParams()
    const { user } = useSelector(state => state.auth)
    const [messages, setMessages] = useState([])
    const [newMsg, setNewMsg] = useState('')
    const [teamName, setTeamName] = useState('')
    const [onlineUsers, setOnlineUsers] = useState([])
    const [typingUsers, setTypingUsers] = useState([])
    const [connected, setConnected] = useState(false)
    const socketRef = useRef(null)
    const messagesEndRef = useRef(null)
    const typingTimeoutRef = useRef(null)

    // Load message history
    useEffect(() => {
        const loadMessages = async () => {
            try {
                const res = await api.get(`/chat/${teamId}/messages`)
                if (res.data.success) {
                    setMessages(res.data.data)
                    setTeamName(res.data.teamName)
                }
            } catch (err) {
                console.error('Failed to load messages:', err)
            }
        }
        loadMessages()
    }, [teamId])

    // Setup Socket.IO connection
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) return

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling']
        })

        socketRef.current = socket

        socket.on('connect', () => {
            setConnected(true)
            socket.emit('joinTeamRoom', teamId)
        })

        socket.on('disconnect', () => {
            setConnected(false)
        })

        socket.on('newMessage', (msg) => {
            setMessages(prev => [...prev, msg])
        })

        socket.on('onlineUsers', (users) => {
            setOnlineUsers(users)
        })

        socket.on('userTyping', ({ userId, userName }) => {
            setTypingUsers(prev => {
                if (prev.some(u => u.userId === userId)) return prev
                return [...prev, { userId, userName }]
            })
        })

        socket.on('userStoppedTyping', ({ userId }) => {
            setTypingUsers(prev => prev.filter(u => u.userId !== userId))
        })

        socket.on('error', (err) => {
            console.error('Socket error:', err)
        })

        return () => {
            socket.emit('leaveTeamRoom', teamId)
            socket.disconnect()
        }
    }, [teamId])

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = () => {
        const trimmed = newMsg.trim()
        if (!trimmed || !socketRef.current) return

        socketRef.current.emit('sendMessage', {
            teamId,
            message: trimmed
        })
        setNewMsg('')

        // Stop typing indicator
        socketRef.current.emit('stopTyping', teamId)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
            return
        }

        // Typing indicator
        if (socketRef.current) {
            socketRef.current.emit('typing', teamId)
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = setTimeout(() => {
                socketRef.current?.emit('stopTyping', teamId)
            }, 2000)
        }
    }

    const formatTime = (ts) => {
        const d = new Date(ts)
        const now = new Date()
        const isToday = d.toDateString() === now.toDateString()
        if (isToday) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
            d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const otherTyping = typingUsers.filter(u => u.userId !== user?._id)

    return (
        <div className="page-wrapper">
            <ParticipantNav />
            <main className="page-content">
                <div className="team-chat-page">
                    {/* Header */}
                    <div className="chat-header">
                        <div>
                            <Link to="/my-teams" className="chat-back-link">← Back to Teams</Link>
                            <h2>💬 {teamName || 'Team Chat'}</h2>
                        </div>
                        <div className="chat-header-info">
                            <div className="online-indicator">
                                <span className="online-dot"></span>
                                <span>{onlineUsers.length} online</span>
                            </div>
                            {!connected && <span className="badge badge-warning">Reconnecting...</span>}
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="chat-messages">
                        {messages.length === 0 ? (
                            <div className="chat-empty">No messages yet. Start the conversation! 🎉</div>
                        ) : (
                            messages.map((msg, i) => {
                                const isOwn = msg.senderId === user?._id
                                const isSystem = msg.messageType === 'system'
                                // Show sender name if different from previous message
                                const showSender = !isOwn && !isSystem && (
                                    i === 0 || messages[i - 1].senderId !== msg.senderId
                                )

                                return (
                                    <div key={msg._id || i} className={`chat-msg ${isOwn ? 'own' : isSystem ? 'system' : 'other'}`}>
                                        {showSender && <span className="msg-sender">{msg.senderName}</span>}
                                        <div className="msg-bubble">{msg.message}</div>
                                        <span className="msg-time">{formatTime(msg.timestamp)}</span>
                                    </div>
                                )
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Typing indicator */}
                    <div className="chat-typing">
                        {otherTyping.length > 0 && (
                            <span>
                                {otherTyping.map(u => u.userName).join(', ')}
                                {otherTyping.length === 1 ? ' is' : ' are'} typing...
                            </span>
                        )}
                    </div>

                    {/* Input */}
                    <div className="chat-input-area">
                        <input
                            type="text"
                            value={newMsg}
                            onChange={e => setNewMsg(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            maxLength={2000}
                        />
                        <button className="btn btn-primary" onClick={handleSend} disabled={!newMsg.trim()}>
                            Send
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}
