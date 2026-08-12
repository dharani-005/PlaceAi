import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, Bot, User, Sparkles, BookOpen, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import client from '../../api/client'

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
        <Bot className="w-3.5 h-3.5 text-indigo-400" />
      </div>
      <div className="bubble-ai flex items-center gap-1 py-3 px-4">
        {[0, 0.15, 0.3].map((d, i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-indigo-400"
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 0.8, delay: d, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  )
}

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-indigo-500' : 'bg-indigo-500/20'
      }`}>
        {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-indigo-400" />}
      </div>
      <div className={isUser ? 'bubble-user' : 'bubble-ai'}>
        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
      </div>
    </motion.div>
  )
}

export default function Chatbot() {
  const [mode, setMode] = useState('qa') // 'qa' | 'mock_interview'
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)
  const hasStartedRef = useRef(false)

  const { data: roadmap } = useQuery({
    queryKey: ['roadmap'],
    queryFn: () => client.get('/roadmap').then(r => r.data).catch(() => null),
  })

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => client.get('/resume/history').then(r => r.data),
  })

  const latestResume = resumes?.[0]

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // Auto-resize textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`
    }
  }, [input])

  const sendMessage = useCallback(async (userInput, isAutoStart = false) => {
    const content = isAutoStart ? 'Please start the mock interview.' : userInput?.trim()
    if (!content) return

    const outgoingMessages = isAutoStart
      ? [{ role: 'user', content }]
      : [...messages, { role: 'user', content }]

    if (!isAutoStart) {
      setMessages(outgoingMessages)
      setInput('')
    }
    setSending(true)

    try {
      const res = await client.post('/chatbot/chat', {
        messages: outgoingMessages,
        mode,
      })
      const reply = { role: 'assistant', content: res.data.reply }
      setMessages(isAutoStart ? [reply] : (prev) => [...prev, reply])
    } catch (err) {
      toast.error(err.response?.data?.detail || 'AI error — check your API key')
    } finally {
      setSending(false)
    }
  }, [messages, mode])

  // Auto-greeting when entering mock interview mode
  useEffect(() => {
    if (mode === 'mock_interview' && messages.length === 0 && !sending && !hasStartedRef.current) {
      hasStartedRef.current = true
      sendMessage(null, true)
    }
  }, [mode, messages.length, sending])

  const handleSend = () => {
    if (!input.trim() || sending) return
    sendMessage(input)
  }

  const clearChat = () => {
    hasStartedRef.current = false
    setMessages([])
    if (mode === 'mock_interview') {
      setTimeout(() => {
        hasStartedRef.current = false
        sendMessage(null, true)
      }, 300)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">Interview Prep</h1>
            <p className="text-slate-400 mt-1">AI-powered Q&A help and mock interviews — personalised to your profile</p>
          </div>
          <button onClick={clearChat} className="btn-ghost text-xs">
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
        </div>

        {/* Mode + context row */}
        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          {/* Mode toggle */}
          <div className="flex p-1 bg-navy-800 border border-white/5 rounded-xl gap-1">
            {[
              { value: 'qa', label: 'Q&A Helper', icon: BookOpen },
              { value: 'mock_interview', label: 'Mock Interview', icon: Sparkles },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => { hasStartedRef.current = false; setMode(value); setMessages([]) }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  mode === value ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Context pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {roadmap && (
              <span className="badge badge-indigo text-xs">
                🎯 {roadmap.target_role}
              </span>
            )}
            {latestResume && (
              <span className="badge badge-emerald text-xs">
                📄 {latestResume.extracted_skills?.length || 0} skills detected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 glass overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && !sending && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center mb-4">
              {mode === 'mock_interview'
                ? <Sparkles className="w-8 h-8 text-indigo-400" />
                : <MessageSquare className="w-8 h-8 text-indigo-400" />}
            </div>
            <p className="font-semibold text-slate-200">
              {mode === 'mock_interview' ? 'Mock Interview Mode' : 'Ask me anything'}
            </p>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">
              {mode === 'mock_interview'
                ? 'Click Start below to begin your mock interview. I\'ll ask you questions one by one.'
                : 'Ask about technical concepts, resume tips, career advice, or anything placement related.'}
            </p>
            {mode === 'mock_interview' && (
              <button
                onClick={() => sendMessage(null, true)}
                className="btn-primary mt-4"
              >
                <Sparkles className="w-4 h-4" />
                Start Interview
              </button>
            )}
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
        </AnimatePresence>

        {sending && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 mt-3">
        <div className="glass flex items-end gap-3 p-3">
          <textarea
            ref={textareaRef}
            id="chat-input"
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 resize-none outline-none min-h-[40px] max-h-32"
            placeholder={mode === 'mock_interview' ? 'Type your answer…' : 'Ask a question…'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
            rows={1}
          />
          <button
            id="send-chat"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="btn-primary py-2 px-3 flex-shrink-0"
          >
            {sending ? <span className="spinner w-4 h-4" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-1.5 text-center">Enter to send • Shift+Enter for new line</p>
      </div>
    </div>
  )
}
