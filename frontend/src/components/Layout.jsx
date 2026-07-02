import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Upload, Menu, X, Shield, Download, Book } from 'lucide-react'
import { useState } from 'react'

function Layout({ children, categories }) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const Logo = ({ className }) => (
    <div className="relative inline-block">
      <Shield className={className} />
      <Book className="absolute top-[48%] left-[50.5%] transform -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 text-primary-500 group-hover:text-primary-400 transition-colors" />
    </div>
  )

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Browse', href: '/browse', icon: Search },
    { name: 'Upload', href: '/upload', icon: Upload },
    { name: 'Export', href: '/export', icon: Download },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <Logo className="h-8 w-8 text-primary-500 group-hover:text-primary-400 transition-colors" />
              <span className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">
                CyberCache
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-gray-900 bg-opacity-90 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-64 bg-gray-800 shadow-xl">
            <div className="p-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400 text-sm space-y-4">
            <p>CyberCache - Your local cybersecurity resource hub | Built with React, Flask, and SQLite</p>
            <div className="border-t border-gray-700 pt-4 mt-4">
              <p className="text-gray-500 italic">
                With great power, comes great responsibility; this material has been collated to encourage learning and development, and not to be leveraged for unethical and/or illegal behaviour.
              </p>
              <p className="text-gray-500 mt-2">
                By visiting any of these sites, you are doing so at your own risk.
              </p>
              <p className="text-gray-500 mt-4">
                I would like to thank all of the authors, instructors, publishers, developers (and others) - both individuals and teams - for the content curated on this site. I must stress that none of the content referenced/linked on this site is my own.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
