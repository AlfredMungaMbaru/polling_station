/**
 * Admin Dashboard Page
 * 
 * Provides a centralized interface for administrators to manage polls,
 * view analytics, and perform administrative actions.
 */

'use client'

import React from 'react'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { RequireRole } from '@/components/auth/RequireRole'
import { USER_ROLES } from '@/types/roles'

export default function AdminPage() {
  return (
    <RequireRole role={USER_ROLES.ADMIN}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Manage polls, view analytics, and perform administrative actions
            </p>
          </div>
          
          <AdminDashboard />
        </div>
      </div>
    </RequireRole>
  )
}