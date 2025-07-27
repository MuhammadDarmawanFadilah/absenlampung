'use client'

import { useEffect, useRef } from 'react'
import Pusher from 'pusher-js'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface PusherHookProps {
  onCutiRequest?: (data: any) => void
  onCutiResponse?: (data: any) => void
}

export const usePusherNotifications = ({ onCutiRequest, onCutiResponse }: PusherHookProps = {}) => {
  const { user } = useAuth()
  const pusherRef = useRef<Pusher | null>(null)

  useEffect(() => {
    if (!user) return

    // Initialize Pusher
    const pusher = new Pusher('e3b5f90419b058345c0d', {
      cluster: 'ap1',
      forceTLS: true
    })

    pusherRef.current = pusher

    // Subscribe to admin channel for cuti requests (for admins)
    if (user.role?.roleName === 'ADMIN') {
      const adminChannel = pusher.subscribe('admin-channel')
      
      adminChannel.bind('cuti-request', (data: any) => {
        toast.info(`📋 Pengajuan cuti baru dari ${data.pegawaiName}`, {
          description: `${data.cutiCount} hari cuti (${data.startDate} - ${data.endDate})`,
          action: {
            label: 'Lihat',
            onClick: () => {
              window.location.href = '/admin/master-data/cuti'
            }
          },
          duration: 10000
        })
        
        // Call custom handler if provided
        onCutiRequest?.(data)
      })
    }

    // Subscribe to personal channel for cuti responses (for pegawai)
    const personalChannel = pusher.subscribe(`pegawai-${user.id}`)
    
    personalChannel.bind('cuti-response', (data: any) => {
      const isApproved = data.status === 'DISETUJUI'
      
      toast[isApproved ? 'success' : 'error'](
        `${data.message}`,
        {
          description: `Tanggal: ${data.tanggalCuti}${data.catatan ? ` | Catatan: ${data.catatan}` : ''}`,
          action: {
            label: 'Lihat Detail',
            onClick: () => {
              window.location.href = '/pegawai/cuti'
            }
          },
          duration: 10000
        }
      )
      
      // Call custom handler if provided
      onCutiResponse?.(data)
    })

    // Cleanup function
    return () => {
      if (pusherRef.current) {
        pusherRef.current.unsubscribe('admin-channel')
        pusherRef.current.unsubscribe(`pegawai-${user.id}`)
        pusherRef.current.disconnect()
      }
    }
  }, [user, onCutiRequest, onCutiResponse])

  return pusherRef.current
}
