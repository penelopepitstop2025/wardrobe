import React, { useState, useEffect } from 'react';
import { Plus, X, Sparkles, Calendar, TrendingUp, BookOpen } from 'lucide-react';

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
  const [openAiApiKey, setOpenAiApiKey] = useState(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const itemsData = localStorage.getItem('wardrobe-items');
      const inspirationData = localStorage.getItem('inspiration-sources');
      const historyData = localStorage.getItem('outfit-history');
      const apiKeyData = localStorage.getItem('openai-api-key');

      if (itemsData) setItems(JSON.parse(itemsData));
      if (inspirationData) setInspiration(JSON.parse(inspirationData));
      if (historyData) setOutfitHistory(JSON.parse(historyData));
      if (apiKeyData) setOpenAiApiKey(apiKeyData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveItems = (newItems) => {
    setItems(newItems);
    localStorage.setItem('wardrobe-items', JSON.stringify(newItems));
  };

  const saveInspiration = (newInspiration) => {
    setInspiration(newInspiration);
    localStorage.setItem('inspiration-sources', JSON.stringify(newInspiration));
  };

  const saveHistory = (newHistory) => {
    setOutfitHistory(newHistory);
    localStorage.setItem('outfit-history', JSON.stringify(newHistory));
  };

  const saveApiKey = (key) => {
    setOpenAiApiKey(key);
    if (key) {
      localStorage.setItem('openai-api-key', key);
    } else {
      localStorage.removeItem('openai-api-key');
    }
  };

  const generateOutfit = async () => {
    setIsGenerating(true);
    setShowRecommendation(true);
    setGeneratedImage(null);

    try {
      const wardrobeContext = items.map(item => 
        `${item.category}: ${item.name} (${item.color})`
      ).join(', ');

      const prompt = `You are a personal stylist. Recommend a complete outfit from these items: ${wardrobeContext}. 

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "items": ["item1", "item2", "item3"],
  "occasion": "suitable occasions",
  "styling_notes": "styling advice"
}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      const aiResponse = data.content.find(block => block.type === "text")?.text || "";
      const cleanResponse = aiResponse.replace(/```json|```/g, '').trim();
      const recommendation = JSON.parse(cleanResponse);

      const outfitItemIds = recommendation.items.map(itemName => {
        const found = items.find(item => 
          item.name.toLowerCase().includes(itemName.toLowerCase()) ||
          itemName.toLowerCase().includes(item.name.toLowerCase())
        );
        return found?.id;
      }).filter(Boolean);

      setCurrentRecommendation({
        ...recommendation,
        itemIds: outfitItemIds,
        date: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error generating outfit:', error);
      setCurrentRecommendation({
        items: ['Error generating outfit. Please try again.'],
        occasion: '',
        styling_notes: ''
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateOutfitImage = async () => {
    if (!openAiApiKey) {
      setShowApiKeyInput(true);
      return;
    }

    setIsGeneratingImage(true);
    
    try {
      const imagePrompt = `Professional fashion photography of a well-dressed gentleman wearing: ${currentRecommendation.items.join(', ')}. Clean background, natural lighting, editorial style.`;

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
          size: '1024x1024'
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
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          box-sizing: border-box;
        }

        .serif { font-family: 'Libre Baskerville', Georgia, serif; }
        
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

        .tab-button:hover { color: #000; }
        .tab-button.active { color: #000; }
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

        .btn-primary:hover:not(:disabled) { background: #333; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

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

        .btn-secondary:hover { background: #000; color: white; }

        .card {
          background: white;
          border: 1px solid #e5e5e5;
          transition: all 0.3s ease;
        }

        .card:hover { border-color: #999; }

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

        @media (max-width: 768px) {
          .tab-button {
            white-space: nowrap;
            font-size: 11px;
            padding: 1rem 0.75rem;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Hero Image */}
        <div style={{ position: 'relative', width: '100%', marginBottom: '3rem', overflow: 'hidden', height: '40vh', minHeight: '250px', maxHeight: '400px', marginLeft: '-1.5rem', marginRight: '-1.5rem', width: 'calc(100% + 3rem)' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: '#f5f5f5' }}>
            <img 
              src="/Screenshot 2026-01-13 155022.png"
              alt="Wardrobe"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, white, rgba(255,255,255,0.6) 60%, transparent)' }}></div>
        </div>

        {/* Header */}
        <header style={{ paddingBottom: '2rem', marginBottom: '3rem', marginTop: '-5rem', position: 'relative', zIndex: 10 }}>
          <h1 className="serif" style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '0.5rem', fontWeight: 400 }}>
            Wardrobe
          </h1>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#999' }}>
            A Personal Archive
          </p>
        </header>

        {/* Navigation */}
        <nav style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem', borderBottom: '1px solid #e5e5e5', overflowX: 'auto', justifyContent: 'center' }}>
          <button className={`tab-button ${activeTab === 'wardrobe' ? 'active' : ''}`} onClick={() => setActiveTab('wardrobe')}>
            Collection
          </button>
          <button className={`tab-button ${activeTab === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveTab('recommendations')}>
            Stylist
          </button>
          <button className={`tab-button ${activeTab === 'inspiration' ? 'active' : ''}`} onClick={() => setActiveTab('inspiration')}>
            Inspiration
          </button>
          <button className={`tab-button ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            Archive
          </button>
          <button className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            Settings
          </button>
        </nav>

        {/* Wardrobe Tab */}
        {activeTab === 'wardrobe' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 300 }}>Collection</h2>
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowAddItem(true)}>
                <Plus size={16} />
                Add Item
              </button>
            </div>

            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '6rem 0', border: '1px dashed #d1d5db' }}>
                <BookOpen size={40} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
                <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No items yet</p>
                <p style={{ fontSize: '0.875rem', color: '#999' }}>Begin building your wardrobe archive</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                  {items.map(item => (
                    <div key={item.id} className="card" style={{ overflow: 'hidden', position: 'relative' }}>
                      {item.image && (
                        <div style={{ position: 'relative', width: '100%', height: '20rem', backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
                          <img 
                            src={item.image} 
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete ${item.name}?`)) {
                                saveItems(items.filter(i => i.id !== item.id));
                              }
                            }}
                            style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(255,255,255,0.9)', padding: '0.5rem', borderRadius: '50%', border: 'none', cursor: 'pointer' }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                      <div style={{ padding: '1.5rem' }}>
                        <h3 className="serif" style={{ fontSize: '1.125rem', marginBottom: '0.75rem', fontWeight: 400 }}>
                          {item.name}
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                          <span className="tag">{item.category}</span>
                          <span className="tag">{item.color}</span>
                          {item.brand && <span className="tag">{item.brand}</span>}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                          <p>{item.season} • {item.formality}</p>
                          {item.resaleValue && (
                            <p style={{ fontWeight: 500, marginTop: '0.5rem' }}>Est. Value: £{item.resaleValue}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Value */}
                {items.some(item => item.resaleValue) && (
                  <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e5e5e5', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: '0.5rem' }}>
                      Total Estimated Value
                    </p>
                    <p className="serif" style={{ fontSize: '2rem' }}>
                      £{items.reduce((sum, item) => sum + (parseFloat(item.resaleValue) || 0), 0).toFixed(2)}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Stylist Tab */}
        {activeTab === 'recommendations' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 300, marginBottom: '1rem' }}>AI Stylist</h2>
              <p style={{ color: '#666', marginBottom: '2rem' }}>Get personalized outfit recommendations</p>
              <button 
                className="btn-primary" 
                onClick={generateOutfit}
                disabled={items.length === 0 || isGenerating}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Sparkles size={16} />
                {isGenerating ? 'Generating...' : 'Generate Outfit'}
              </button>
              {items.length === 0 && (
                <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#999' }}>
                  Add items to your collection first
                </p>
              )}
            </div>

            {showRecommendation && currentRecommendation && (
              <div style={{ maxWidth: '900px', margin: '0 auto', border: '1px solid #e5e5e5', padding: '3rem' }}>
                {isGenerating ? (
                  <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <p>Composing your ensemble...</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="serif" style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>Today's Recommendation</h3>
                    
                    <div style={{ marginBottom: '2rem' }}>
                      <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: '1rem' }}>
                        The Ensemble
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {currentRecommendation.itemIds?.map(id => {
                          const item = items.find(i => i.id === id);
                          return item ? (
                            <div key={id} style={{ border: '1px solid #e5e5e5' }}>
                              {item.image && (
                                <div style={{ width: '100%', height: '12rem', backgroundColor: '#f3f4f6' }}>
                                  <img 
                                    src={item.image} 
                                    alt={item.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                </div>
                              )}
                              <div style={{ padding: '1rem' }}>
                                <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{item.name}</p>
                                <p style={{ fontSize: '0.875rem', color: '#666' }}>{item.category}</p>
                              </div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>

                    {currentRecommendation.occasion && (
                      <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: '0.75rem' }}>
                          Occasions
                        </h4>
                        <p style={{ color: '#666' }}>{currentRecommendation.occasion}</p>
                      </div>
                    )}

                    {currentRecommendation.styling_notes && (
                      <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: '0.75rem' }}>
                          Styling Notes
                        </h4>
                        <p style={{ color: '#666' }}>{currentRecommendation.styling_notes}</p>
                      </div>
                    )}

                    {/* Image Generation */}
                    <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e5e5e5' }}>
                      <div style={{ background: '#f9fafb', padding: '1.5rem', border: '1px solid #e5e5e5' }}>
                        <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: '1rem' }}>
                          Visualize This Outfit
                        </h4>
                        
                        {!openAiApiKey && (
                          <div style={{ marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.75rem' }}>
                              Add your OpenAI API key to generate outfit images
                            </p>
                            <button className="btn-secondary" onClick={() => setShowApiKeyInput(true)}>
                              Add API Key
                            </button>
                          </div>
                        )}

                        {openAiApiKey && !generatedImage && (
                          <button 
                            className="btn-primary"
                            style={{ width: '100%' }}
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
                              alt="Generated outfit"
                              style={{ width: '100%', border: '1px solid #e5e5e5', marginBottom: '1rem' }}
                            />
                            <button 
                              className="btn-secondary"
                              style={{ width: '100%' }}
                              onClick={() => { setGeneratedImage(null); generateOutfitImage(); }}
                            >
                              Generate New Image
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
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
                )}
              </div>
            )}
          </div>
        )}

        {/* Inspiration Tab */}
        {activeTab === 'inspiration' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 300 }}>Inspiration</h2>
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowAddInspiration(true)}>
                <Plus size={16} />
                Add Source
              </button>
            </div>

            {inspiration.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '6rem 0', border: '1px dashed #d1d5db' }}>
                <TrendingUp size={40} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
                <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No inspiration sources yet</p>
                <p style={{ fontSize: '0.875rem', color: '#999' }}>Add websites, Instagram, or Pinterest</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {inspiration.map(source => (
                  <div key={source.id} className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>{source.url}</p>
                        <p style={{ fontSize: '0.875rem', color: '#666' }}>{source.type}</p>
                        {source.description && (
                          <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.75rem', fontStyle: 'italic' }}>
                            {source.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm('Remove this source?')) {
                            saveInspiration(inspiration.filter(s => s.id !== source.id));
                          }
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Archive Tab */}
        {activeTab === 'history' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 300, marginBottom: '2rem' }}>Archive</h2>
            
            {outfitHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '6rem 0', border: '1px dashed #d1d5db' }}>
                <Calendar size={40} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
                <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No saved outfits yet</p>
                <p style={{ fontSize: '0.875rem', color: '#999' }}>Save outfits from the Stylist to see them here</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '2rem' }}>
                {outfitHistory.map(outfit => (
                  <div key={outfit.id} className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h3 className="serif" style={{ fontSize: '1.25rem' }}>Saved Outfit</h3>
                      <span style={{ fontSize: '0.875rem', color: '#999' }}>
                        {new Date(outfit.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                      {outfit.items.map(itemId => {
                        const item = items.find(i => i.id === itemId);
                        return item ? (
                          <div key={itemId} style={{ textAlign: 'center' }}>
                            {item.image && (
                              <div style={{ width: '100%', height: '8rem', backgroundColor: '#f3f4f6', marginBottom: '0.5rem' }}>
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </div>
                            )}
                            <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.name}</p>
                          </div>
                        ) : null;
                      })}
                    </div>
                    {outfit.notes && (
                      <p style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e5e5', color: '#666', fontStyle: 'italic' }}>
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
          <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 300, marginBottom: '2rem' }}>Settings</h2>
            
            <div style={{ border: '1px solid #e5e5e5', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>OpenAI API Key</h3>
              <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                Used for generating AI outfit visualizations with DALL-E 3
              </p>
              
              {openAiApiKey ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: '#666' }}>
                      {openAiApiKey.substring(0, 8)}...{openAiApiKey.substring(openAiApiKey.length - 4)}
                    </span>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981' }}>Active</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn-secondary" onClick={() => setShowApiKeyInput(true)}>
                      Update Key
                    </button>
                    <button 
                      className="btn-secondary"
                      onClick={() => {
                        if (window.confirm('Remove API key? You won\'t be able to generate images until you add a new one.')) {
                          saveApiKey(null);
                        }
                      }}
                    >
                      Remove Key
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn-primary" onClick={() => setShowApiKeyInput(true)}>
                  Add API Key
                </button>
              )}
            </div>

            <div style={{ border: '1px solid #e5e5e5', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>About</h3>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                <p>Wardrobe - A Personal Archive</p>
                <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>
                  Your wardrobe data is stored locally on this device
                </p>
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

      {/* API Key Modal */}
      {showApiKeyInput && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50 }}>
          <div style={{ background: 'white', maxWidth: '28rem', width: '100%', padding: '2rem' }}>
            <h2 className="serif" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>OpenAI API Key</h2>
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem' }}>
              Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>platform.openai.com</a>
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: '#666' }}>
                API Key
              </label>
              <input
                type="password"
                placeholder="sk-..."
                defaultValue={openAiApiKey || ''}
                id="api-key-input"
              />
              <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>
                Your key is stored locally and never sent to our servers
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowApiKeyInput(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary"
                style={{ flex: 1 }}
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

function AddItemModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'jacket',
    color: '',
    brand: '',
    season: 'all-season',
    formality: 'smart-casual',
    resaleValue: '',
    image: ''
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50 }}>
      <div style={{ background: 'white', maxWidth: '42rem', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ borderBottom: '1px solid #e5e5e5', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="serif" style={{ fontSize: '1.5rem' }}>Add Item</h2>
          <button onClick={onClose} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (formData.name && formData.color) onSave(formData); }} style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: '#666' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: '#666' }}>
                Category *
              </label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                <option value="jacket">Jacket</option>
                <option value="blazer">Blazer</option>
                <option value="shirt">Shirt</option>
                <option value="trousers">Trousers</option>
                <option value="shoes">Shoes</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: '#666' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: '#666' }}>
                Brand
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Optional"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: '#666' }}>
                Season
              </label>
              <select value={formData.season} onChange={(e) => setFormData({ ...formData, season: e.target.value })}>
                <option value="all-season">All Season</option>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="autumn">Autumn</option>
                <option value="winter">Winter</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: '#666' }}>
                Formality
              </label>
              <select value={formData.formality} onChange={(e) => setFormData({ ...formData, formality: e.target.value })}>
                <option value="formal">Formal</option>
                <option value="business">Business</option>
                <option value="smart-casual">Smart Casual</option>
                <option value="casual">Casual</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: '#666' }}>
                Resale Value (£)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.resaleValue}
                onChange={(e) => setFormData({ ...formData, resaleValue: e.target.value })}
                placeholder="250.00"
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: '#666' }}>
              Photograph
            </label>
            <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} />
            {formData.image && (
              <div style={{ marginTop: '1rem', border: '1px solid #e5e5e5' }}>
                <img src={formData.image} alt="Preview" style={{ width: '100%', height: '16rem', objectFit: 'cover' }} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e5e5' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddInspirationModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    url: '',
    type: 'website',
    description: ''
  });

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50 }}>
      <div style={{ background: 'white', maxWidth: '42rem', width: '100%' }}>
        <div style={{ borderBottom: '1px solid #e5e5e5', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="serif" style={{ fontSize: '1.5rem' }}>Add Inspiration Source</h2>
          <button onClick={onClose} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (formData.url) onSave(formData); }} style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: '#666' }}>
              URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com"
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: '#666' }}>
              Type
            </label>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
              <option value="website">Website</option>
              <option value="instagram">Instagram</option>
              <option value="pinterest">Pinterest</option>
              <option value="magazine">Magazine</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: '#666' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What draws you to this source?"
              style={{ resize: 'none', height: '6rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e5e5' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              Add Source
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
