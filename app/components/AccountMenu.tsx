'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  username: string
  userId: string
}

type Section = 'username' | 'password' | null

export default function AccountMenu({ username, userId }: Props) {
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>(null)

  // Username section state
  const [newUsername, setNewUsername] = useState(username)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [usernameError, setUsernameError] = useState('')

  // Password section state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [passwordError, setPasswordError] = useState('')

  // Close when clicking outside
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  function toggleSection(section: Section) {
    setActiveSection(prev => (prev === section ? null : section))
  }

  async function handleSaveUsername() {
    const trimmed = newUsername.trim()
    if (!trimmed) {
      setUsernameStatus('error')
      setUsernameError('Username cannot be empty.')
      return
    }
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ username: trimmed })
      .eq('id', userId)
    if (error) {
      setUsernameStatus('error')
      setUsernameError(error.message)
    } else {
      setUsernameStatus('saved')
      setUsernameError('')
      router.refresh()
    }
  }

  async function handleSavePassword() {
    if (!newPassword) {
      setPasswordStatus('error')
      setPasswordError('Password cannot be empty.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus('error')
      setPasswordError('Passwords do not match.')
      return
    }
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordStatus('error')
      setPasswordError(error.message)
    } else {
      setPasswordStatus('saved')
      setPasswordError('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div ref={wrapperRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-label="Account menu"
        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5 text-gray-300"
        >
          <path
            fillRule="evenodd"
            d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-800">
            <span className="text-gray-400 text-sm">{username}</span>
          </div>

          {/* Change Username */}
          <div>
            <button
              onClick={() => {
                toggleSection('username')
                setUsernameStatus('idle')
                setUsernameError('')
                setNewUsername(username)
              }}
              className="w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 text-left transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.885L17.5 5.5a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343Z" />
              </svg>
              Change Username
            </button>
            {activeSection === 'username' && (
              <div className="px-4 pb-3 space-y-2">
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => {
                    setNewUsername(e.target.value)
                    setUsernameStatus('idle')
                  }}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm w-full focus:outline-none focus:border-orange-500"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveUsername}
                    className="bg-orange-600 hover:bg-orange-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  {usernameStatus === 'saved' && (
                    <span className="text-green-400 text-xs">✓ Saved</span>
                  )}
                  {usernameStatus === 'error' && (
                    <span className="text-red-400 text-xs">{usernameError}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Change Password */}
          <div>
            <button
              onClick={() => {
                toggleSection('password')
                setPasswordStatus('idle')
                setPasswordError('')
                setNewPassword('')
                setConfirmPassword('')
              }}
              className="w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 text-left transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
              </svg>
              Change Password
            </button>
            {activeSection === 'password' && (
              <div className="px-4 pb-3 space-y-2">
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => {
                    setNewPassword(e.target.value)
                    setPasswordStatus('idle')
                  }}
                  placeholder="New password"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm w-full focus:outline-none focus:border-orange-500"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value)
                    setPasswordStatus('idle')
                  }}
                  placeholder="Confirm password"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm w-full focus:outline-none focus:border-orange-500"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSavePassword}
                    className="bg-orange-600 hover:bg-orange-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  {passwordStatus === 'saved' && (
                    <span className="text-green-400 text-xs">✓ Password updated</span>
                  )}
                  {passwordStatus === 'error' && (
                    <span className="text-red-400 text-xs">{passwordError}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800" />

          {/* Sign Out */}
          <div className="p-2">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-sm text-red-400 hover:bg-red-950 hover:text-red-300 rounded-lg text-left transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
