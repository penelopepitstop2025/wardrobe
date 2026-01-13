import React, { useState, useEffect } from 'react';
import { Plus, X, Sparkles, CloudRain, Calendar, TrendingUp, BookOpen } from 'lucide-react';

export default function WardrobeLedger() {
  const [activeTab, setActiveTab] = useState('wardrobe');
  const [items, setItems] = useState([]);
  const [inspiration, setInspiration] = useState([]);
  const [outfitHistory, setOutfitHistory] = useState([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddInspiration, setShowAddInspiration] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [currentRecommendation, setCurrentRecommendation] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [showProfileUpload, setShowProfileUpload] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [openAiApiKey, setOpenAiApiKey] = useState(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Check if we're in artifact environment with window.storage
      const isArtifact = typeof window.storage !== 'undefined';
      
      if (isArtifact) {
        const [itemsResult, inspirationResult, historyResult, profileResult] = await Promise.all([
          window.storage.get('wardrobe-items').catch(() => null),
          window.storage.get('inspiration-sources').catch(() => null),
          window.storage.get('outfit-history').catch(() => null),
          window.storage.get('profile-photo').catch(() => null)
        ]);

        if (itemsResult?.value) setItems(JSON.parse(itemsResult.value));
        if (inspirationResult?.value) setInspiration(JSON.parse(inspirationResult.value));
        if (historyResult?.value) setOutfitHistory(JSON.parse(historyResult.value));
        if (profileResult?.value) setProfilePhoto(profileResult.value);
      } else {
        // Use localStorage for Vercel/standard deployment
        const itemsData = localStorage.getItem('wardrobe-items');
        const inspirationData = localStorage.getItem('inspiration-sources');
        const historyData = localStorage.getItem('outfit-history');
        const profileData = localStorage.getItem('profile-photo');

        if (itemsData) setItems(JSON.parse(itemsData));
        if (inspirationData) setInspiration(JSON.parse(inspirationData));
        if (historyData) setOutfitHistory(JSON.parse(historyData));
        if (profileData) setProfilePhoto(profileData);
        
        const apiKeyData = localStorage.getItem('openai-api-key');
        if (apiKeyData) setOpenAiApiKey(apiKeyData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveApiKey = (key) => {
    setOpenAiApiKey(key);
    try {
      localStorage.setItem('openai-api-key', key);
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  const generateOutfitImage = async () => {
    if (!openAiApiKey) {
      setShowApiKeyInput(true);
      return;
    }

    setIsGeneratingImage(true);
    
    try {
      const imagePrompt = `Create a photorealistic, high-quality fashion photograph in the style of a high-end menswear catalog (similar to Anglo-Italian or Campbell's of Beauly aesthetic). 

The image should show a well-dressed gentleman wearing:
${currentRecommendation.items?.join(', ') || currentRecommendation.itemIds?.map(id => items.find(i => i.id === id)?.name).filter(Boolean).join(', ')}

Setting: ${currentRecommendation.occasion || 'Classic, timeless setting'}
Style notes: ${currentRecommendation.styling_notes || 'Refined, understated elegance'}

The photo should be:
- Natural daylight, soft shadows
- Clean, minimal background
- Professional fashion photography aesthetic
- Focus on the outfit's details and fit
- Sophisticated, editorial style`;

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiApiKey}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: imagePrompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard'
        })
      });

      const data = await response.json();
      
      if (data.error) {
        alert(`Error: ${data.error.message}`);
        if (data.error.message.includes('API key')) {
          setShowApiKeyInput(true);
        }
      } else {
        setGeneratedImage(data.data[0].url);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please check your API key.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const saveProfilePhoto = async (photo) => {
    setProfilePhoto(photo);
    try {
      const isArtifact = typeof window.storage !== 'undefined';
      if (isArtifact) {
        await window.storage.set('profile-photo', photo);
      } else {
        localStorage.setItem('profile-photo', photo);
      }
    } catch (error) {
      console.error('Error saving profile photo:', error);
    }
  };

  const saveItems = async (newItems) => {
    setItems(newItems);
    try {
      const isArtifact = typeof window.storage !== 'undefined';
      if (isArtifact) {
        await window.storage.set('wardrobe-items', JSON.stringify(newItems));
      } else {
        localStorage.setItem('wardrobe-items', JSON.stringify(newItems));
      }
    } catch (error) {
      console.error('Error saving items:', error);
    }
  };

  const saveInspiration = async (newInspiration) => {
    setInspiration(newInspiration);
    try {
      const isArtifact = typeof window.storage !== 'undefined';
      if (isArtifact) {
        await window.storage.set('inspiration-sources', JSON.stringify(newInspiration));
      } else {
        localStorage.setItem('inspiration-sources', JSON.stringify(newInspiration));
      }
    } catch (error) {
      console.error('Error saving inspiration:', error);
    }
  };

  const saveHistory = async (newHistory) => {
    setOutfitHistory(newHistory);
    try {
      const isArtifact = typeof window.storage !== 'undefined';
      if (isArtifact) {
        await window.storage.set('outfit-history', JSON.stringify(newHistory));
      } else {
        localStorage.setItem('outfit-history', JSON.stringify(newHistory));
      }
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const generateOutfit = async () => {
    setIsGenerating(true);
    setShowRecommendation(true);

    // Check if network is available
    if (typeof window.storage !== 'undefined') {
      // We're in artifact environment - network is disabled
      setCurrentRecommendation({
        items: ['Network access is disabled in this environment.'],
        occasion: '',
        styling_notes: 'To use AI recommendations, please deploy this app to Vercel or run it locally. The outfit generation feature requires API access.',
        inspiration: '',
        weather_note: 'Deploy to vercel.com for full functionality including weather-based recommendations.'
      });
      setIsGenerating(false);
      return;
    }

    try {
      const weather = { temp: 18, condition: 'partly cloudy' };
      
      const wardrobeContext = items.map(item => 
        `${item.category}: ${item.name} (${item.color}, ${item.season}, ${item.formality})`
      ).join('\n');

      const inspirationContext = inspiration.map(source => 
        `${source.type}: ${source.url} - ${source.description || ''}`
      ).join('\n');

      const recentOutfits = outfitHistory.slice(0, 5).map(outfit => 
        outfit.items.map(id => items.find(i => i.id === id)?.name).join(', ')
      ).join('\n');

      const prompt = `You are a refined personal stylist with expertise in classic menswear, preppy aesthetics, and timeless British style.

Current weather: ${weather.temp}°C, ${weather.condition}

Available wardrobe:
${wardrobeContext}

Style inspiration sources:
${inspirationContext || 'Classic menswear, understated elegance'}

Recently worn outfits (to avoid repetition):
${recentOutfits || 'None yet'}

Please recommend a complete outfit for today that:
1. Is weather-appropriate
2. Reflects refined, understated style
3. Avoids recently worn combinations
4. Uses items from the wardrobe above
5. Includes thoughtful styling notes

Respond ONLY with a JSON object in this exact format (no markdown, no backticks):
{
  "outfit": {
    "items": ["item name 1", "item name 2", "item name 3"],
    "occasion": "description of suitable occasions",
    "styling_notes": "specific styling advice",
    "inspiration": "what inspired this combination",
    "weather_note": "why this works for today's weather"
  }
}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            { role: "user", content: prompt }
          ],
        })
      });

      const data = await response.json();
      const aiResponse = data.content.find(block => block.type === "text")?.text || "";
      
      const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      const recommendation = JSON.parse(cleanResponse);

      const outfitItemIds = recommendation.outfit.items.map(itemName => {
        const found = items.find(item => 
          item.name.toLowerCase().includes(itemName.toLowerCase()) ||
          itemName.toLowerCase().includes(item.name.toLowerCase())
        );
        return found?.id;
      }).filter(Boolean);

      setCurrentRecommendation({
        ...recommendation.outfit,
        itemIds: outfitItemIds,
        date: new Date().toISOString(),
        weather
      });

    } catch (error) {
      console.error('Error generating outfit:', error);
      setCurrentRecommendation({
        items: ['Error generating outfit. Please try again.'],
        occasion: '',
        styling_notes: '',
        inspiration: '',
        weather_note: ''
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveOutfitToHistory = () => {
    if (currentRecommendation && currentRecommendation.itemIds) {
      const newHistory = [{
        id: Date.now(),
        items: currentRecommendation.itemIds,
        date: currentRecommendation.date,
        notes: currentRecommendation.styling_notes
      }, ...outfitHistory];
      saveHistory(newHistory);
      setShowRecommendation(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .serif {
          font-family: 'Libre Baskerville', Georgia, serif;
        }

        .fade-in {
          animation: fadeIn 0.8s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .image-hover {
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .image-hover:hover {
          transform: scale(1.03);
        }

        .tab-button {
          position: relative;
          padding: 1rem 0;
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #666;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .tab-button:hover {
          color: #000;
        }

        .tab-button.active {
          color: #000;
        }

        .tab-button.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: #000;
        }

        .btn-primary {
          padding: 14px 32px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: white;
          background: #000;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary:hover:not(:disabled) {
          background: #333;
        }

        .btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .btn-secondary {
          padding: 14px 32px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #000;
          background: white;
          border: 1px solid #000;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: #000;
          color: white;
        }

        .card {
          background: white;
          border: 1px solid #e5e5e5;
          transition: all 0.3s ease;
        }

        .card:hover {
          border-color: #999;
        }

        input, textarea, select {
          width: 100%;
          padding: 12px 16px;
          font-size: 14px;
          color: #000;
          background: white;
          border: 1px solid #ddd;
          transition: border-color 0.3s ease;
        }

        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #000;
        }

        input::placeholder, textarea::placeholder {
          color: #999;
        }

        .tag {
          display: inline-block;
          padding: 4px 12px;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #666;
          background: #f5f5f5;
        }

        .modal-backdrop {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
        }

        .divider {
          height: 1px;
          background: #e5e5e5;
          margin: 3rem 0;
        }

        .text-body {
          color: #666;
          line-height: 1.6;
        }

        .text-muted {
          color: #999;
        }
        nav::-webkit-scrollbar { display: none; }
        @media (max-width: 768px) {
          .tab-button { white-space: nowrap; font-size: 11px; padding: 1rem 0.75rem; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 md:px-12 py-6 md:py-16">
        {/* Hero Image */}
        <div className="relative w-full mb-12 md:mb-16 overflow-hidden fade-in -mx-4 md:mx-0" style={{ height: '40vh', minHeight: '250px', maxHeight: '400px' }}>
          <div className="absolute inset-0 bg-gray-100">
            <img 
              src="/Screenshot 2026-01-13 155022.png"
              alt="Wardrobe"
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center' }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent"></div>
        </div>

        {/* Header */}
        <header className="pb-6 md:pb-12 mb-8 md:mb-16 fade-in" style={{ marginTop: '-6rem' }}>
          <div className="relative z-10">
            <h1 className="serif text-3xl md:text-6xl font-normal mb-2 md:mb-4 text-center tracking-tight">
              Wardrobe
            </h1>
            <p className="text-center text-xs md:text-sm text-muted uppercase tracking-widest">
              A Personal Archive
            </p>
          </div>
        </header>

        {/* Navigation */}
        <nav className="flex justify-center gap-4 md:gap-8 mb-10 md:mb-16 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 md:justify-center border-b border-gray-200">
          <button
            className={`tab-button ${activeTab === 'wardrobe' ? 'active' : ''}`}
            onClick={() => setActiveTab('wardrobe')}
          >
            Collection
          </button>
          <button
            className={`tab-button ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            Stylist
          </button>
          <button
            className={`tab-button ${activeTab === 'inspiration' ? 'active' : ''}`}
            onClick={() => setActiveTab('inspiration')}
          >
            Inspiration
          </button>
          <button
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Archive
          </button>
          <button
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </nav>

        {/* Wardrobe Tab */}
        {activeTab === 'wardrobe' && (
          <div className="fade-in">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-light">Collection</h2>
              <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddItem(true)}>
                <Plus size={16} />
                Add Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-gray-300">
                <BookOpen size={40} className="mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">No items yet</p>
                <p className="text-sm text-muted">Begin building your wardrobe archive</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map(item => (
                  <div key={item.id} className="card group cursor-pointer overflow-hidden relative">
                    {item.image && (
                      <div className="relative w-full h-80 overflow-hidden bg-gray-100">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover image-hover"
                        />
                        {/* Delete button overlay */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete ${item.name}?`)) {
                              saveItems(items.filter(i => i.id !== item.id));
                            }
                          }}
                          className="absolute top-3 right-3 bg-white/90 hover:bg-red-600 hover:text-white text-gray-800 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                          style={{ backdropFilter: 'blur(10px)' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="serif text-lg mb-3 font-normal">
                        {item.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="tag">{item.category}</span>
                        <span className="tag">{item.color}</span>
                        {item.brand && <span className="tag">{item.brand}</span>}
                      </div>
                      <div className="text-sm text-body space-y-1">
                        <p>{item.season} • {item.formality}</p>
                        {item.resaleValue && (
                          <p className="font-medium">Est. Value: £{item.resaleValue}</p>
                        )}
                        {item.notes && (
                          <p className="mt-3 pt-3 border-t border-gray-200 italic text-muted">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total Value Summary */}
            {items.length > 0 && items.some(item => item.resaleValue) && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex justify-between items-center max-w-md mx-auto">
                  <span className="text-sm uppercase tracking-wider text-muted">Total Estimated Value</span>
                  <span className="serif text-2xl">
                    £{items.reduce((sum, item) => sum + (parseFloat(item.resaleValue) || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stylist Tab */}
        {activeTab === 'recommendations' && (
          <div className="fade-in">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="serif text-3xl mb-6">Daily Recommendation</h2>
              <p className="text-body mb-8">
                Receive thoughtful outfit suggestions tailored to the weather and your personal style
              </p>
              <button 
                className="btn-primary mx-auto flex items-center gap-2"
                onClick={generateOutfit}
                disabled={isGenerating || items.length === 0}
              >
                <Sparkles size={16} />
                {isGenerating ? 'Composing...' : 'Get Recommendation'}
              </button>
              {items.length === 0 && (
                <p className="mt-4 text-sm text-muted">
                  Add items to your collection first
                </p>
              )}
            </div>

            {showRecommendation && currentRecommendation && (
              <div className="max-w-4xl mx-auto border border-gray-200 p-12">
                {isGenerating ? (
                  <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-black mb-6"></div>
                    <p className="text-lg">Composing your ensemble...</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="serif text-2xl mb-8 text-center">Today's Recommendation</h3>
                    
                    <div className="space-y-10">
                      <div>
                        <h4 className="text-sm uppercase tracking-widest mb-6 text-muted">The Ensemble</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {currentRecommendation.itemIds?.map(id => {
                            const item = items.find(i => i.id === id);
                            return item ? (
                              <div key={id} className="border border-gray-200">
                                {item.image && (
                                  <div className="relative w-full h-48 bg-gray-100">
                                    <img 
                                      src={item.image} 
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="p-4">
                                  <p className="font-medium mb-1">{item.name}</p>
                                  <p className="text-sm text-muted">{item.category}</p>
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                        {currentRecommendation.items?.length > 0 && (
                          <div className="mt-6 p-6 bg-gray-50">
                            <p className="font-medium mb-3">Suggested pieces:</p>
                            <ul className="space-y-2 text-body">
                              {currentRecommendation.items.map((item, i) => (
                                <li key={i}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {currentRecommendation.occasion && (
                        <div>
                          <h4 className="text-sm uppercase tracking-widest mb-3 text-muted">Occasions</h4>
                          <p className="text-body">{currentRecommendation.occasion}</p>
                        </div>
                      )}

                      {currentRecommendation.styling_notes && (
                        <div>
                          <h4 className="text-sm uppercase tracking-widest mb-3 text-muted">Styling Notes</h4>
                          <p className="text-body">{currentRecommendation.styling_notes}</p>
                        </div>
                      )}

                      {currentRecommendation.inspiration && (
                        <div className="border-l-2 border-black pl-6">
                          <h4 className="text-sm uppercase tracking-widest mb-3 text-muted">Inspiration</h4>
                          <p className="text-body italic">{currentRecommendation.inspiration}</p>
                        </div>
                      )}

                      {currentRecommendation.weather_note && (
                        <div className="flex items-start gap-4 p-6 bg-gray-50">
                          <CloudRain size={24} className="text-gray-600 flex-shrink-0 mt-1" />
                          <p className="text-body">{currentRecommendation.weather_note}</p>
                        </div>
                      )}
                    </div>

                    {/* Image Generation Section */}
                    <div className="mt-12 pt-8 border-t border-gray-200">
                      <div className="bg-gray-50 p-6 rounded border border-gray-200">
                        <h4 className="text-sm uppercase tracking-widest mb-4 text-muted">Visualize This Outfit</h4>
                        
                        {!openAiApiKey && (
                          <div className="mb-4">
                            <p className="text-sm text-body mb-3">
                              Add your OpenAI API key to generate outfit images with DALL-E 3
                            </p>
                            <button 
                              className="btn-secondary"
                              onClick={() => setShowApiKeyInput(true)}
                            >
                              Add API Key
                            </button>
                          </div>
                        )}

                        {openAiApiKey && !generatedImage && (
                          <button 
                            className="btn-primary w-full"
                            onClick={generateOutfitImage}
                            disabled={isGeneratingImage}
                          >
                            {isGeneratingImage ? 'Generating Image...' : '✨ Generate Outfit Image'}
                          </button>
                        )}

                        {generatedImage && (
                          <div>
                            <img 
                              src={generatedImage} 
                              alt="Generated outfit visualization"
                              className="w-full rounded border border-gray-200 mb-4"
                            />
                            <button 
                              className="btn-secondary w-full"
                              onClick={() => {
                                setGeneratedImage(null);
                                generateOutfitImage();
                              }}
                            >
                              Generate New Image
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4 justify-center mt-6">
                      <button className="btn-secondary" onClick={() => setShowRecommendation(false)}>
                        Close
                      </button>
                      <button className="btn-primary" onClick={saveOutfitToHistory}>
                        Save to Archive
                      </button>
                      <button className="btn-secondary" onClick={generateOutfit}>
                        Try Again
                      </button>
                    </div>

                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Inspiration Tab */}
        {activeTab === 'inspiration' && (
          <div className="fade-in">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-light">Inspiration</h2>
              <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddInspiration(true)}>
                <Plus size={16} />
                Add Source
              </button>
            </div>

            {inspiration.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-gray-300">
                <TrendingUp size={40} className="mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">No inspiration sources yet</p>
                <p className="text-sm text-muted">Add websites, Instagram handles, or Pinterest boards</p>
              </div>
            ) : (
              <div className="space-y-6">
                {inspiration.map(source => (
                  <div key={source.id} className="border border-gray-200 p-8">
                    <div className="mb-4">
                      <span className="tag mb-3 inline-block">{source.type}</span>
                      <h3 className="serif text-xl">
                        {source.name || source.url}
                      </h3>
                    </div>
                    <p className="text-sm text-muted mb-4 font-mono bg-gray-50 p-3 inline-block">
                      {source.url}
                    </p>
                    {source.description && (
                      <p className="text-body italic border-l-2 border-black pl-6">
                        {source.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Archive Tab */}
        {activeTab === 'history' && (
          <div className="fade-in">
            <div className="mb-10">
              <h2 className="text-2xl font-light">Archive</h2>
            </div>

            {outfitHistory.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-gray-300">
                <Calendar size={40} className="mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">No saved outfits yet</p>
                <p className="text-sm text-muted">Save recommendations to build your archive</p>
              </div>
            ) : (
              <div className="space-y-8">
                {outfitHistory.map(outfit => (
                  <div key={outfit.id} className="border border-gray-200 p-8">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                      <Calendar size={18} className="text-gray-600" />
                      <span className="font-medium">
                        {new Date(outfit.date).toLocaleDateString('en-GB', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {outfit.items.map(itemId => {
                        const item = items.find(i => i.id === itemId);
                        return item ? (
                          <div key={itemId} className="text-center">
                            {item.image && (
                              <div className="relative w-full h-32 mb-3 bg-gray-100">
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <p className="text-sm font-medium">{item.name}</p>
                          </div>
                        ) : null;
                      })}
                    </div>
                    {outfit.notes && (
                      <p className="mt-6 pt-6 border-t border-gray-200 text-body italic border-l-2 border-black pl-6">
                        {outfit.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="fade-in max-w-2xl mx-auto">
            <h2 className="text-2xl font-light mb-10">Settings</h2>
            
            <div className="space-y-8">
              {/* API Key Management */}
              <div className="border border-gray-200 p-6">
                <h3 className="text-lg mb-4">OpenAI API Key</h3>
                <p className="text-sm text-body mb-4">
                  Used for generating AI outfit visualizations with DALL-E 3
                </p>
                
                {openAiApiKey ? (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-sm text-muted font-mono">
                        {openAiApiKey.substring(0, 8)}...{openAiApiKey.substring(openAiApiKey.length - 4)}
                      </span>
                      <span className="text-xs text-green-600 uppercase tracking-wider">Active</span>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        className="btn-secondary"
                        onClick={() => setShowApiKeyInput(true)}
                      >
                        Update Key
                      </button>
                      <button 
                        className="btn-secondary"
                        onClick={() => {
                          if (confirm('Remove API key? You won\'t be able to generate images until you add a new one.')) {
                            saveApiKey(null);
                            setOpenAiApiKey(null);
                          }
                        }}
                      >
                        Remove Key
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    className="btn-primary"
                    onClick={() => setShowApiKeyInput(true)}
                  >
                    Add API Key
                  </button>
                )}
              </div>

              {/* App Info */}
              <div className="border border-gray-200 p-6">
                <h3 className="text-lg mb-4">About</h3>
                <div className="text-sm text-body space-y-2">
                  <p>Wardrobe - A Personal Archive</p>
                  <p className="text-xs text-muted">Your wardrobe data is stored locally on this device</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <AddItemModal
          onClose={() => setShowAddItem(false)}
          onSave={(newItem) => {
            saveItems([...items, { ...newItem, id: Date.now() }]);
            setShowAddItem(false);
          }}
        />
      )}

      {/* Add Inspiration Modal */}
      {showAddInspiration && (
        <AddInspirationModal
          onClose={() => setShowAddInspiration(false)}
          onSave={(newSource) => {
            saveInspiration([...inspiration, { ...newSource, id: Date.now() }]);
            setShowAddInspiration(false);
          }}
        />
      )}

      {/* API Key Input Modal */}
      {showApiKeyInput && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full p-8">
            <div className="border-b border-gray-200 pb-6 mb-6">
              <h2 className="serif text-2xl mb-2">OpenAI API Key</h2>
              <p className="text-sm text-body">
                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com</a>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm uppercase tracking-wider mb-2 text-muted">
                API Key
              </label>
              <input
                type="password"
                placeholder="sk-..."
                defaultValue={openAiApiKey || ''}
                id="api-key-input"
                className="w-full"
              />
              <p className="text-xs text-muted mt-2">
                Your key is stored locally and never sent to our servers
              </p>
            </div>

            <div className="flex gap-4">
              <button 
                className="btn-secondary flex-1"
                onClick={() => setShowApiKeyInput(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary flex-1"
                onClick={() => {
                  const key = document.getElementById('api-key-input').value;
                  if (key) {
                    saveApiKey(key);
                    setShowApiKeyInput(false);
                  }
                }}
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add Item Modal
function AddItemModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'jacket',
    color: '',
    brand: '',
    season: 'all-season',
    formality: 'smart-casual',
    notes: '',
    image: '',
    resaleValue: ''
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.color) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 p-8 flex justify-between items-center">
          <h2 className="serif text-2xl">Add Item</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm uppercase tracking-wider mb-2 text-muted">
              Item Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Navy Blazer"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm uppercase tracking-wider mb-2 text-muted">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="jacket">Jacket</option>
                <option value="blazer">Blazer</option>
                <option value="coat">Coat</option>
                <option value="shirt">Shirt</option>
                <option value="polo">Polo</option>
                <option value="knitwear">Knitwear</option>
                <option value="trousers">Trousers</option>
                <option value="chinos">Chinos</option>
                <option value="jeans">Jeans</option>
                <option value="shoes">Shoes</option>
                <option value="boots">Boots</option>
                <option value="tie">Tie</option>
                <option value="pocket-square">Pocket Square</option>
                <option value="belt">Belt</option>
                <option value="watch">Watch</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm uppercase tracking-wider mb-2 text-muted">
                Color *
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Navy"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm uppercase tracking-wider mb-2 text-muted">
              Brand / Maker
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Anderson & Sheppard"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm uppercase tracking-wider mb-2 text-muted">
                Season
              </label>
              <select
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
              >
                <option value="all-season">All Season</option>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="autumn">Autumn</option>
                <option value="winter">Winter</option>
              </select>
            </div>

            <div>
              <label className="block text-sm uppercase tracking-wider mb-2 text-muted">
                Formality
              </label>
              <select
                value={formData.formality}
                onChange={(e) => setFormData({ ...formData, formality: e.target.value })}
              >
                <option value="formal">Formal</option>
                <option value="business">Business</option>
                <option value="smart-casual">Smart Casual</option>
                <option value="casual">Casual</option>
                <option value="sportswear">Sportswear</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm uppercase tracking-wider mb-2 text-muted">
              Photograph
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
            />
            {formData.image && (
              <div className="mt-4 border border-gray-200">
                <img src={formData.image} alt="Preview" className="w-full h-64 object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm uppercase tracking-wider mb-2 text-muted">
              Estimated Resale Value (£)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.resaleValue}
              onChange={(e) => setFormData({ ...formData, resaleValue: e.target.value })}
              placeholder="250.00"
            />
          </div>

          <div>
            <label className="block text-sm uppercase tracking-wider mb-2 text-muted">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Provenance, details, styling notes..."
              className="resize-none h-24"
            />
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Inspiration Modal
function AddInspirationModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    type: 'website',
    name: '',
    url: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.url) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50">
      <div className="bg-white max-w-xl w-full">
        <div className="border-b border-gray-200 p-8 flex justify-between items-center">
          <h2 className="serif text-2xl">Add Inspiration</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm uppercase tracking-wider mb-2 text-muted">
              Source Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="website">Website / Blog</option>
              <option value="instagram">Instagram</option>
              <option value="pinterest">Pinterest</option>
              <option value="magazine">Magazine / Publication</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm uppercase tracking-wider mb-2 text-muted">
              Name / Handle
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Permanent Style"
            />
          </div>

          <div>
            <label className="block text-sm uppercase tracking-wider mb-2 text-muted">
              URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
              required
            />
          </div>

          <div>
            <label className="block text-sm uppercase tracking-wider mb-2 text-muted">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What draws you to this source?"
              className="resize-none h-24"
            />
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Add Source
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
