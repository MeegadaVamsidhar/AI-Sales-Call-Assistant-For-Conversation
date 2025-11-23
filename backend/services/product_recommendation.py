"""
Product Recommendation System & CRM Integration
Milestone 3: Weeks 5-6 Module 2

This module implements:
1. CRM data integration for customer profiles
2. Product recommendation engine based on customer preferences
3. Book catalog management with genres, authors, and ratings
4. Real-time recommendation generation during sales calls
"""

import os
import logging
import json
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum
from collections import defaultdict

# LLM imports
import openai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BookGenre(Enum):
    """Book genre categories"""
    FICTION = "fiction"
    NON_FICTION = "non-fiction"
    MYSTERY = "mystery"
    ROMANCE = "romance"
    THRILLER = "thriller"
    SCI_FI = "sci-fi"
    FANTASY = "fantasy"
    BIOGRAPHY = "biography"
    HISTORY = "history"
    SELF_HELP = "self-help"
    BUSINESS = "business"
    CHILDREN = "children"
    YOUNG_ADULT = "young-adult"
    COOKING = "cooking"
    TRAVEL = "travel"
    HEALTH = "health"
    RELIGION = "religion"
    PHILOSOPHY = "philosophy"
    POETRY = "poetry"

class CustomerSegment(Enum):
    """Customer segmentation categories"""
    NEW_CUSTOMER = "new_customer"
    REGULAR_CUSTOMER = "regular_customer"
    VIP_CUSTOMER = "vip_customer"
    BUDGET_CONSCIOUS = "budget_conscious"
    PREMIUM_READER = "premium_reader"
    BULK_BUYER = "bulk_buyer"

@dataclass
class Book:
    """Book data structure"""
    book_id: str
    title: str
    author: str
    genre: BookGenre
    price: float
    rating: float
    description: str
    isbn: str
    publication_year: int
    page_count: int
    language: str = "English"
    availability: bool = True
    stock_quantity: int = 0
    tags: List[str] = None
    similar_books: List[str] = None  # IDs of similar books

@dataclass
class CustomerProfile:
    """Customer profile data structure"""
    customer_id: str
    name: str
    email: str
    phone: str
    segment: CustomerSegment
    preferences: Dict[str, Any]  # Genre preferences, price range, etc.
    purchase_history: List[Dict[str, Any]]
    reading_level: str  # beginner, intermediate, advanced
    favorite_authors: List[str]
    favorite_genres: List[BookGenre]
    budget_range: Tuple[float, float]  # min, max price
    last_purchase_date: Optional[datetime] = None
    total_purchases: int = 0
    average_order_value: float = 0.0

@dataclass
class Recommendation:
    """Product recommendation structure"""
    book: Book
    confidence_score: float
    reason: str
    recommendation_type: str  # "similar_books", "trending", "personalized", "cross_sell"
    discount_available: bool = False
    discount_percentage: float = 0.0

class ProductRecommendationEngine:
    """
    Advanced product recommendation engine with CRM integration
    """
    
    def __init__(self):
        self.openai_client = None
        self.book_catalog: Dict[str, Book] = {}
        self.customer_profiles: Dict[str, CustomerProfile] = {}
        self.recommendation_history: Dict[str, List[Recommendation]] = {}
        
        # Initialize with sample data
        self._initialize_sample_data()
        self._initialize_openai()
    
    def _initialize_openai(self):
        """Initialize OpenAI client for advanced recommendations"""
        try:
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if openai_api_key:
                self.openai_client = openai.AsyncOpenAI(api_key=openai_api_key)
                logger.info("OpenAI client initialized for product recommendations")
            else:
                logger.warning("OpenAI API key not found - using rule-based recommendations only")
        except Exception as e:
            logger.error(f"Error initializing OpenAI: {e}")
    
    def _initialize_sample_data(self):
        """Initialize with sample book catalog and customer data"""
        # Sample book catalog
        sample_books = [
            Book(
                book_id="BK001",
                title="The Great Gatsby",
                author="F. Scott Fitzgerald",
                genre=BookGenre.FICTION,
                price=12.99,
                rating=4.2,
                description="A classic American novel about the Jazz Age and the American Dream.",
                isbn="9780743273565",
                publication_year=1925,
                page_count=180,
                tags=["classic", "american", "jazz age"],
                stock_quantity=25
            ),
            Book(
                book_id="BK002",
                title="Rich Dad Poor Dad",
                author="Robert Kiyosaki",
                genre=BookGenre.BUSINESS,
                price=15.99,
                rating=4.5,
                description="Personal finance advice and lessons about money management.",
                isbn="9781612680194",
                publication_year=1997,
                page_count=336,
                tags=["finance", "money", "investment"],
                stock_quantity=30
            ),
            Book(
                book_id="BK003",
                title="To Kill a Mockingbird",
                author="Harper Lee",
                genre=BookGenre.FICTION,
                price=13.99,
                rating=4.8,
                description="A gripping tale of racial injustice and childhood innocence.",
                isbn="9780061120084",
                publication_year=1960,
                page_count=281,
                tags=["classic", "social justice", "coming of age"],
                stock_quantity=20
            ),
            Book(
                book_id="BK004",
                title="Atomic Habits",
                author="James Clear",
                genre=BookGenre.SELF_HELP,
                price=16.99,
                rating=4.7,
                description="An easy and proven way to build good habits and break bad ones.",
                isbn="9780735211292",
                publication_year=2018,
                page_count=320,
                tags=["habits", "productivity", "self-improvement"],
                stock_quantity=35
            ),
            Book(
                book_id="BK005",
                title="The Silent Patient",
                author="Alex Michaelides",
                genre=BookGenre.THRILLER,
                price=14.99,
                rating=4.3,
                description="A psychological thriller about a woman who refuses to speak.",
                isbn="9781250301697",
                publication_year=2019,
                page_count=336,
                tags=["psychological thriller", "mystery", "bestseller"],
                stock_quantity=28
            ),
            Book(
                book_id="BK006",
                title="Sapiens",
                author="Yuval Noah Harari",
                genre=BookGenre.HISTORY,
                price=18.99,
                rating=4.6,
                description="A brief history of humankind from the Stone Age to the present.",
                isbn="9780062316097",
                publication_year=2014,
                page_count=443,
                tags=["history", "anthropology", "evolution"],
                stock_quantity=22
            ),
            Book(
                book_id="BK007",
                title="The Seven Husbands of Evelyn Hugo",
                author="Taylor Jenkins Reid",
                genre=BookGenre.FICTION,
                price=15.99,
                rating=4.4,
                description="A captivating story about a reclusive Hollywood icon.",
                isbn="9781501139239",
                publication_year=2017,
                page_count=400,
                tags=["hollywood", "drama", "lgbtq"],
                stock_quantity=18
            ),
            Book(
                book_id="BK008",
                title="Educated",
                author="Tara Westover",
                genre=BookGenre.BIOGRAPHY,
                price=17.99,
                rating=4.7,
                description="A memoir about education, family, and the struggle for self-invention.",
                isbn="9780399590504",
                publication_year=2018,
                page_count=334,
                tags=["memoir", "education", "family"],
                stock_quantity=26
            )
        ]
        
        # Add to catalog
        for book in sample_books:
            self.book_catalog[book.book_id] = book
        
        # Set up similar books relationships
        self._setup_similar_books()
        
        # Sample customer profiles
        sample_customers = [
            CustomerProfile(
                customer_id="CUST001",
                name="John Smith",
                email="john.smith@email.com",
                phone="+1234567890",
                segment=CustomerSegment.REGULAR_CUSTOMER,
                preferences={
                    "preferred_genres": [BookGenre.FICTION, BookGenre.BUSINESS],
                    "price_range": (10.0, 25.0),
                    "reading_frequency": "monthly"
                },
                purchase_history=[
                    {"book_id": "BK001", "date": "2024-01-15", "rating": 5},
                    {"book_id": "BK002", "date": "2024-02-20", "rating": 4}
                ],
                reading_level="intermediate",
                favorite_authors=["F. Scott Fitzgerald", "Robert Kiyosaki"],
                favorite_genres=[BookGenre.FICTION, BookGenre.BUSINESS],
                budget_range=(10.0, 25.0),
                last_purchase_date=datetime(2024, 2, 20),
                total_purchases=2,
                average_order_value=14.49
            ),
            CustomerProfile(
                customer_id="CUST002",
                name="Sarah Johnson",
                email="sarah.j@email.com",
                phone="+1987654321",
                segment=CustomerSegment.VIP_CUSTOMER,
                preferences={
                    "preferred_genres": [BookGenre.THRILLER, BookGenre.MYSTERY],
                    "price_range": (15.0, 30.0),
                    "reading_frequency": "weekly"
                },
                purchase_history=[
                    {"book_id": "BK005", "date": "2024-01-10", "rating": 5},
                    {"book_id": "BK003", "date": "2024-02-05", "rating": 4}
                ],
                reading_level="advanced",
                favorite_authors=["Alex Michaelides", "Harper Lee"],
                favorite_genres=[BookGenre.THRILLER, BookGenre.FICTION],
                budget_range=(15.0, 30.0),
                last_purchase_date=datetime(2024, 2, 5),
                total_purchases=2,
                average_order_value=14.49
            )
        ]
        
        for customer in sample_customers:
            self.customer_profiles[customer.customer_id] = customer
    
    def _setup_similar_books(self):
        """Set up similar books relationships for recommendations"""
        # Define similar books based on genre, themes, and author
        similar_books_map = {
            "BK001": ["BK003", "BK007"],  # Classic fiction
            "BK002": ["BK004"],  # Self-help/business
            "BK003": ["BK001", "BK007"],  # Classic fiction
            "BK004": ["BK002"],  # Self-help
            "BK005": ["BK003"],  # Thriller/mystery
            "BK006": ["BK008"],  # Non-fiction
            "BK007": ["BK001", "BK003"],  # Fiction
            "BK008": ["BK006"]  # Biography/history
        }
        
        for book_id, similar_ids in similar_books_map.items():
            if book_id in self.book_catalog:
                self.book_catalog[book_id].similar_books = similar_ids
    
    async def get_recommendations(self, customer_id: str, conversation_context: str = "", 
                                max_recommendations: int = 5) -> List[Recommendation]:
        """
        Get personalized product recommendations for a customer
        """
        try:
            # Get customer profile
            customer = self.customer_profiles.get(customer_id)
            if not customer:
                # Create new customer profile if not found
                customer = await self._create_new_customer_profile(customer_id)
            
            # Generate recommendations using multiple strategies
            recommendations = []
            
            # 1. Personalized recommendations based on history
            personalized_recs = await self._get_personalized_recommendations(customer, max_recommendations)
            recommendations.extend(personalized_recs)
            
            # 2. Genre-based recommendations
            genre_recs = await self._get_genre_based_recommendations(customer, max_recommendations)
            recommendations.extend(genre_recs)
            
            # 3. Trending/popular books
            trending_recs = await self._get_trending_recommendations(max_recommendations)
            recommendations.extend(trending_recs)
            
            # 4. AI-powered contextual recommendations
            if self.openai_client and conversation_context:
                ai_recs = await self._get_ai_contextual_recommendations(
                    customer, conversation_context, max_recommendations
                )
                recommendations.extend(ai_recs)
            
            # Remove duplicates and sort by confidence
            unique_recommendations = self._deduplicate_recommendations(recommendations)
            sorted_recommendations = sorted(
                unique_recommendations, 
                key=lambda x: x.confidence_score, 
                reverse=True
            )
            
            # Store recommendation history
            if customer_id not in self.recommendation_history:
                self.recommendation_history[customer_id] = []
            self.recommendation_history[customer_id].extend(sorted_recommendations[:max_recommendations])
            
            return sorted_recommendations[:max_recommendations]
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return []
    
    async def _create_new_customer_profile(self, customer_id: str) -> CustomerProfile:
        """Create a new customer profile for unknown customers"""
        return CustomerProfile(
            customer_id=customer_id,
            name="Unknown Customer",
            email="",
            phone="",
            segment=CustomerSegment.NEW_CUSTOMER,
            preferences={
                "preferred_genres": [],
                "price_range": (5.0, 50.0),
                "reading_frequency": "unknown"
            },
            purchase_history=[],
            reading_level="beginner",
            favorite_authors=[],
            favorite_genres=[],
            budget_range=(5.0, 50.0),
            total_purchases=0,
            average_order_value=0.0
        )
    
    async def _get_personalized_recommendations(self, customer: CustomerProfile, 
                                              max_recs: int) -> List[Recommendation]:
        """Generate personalized recommendations based on customer history"""
        recommendations = []
        
        # Get books similar to previously purchased books
        for purchase in customer.purchase_history:
            book_id = purchase["book_id"]
            if book_id in self.book_catalog:
                book = self.book_catalog[book_id]
                if book.similar_books:
                    for similar_id in book.similar_books:
                        if similar_id in self.book_catalog:
                            similar_book = self.book_catalog[similar_id]
                            if similar_book.availability and similar_book.stock_quantity > 0:
                                rec = Recommendation(
                                    book=similar_book,
                                    confidence_score=0.8,
                                    reason=f"Similar to '{book.title}' which you rated {purchase['rating']} stars",
                                    recommendation_type="similar_books"
                                )
                                recommendations.append(rec)
        
        return recommendations[:max_recs]
    
    async def _get_genre_based_recommendations(self, customer: CustomerProfile, 
                                             max_recs: int) -> List[Recommendation]:
        """Generate recommendations based on customer's favorite genres"""
        recommendations = []
        
        # Get books from favorite genres
        for genre in customer.favorite_genres:
            genre_books = [book for book in self.book_catalog.values() 
                          if book.genre == genre and book.availability and book.stock_quantity > 0]
            
            # Sort by rating and price within budget
            genre_books = [book for book in genre_books 
                          if customer.budget_range[0] <= book.price <= customer.budget_range[1]]
            genre_books.sort(key=lambda x: (x.rating, -x.price), reverse=True)
            
            for book in genre_books[:max_recs]:
                rec = Recommendation(
                    book=book,
                    confidence_score=0.7,
                    reason=f"Popular in {genre.value} genre",
                    recommendation_type="genre_based"
                )
                recommendations.append(rec)
        
        return recommendations[:max_recs]
    
    async def _get_trending_recommendations(self, max_recs: int) -> List[Recommendation]:
        """Generate trending/popular book recommendations"""
        recommendations = []
        
        # Get top-rated books with good stock
        trending_books = [book for book in self.book_catalog.values() 
                         if book.availability and book.stock_quantity > 0 and book.rating >= 4.0]
        trending_books.sort(key=lambda x: (x.rating, -x.price), reverse=True)
        
        for book in trending_books[:max_recs]:
            rec = Recommendation(
                book=book,
                confidence_score=0.6,
                reason=f"Trending book with {book.rating} star rating",
                recommendation_type="trending"
            )
            recommendations.append(rec)
        
        return recommendations
    
    async def _get_ai_contextual_recommendations(self, customer: CustomerProfile, 
                                               conversation_context: str, 
                                               max_recs: int) -> List[Recommendation]:
        """Generate AI-powered contextual recommendations based on conversation"""
        if not self.openai_client:
            return []
        
        try:
            # Prepare book catalog summary for AI
            catalog_summary = []
            for book in self.book_catalog.values():
                if book.availability and book.stock_quantity > 0:
                    catalog_summary.append({
                        "id": book.book_id,
                        "title": book.title,
                        "author": book.author,
                        "genre": book.genre.value,
                        "price": book.price,
                        "rating": book.rating,
                        "description": book.description[:100] + "..."
                    })
            
            # Create AI prompt
            prompt = f"""
            Based on this customer conversation and their profile, recommend books from our catalog.
            
            Customer Profile:
            - Name: {customer.name}
            - Segment: {customer.segment.value}
            - Favorite Genres: {[g.value for g in customer.favorite_genres]}
            - Budget Range: ${customer.budget_range[0]} - ${customer.budget_range[1]}
            - Reading Level: {customer.reading_level}
            
            Conversation Context: {conversation_context}
            
            Available Books:
            {json.dumps(catalog_summary, indent=2)}
            
            Return a JSON response with up to {max_recs} recommendations:
            {{
                "recommendations": [
                    {{
                        "book_id": "BK001",
                        "confidence_score": 0.9,
                        "reason": "Based on your interest in classic literature and the conversation about American novels",
                        "recommendation_type": "contextual"
                    }}
                ]
            }}
            """
            
            response = await self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a book recommendation expert. Analyze customer profiles and conversation context to suggest relevant books."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            ai_result = json.loads(content)
            
            # Convert AI recommendations to our format
            recommendations = []
            for rec_data in ai_result.get("recommendations", []):
                book_id = rec_data.get("book_id")
                if book_id in self.book_catalog:
                    book = self.book_catalog[book_id]
                    rec = Recommendation(
                        book=book,
                        confidence_score=rec_data.get("confidence_score", 0.7),
                        reason=rec_data.get("reason", "AI recommended"),
                        recommendation_type=rec_data.get("recommendation_type", "contextual")
                    )
                    recommendations.append(rec)
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in AI contextual recommendations: {e}")
            return []
    
    def _deduplicate_recommendations(self, recommendations: List[Recommendation]) -> List[Recommendation]:
        """Remove duplicate recommendations based on book_id"""
        seen_books = set()
        unique_recommendations = []
        
        for rec in recommendations:
            if rec.book.book_id not in seen_books:
                seen_books.add(rec.book.book_id)
                unique_recommendations.append(rec)
        
        return unique_recommendations
    
    async def get_book_by_id(self, book_id: str) -> Optional[Book]:
        """Get a specific book by ID"""
        return self.book_catalog.get(book_id)
    
    async def search_books(self, query: str, genre: Optional[BookGenre] = None, 
                          max_price: Optional[float] = None) -> List[Book]:
        """Search books by title, author, or description"""
        results = []
        query_lower = query.lower()
        
        for book in self.book_catalog.values():
            if not book.availability or book.stock_quantity <= 0:
                continue
            
            # Check genre filter
            if genre and book.genre != genre:
                continue
            
            # Check price filter
            if max_price and book.price > max_price:
                continue
            
            # Check if query matches title, author, or description
            if (query_lower in book.title.lower() or 
                query_lower in book.author.lower() or 
                query_lower in book.description.lower()):
                results.append(book)
        
        # Sort by relevance (rating and price)
        results.sort(key=lambda x: (x.rating, -x.price), reverse=True)
        return results
    
    async def update_customer_profile(self, customer_id: str, purchase_data: Dict[str, Any]):
        """Update customer profile with new purchase data"""
        if customer_id in self.customer_profiles:
            customer = self.customer_profiles[customer_id]
            
            # Add to purchase history
            customer.purchase_history.append(purchase_data)
            
            # Update statistics
            customer.total_purchases += 1
            customer.last_purchase_date = datetime.now()
            
            # Update average order value
            total_value = sum(p.get("price", 0) for p in customer.purchase_history)
            customer.average_order_value = total_value / customer.total_purchases
            
            # Update preferences based on purchase
            book_id = purchase_data.get("book_id")
            if book_id in self.book_catalog:
                book = self.book_catalog[book_id]
                
                # Add to favorite authors if not already there
                if book.author not in customer.favorite_authors:
                    customer.favorite_authors.append(book.author)
                
                # Add to favorite genres if not already there
                if book.genre not in customer.favorite_genres:
                    customer.favorite_genres.append(book.genre)
    
    def get_customer_profile(self, customer_id: str) -> Optional[CustomerProfile]:
        """Get customer profile by ID"""
        return self.customer_profiles.get(customer_id)
    
    def get_all_books(self) -> List[Book]:
        """Get all available books"""
        return [book for book in self.book_catalog.values() if book.availability and book.stock_quantity > 0]

# Global recommendation engine instance
recommendation_engine = ProductRecommendationEngine()
