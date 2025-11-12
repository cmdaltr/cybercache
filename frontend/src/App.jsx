import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Home from './pages/Home'
import Browse from './pages/Browse'
import Search from './pages/Search'
import Upload from './pages/Upload'
import ResourceDetail from './pages/ResourceDetail'
import { categoriesAPI } from './api/client'

function App() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll()
      setCategories(response.data)
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <Router>
      <Layout categories={categories}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse categories={categories} />} />
          <Route path="/browse/:category" element={<Browse categories={categories} />} />
          <Route path="/search" element={<Search />} />
          <Route path="/upload" element={<Upload categories={categories} />} />
          <Route path="/resource/:id" element={<ResourceDetail />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
