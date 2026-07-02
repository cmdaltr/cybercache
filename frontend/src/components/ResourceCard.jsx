import { Link } from 'react-router-dom'
import { FileText, Link as LinkIcon, Download, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'

function ResourceCard({ resource }) {
  const isFile = resource.resource_type === 'file'
  const isPDF = resource.file_type?.includes('pdf')

  const getFileIcon = () => {
    if (isPDF) return <FileText className="h-6 w-6" />
    return <FileText className="h-6 w-6" />
  }

  // Get category-based gradient
  const getCategoryGradient = () => {
    const category = resource.category?.toLowerCase() || ''
    const gradients = {
      'cheatsheets': 'from-blue-600 to-blue-800',
      'publications': 'from-purple-600 to-purple-800',
      'media': 'from-pink-600 to-pink-800',
      'tooling': 'from-green-600 to-green-800',
      'training': 'from-yellow-600 to-yellow-800',
      'ctfs': 'from-red-600 to-red-800',
      'projects': 'from-indigo-600 to-indigo-800',
      'vms': 'from-cyan-600 to-cyan-800',
      'int': 'from-teal-600 to-teal-800',
    }

    for (const [key, gradient] of Object.entries(gradients)) {
      if (category.includes(key)) return gradient
    }
    return 'from-gray-600 to-gray-800'
  }

  // Get favicon URL for links
  const getFaviconUrl = () => {
    if (!resource.url) return null
    try {
      const url = new URL(resource.url)
      return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`
    } catch {
      return null
    }
  }

  const handleDownload = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isFile && resource.file_path) {
      window.open(`/files/${resource.file_path}`, '_blank')
    }
  }

  const handleExternalLink = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (resource.url) {
      window.open(resource.url, '_blank')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card group"
    >
      <Link to={`/resource/${resource.id}`} className="block">
        {/* Preview/Icon */}
        <div className={`aspect-[16/10] bg-gradient-to-br ${getCategoryGradient()} rounded-lg mb-3 flex items-center justify-center overflow-hidden relative`}>
          {isFile ? (
            <div className="text-white opacity-80">
              <FileText className="h-12 w-12" />
            </div>
          ) : getFaviconUrl() ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <img
                src={getFaviconUrl()}
                alt=""
                className="w-16 h-16 object-contain"
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          ) : (
            <LinkIcon className="h-12 w-12 text-white opacity-60" />
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base mb-2 text-white group-hover:text-primary-400 transition-colors line-clamp-2 min-h-[3rem]">
          {resource.title}
        </h3>

        {/* Description */}
        {resource.description && (
          <p className="text-gray-400 text-xs mb-2 line-clamp-2">
            {resource.description}
          </p>
        )}

        {/* Category Badge */}
        {resource.category && (
          <span className="inline-block px-2 py-1 bg-primary-600 bg-opacity-20 text-primary-400 text-xs rounded-full mb-2">
            {resource.category}
          </span>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isFile && resource.file_path && (
            <button
              onClick={handleDownload}
              className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
          )}
          {resource.url && (
            <button
              onClick={handleExternalLink}
              className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center space-x-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Visit</span>
            </button>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

export default ResourceCard
