import { apiEndpoint, apiRequest } from '../config/api';

export const progressApi = {
  // Get course progress
  async getCourseProgress(courseId) {
    const response = await apiRequest(apiEndpoint(`progress/course/${courseId}`));
    if (!response.ok) throw new Error('Failed to get progress');
    return response.json();
  },

  // Mark lesson complete/incomplete
  async updateLessonProgress(courseId, lessonId, completed) {
    const response = await apiRequest(apiEndpoint('progress/lesson'), {
      method: 'POST',
      body: JSON.stringify({ courseId, lessonId, completed })
    });
    if (!response.ok) throw new Error('Failed to update progress');
    return response.json();
  }
};