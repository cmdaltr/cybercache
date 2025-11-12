import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Search, Upload, Database, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { statsAPI, resourcesAPI } from '../api/client'
import ResourceCard from '../components/ResourceCard'

function Home() {
  const [stats, setStats] = useState(null)
  const [recentResources, setRecentResources] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, resourcesRes] = await Promise.all([
        statsAPI.get(),
        resourcesAPI.getAll({ limit: 6 })
      ])
      setStats(statsRes.data)
      setRecentResources(resourcesRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: Database,
      title: 'Automatic Updates',
      description: 'Drop files into watched folders and they automatically appear in the library'
    },
    {
      icon: Search,
      title: 'Powerful Search',
      description: 'Full-text search with intelligent ranking finds exactly what you need'
    },
    {
      icon: Upload,
      title: 'Easy Uploads',
      description: 'Upload files and add external links through a simple interface'
    },
    {
      icon: Shield,
      title: 'Organized Collections',
      description: 'Browse curated cybersecurity resources organized by category'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6"
      >
        <div className="flex justify-center">
          <Shield className="h-20 w-20 text-primary-500" />
        </div>
        <h1 className="text-5xl font-bold text-white">
          CyberCache
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Your personal, locally-hosted cybersecurity resource hub.
          Automatically organize, search, and manage your security resources.
        </p>

        {/* Quick Stats */}
        {stats && (
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-500">{stats.total}</div>
              <div className="text-sm text-gray-400">Total Resources</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-500">
                {Object.keys(stats.by_category || {}).length}
              </div>
              <div className="text-sm text-gray-400">Categories</div>
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Link to="/browse" className="btn-primary px-8 py-3 text-lg">
            Browse Resources
          </Link>
          <Link to="/upload" className="btn-secondary px-8 py-3 text-lg">
            Upload New
          </Link>
        </div>
      </motion.div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card text-center"
            >
              <div className="flex justify-center mb-4">
                <Icon className="h-12 w-12 text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm">
                {feature.description}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Recent Resources */}
      {recentResources.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary-500" />
              Recent Resources
            </h2>
            <Link to="/browse" className="text-primary-400 hover:text-primary-300">
              View all →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
