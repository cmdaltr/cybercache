import { useState } from 'react'
import { Upload as UploadIcon, Link as LinkIcon, Check, AlertCircle } from 'lucide-react'
import { uploadAPI, resourcesAPI } from '../api/client'

function Upload({ categories }) {
  const [uploadType, setUploadType] = useState('file') // 'file' or 'link'
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  // Form state
  const [file, setFile] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    url: ''
  })

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Auto-fill title from filename if empty
      if (!formData.title) {
        const title = selectedFile.name
          .replace(/\.[^/.]+$/, '') // Remove extension
          .replace(/[_-]/g, ' ') // Replace _ and - with spaces
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        setFormData(prev => ({ ...prev, title }))
      }
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      if (uploadType === 'file') {
        if (!file) {
          setError('Please select a file to upload')
          setUploading(false)
          return
        }

        await uploadAPI.uploadFile(file, formData)
      } else {
        // Upload link
        if (!formData.url) {
          setError('Please enter a URL')
          setUploading(false)
          return
        }

        await resourcesAPI.create({
          ...formData,
          resource_type: 'link'
        })
      }

      setSuccess(true)
      // Reset form
      setFile(null)
      setFormData({
        title: '',
        description: '',
        category: '',
        tags: '',
        url: ''
      })
      // Reset file input
      const fileInput = document.getElementById('file-upload')
      if (fileInput) fileInput.value = ''

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <UploadIcon className="h-16 w-16 text-primary-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Upload Resource
        </h1>
        <p className="text-gray-400">
          Add a file or external link to your collection
        </p>
      </div>

      {/* Type Selector */}
      <div className="flex gap-4">
        <button
          onClick={() => setUploadType('file')}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            uploadType === 'file'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <UploadIcon className="h-5 w-5" />
          Upload File
        </button>
        <button
          onClick={() => setUploadType('link')}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            uploadType === 'link'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <LinkIcon className="h-5 w-5" />
          Add Link
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-600 bg-opacity-20 border border-green-600 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
          <Check className="h-5 w-5 text-green-400" />
          <p className="text-green-400">
            {uploadType === 'file' ? 'File uploaded successfully!' : 'Link added successfully!'}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-600 bg-opacity-20 border border-red-600 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* File Upload */}
        {uploadType === 'file' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              File *
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
              <input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.mp4,.webm,.doc,.docx,.txt,.md"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                {file ? (
                  <p className="text-white font-medium">{file.name}</p>
                ) : (
                  <>
                    <p className="text-white font-medium mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-gray-400 text-sm">
                      PDF, images, documents (max 100MB)
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>
        )}

        {/* URL Input */}
        {uploadType === 'link' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              URL *
            </label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className="input-field w-full"
              required={uploadType === 'link'}
            />
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title {uploadType === 'link' && '*'}
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Resource title"
            className="input-field w-full"
            required={uploadType === 'link'}
          />
          {uploadType === 'file' && (
            <p className="text-gray-500 text-xs mt-1">
              Leave empty to auto-generate from filename
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Brief description of the resource"
            rows="3"
            className="input-field w-full resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="input-field w-full"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tags
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="security, penetration-testing, tools (comma-separated)"
            className="input-field w-full"
          />
          <p className="text-gray-500 text-xs mt-1">
            Separate tags with commas
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading || (uploadType === 'file' && !file)}
          className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              {uploadType === 'file' ? 'Uploading...' : 'Adding...'}
            </span>
          ) : (
            <span>{uploadType === 'file' ? 'Upload File' : 'Add Link'}</span>
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-3">💡 Pro Tip</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          You can also add files automatically by dropping them into the watched folders
          in your project directory. The system will automatically detect and import them!
        </p>
      </div>
    </div>
  )
}

export default Upload
