import { useState } from 'react'
import { Download, FileText, Globe } from 'lucide-react'
import { motion } from 'framer-motion'
import chromeIcon from '../../images/chrome.png'
import firefoxIcon from '../../images/firefox.png'
import safariIcon from '../../images/safari.png'
import edgeIcon from '../../images/edge.png'
import operaIcon from '../../images/opera.png'

function Export() {
  const [selectedBrowser, setSelectedBrowser] = useState(null)
  const [format, setFormat] = useState('html')

  const browsers = [
    { id: 'chrome', name: 'Chrome', icon: chromeIcon },
    { id: 'firefox', name: 'Firefox', icon: firefoxIcon },
    { id: 'safari', name: 'Safari', icon: safariIcon },
    { id: 'edge', name: 'Edge', icon: edgeIcon },
    { id: 'opera', name: 'Opera', icon: operaIcon }
  ]

  const handleExport = (browserId) => {
    const url = `/api/bookmarks/export/${browserId}?format=${format}`
    const filename = `cybercache_bookmarks_${browserId}.${format}`

    // Create a temporary link and trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setSelectedBrowser(browserId)
    setTimeout(() => setSelectedBrowser(null), 2000)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Download className="h-8 w-8 text-primary-500" />
          Export Bookmarks
        </h1>
        <p className="text-gray-400">
          Export all your link resources as browser bookmarks for easy import
        </p>
      </motion.div>

      {/* Export Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="card"
      >
        <div className="flex gap-4 flex-wrap items-center">
          <button
            onClick={() => setFormat('html')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              format === 'html'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            HTML (Recommended)
          </button>
          <button
            onClick={() => setFormat('json')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              format === 'json'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            JSON
          </button>
          <div className="h-10 w-px bg-gray-600 mx-6"></div>
          {browsers.map((browser) => (
            <motion.button
              key={browser.id}
              onClick={() => handleExport(browser.id)}
              disabled={selectedBrowser === browser.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 py-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                selectedBrowser === browser.id
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-700 hover:border-primary-500 bg-gray-800'
              }`}
            >
              <img src={browser.icon} alt={browser.name} className="w-6 h-6" />
              <span className="font-medium text-white">{browser.name}</span>
              {selectedBrowser === browser.id && (
                <span className="text-green-400">✓</span>
              )}
            </motion.button>
          ))}
        </div>
        <p className="text-sm text-gray-400 mt-4">
          {format === 'html'
            ? 'Standard Netscape bookmark format compatible with all browsers'
            : 'JSON format for programmatic use or custom import scripts'}
        </p>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="card bg-gray-800/50"
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          📖 How to Import Bookmarks
        </h2>
        <div className="space-y-4 text-gray-300">
          <div>
            <h3 className="font-semibold text-primary-400 mb-2">Chrome / Edge:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click ⋮ (three dots) → Bookmarks → Bookmark Manager</li>
              <li>Click ⋮ → Import bookmarks</li>
              <li>Select the downloaded HTML file</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-primary-400 mb-2">Firefox:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click ☰ (menu) → Bookmarks → Manage Bookmarks</li>
              <li>Click Import and Backup → Import Bookmarks from HTML</li>
              <li>Select the downloaded HTML file</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-primary-400 mb-2">Safari:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>File → Import From → Bookmarks HTML File</li>
              <li>Select the downloaded HTML file</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-primary-400 mb-2">Opera:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click ☰ (menu) → Bookmarks → Import bookmarks and settings</li>
              <li>Select "Bookmarks HTML File" from dropdown</li>
              <li>Click "Choose File" and select the downloaded HTML file</li>
            </ol>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="card bg-primary-900/20 border border-primary-500/20"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-500/20 rounded-lg">
            <Globe className="h-6 w-6 text-primary-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Export includes</p>
            <p className="text-lg font-semibold text-white">
              All link resources organized by category
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Export
