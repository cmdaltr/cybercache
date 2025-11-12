import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Download, ExternalLink, Trash2, ArrowLeft, FileText, Calendar } from 'lucide-react'
import { resourcesAPI } from '../api/client'

function ResourceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadResource()
  }, [id])

  const loadResource = async () => {
    try {
      const response = await resourcesAPI.getOne(id)
      setResource(response.data)
    } catch (error) {
      console.error('Error loading resource:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this resource?')) {
      return
    }

    setDeleting(true)
    try {
      await resourcesAPI.delete(id)
      navigate('/browse')
    } catch (error) {
      console.error('Error deleting resource:', error)
      alert('Failed to delete resource')
      setDeleting(false)
    }
  }

  const handleDownload = () => {
    if (resource.resource_type === 'file' && resource.file_path) {
      window.open(`/files/${resource.file_path}`, '_blank')
    }
  }

  const handleExternalLink = () => {
    if (resource.url) {
      window.open(resource.url, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-lg mb-4">Resource not found</p>
        <Link to="/browse" className="btn-primary">
          Back to Browse
        </Link>
      </div>
    )
  }

  const isFile = resource.resource_type === 'file'
  const isPDF = resource.file_type?.includes('pdf')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to="/browse"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Browse
      </Link>

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-4">
              {resource.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
              {resource.category && (
                <span className="px-3 py-1 bg-primary-600 bg-opacity-20 text-primary-400 rounded-full">
                  {resource.category}
                </span>
              )}
              {resource.file_type && (
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {resource.file_type}
                </span>
              )}
              {resource.file_size && (
                <span>
                  {(resource.file_size / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
              {resource.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(resource.created_at).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Description */}
            {resource.description && (
              <p className="text-gray-300 leading-relaxed">
                {resource.description}
              </p>
            )}

            {/* Tags */}
            {resource.tags && (
              <div className="mt-4 flex flex-wrap gap-2">
                {resource.tags.split(',').map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {isFile && resource.file_path && (
              <button
                onClick={handleDownload}
                className="btn-primary flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            )}
            {resource.url && (
              <button
                onClick={handleExternalLink}
                className="btn-secondary flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Visit Link
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-secondary flex items-center gap-2 bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      {isPDF && resource.file_path && (
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Preview</h2>
          <div className="aspect-[4/3] bg-gray-700 rounded-lg overflow-hidden">
            <iframe
              src={`/files/${resource.file_path}`}
              className="w-full h-full"
              title={resource.title}
            />
          </div>
        </div>
      )}

      {/* Image Preview */}
      {isFile && resource.file_type?.startsWith('image/') && resource.file_path && (
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Preview</h2>
          <div className="bg-gray-700 rounded-lg overflow-hidden">
            <img
              src={`/files/${resource.file_path}`}
              alt={resource.title}
              className="w-full h-auto"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ResourceDetail
