import { useState } from 'react'
import { Upload as UploadIcon, Link as LinkIcon, Check, AlertCircle, Loader2, ArrowLeft, Sparkles, FolderOpen } from 'lucide-react'
import { uploadAPI, resourcesAPI, importAPI, extractAPI } from '../api/client'

function Upload({ categories }) {
  const [step, setStep] = useState('input') // 'input', 'preview', 'success'
  const [mode, setMode] = useState(null) // 'file', 'link', 'bulk', 'directory' - detected automatically
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Input state
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState('')
  const [extractedData, setExtractedData] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: ''
  })

  // Bulk import state (for .txt files with links)
  const [bulkPreviews, setBulkPreviews] = useState([])
  const [bulkResults, setBulkResults] = useState(null)

  // Directory/batch upload state
  const [directoryFiles, setDirectoryFiles] = useState([])
  const [directoryPreviews, setDirectoryPreviews] = useState([])
  const [directoryResults, setDirectoryResults] = useState(null)

  const resetForm = () => {
    setStep('input')
    setMode(null)
    setFile(null)
    setUrl('')
    setExtractedData(null)
    setFormData({ title: '', description: '', category: '', tags: '' })
    setError(null)
    setBulkPreviews([])
    setBulkResults(null)
    setDirectoryFiles([])
    setDirectoryPreviews([])
    setDirectoryResults(null)
    const fileInput = document.getElementById('file-upload')
    if (fileInput) fileInput.value = ''
    const dirInput = document.getElementById('directory-upload')
    if (dirInput) dirInput.value = ''
  }

  // ============================================================================
  // Detect if a text file contains URLs
  // ============================================================================

  const isLinkFile = (content) => {
    const lines = content.split('\n').filter(l => l.trim())
    if (lines.length === 0) return false

    // Check if most lines are URLs
    const urlCount = lines.filter(l =>
      l.trim().startsWith('http://') || l.trim().startsWith('https://')
    ).length

    return urlCount >= lines.length * 0.5 // At least 50% are URLs
  }

  // ============================================================================
  // File Upload Handler
  // ============================================================================

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setLoading(true)
    setError(null)

    const fileName = selectedFile.name.toLowerCase()
    const isTextFile = fileName.endsWith('.txt') || fileName.endsWith('.csv')

    // If it's a text file, check if it contains URLs
    if (isTextFile) {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const content = event.target.result

        if (isLinkFile(content)) {
          // It's a bulk links file
          setMode('bulk')
          try {
            const response = await importAPI.previewLinks(content)
            setBulkPreviews(response.data.previews || [])
            setStep('preview')
          } catch (err) {
            setError(err.response?.data?.error || 'Failed to preview links')
          } finally {
            setLoading(false)
          }
        } else {
          // It's a regular text file, treat as document
          await processRegularFile(selectedFile)
        }
      }
      reader.readAsText(selectedFile)
    } else {
      // Regular file (PDF, image, etc.)
      await processRegularFile(selectedFile)
    }
  }

  const processRegularFile = async (selectedFile) => {
    setMode('file')
    try {
      const response = await extractAPI.fromFile(selectedFile)
      const data = response.data

      setExtractedData(data)
      setFormData({
        title: data.title || '',
        description: data.description || '',
        category: data.category || '',
        tags: data.tags || ''
      })
      setStep('preview')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze file')
      setFile(null)
      setMode(null)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // Directory Upload Handler
  // ============================================================================

  const handleDirectorySelect = async (e) => {
    const files = Array.from(e.target.files)
    if (!files || files.length === 0) return

    // Filter only allowed file types
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm', 'doc', 'docx', 'txt', 'md']
    const validFiles = files.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase()
      return ext && allowedExtensions.includes(ext)
    })

    if (validFiles.length === 0) {
      setError('No valid files found in the selected directory')
      return
    }

    setDirectoryFiles(validFiles)
    setMode('directory')
    setLoading(true)
    setError(null)

    try {
      const response = await extractAPI.fromBatch(validFiles)
      setDirectoryPreviews(response.data.previews || [])
      setStep('preview')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze files')
      setDirectoryFiles([])
      setMode(null)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // Link Handler
  // ============================================================================

  const handleLinkSubmit = async (e) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError(null)
    setMode('link')

    try {
      const response = await extractAPI.fromLink(url)
      const data = response.data

      if (data.is_duplicate) {
        setError('This URL already exists in your collection')
        setLoading(false)
        setMode(null)
        return
      }

      setExtractedData(data)
      setFormData({
        title: data.title || '',
        description: data.description || '',
        category: data.category || '',
        tags: data.tags || ''
      })
      setStep('preview')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch URL metadata')
      setMode(null)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // Save Handlers
  // ============================================================================

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (mode === 'file') {
        await uploadAPI.uploadFile(file, formData)
      } else {
        await resourcesAPI.create({
          ...formData,
          url: url,
          resource_type: 'link'
        })
      }

      setStep('success')
      setTimeout(() => {
        resetForm()
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save resource')
    } finally {
      setSaving(false)
    }
  }

  // ============================================================================
  // Bulk Import Handlers
  // ============================================================================

  const handleBulkPreviewUpdate = (index, field, value) => {
    setBulkPreviews(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // ============================================================================
  // Directory Upload Handlers
  // ============================================================================

  const handleDirectoryPreviewUpdate = (index, field, value) => {
    setDirectoryPreviews(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleDirectorySave = async () => {
    const validItems = directoryPreviews.filter(item =>
      !item.error && item.title?.trim()
    )

    if (validItems.length === 0) {
      setError('No valid files to import. Please ensure all items have titles.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Find files that match valid previews
      const filesToUpload = directoryFiles.filter(file => {
        const preview = directoryPreviews.find(p =>
          p.filename === file.name ||
          p.filename === file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        )
        return preview && !preview.error && preview.title?.trim()
      })

      const response = await uploadAPI.uploadBatch(filesToUpload)

      setDirectoryResults(response.data.results)
      setStep('success')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload files')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkSave = async () => {
    const validItems = bulkPreviews.filter(item =>
      !item.is_duplicate && !item.error && item.title?.trim()
    )

    if (validItems.length === 0) {
      setError('No valid items to import. Please ensure all items have titles.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const results = {
        successful: 0,
        failed: 0,
        duplicates: 0,
        processed: [],
        failedItems: []
      }

      for (const item of bulkPreviews) {
        if (item.is_duplicate) {
          results.duplicates++
          continue
        }
        if (item.error || !item.title?.trim()) {
          results.failed++
          results.failedItems.push({ url: item.url, reason: item.error || 'Missing title' })
          continue
        }

        try {
          let tags = item.tags
          if (Array.isArray(tags)) {
            tags = tags.join(', ')
          }

          await resourcesAPI.create({
            title: item.title,
            description: item.description || '',
            category: item.category || '',
            tags: tags || '',
            url: item.url,
            resource_type: 'link'
          })
          results.successful++
          results.processed.push({ title: item.title, category: item.category })
        } catch (err) {
          results.failed++
          results.failedItems.push({ url: item.url, reason: err.response?.data?.error || 'Save failed' })
        }
      }

      setBulkResults(results)
      setStep('success')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to import links')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const getMissingFields = () => {
    const missing = []
    if (!formData.title?.trim()) missing.push('title')
    if (!formData.category?.trim()) missing.push('category')
    return missing
  }

  const missingFields = getMissingFields()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <UploadIcon className="h-16 w-16 text-primary-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Add Resource
        </h1>
      </div>

      {/* Back Button - show in preview step */}
      {step === 'preview' && (
        <button
          onClick={resetForm}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-600 bg-opacity-20 border border-red-600 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Success Message (single item) */}
      {step === 'success' && mode !== 'bulk' && (
        <div className="bg-green-600 bg-opacity-20 border border-green-600 rounded-lg p-4 flex items-center gap-3">
          <Check className="h-5 w-5 text-green-400" />
          <p className="text-green-400">
            {mode === 'file' ? 'File uploaded successfully!' : 'Link added successfully!'}
          </p>
        </div>
      )}

      {/* ======================================================================== */}
      {/* INPUT STEP - Unified file/link input */}
      {/* ======================================================================== */}

      {step === 'input' && (
        <div className="space-y-6">
          {/* File and Directory Upload - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Drop Zone */}
            <div className="card">
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors h-full flex flex-col justify-center">
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.mp4,.webm,.doc,.docx,.txt,.md,.csv"
                  disabled={loading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {loading && mode === 'file' ? (
                    <>
                      <Loader2 className="h-12 w-12 text-primary-500 mx-auto mb-4 animate-spin" />
                      <p className="text-white font-medium">Analyzing...</p>
                      <p className="text-gray-400 text-sm mt-2">Extracting metadata and classifying</p>
                    </>
                  ) : (
                    <>
                      <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-white font-medium mb-2">
                        Upload a file
                      </p>
                      <p className="text-gray-400 text-sm">
                        PDF, images, documents, or .txt with URLs
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Directory Upload */}
            <div className="card">
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors h-full flex flex-col justify-center">
                <input
                  id="directory-upload"
                  type="file"
                  onChange={handleDirectorySelect}
                  className="hidden"
                  webkitdirectory=""
                  directory=""
                  multiple
                  disabled={loading}
                />
                <label htmlFor="directory-upload" className="cursor-pointer">
                  {loading && mode === 'directory' ? (
                    <>
                      <Loader2 className="h-12 w-12 text-primary-500 mx-auto mb-4 animate-spin" />
                      <p className="text-white font-medium">Analyzing directory...</p>
                      <p className="text-gray-400 text-sm mt-2">Processing {directoryFiles.length} files</p>
                    </>
                  ) : (
                    <>
                      <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-white font-medium mb-2">
                        Upload a directory
                      </p>
                      <p className="text-gray-400 text-sm">
                        Import all supported files at once
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-gray-700"></div>
            <span className="text-gray-500 text-sm">OR</span>
            <div className="flex-1 border-t border-gray-700"></div>
          </div>

          {/* URL Input */}
          <form onSubmit={handleLinkSubmit} className="card space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <LinkIcon className="h-4 w-4 inline mr-2" />
                Paste a URL
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/resource"
                  className="input-field flex-1"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && mode === 'link' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                  Extract
                </button>
              </div>
            </div>
          </form>

          {/* Info Box */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-3">How it works</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Upload any file, select an entire directory, or paste a URL. CyberCache will automatically
              extract metadata and classify resources with categories and tags. You can review and edit
              everything before saving. For bulk URL imports, upload a .txt file with one URL per line.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* PREVIEW & EDIT (Single File or Link) */}
      {/* ======================================================================== */}

      {(mode === 'file' || mode === 'link') && step === 'preview' && (
        <div className="card space-y-6">
          {/* Extracted Info Banner */}
          {extractedData && (
            <div className="bg-primary-600 bg-opacity-20 border border-primary-600 rounded-lg p-4">
              <div className="flex items-center gap-2 text-primary-400 mb-2">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Auto-extracted metadata</span>
                <span className="text-xs text-gray-400">
                  (confidence: {extractedData.confidence})
                </span>
              </div>
              {missingFields.length > 0 && (
                <p className="text-yellow-400 text-sm">
                  Please fill in the missing fields: {missingFields.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Source info */}
          <div className="text-sm text-gray-500">
            {mode === 'file' && file && (
              <span>File: {file.name}</span>
            )}
            {mode === 'link' && (
              <span>URL: {url}</span>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Resource title"
                className={`input-field w-full ${!formData.title.trim() ? 'border-yellow-500' : ''}`}
                required
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category <span className="text-yellow-400">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`input-field w-full h-[42px] ${!formData.category ? 'border-yellow-500' : ''}`}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || !formData.title.trim()}
            className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Save Resource
              </>
            )}
          </button>
        </div>
      )}

      {/* ======================================================================== */}
      {/* BULK IMPORT - Preview & Edit */}
      {/* ======================================================================== */}

      {mode === 'bulk' && step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Review & Edit ({bulkPreviews.length} links found)
            </h2>
            <div className="text-sm text-gray-400">
              {bulkPreviews.filter(p => !p.is_duplicate && !p.error && p.title).length} ready to import
            </div>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {bulkPreviews.map((item, index) => (
              <div
                key={index}
                className={`card p-4 ${
                  item.is_duplicate ? 'opacity-50 border-yellow-600' :
                  item.error ? 'opacity-50 border-red-600' :
                  !item.title ? 'border-yellow-500' : ''
                }`}
              >
                {item.is_duplicate && (
                  <div className="text-yellow-400 text-sm mb-2">Duplicate - already exists</div>
                )}
                {item.error && (
                  <div className="text-red-400 text-sm mb-2">Error: {item.error}</div>
                )}

                <div className="text-xs text-gray-500 mb-2 truncate">{item.url}</div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => handleBulkPreviewUpdate(index, 'title', e.target.value)}
                      placeholder="Title *"
                      className={`input-field w-full text-sm ${!item.title ? 'border-yellow-500' : ''}`}
                      disabled={item.is_duplicate || item.error}
                    />
                  </div>
                  <div>
                    <select
                      value={item.category || ''}
                      onChange={(e) => handleBulkPreviewUpdate(index, 'category', e.target.value)}
                      className="input-field w-full text-sm h-[38px]"
                      disabled={item.is_duplicate || item.error}
                    >
                      <option value="">Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '')}
                      onChange={(e) => handleBulkPreviewUpdate(index, 'tags', e.target.value)}
                      placeholder="Tags"
                      className="input-field w-full text-sm"
                      disabled={item.is_duplicate || item.error}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleBulkSave}
            disabled={saving || bulkPreviews.filter(p => !p.is_duplicate && !p.error && p.title).length === 0}
            className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Import {bulkPreviews.filter(p => !p.is_duplicate && !p.error && p.title).length} Items
              </>
            )}
          </button>
        </div>
      )}

      {/* ======================================================================== */}
      {/* BULK IMPORT - Success */}
      {/* ======================================================================== */}

      {mode === 'bulk' && step === 'success' && bulkResults && (
        <div className="card space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-600 bg-opacity-20 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{bulkResults.successful}</div>
              <div className="text-sm text-gray-400">Imported</div>
            </div>
            <div className="bg-yellow-600 bg-opacity-20 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">{bulkResults.duplicates}</div>
              <div className="text-sm text-gray-400">Duplicates</div>
            </div>
            <div className="bg-red-600 bg-opacity-20 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-400">{bulkResults.failed}</div>
              <div className="text-sm text-gray-400">Failed</div>
            </div>
          </div>

          {bulkResults.processed?.length > 0 && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Successfully Imported:</h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {bulkResults.processed.map((item, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="text-primary-400">{item.title}</span>
                    {item.category && (
                      <span className="text-gray-500 ml-2">({item.category})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {bulkResults.failedItems?.length > 0 && (
            <div className="bg-red-900 bg-opacity-30 rounded-lg p-4">
              <h4 className="text-red-400 font-medium mb-2">Failed to Import:</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {bulkResults.failedItems.map((item, idx) => (
                  <div key={idx} className="text-sm text-red-300">
                    {item.url}: {item.reason}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={resetForm}
            className="btn-secondary w-full py-3"
          >
            Add More Resources
          </button>
        </div>
      )}

      {/* ======================================================================== */}
      {/* DIRECTORY UPLOAD - Preview & Edit */}
      {/* ======================================================================== */}

      {mode === 'directory' && step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Review & Edit ({directoryPreviews.length} files found)
            </h2>
            <div className="text-sm text-gray-400">
              {directoryPreviews.filter(p => !p.error && p.title).length} ready to import
            </div>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {directoryPreviews.map((item, index) => (
              <div
                key={index}
                className={`card p-4 ${
                  item.error ? 'opacity-50 border-red-600' :
                  !item.title ? 'border-yellow-500' : ''
                }`}
              >
                {item.error && (
                  <div className="text-red-400 text-sm mb-2">Error: {item.error}</div>
                )}

                <div className="text-xs text-gray-500 mb-2 truncate">
                  {item.filename}
                  {item.file_size && (
                    <span className="ml-2">
                      ({(item.file_size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => handleDirectoryPreviewUpdate(index, 'title', e.target.value)}
                      placeholder="Title *"
                      className={`input-field w-full text-sm ${!item.title ? 'border-yellow-500' : ''}`}
                      disabled={item.error}
                    />
                  </div>
                  <div>
                    <select
                      value={item.category || ''}
                      onChange={(e) => handleDirectoryPreviewUpdate(index, 'category', e.target.value)}
                      className="input-field w-full text-sm h-[38px]"
                      disabled={item.error}
                    >
                      <option value="">Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={item.tags || ''}
                      onChange={(e) => handleDirectoryPreviewUpdate(index, 'tags', e.target.value)}
                      placeholder="Tags"
                      className="input-field w-full text-sm"
                      disabled={item.error}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleDirectorySave}
            disabled={saving || directoryPreviews.filter(p => !p.error && p.title).length === 0}
            className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Upload {directoryPreviews.filter(p => !p.error && p.title).length} Files
              </>
            )}
          </button>
        </div>
      )}

      {/* ======================================================================== */}
      {/* DIRECTORY UPLOAD - Success */}
      {/* ======================================================================== */}

      {mode === 'directory' && step === 'success' && directoryResults && (
        <div className="card space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-600 bg-opacity-20 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{directoryResults.processed?.length || 0}</div>
              <div className="text-sm text-gray-400">Uploaded</div>
            </div>
            <div className="bg-yellow-600 bg-opacity-20 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">{directoryResults.duplicates?.length || 0}</div>
              <div className="text-sm text-gray-400">Duplicates</div>
            </div>
            <div className="bg-red-600 bg-opacity-20 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-400">{directoryResults.failed?.length || 0}</div>
              <div className="text-sm text-gray-400">Failed</div>
            </div>
          </div>

          {directoryResults.processed?.length > 0 && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Successfully Uploaded:</h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {directoryResults.processed.map((item, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="text-primary-400">{item.title}</span>
                    {item.category && (
                      <span className="text-gray-500 ml-2">({item.category})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {directoryResults.duplicates?.length > 0 && (
            <div className="bg-yellow-900 bg-opacity-30 rounded-lg p-4">
              <h4 className="text-yellow-400 font-medium mb-2">Skipped (Duplicates):</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {directoryResults.duplicates.map((item, idx) => (
                  <div key={idx} className="text-sm text-yellow-300">
                    {item.filename}
                  </div>
                ))}
              </div>
            </div>
          )}

          {directoryResults.failed?.length > 0 && (
            <div className="bg-red-900 bg-opacity-30 rounded-lg p-4">
              <h4 className="text-red-400 font-medium mb-2">Failed to Upload:</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {directoryResults.failed.map((item, idx) => (
                  <div key={idx} className="text-sm text-red-300">
                    {item.filename}: {item.reason}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={resetForm}
            className="btn-secondary w-full py-3"
          >
            Add More Resources
          </button>
        </div>
      )}
    </div>
  )
}

export default Upload
