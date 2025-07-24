'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AuthForm from '@/components/AuthForm'
import ImageUpload from '@/components/ImageUpload'
import ImageGallery from '@/components/ImageGallery'

export default function Home() {
  const { user, loading, signOut } = useAuth()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Galerie d&apos;Images Personnelle
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stockez, organisez et partagez vos images préférées dans votre espace personnel sécurisé
            </p>
          </div>
          <AuthForm />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white/70 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Ma Galerie d&apos;Images
            </h1>
          </div>
          <div className="flex flex-col items-center space-x-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Connecté en tant que</p>
              <p className="font-medium text-gray-700">{user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ImageUpload onUploadComplete={handleUploadComplete} />
        <ImageGallery refreshTrigger={refreshTrigger} />
      </main>
    </div>
  )
}
