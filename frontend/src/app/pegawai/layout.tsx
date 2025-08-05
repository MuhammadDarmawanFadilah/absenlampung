'use client'

import ProtectedRoute from "@/components/ProtectedRoute"

export default function PegawaiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requireAuth={true} allowedRoles={["PEGAWAI", "ADMIN", "MODERATOR"]}>
      {children}
    </ProtectedRoute>
  )
}