import React, { useState, useEffect } from 'react';

interface KeywordsDisplayProps {
  keywords: string[];
  sentiment: number;
}

const KeywordBubble: React.FC<{ keyword: string; index: number; sentiment: number }> = ({
  keyword,
  index,
  sentiment
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Stagger the animation for each keyword
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 300);

    return () => clearTimeout(timer);
  }, [index]);

  // Determine color based on sentiment
  const getColor = () => {
    if (sentiment > 0.1) {
      return `rgba(255, 107, 107, ${isVisible ? 0.8 : 0})`; // Warm red
    } else if (sentiment < -0.1) {
      return `rgba(100, 149, 237, ${isVisible ? 0.8 : 0})`; // Cool blue
    } else {
      return `rgba(144, 238, 144, ${isVisible ? 0.8 : 0})`; // Neutral green
    }
  };

  return (
    <div
      className="keyword-bubble"
      style={{
        backgroundColor: getColor(),
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
        opacity: isVisible ? 1 : 0,
      }}
    >
      {keyword}
      <style>{`
        .keyword-bubble {
          display: inline-block;
          padding: 8px 16px;
          margin: 4px;
          border-radius: 20px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          cursor: default;
          user-select: none;
        }

        .keyword-bubble:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
};

const KeywordsDisplay: React.FC<KeywordsDisplayProps> = ({ keywords, sentiment }) => {
  return (
    <div className="keywords-display">
      <div className="keywords-header">
        <h3>Keywords</h3>
      </div>
      <div className="keywords-container">
        {keywords.length > 0 ? (
          keywords.map((keyword, index) => (
            <KeywordBubble
              key={`${keyword}-${index}`}
              keyword={keyword}
              index={index}
              sentiment={sentiment}
            />
          ))
        ) : (
          <div className="keywords-placeholder">
            Keywords will appear here...
          </div>
        )}
      </div>
      <style>{`
        .keywords-display {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 300px;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 16px;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          z-index: 10; /* Content layer */
        }

        .keywords-header {
          margin-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 8px;
        }

        .keywords-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .keywords-container {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          max-height: 300px;
          overflow-y: auto;
        }

        .keywords-placeholder {
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
          font-size: 14px;
          padding: 20px 0;
          text-align: center;
        }

        @media (max-width: 768px) {
          .keywords-display {
            width: calc(100% - 40px);
            max-width: 300px;
          }
        }
      `}</style>
    </div>
  );
};

export default KeywordsDisplay;