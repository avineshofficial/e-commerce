import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import '../../styles/HeroSlider.css';

// Generic fallback image (Grey subtle pattern) to use if no image is provided, 
// ensuring the layout doesn't collapse.
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1200&auto=format&fit=crop";

const HeroSlider = ({ onCategorySelect }) => {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState([]); 
  const navigate = useNavigate();

  // Load from DB
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "hero_slides"));
        const dbSlides = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (dbSlides.length > 0) setSlides(dbSlides);
        // We don't load defaults if DB is empty to keep it clean (or add one empty state slide)
      } catch (error) {
        console.error(error);
      }
    };
    fetchSlides();
  }, []);

  // Timer Logic
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(curr => (curr === slides.length - 1 ? 0 : curr + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleAction = (category) => {
    if (category === 'OFFERS_LINK') navigate('/offers'); 
    else if (onCategorySelect && category !== 'all') {
      onCategorySelect(category);
      document.getElementById('shop-section')?.scrollIntoView({ behavior: 'smooth' });
    } 
    else navigate('/');
  };

  // If nothing is loaded, don't render an empty section
  if (slides.length === 0) return null;

  return (
    <section className="hero-slider">
      {slides.map((slide, index) => {
        // Updated Logic: 
        // 1. If valid URL, use it.
        // 2. If no URL, use the neutral fallback image (removing the purple color block).
        const bgImage = (slide.image && slide.image.startsWith('http')) 
          ? `url(${slide.image})` 
          : `url(${FALLBACK_IMAGE})`;

        return (
          <div
            key={slide.id}
            className={`slide ${index === current ? 'active' : ''}`}
            style={{ 
              backgroundImage: bgImage,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#f1f5f9' /* Neutral light gray instead of purple */
            }}
          >
            {index === current && (
              <div className="slide-content">
                <h2>{slide.title}</h2>
                <p>{slide.subtitle}</p>
                <button className="slider-btn" onClick={() => handleAction(slide.category)}>
                  {slide.btnText || 'Explore'}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {slides.length > 1 && (
        <div className="slider-dots">
          {slides.map((_, index) => (
            <div key={index} className={`dot ${index === current ? 'active' : ''}`} onClick={() => setCurrent(index)} />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroSlider;