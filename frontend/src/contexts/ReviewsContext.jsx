import { createContext, useContext, useState, useEffect } from 'react'

const ReviewsContext = createContext(null)

export function ReviewsProvider({ children }) {
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    const savedReviews = localStorage.getItem('reviews')
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews))
    }
  }, [])

  const maskName = (name) => {
    if (!name) return ''
    
    // Split name by spaces for names like "Andrew Lee"
    const nameParts = name.trim().split(/\s+/)
    
    if (nameParts.length === 1) {
      // Single word name (Korean or single-word English)
      const singleName = nameParts[0]
      if (singleName.length <= 1) {
        return singleName
      }
      if (singleName.length === 2) {
        return singleName[0] + '*'
      }
      return singleName[0] + '*'.repeat(singleName.length - 2) + singleName[singleName.length - 1]
    } else {
      // Multi-word name (e.g., "Andrew Lee" -> "A***** **e")
      const firstPart = nameParts[0]
      const lastPart = nameParts[nameParts.length - 1]
      const middleParts = nameParts.slice(1, -1)
      
      let masked = ''
      // First word: first char + stars
      if (firstPart.length > 0) {
        masked += firstPart[0] + '*'.repeat(Math.max(0, firstPart.length - 1))
      }
      
      // Middle words: all stars
      middleParts.forEach(part => {
        masked += ' ' + '*'.repeat(part.length)
      })
      
      // Last word: stars + last char
      if (lastPart.length > 0) {
        if (middleParts.length > 0 || firstPart.length > 0) {
          masked += ' '
        }
        masked += '*'.repeat(Math.max(0, lastPart.length - 1)) + lastPart[lastPart.length - 1]
      }
      
      return masked.trim()
    }
  }

  const addReview = (review) => {
    const maskedName = maskName(review.userName)
    const newReview = {
      id: Date.now(),
      ...review,
      userId: review.userId, // Store userId to track who wrote the review
      userName: maskedName, // Store masked name
      originalUserName: review.userName, // Keep original for admin purposes (optional)
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const updatedReviews = [newReview, ...reviews]
    setReviews(updatedReviews)
    localStorage.setItem('reviews', JSON.stringify(updatedReviews))
    return newReview
  }

  const updateReview = (reviewId, updates) => {
    const updatedReviews = reviews.map(review => {
      if (review.id === reviewId) {
        const maskedName = maskName(updates.userName || review.originalUserName)
        return {
          ...review,
          ...updates,
          userName: maskedName,
          originalUserName: updates.userName || review.originalUserName,
          updatedAt: new Date().toISOString()
        }
      }
      return review
    })
    setReviews(updatedReviews)
    localStorage.setItem('reviews', JSON.stringify(updatedReviews))
    return updatedReviews.find(r => r.id === reviewId)
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
    addReview,
    updateReview,
    getUserReview,
    getReviewsByItemId,
    getRecentReviews
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
