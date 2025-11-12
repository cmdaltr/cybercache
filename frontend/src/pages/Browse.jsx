import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Filter } from 'lucide-react'
import { resourcesAPI } from '../api/client'
import ResourceCard from '../components/ResourceCard'

function Browse({ categories }) {
  const { category } = useParams()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(category || null)

  useEffect(() => {
    loadResources()
  }, [selectedCategory])

  const loadResources = async () => {
    setLoading(true)
    try {
      const response = await resourcesAPI.getAll({
        category: selectedCategory
      })
      setResources(response.data)
    } catch (error) {
      console.error('Error loading resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat === selectedCategory ? null : cat)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Browse Resources
        </h1>
        <p className="text-gray-400">
          {selectedCategory
            ? `Showing resources in ${selectedCategory}`
            : 'Showing all resources'}
        </p>
      </div>

      {/* Category Filter */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-white">Filter by Category</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryChange(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              !selectedCategory
                ? 'bg-primary-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.name)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedCategory === cat.name
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-4">No resources found</p>
          <Link to="/upload" className="btn-primary">
            Upload your first resource
          </Link>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <p className="text-gray-400">
              {resources.length} resource{resources.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default Browse
