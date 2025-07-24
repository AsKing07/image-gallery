'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import ImageModal from './ImageModal'

interface ImageItem {
  id: string
  url: string
  created_at: string
  signedUrl?: string
}

interface ImageGalleryProps {
  refreshTrigger: number
}

export default function ImageGallery({ refreshTrigger }: ImageGalleryProps) {
  const [images, setImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const { user } = useAuth()

  const fetchImages = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Générer des URLs signées pour chaque image
      const imagesWithSignedUrls = await Promise.all(
        (data || []).map(async (image) => {
          const { data: signedData, error: signedError } = await supabase.storage
            .from('user-images')
            .createSignedUrl(image.url, 3600) // URL valide 1 heure
          
          return {
            ...image,
            signedUrl: signedError ? null : signedData?.signedUrl
          }
        })
      )
      
      setImages(imagesWithSignedUrls)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchImages()
  }, [fetchImages, refreshTrigger])

  const handleImageClick = (image: ImageItem) => {
    if (image.signedUrl) {
      setSelectedImage(image)
      setModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedImage(null)
  }

  const handleDelete = async (imageId: string, imageUrl: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
      return
    }

    setDeleting(imageId)

    try {
      // Le chemin du fichier est directement stocké dans imageUrl maintenant
      const filePath = imageUrl

      // Supprimer le fichier du storage
      const { error: storageError } = await supabase.storage
        .from('user-images')
        .remove([filePath])

      if (storageError) {
        console.warn('Erreur lors de la suppression du fichier:', storageError.message)
      }

      // Supprimer l'entrée de la base de données
      const { error: dbError } = await supabase
        .from('images')
        .delete()
        .eq('id', imageId)

      if (dbError) throw dbError

      // Mettre à jour l'état local
      setImages(images.filter(img => img.id !== imageId))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement de vos images...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Votre galerie est vide</h3>
          <p className="text-gray-600">Commencez par ajouter votre première image en utilisant la zone d&apos;upload ci-dessus !</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Ma Galerie
            </h3>
          </div>
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full">
            <span className="text-sm font-medium text-purple-800">
              {images.length} image{images.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((image) => (
            <div key={image.id} className="group relative bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="aspect-square relative overflow-hidden cursor-pointer" onClick={() => handleImageClick(image)}>
              {image.signedUrl ? (
              <Image
                src={image.signedUrl}
                alt="Image uploadée"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
              ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-500 text-sm">Image non disponible</span>
                </div>
              </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-medium">
                {new Date(image.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
                })}
              </p>
              <div className="flex space-x-2">
                <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleImageClick(image)
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-all duration-200"
                title="Voir en grand"
                >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                </button>
                <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(image.id, image.url)
                }}
                disabled={deleting === image.id}
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all duration-200 disabled:opacity-50"
                title="Supprimer cette image"
                >
                {deleting === image.id ? (
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                </button>
              </div>
              </div>
            </div>
            </div>
        ))}
      </div>
    </div>

    {/* Modal */}
    {selectedImage && selectedImage.signedUrl && (
      <ImageModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        imageUrl={selectedImage.signedUrl}
        imageDate={new Date(selectedImage.created_at).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      />
    )}
    </>
  )
}
