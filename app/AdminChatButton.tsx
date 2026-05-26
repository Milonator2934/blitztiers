'use client'

import { useEffect, useMemo, useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import { categories, type CategoryKey, getCategory } from '@/lib/categories'
import { supabase } from '@/lib/supabase'

type ModerationRequest = {
  id: string
  category: CategoryKey
  region?: string | null
  code_type: string
  code_number: number
  status: string
  created_at?: string | null
}

type ChatMessage = {
  id: string
  request_id: string
  sender_id: string
  body: string
  created_at: string
  profiles?: { username: string } | { username: string }[] | null
}

function getSenderName(profile: ChatMessage['profiles'], fallback: string) {
  if (Array.isArray(profile)) {
    return profile[0]?.username || fallback
  }

  return profile?.username || fallback
}

export function AdminChatButton() {
  const [userId, setUserId] = useState('')
  const [requests, setRequests] = useState<ModerationRequest[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [selectedRequestId, setSelectedRequestId] = useState('')
  const [draft, setDraft] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedRequestId) || requests[0],
    [requests, selectedRequestId]
  )

  useEffect(() => {
    let ignore = false

    async function loadRequests() {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        if (!ignore) {
          setUserId('')
          setRequests([])
          setLoading(false)
        }
        return
      }

      const { data, error: requestError } = await supabase
        .from('moderation_requests')
        .select('id, category, region, code_type, code_number, status, created_at')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })

      if (!ignore) {
        setUserId(user.id)
        setRequests((data || []) as ModerationRequest[])
        setSelectedRequestId((data || [])[0]?.id || '')
        setError(requestError ? requestError.message : '')
        setLoading(false)
      }
    }

    loadRequests()

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      setLoading(true)
      loadRequests()
    })
    window.addEventListener('moderation-request-created', loadRequests)

    return () => {
      ignore = true
      window.removeEventListener('moderation-request-created', loadRequests)
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!selectedRequest?.id || !open) {
      return
    }

    let ignore = false

    async function loadMessages() {
      const { data, error: messageError } = await supabase
        .from('moderation_request_messages')
        .select('id, request_id, sender_id, body, created_at, profiles!moderation_request_messages_sender_id_fkey(username)')
        .eq('request_id', selectedRequest.id)
        .order('created_at', { ascending: true })

      if (!ignore) {
        setMessages((data || []) as unknown as ChatMessage[])
        setError(messageError ? messageError.message : '')
      }
    }

    loadMessages()

    const refresh = window.setInterval(loadMessages, 15000)

    return () => {
      ignore = true
      window.clearInterval(refresh)
    }
  }, [open, selectedRequest?.id])

  async function sendMessage() {
    const body = draft.trim()

    if (!selectedRequest || !userId || !body) {
      return
    }

    setSending(true)
    setError('')

    const { data, error: sendError } = await supabase
      .from('moderation_request_messages')
      .insert({
        request_id: selectedRequest.id,
        sender_id: userId,
        body,
      })
      .select('id, request_id, sender_id, body, created_at, profiles!moderation_request_messages_sender_id_fkey(username)')
      .single()

    setSending(false)

    if (sendError) {
      setError(
        sendError.message.includes("Could not find the table")
          ? 'Admin chat is not set up yet. Run the latest Supabase migration, then try again.'
          : sendError.message
      )
      return
    }

    setMessages((current) => [...current, data as unknown as ChatMessage])
    setDraft('')
  }

  if (loading || requests.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3">
      {open && (
        <section className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950 text-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 p-3">
            <div>
              <h2 className="font-bold">Admin chat</h2>
              <p className="text-xs text-zinc-400">Send code or category changes here.</p>
            </div>
            <button
              type="button"
              aria-label="Close admin chat"
              onClick={() => setOpen(false)}
              className="rounded bg-zinc-900 p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {requests.length > 1 && (
            <label className="block border-b border-zinc-800 p-3">
              <span className="mb-2 block text-xs font-bold uppercase text-zinc-400">Request</span>
              <select
                className="w-full rounded bg-zinc-900 p-2 text-sm outline-none ring-1 ring-zinc-800 focus:ring-blue-500"
                value={selectedRequest?.id || ''}
                onChange={(event) => setSelectedRequestId(event.target.value)}
              >
                {requests.map((request) => {
                  const category = categories.find((item) => item.key === request.category)

                  return (
                    <option key={request.id} value={request.id}>
                      {category?.shortLabel || request.category} - {request.region || 'NA'} - {request.code_type} #{request.code_number}
                    </option>
                  )
                })}
              </select>
            </label>
          )}

          {selectedRequest && (
            <div className="border-b border-zinc-800 p-3 text-sm text-zinc-300">
              <span className="font-bold text-white">{getCategory(selectedRequest.category).shortLabel}</span>
              {' '}in {selectedRequest.region || 'NA'}, {selectedRequest.code_type} #{selectedRequest.code_number}
              <span className="ml-2 rounded bg-zinc-800 px-2 py-0.5 text-xs uppercase text-zinc-300">
                {selectedRequest.status}
              </span>
            </div>
          )}

          <div className="max-h-72 space-y-3 overflow-y-auto p-3">
            {messages.length === 0 ? (
              <p className="rounded bg-black/30 p-3 text-sm text-zinc-400">
                No messages yet. Tell admins what changed.
              </p>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.sender_id === userId

                return (
                  <div
                    key={message.id}
                    className={`rounded p-3 text-sm ${
                      isOwnMessage ? 'ml-6 bg-blue-600 text-white' : 'mr-6 bg-zinc-900 text-zinc-200'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs opacity-75">
                      <span>{isOwnMessage ? 'You' : getSenderName(message.profiles, 'Admin')}</span>
                      <span>{new Date(message.created_at).toLocaleString()}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  </div>
                )
              })
            )}
          </div>

          {error && (
            <p className="mx-3 mb-3 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-100">
              {error}
            </p>
          )}

          <div className="flex gap-2 border-t border-zinc-800 p-3">
            <textarea
              className="min-h-12 flex-1 resize-none rounded bg-zinc-900 p-2 text-sm outline-none ring-1 ring-zinc-800 focus:ring-blue-500"
              placeholder="Message admins"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button
              type="button"
              aria-label="Send message"
              onClick={sendMessage}
              disabled={sending || draft.trim().length === 0}
              className="self-end rounded bg-blue-600 p-3 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={18} />
            </button>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 font-bold text-white shadow-2xl hover:bg-blue-500"
      >
        <MessageCircle size={20} /> Chat with admins
      </button>
    </div>
  )
}
