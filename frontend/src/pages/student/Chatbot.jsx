import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Bot, User, Sparkles, RotateCcw,
  Copy, Check, HelpCircle, Code2, Terminal, Zap,
  ChevronRight, Mic
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import toast from 'react-hot-toast'
import client from '../../api/client'

// ─── Code Block with Copy Button ─────────────────────────────────────────────
function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    toast.success('Code copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-xl font-mono text-xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/5 border-b border-white/10 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 uppercase font-semibold text-purple-400">
          <Terminal className="w-3.5 h-3.5" />
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white transition-colors py-0.5 px-2 rounded hover:bg-white/10"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-slate-100 leading-relaxed">
        <pre>
          <code>{value}</code>
        </pre>
      </div>
    </div>
  )
}

// ─── Markdown Renderer Component ─────────────────────────────────────────────
function FormattedMarkdown({ content }) {
  return (
    <div className="max-w-none text-xs sm:text-sm leading-relaxed space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-bold mt-3 mb-1 border-b pb-1" style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-purple-600 dark:text-purple-300 mt-2.5 mb-1 flex items-center gap-1">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-bold text-cyan-600 dark:text-cyan-300 mt-2 mb-1">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-1.5 leading-relaxed font-normal" style={{ color: 'var(--text-secondary)' }}>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-4 space-y-1 my-1.5" style={{ color: 'var(--text-secondary)' }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 space-y-1 my-1.5" style={{ color: 'var(--text-secondary)' }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-purple-500 pl-3 my-2 italic py-1 rounded-r" style={{ background: 'var(--purple-dim)', color: 'var(--text-secondary)' }}>
              {children}
            </blockquote>
          ),
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const textContent = String(children).replace(/\n$/, '')
            if (!inline && (match || textContent.includes('\n'))) {
              return (
                <CodeBlock
                  language={match ? match[1] : ''}
                  value={textContent}
                />
              )
            }
            return (
              <code
                className="bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-purple-500/20 font-semibold"
                {...props}
              >
                {children}
              </code>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5 animate-fade-in">
      <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center flex-shrink-0 shadow-glow-purple">
        <Bot className="w-4 h-4 text-purple-500" />
      </div>
      <div className="bubble-ai flex items-center gap-1.5 py-3 px-4 rounded-2xl">
        {[0, 0.18, 0.36].map((d, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-purple-500"
            animate={{ y: [-3, 3, -3], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.9, delay: d, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        <span className="text-xs ml-2 font-medium" style={{ color: 'var(--text-muted)' }}>PlaceAI is thinking...</span>
      </div>
    </div>
  )
}

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user'
  const [copied, setCopied] = useState(false)

  const copyFullMessage = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    toast.success('Message text copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-2.5 group ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
        isUser
          ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
          : 'bg-purple-500/15 border border-purple-500/25 text-purple-600 dark:text-purple-300 shadow-glow-purple'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={`relative max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 shadow-sm ${
        isUser
          ? 'bubble-user bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
          : 'bubble-ai'
      }`}>
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm text-white font-medium">{msg.content}</p>
        ) : (
          <FormattedMarkdown content={msg.content} />
        )}

        {!isUser && (
          <div className="flex items-center justify-end mt-2 pt-2 border-t border-slate-200 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={copyFullMessage}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center gap-1 transition-colors"
              title="Copy response"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy Response'}</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const QUICK_PROMPTS_QA = [
  'How do I answer "Tell me about yourself" for campus placement?',
  'Explain ACID properties in DBMS with real-world examples.',
  'What is the difference between TCP and UDP protocols?',
  'Top 5 DSA concepts asked in technical interview rounds?',
]

const QUICK_PROMPTS_MOCK = [
  'I am ready for the technical interview. Please ask the first question.',
  'Can we focus on Data Structures, System Design, and Python?',
  'Please test me on Behavioral & HR questions using the STAR method.',
]

export default function Chatbot() {
  const qc = useQueryClient()
  const [mode, setMode] = useState('qa') // 'qa' | 'mock_interview'
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [isListening, setIsListening] = useState(false)
  
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)
  const autoStartRef = useRef(false)
  const recognitionRef = useRef(null)

  // Fetch active roadmap & resume for context indicators
  const { data: roadmap } = useQuery({
    queryKey: ['roadmap'],
    queryFn: () => client.get('/roadmap').then(r => r.data).catch(() => null),
  })

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => client.get('/resume/history').then(r => r.data).catch(() => []),
  })

  // Load chat history from backend database per mode
  const { data: dbHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['chat-history', mode],
    queryFn: () => client.get('/chatbot/history', { params: { mode } }).then(r => r.data),
  })

  // Synchronize database history into component messages safely
  useEffect(() => {
    if (dbHistory) {
      setMessages(dbHistory.map(m => ({ role: m.role, content: m.content })))
    } else {
      setMessages([])
    }
  }, [dbHistory, mode])

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // Auto-resize input textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`
    }
  }, [input])

  // Voice speech recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        toast('🎙️ Listening... Speak clearly', { id: 'voice-mic', duration: 3000 })
      }

      recognition.onresult = (event) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript
        }
        if (transcript.trim()) {
          setInput(prev => {
            const separator = prev && !prev.endsWith(' ') ? ' ' : ''
            return `${prev}${separator}${transcript}`.trim()
          })
        }
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        if (event.error !== 'no-speech') {
          toast.error(`Voice error: ${event.error}`)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Voice recognition is not supported in this browser. Try Chrome or Edge.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
      } catch (err) {
        console.error('Could not start recognition:', err)
        recognitionRef.current.abort()
        setTimeout(() => recognitionRef.current.start(), 200)
      }
    }
  }

  const sendMessage = useCallback(async (text, isAutoStart = false) => {
    const content = isAutoStart ? 'Please start the mock placement interview.' : text?.trim()
    if (!content) return

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }

    const userMsg = { role: 'user', content }
    const updatedMessages = isAutoStart ? [userMsg] : [...messages, userMsg]

    setMessages(updatedMessages)
    if (!isAutoStart) {
      setInput('')
    }
    setSending(true)

    try {
      const res = await client.post('/chatbot/chat', {
        messages: updatedMessages,
        mode,
      })
      const replyMsg = { role: 'assistant', content: res.data.reply }
      setMessages(prev => [...prev, replyMsg])
      qc.invalidateQueries({ queryKey: ['chat-history', mode] })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'AI connection failed. Please check network/API key.')
    } finally {
      setSending(false)
    }
  }, [messages, mode, qc, isListening])

  // Auto-start greeting for mock interview if empty
  useEffect(() => {
    if (mode === 'mock_interview' && !loadingHistory && messages.length === 0 && !sending && !autoStartRef.current) {
      autoStartRef.current = true
      sendMessage(null, true)
    }
  }, [mode, messages.length, loadingHistory, sending, sendMessage])

  const handleClearChat = async () => {
    if (!window.confirm(`Are you sure you want to clear your saved history for ${mode === 'qa' ? 'Q&A' : 'Mock Interview'}?`)) return
    try {
      await client.delete('/chatbot/history', { params: { mode } })
      setMessages([])
      autoStartRef.current = false
      qc.invalidateQueries({ queryKey: ['chat-history', mode] })
      toast.success('Chat history cleared')
      if (mode === 'mock_interview') {
        setTimeout(() => sendMessage(null, true), 300)
      }
    } catch (err) {
      toast.error('Failed to clear chat history')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !sending) {
        sendMessage(input)
      }
    }
  }

  const handleModeChange = (newMode) => {
    if (mode === newMode) return
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
    setMode(newMode)
    setMessages([])
    autoStartRef.current = false
  }

  const targetRole = roadmap?.target_role || 'Software Engineer'
  const skillsCount = resumes?.[0]?.extracted_skills?.length || 0

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-6.5rem)] lg:h-[calc(100vh-6.8rem)] animate-fade-in max-w-5xl mx-auto w-full pb-1">
      {/* Header Bar */}
      <div className="flex-shrink-0 space-y-2.5 mb-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>Placement AI Coach</span>
              <span className="badge badge-purple text-[10px] uppercase font-bold tracking-wider">
                {mode === 'qa' ? 'Q&A Mode' : 'Interview Simulator'}
              </span>
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Personalized technical mentorship, Q&A concepts, and interactive mock placement rounds
            </p>
          </div>

          <button
            onClick={handleClearChat}
            className="btn-ghost text-xs flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-white/10 hover:border-rose-500/30 hover:text-rose-500"
            title="Clear saved history for this mode"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear History</span>
          </button>
        </div>

        {/* Mode Selector & Context Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 glass p-1.5 rounded-2xl">
          <div className="flex p-1 rounded-xl border border-slate-200 dark:border-white/5" style={{ background: 'var(--bg-deep)' }}>
            <button
              onClick={() => handleModeChange('qa')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                mode === 'qa'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Placement Q&A</span>
            </button>
            <button
              onClick={() => handleModeChange('mock_interview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                mode === 'mock_interview'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Mock Interview</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] px-2 overflow-x-auto" style={{ color: 'var(--text-secondary)' }}>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/5" style={{ background: 'var(--bg-deep)' }}>
              <Zap className="w-3 h-3 text-cyan-500" />
              Target: <strong style={{ color: 'var(--text-primary)' }}>{targetRole}</strong>
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/5" style={{ background: 'var(--bg-deep)' }}>
              <Code2 className="w-3 h-3 text-purple-500" />
              Resume: <strong style={{ color: 'var(--text-primary)' }}>{skillsCount} skills</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 py-2 custom-scrollbar min-h-0">
        {loadingHistory ? (
          <div className="flex justify-center items-center h-48">
            <div className="spinner scale-125" />
          </div>
        ) : messages.length === 0 ? (
          /* Empty State & Prompt Suggestions */
          <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-600 dark:text-purple-300 shadow-glow-purple">
              <Bot className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                {mode === 'qa' ? 'Placement Preparation Assistant' : 'Mock Interview Simulator'}
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {mode === 'qa'
                  ? 'Ask any technical, system design, or placement interview question. Instant detailed answers formatted with clear code snippets.'
                  : 'AI interviewer evaluates your answers step-by-step with structured feedback and follow-up rounds.'}
              </p>
            </div>

            {/* Prompt Suggestions */}
            <div className="w-full max-w-lg space-y-1.5 pt-1 text-left">
              <p className="text-[10px] uppercase tracking-wider font-bold text-center" style={{ color: 'var(--text-muted)' }}>
                Suggested Prompts
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {(mode === 'qa' ? QUICK_PROMPTS_QA : QUICK_PROMPTS_MOCK).map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(prompt)}
                    className="p-2.5 rounded-xl card hover:border-purple-500/40 text-xs flex items-center justify-between transition-all group"
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>{prompt}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500 transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Messages List */
          <div className="space-y-3.5">
            {messages.map((m, i) => (
              <ChatBubble key={i} msg={m} />
            ))}
            {sending && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input Box Bar (Pinned snugly at bottom) */}
      <div className="flex-shrink-0 pt-2 pb-0">
        <div className={`glass p-2 rounded-2xl border flex items-end gap-2 shadow-xl transition-all ${
          isListening ? 'border-rose-500 ring-2 ring-rose-500/30' : 'focus-within:border-purple-500'
        }`} style={{ background: 'var(--bg-surface)' }}>
          {/* Microphone Voice Button */}
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? 'Stop listening' : 'Speak your answer / query'}
            className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-glow-rose'
                : 'btn-secondary py-2 px-2.5'
            }`}
          >
            <Mic className={`w-4 h-4 ${isListening ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`} />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening to your voice... Speak now'
                : mode === 'qa'
                ? 'Ask a technical or placement interview question... (Enter to send, Shift+Enter for newline)'
                : 'Type or speak your interview response... (Enter to send)'
            }
            className="flex-1 bg-transparent border-0 text-xs sm:text-sm resize-none focus:outline-none p-2 leading-relaxed"
            style={{ color: 'var(--text-primary)' }}
          />

          {/* Send Button */}
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || sending}
            className="p-2.5 rounded-xl btn-primary text-white disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 shadow-glow-purple"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            title="Send message"
          >
            {sending ? <span className="spinner w-4 h-4 border-top-color-white" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {/* Listening Status Indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex items-center justify-between text-[11px] text-rose-500 mt-1 px-2 font-medium"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Listening to speech... Speak clearly into your microphone
              </span>
              <button
                onClick={toggleListening}
                className="underline hover:text-rose-600 font-semibold"
              >
                Done Speaking
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
