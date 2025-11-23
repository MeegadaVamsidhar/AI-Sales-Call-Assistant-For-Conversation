'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Star, ShoppingCart, Search, Filter, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoomContext } from '@livekit/components-react';

interface Book {
  book_id: string;
  title: string;
  author: string;
  genre: string;
  price: number;
  rating: number;
  description: string;
  confidence_score: number;
  reason: string;
  recommendation_type: string;
  discount_available: boolean;
  discount_percentage: number;
}

interface RecommendationPanelProps {
  customerId?: string;
  conversationContext?: string;
  onBookSelect?: (book: Book) => void;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  customerId = 'CUST001',
  conversationContext = '',
  onBookSelect
}) => {
  const room = useRoomContext();
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number | undefined>();

  const genres = [
    'fiction', 'non-fiction', 'mystery', 'romance', 'thriller',
    'sci-fi', 'fantasy', 'biography', 'history', 'self-help',
    'business', 'children', 'young-adult'
  ];

  const fetchRecommendations = async (addRandomOffset = false) => {
    setLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      // Add random offset to get different books on each refresh
      const randomOffset = addRandomOffset ? Math.floor(Math.random() * 50) : 0;
      const timestamp = Date.now(); // Cache buster
      const response = await fetch(
        `${backendUrl}/recommendations/${customerId}?conversation_context=${encodeURIComponent(conversationContext)}&max_recommendations=20&offset=${randomOffset}&_t=${timestamp}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const searchBooks = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const params = new URLSearchParams({
        query: searchQuery,
        ...(selectedGenre && selectedGenre !== 'all' && { genre: selectedGenre }),
        ...(maxPrice && { max_price: maxPrice.toString() })
      });

      const response = await fetch(`${backendUrl}/books/search?${params}`);

      if (!response.ok) {
        throw new Error('Failed to search books');
      }

      const data = await response.json();
      setRecommendations(data.books || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch without offset
    fetchRecommendations(false);

    // Set up auto-refresh every 10 seconds with random offset for variety
    const refreshInterval = setInterval(() => {
      fetchRecommendations(true); // Pass true to enable random offset
    }, 10000); // 10 seconds

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [customerId, conversationContext]);

  const getRecommendationTypeColor = (type: string) => {
    switch (type) {
      case 'similar_books': return 'bg-blue-100 text-blue-800';
      case 'genre_based': return 'bg-green-100 text-green-800';
      case 'trending': return 'bg-purple-100 text-purple-800';
      case 'contextual': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecommendationTypeIcon = (type: string) => {
    switch (type) {
      case 'similar_books': return '🔗';
      case 'genre_based': return '📚';
      case 'trending': return '🔥';
      case 'contextual': return '🧠';
      default: return '📖';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-border">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-card rounded-lg shadow-sm">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">AI Recommendations</h3>
            <p className="text-xs text-muted-foreground">Personalized for you</p>
          </div>
        </div>
        <Button
          onClick={() => fetchRecommendations(true)}
          variant="outline"
          size="sm"
          disabled={loading}
          className="bg-card hover:bg-accent border-border text-foreground shadow-sm transition-all active:scale-95"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex space-x-2">
          <Input
            placeholder="Search books..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button onClick={searchBooks} disabled={loading || !searchQuery.trim()}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex space-x-2">
          <Select value={selectedGenre} onValueChange={setSelectedGenre}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {genres.map(genre => (
                <SelectItem key={genre} value={genre}>
                  {genre.charAt(0).toUpperCase() + genre.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder="Max Price"
            value={maxPrice || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
            className="w-32"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Recommendations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((book) => (
            <Card
              key={book.book_id}
              className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-border hover:-translate-y-1 overflow-hidden"
              onClick={() => onBookSelect?.(book)}
            >
              <CardHeader className="pb-3 bg-muted/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">{book.title}</CardTitle>
                    <CardDescription className="text-sm font-medium text-muted-foreground">{book.author}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-1 ml-2 bg-card px-2 py-1 rounded-full shadow-sm border border-border">
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />
                    <span className="text-xs font-bold text-foreground">{book.rating}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <div className="space-y-3">
                  {/* Genre and Type Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground hover:bg-accent">
                      {book.genre}
                    </Badge>
                    <Badge
                      className={`text-[10px] px-2 py-0.5 border-0 ${getRecommendationTypeColor(book.recommendation_type)}`}
                    >
                      {getRecommendationTypeIcon(book.recommendation_type)} {book.recommendation_type.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Price</span>
                      <span className="text-xl font-bold text-foreground">
                        ${book.price.toFixed(2)}
                      </span>
                    </div>
                    {book.discount_available && (
                      <Badge variant="destructive" className="text-xs animate-pulse">
                        {book.discount_percentage}% OFF
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {book.description}
                  </p>



                  {/* Action Button */}
                  <Button
                    size="sm"
                    className="w-full mt-2 bg-gradient-to-r from-[#7C4DFF] to-[#FF3CA6] hover:opacity-90 text-white shadow-md group-hover:shadow-lg transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookSelect?.(book);
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Select Book
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No recommendations available</p>
          <p className="text-sm">Try searching for books or refresh recommendations</p>
        </div>
      )}
    </div>
  );
};

export default RecommendationPanel;
