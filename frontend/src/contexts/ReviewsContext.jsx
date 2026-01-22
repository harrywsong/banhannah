import { createContext, useContext, useState, useEffect } from 'react'
import { apiEndpoint, apiRequest } from '../config/api'

const ReviewsContext = createContext(null)

export function ReviewsProvider({ children }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  // Load reviews from database
  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      const response = await apiRequest(apiEndpoint('reviews'))
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Failed to load reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const addReview = async (reviewData) => {
  try {
    console.log('📝 Submitting review with data:', reviewData); // Debug log
    
    const response = await apiRequest(apiEndpoint('reviews'), {
      method: 'POST',
      body: JSON.stringify({
        itemId: reviewData.itemId,
        itemType: reviewData.itemType,
        itemTitle: reviewData.itemTitle,  // ✅ MUST INCLUDE THIS
        rating: reviewData.rating,
        comment: reviewData.comment
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Review submission failed:', errorData);
      throw new Error(errorData.error || 'Failed to add review');
    }
    
    const data = await response.json()
    setReviews([data.review, ...reviews])
    return data.review
  } catch (error) {
    console.error('Failed to add review:', error)
    throw error
  }
}

  const updateReview = async (reviewId, updates) => {
    try {
      const response = await apiRequest(apiEndpoint(`reviews/${reviewId}`), {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        const data = await response.json()
        setReviews(reviews.map(r => r.id === reviewId ? data.review : r))
        return data.review
      }
    } catch (error) {
      console.error('Failed to update review:', error)
      throw error
    }
  }

  const getUserReview = (userId, itemId, itemType) => {
    return reviews.find(r => 
      r.userId === userId && 
      r.itemId === itemId && 
      r.itemType === itemType
    )
  }

  const getReviewsByItemId = (itemId, itemType) => {
    return reviews.filter(r => r.itemId === itemId && r.itemType === itemType)
  }

  const getRecentReviews = (limit = 5) => {
    return reviews
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit)
  }

  const value = {
    reviews,
    loading,
    addReview,
    updateReview,
    getUserReview,
    getReviewsByItemId,
    getRecentReviews,
    reload: loadReviews
  }

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>
}

export function useReviews() {
  const context = useContext(ReviewsContext)
  if (!context) {
    throw new Error('useReviews must be used within ReviewsProvider')
  }
  return context
}