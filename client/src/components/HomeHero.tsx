
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAllContent } from '@/hooks/useContentQueries';

const HomeHero = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoVisible, setIsVideoVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: allContent } = useAllContent();

  // Get latest content for hero (newest content with "Home Hero" feature - Movies and Web Series seasons)
  const getHeroContent = () => {
    const allContentArray = [
      ...(allContent?.movies || []),
      ...(allContent?.webSeries || [])
    ].filter(content => {
      if (content.content_type === 'Movie') {
        return content.movie?.feature_in?.includes('Home Hero');
      } else if (content.content_type === 'Web Series') {
        // Each webSeries entry now represents a single season
        return content.web_series?.seasons?.[0]?.feature_in?.includes('Home Hero');
      }
      return false;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (allContentArray.length === 0) {
      return {
        id: 1,
        title: "Welcome to GreenFlix",
        description: "Discover amazing movies, web series, and shows. Upload your content to get started.",
        rating: "TV-PG",
        year: "2024",
        score: "9.0",
        image: "/placeholder.svg",
        type: "Platform",
        trailerUrl: ""
      };
    }

    const content = allContentArray[0];
    let contentData;
    let thumbnailUrl = "";
    let trailerUrl = "";

    if (content.content_type === 'Movie') {
      contentData = content.movie;
      thumbnailUrl = contentData?.thumbnail_url || "";
      trailerUrl = contentData?.trailer_url || "";
    } else if (content.content_type === 'Web Series') {
      // Each webSeries entry now contains only one season
      const seasonData = content.web_series?.seasons?.[0];
      contentData = seasonData;
      thumbnailUrl = seasonData?.thumbnail_url || "";
      trailerUrl = seasonData?.trailer_url || "";
    }

    return {
      id: content.id,
      title: content.title,
      description: contentData?.description || contentData?.season_description || content.description || "No description available",
      rating: contentData?.rating_type || "TV-PG",
      year: contentData?.release_year?.toString() || content.created_at?.split('-')[0] || "2024",
      score: contentData?.rating?.toString() || "8.0",
      image: thumbnailUrl || "/placeholder.svg",
      type: content.content_type === 'Web Series' ? 'series' : content.content_type,
      seasonNumber: content.seasonNumber || 1,
      trailerUrl: trailerUrl
    };
  };

  const heroContent = getHeroContent();

  // Scroll detection effect
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current && videoRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        setIsVideoVisible(isVisible);
        
        if (isVisible && videoRef.current.paused) {
          videoRef.current.play().catch(console.warn);
        } else if (!isVisible && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Page change detection effect
  useEffect(() => {
    return () => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    };
  }, []);

  // Auto-play video effect
  useEffect(() => {
    if (videoRef.current && heroContent.trailerUrl) {
      const video = videoRef.current;

      const handleLoadedData = () => {
        if (video && video.isConnected && isVideoVisible) {
          video.playbackRate = 0.9; // Set playback speed to 0.9x
          video.play().catch((error) => {
            if (error.name !== 'AbortError') {
              console.warn('Video autoplay failed:', error);
            }
          });
        }
      };

      const handleEnded = () => {
        if (video && video.isConnected) {
          video.currentTime = 0;
          video.playbackRate = 0.9; // Maintain playback speed on loop
          video.play().catch(console.warn);
        }
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('ended', handleEnded);

      // Initial play attempt
      if (video.readyState >= 3) { // HAVE_FUTURE_DATA
        handleLoadedData();
      }

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('ended', handleEnded);
        if (video && video.isConnected) {
          video.pause();
          video.currentTime = 0;
        }
      };
    }
  }, [heroContent.trailerUrl, isVideoVisible]);

  const handlePlayClick = () => {
    // Get the original database content for navigation
    const originalContent = getOriginalContentData();
    console.log('HomeHero navigating to details with original content:', originalContent);
    
    if (originalContent) {
      const navigationId = originalContent.content_id || originalContent.id;
      navigate(`/details/${navigationId}`, { state: originalContent });
    } else {
      console.warn('No original content found for navigation');
    }
  };

  const handleMoreInfoClick = () => {
    // Get the original database content for navigation
    const originalContent = getOriginalContentData();
    console.log('HomeHero navigating to details with original content:', originalContent);
    
    if (originalContent) {
      const navigationId = originalContent.content_id || originalContent.id;
      navigate(`/details/${navigationId}`, { state: originalContent });
    } else {
      console.warn('No original content found for navigation');
    }
  };

  const getOriginalContentData = () => {
    if (!allContent) return null;

    const allContentArray = [
      ...(allContent?.movies || []),
      ...(allContent?.webSeries || [])
    ].filter(content => {
      if (content.content_type === 'Movie') {
        return content.movie?.feature_in?.includes('Home Hero');
      } else if (content.content_type === 'Web Series') {
        return content.web_series?.seasons?.[0]?.feature_in?.includes('Home Hero');
      }
      return false;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return allContentArray.length > 0 ? allContentArray[0] : null;
  };

  // Function to get embed URL for trailer
  const getEmbedUrl = (url: string) => {
    if (!url) return '';

    // YouTube URLs - Note: YouTube doesn't support playback speed in embed parameters
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&rel=0&showinfo=0&modestbranding=1&enablejsapi=1` : '';
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&rel=0&showinfo=0&modestbranding=1&enablejsapi=1` : '';
    }
    
    // Vimeo URLs
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&controls=0&background=1` : '';
    }

    // For direct video files or other formats
    return url;
  };

  const embedUrl = getEmbedUrl(heroContent.trailerUrl);

  return (
    <div ref={heroRef} className="relative h-screen w-screen overflow-hidden -mx-6" style={{ minWidth: '1200px', width: '100vw' }}>
      {/* Background Video/Trailer */}
      <div className="absolute inset-0 w-full h-full">
        {embedUrl ? (
          embedUrl.includes('embed') ? (
            // For YouTube/Vimeo embeds
            <iframe
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                filter: 'sepia(0.1) contrast(1.1) brightness(0.9)',
                transform: 'scale(1.05)' // Slight zoom to hide potential borders
              }}
              src={embedUrl}
              title={`${heroContent.title} Trailer`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            // For direct video files
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                filter: 'sepia(0.1) contrast(1.1) brightness(0.9)'
              }}
              loop
              muted
              playsInline
              controls={false}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  videoRef.current.playbackRate = 0.9;
                }
              }}
              onError={(e) => {
                console.warn('Video error:', e);
              }}
            >
              <source src={embedUrl} type="video/mp4" />
            </video>
          )
        ) : (
          // Fallback image if no trailer
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${heroContent.image})`,
              filter: 'sepia(0.1) contrast(1.1) brightness(0.9)'
            }}
          />
        )}
      </div>

      {/* Dark Vintage Bottom Overlay - 15% from bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '15%',
          background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.7) 40%, rgba(0, 0, 0, 0.5) 70%, transparent 100%)',
          backdropFilter: 'contrast(1.2)'
        }}
      />

      {/* Gradient Overlay - More darker with 10% transparency */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />

      {/* Content Card */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-6">
          <div
            className={`max-w-2xl backdrop-blur-sm rounded-lg transition-all duration-700 ease-out pointer-events-auto cursor-pointer border border-primary/30 shadow-lg shadow-primary/20 ${
              isHovered 
                ? 'transform scale-100 opacity-100 bg-black/30 backdrop-blur-md border-primary/50 p-8' 
                : 'transform scale-90 opacity-60 bg-black/20 border-primary/20 p-6'
            }`}
            style={{
              minWidth: '480px',
              width: '100%'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handlePlayClick}
          >
            <h1 className="text-4xl font-thin mb-4 text-foreground animate-fade-in line-clamp-2">
              {heroContent.title}
            </h1>

            <div className="flex items-center flex-wrap gap-2 mb-4 text-base text-muted-foreground animate-slide-up">
              <span className="bg-primary/30 text-primary-foreground px-3 py-1 rounded border border-primary/50 text-sm">
                {heroContent.rating}
              </span>
              {heroContent.type === 'series' && heroContent.seasonNumber && (
                <span className="bg-primary/30 text-primary-foreground px-3 py-1 rounded border border-primary/50 text-sm">
                  Season {heroContent.seasonNumber}
                </span>
              )}
              <span className="font-thin">{heroContent.year}</span>
              <div className="flex items-center space-x-1">
                <span className="text-yellow-400">★</span>
                <span className="font-thin">{heroContent.score}</span>
              </div>
            </div>

            <p className="text-base font-thin text-foreground/90 mb-8 leading-relaxed animate-slide-up line-clamp-3">
              {heroContent.description}
            </p>

            <div className="flex justify-start animate-scale-in">
              <Button 
                onClick={handlePlayClick}
                className="bg-transparent backdrop-blur-sm border border-primary/60 text-primary hover:bg-primary/50 hover:text-primary-foreground hover:scale-105 transition-all duration-300 font-semibold text-lg px-16 py-4 min-w-[240px] rounded-lg shadow-lg"
              >
                <Play className="w-6 h-6 mr-3" />
                Play Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;
