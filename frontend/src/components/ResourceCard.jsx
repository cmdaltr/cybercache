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
        <div className="aspect-video bg-gray-700 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
          {isPDF && resource.file_path ? (
            <iframe
              src={`/files/${resource.file_path}#view=FitH`}
              className="w-full h-full pointer-events-none"
              title={resource.title}
            />
          ) : isFile ? (
            <div className="text-gray-400">
              {getFileIcon()}
            </div>
          ) : (
            <LinkIcon className="h-6 w-6 text-gray-400" />
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-lg mb-2 text-white group-hover:text-primary-400 transition-colors line-clamp-2">
          {resource.title}
        </h3>

        {/* Description */}
        {resource.description && (
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {resource.description}
          </p>
        )}

        {/* Category Badge */}
        {resource.category && (
          <span className="inline-block px-3 py-1 bg-primary-600 bg-opacity-20 text-primary-400 text-xs rounded-full mb-3">
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
