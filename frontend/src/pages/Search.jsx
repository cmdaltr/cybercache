import { useState } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { resourcesAPI } from '../api/client'
import SearchBar from '../components/SearchBar'
import ResourceCard from '../components/ResourceCard'

function Search() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [query, setQuery] = useState('')

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([])
      setSearched(false)
      setQuery('')
      return
    }

    setLoading(true)
    setQuery(searchQuery)
    setSearched(true)

    try {
      const response = await resourcesAPI.search(searchQuery)
      setResults(response.data)
    } catch (error) {
      console.error('Error searching:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <SearchIcon className="h-16 w-16 text-primary-500" />
        </div>
        <h1 className="text-3xl font-bold text-white">
          Search Resources
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Search across all your resources using powerful full-text search.
          Find documents by title, description, tags, or category.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-3xl mx-auto">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search for cheat sheets, tools, guides..."
          autoFocus={true}
        />
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : searched ? (
        results.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">
              No results found for "{query}"
            </p>
            <p className="text-gray-500 mt-2">
              Try different keywords or browse all resources
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-400">
              Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="text-center py-16 text-gray-500">
          <p>Enter a search query to find resources</p>
        </div>
      )}
    </div>
  )
}

export default Search
