import React, { useState, useEffect } from 'react';
import { Star, Send, MessageSquare, TrendingUp } from 'lucide-react';

const PlatformRating: React.FC = () => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    satisfactionRate: 0
  });

  useEffect(() => {
    loadPlatformStats();
  }, []);

  const loadPlatformStats = () => {
    // Load from localStorage or initialize to 0
    const totalReviews = parseInt(localStorage.getItem('platform_total_reviews') || '0');
    const totalRating = parseFloat(localStorage.getItem('platform_total_rating') || '0');
    const satisfactionRate = parseFloat(localStorage.getItem('platform_satisfaction_rate') || '0');
    
    setStats({
      totalReviews,
      averageRating: totalReviews > 0 ? totalRating / totalReviews : 0,
      satisfactionRate
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get current stats
    const currentTotalReviews = parseInt(localStorage.getItem('platform_total_reviews') || '0');
    const currentTotalRating = parseFloat(localStorage.getItem('platform_total_rating') || '0');
    
    // Update stats
    const newTotalReviews = currentTotalReviews + 1;
    const newTotalRating = currentTotalRating + rating;
    
    // Calculate satisfaction rate (ratings 4 and 5 are considered satisfied)
    const existingRatings = JSON.parse(localStorage.getItem('platformRatings') || '[]');
    existingRatings.push({
      rating,
      feedback,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9)
    });
    
    const satisfiedRatings = existingRatings.filter((r: any) => r.rating >= 4).length;
    const newSatisfactionRate = (satisfiedRatings / newTotalReviews) * 100;
    
    // Store updated stats
    localStorage.setItem('platform_total_reviews', newTotalReviews.toString());
    localStorage.setItem('platform_total_rating', newTotalRating.toString());
    localStorage.setItem('platform_satisfaction_rate', newSatisfactionRate.toString());
    localStorage.setItem('platformRatings', JSON.stringify(existingRatings));
    
    // Update local state
    setStats({
      totalReviews: newTotalReviews,
      averageRating: newTotalRating / newTotalReviews,
      satisfactionRate: newSatisfactionRate
    });
    
    setSubmitted(true);
  };

  const handleReset = () => {
    setRating(0);
    setFeedback('');
    setSubmitted(false);
    loadPlatformStats(); // Reload stats to show updated values
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Thank You!</h2>
          <p className="text-green-600 mb-6">Your feedback has been submitted successfully</p>
          
          {/* Show updated stats */}
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-800 mb-2">Updated Platform Statistics</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-2xl font-bold text-green-800">{stats.averageRating.toFixed(1)}</div>
                <div className="text-green-600">Average Rating</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-800">{stats.totalReviews}</div>
                <div className="text-green-600">Total Reviews</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-800">{stats.satisfactionRate.toFixed(0)}%</div>
                <div className="text-green-600">Satisfaction Rate</div>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleReset}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
          >
            Submit Another Rating
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg">
            <Star className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-yellow-800">Rate Platform</h2>
            <p className="text-yellow-600">Share your experience with HerbionYX</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Star Rating */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">How would you rate your experience?</h3>
            <div className="flex justify-center space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-2 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredStar || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              {rating === 0 && 'Click to rate'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share your feedback (optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder="Tell us about your experience with the platform..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={rating === 0}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-3 px-8 rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
            >
              <Send className="h-5 w-5" />
              <span>Submit Rating</span>
            </button>
          </div>
        </form>

        {/* Platform Statistics */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Platform Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-800">{stats.averageRating.toFixed(1)}</div>
              <div className="text-sm text-green-600">Average Rating</div>
              <div className="flex justify-center mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= Math.round(stats.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-800">{stats.totalReviews}</div>
              <div className="text-sm text-blue-600">Total Reviews</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-800">{stats.satisfactionRate.toFixed(0)}%</div>
              <div className="text-sm text-purple-600">Satisfaction Rate</div>
              <div className="text-xs text-purple-500 mt-1">Ratings 4+ considered satisfied</div>
            </div>
          </div>
          
          {stats.totalReviews === 0 && (
            <div className="text-center mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">Be the first to rate our platform!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatformRating;