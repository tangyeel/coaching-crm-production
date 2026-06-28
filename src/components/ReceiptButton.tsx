'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Check, Loader2 } from 'lucide-react'

export default function ReceiptButton({ id }: { id: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle')

  const handleDownload = () => {
    if (state !== 'idle') return
    setState('loading')
    // Mock PDF generation delay
    setTimeout(() => {
      setState('success')
      setTimeout(() => setState('idle'), 2000)
    }, 1200)
  }

  return (
    <button
      className="btn outline sm"
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, padding: 0 }}
      onClick={handleDownload}
      disabled={state === 'loading'}
      title="Download PDF Receipt"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Download size={15} />
          </motion.div>
        )}
        {state === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1, rotate: 360 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ opacity: { duration: 0.2 }, rotate: { repeat: Infinity, duration: 1, ease: 'linear' } }}
          >
            <Loader2 size={15} />
          </motion.div>
        )}
        {state === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Check size={15} color="var(--good)" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}
