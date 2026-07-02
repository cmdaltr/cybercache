import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Filter, Search as SearchIcon, Tag } from 'lucide-react'
import { resourcesAPI, tagsAPI } from '../api/client'
import ResourceCard from '../components/ResourceCard'
import SearchBar from '../components/SearchBar'

function Browse({ categories }) {
  const { category } = useParams()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(category || null)
  const [selectedTag, setSelectedTag] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [tags, setTags] = useState([])

  useEffect(() => {
    loadTags()
  }, [])

  useEffect(() => {
    loadResources()
  }, [selectedCategory, selectedTag, searchQuery])

  const loadTags = async () => {
    try {
      const response = await tagsAPI.getAll()
      setTags(response.data)
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  }

  const loadResources = async () => {
    setLoading(true)
    try {
      let response
      if (searchQuery) {
        // If there's a search query, use search API
        response = await resourcesAPI.search(searchQuery)
        // Filter by category if one is selected
        if (selectedCategory) {
          response.data = response.data.filter(r => r.category === selectedCategory)
        }
        // Filter by tag if one is selected
        if (selectedTag) {
          response.data = response.data.filter(r =>
            r.tags && r.tags.split(',').map(t => t.trim()).includes(selectedTag)
          )
        }
      } else {
        // Otherwise, get all resources
        response = await resourcesAPI.getAll({
          category: selectedCategory
        })
        // Filter by tag if one is selected
        if (selectedTag) {
          response.data = response.data.filter(r =>
            r.tags && r.tags.split(',').map(t => t.trim()).includes(selectedTag)
          )
        }
      }
      setResources(response.data)
    } catch (error) {
      console.error('Error loading resources:', error)
      setResources([])
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat === selectedCategory ? null : cat)
  }

  const handleTagChange = (tag) => {
    setSelectedTag(tag === selectedTag ? null : tag)
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Browse Resources
        </h1>
        <p className="text-gray-400">
          {searchQuery
            ? `Search results for "${searchQuery}"${selectedCategory ? ` in ${selectedCategory}` : ''}${selectedTag ? ` tagged with ${selectedTag}` : ''}`
            : selectedCategory || selectedTag
            ? `Showing resources${selectedCategory ? ` in ${selectedCategory}` : ''}${selectedTag ? ` tagged with ${selectedTag}` : ''}`
            : 'Showing all resources'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <SearchIcon className="h-5 w-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-white">Search Resources</h2>
        </div>
        <SearchBar onSearch={handleSearch} placeholder="Search by title, description, or tags..." />
      </div>

      {/* Category & Tag Filter */}
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
          {tags.length > 0 && tags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagChange(tag)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedTag === tag
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-900/40 text-purple-300 hover:bg-purple-800/60'
              }`}
            >
              {tag}
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
              {resources.length} resource{resources.length !== 1 ? 's' : ''} • {tags.length} tag{tags.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
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
