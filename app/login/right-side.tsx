'use client'

import React, { useState, useEffect } from 'react'

export default function RightSide() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      id: 1,
      title: "Manage Products and Orders",
      description: "Suppliers add items and track stock, while Admins review and approve details.",
      backgroundImage: "/images/jean-philippe-delberghe-Ry9WBo3qmoc-unsplash.png"
    },
    {
      id: 2,
      title: "Streamline QC and Deliveries",
      description: "Suppliers update packaging, and Admins handle QC approvals and shipping.",
      backgroundImage: "/images/ryan-riggins-9v7UJS92HYc-unsplash (1).png"
    },
    {
      id: 3,
      title: "Track Performance and Payments",
      description: "Suppliers see payouts, and Admins monitor reports and performance metrics.",
      backgroundImage: "/images/minh-pham-7pCFUybP_P8-unsplash@2x.png"
    }
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg">
      {/* Carousel Container */}
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div key={slide.id} className="w-full h-full flex-shrink-0 relative">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={slide.backgroundImage}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div 
                className="absolute inset-0"
                style={{ 
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.8) 100%)' 
                }}
              ></div>
            </div>
            
            {/* Content Overlay - Positioned at bottom */}
            <div className="absolute bottom-20 left-0 right-0 z-10 flex flex-col justify-center items-center text-white px-5 text-center">
              <h2 className="text-h3 font-medium weight-medium mb-2 font-spectral text-neutral-100 mt-8">
                {slide.title}
              </h2>
              <p className="text-h7 weight-medium font-normal font-urbanist text-neutral-100 max-w-md">
                {slide.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation Container */}
      <div className="absolute bottom-20 left-0 right-0 z-20 flex items-center justify-center px-5" style={{ transform: 'translateY(calc(100% + 4px))' }}>
        <div className="flex items-center justify-between w-full max-w-md">
          {/* Left Arrow - Only visible on slides 2 and 3 */}
          {currentSlide !== 0 ? (
            <button
              onClick={prevSlide}
              className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center text-white opacity-80 hover:opacity-100 transition-opacity duration-300"
              aria-label="Previous slide"
            >
              <svg className="w-4 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </button>
          ) : (
            <div className="w-6 h-6"></div>
          )}

          {/* Navigation Dots - Always centered */}
          <div className="flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`${
                  index === currentSlide
                    ? 'w-6 h-1.5 bg-white'
                    : 'w-2 h-1.5 bg-white/60 hover:bg-white/80'
                } rounded-full transition-all duration-300`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Right Arrow - Only visible on slides 1 and 2 */}
          {currentSlide !== 2 ? (
            <button
              onClick={nextSlide}
              className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center text-white transition-opacity duration-300 hover:opacity-100"
              aria-label="Next slide"
            >
              <svg className="w-4 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </button>
          ) : (
            <div className="w-6 h-6"></div>
          )}
        </div>
      </div>
    </div>
  )
}
