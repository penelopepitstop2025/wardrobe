import React, { useState, useEffect } from 'react';
import { Plus, X, BookOpen } from 'lucide-react';

export default function WardrobeLedger() {
  const [items, setItems] = useState([]);
  const [showAddItem, setShowAddItem] = useState(false);

  useEffect(() => {
    const itemsData = localStorage.getItem('wardrobe-items');
    if (itemsData) setItems(JSON.parse(itemsData));
  }, []);

  const saveItems = (newItems) => {
    setItems(newItems);
    localStorage.setItem('wardrobe-items', JSON.stringify(newItems));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          box-sizing: border-box;
        }

        .serif {
          font-family: 'Libre Baskerville', Georgia, serif;
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
        }

        .btn-primary:hover {
          background: #333;
        }

        input, select {
          width: 100%;
          padding: 12px 16px;
          font-size: 14px;
          border: 1px solid #ddd;
        }
      `}</style>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>
        <header style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: '2rem', marginBottom: '3rem' }}>
          <h1 className="serif" style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '0.75rem' }}>
            Wardrobe
          </h1>
          <p style={{ textAlign: 'center', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#999' }}>
            A Personal Archive
          </p>
        </header>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 300 }}>Collection</h2>
          <button className="btn-primary" onClick={() => setShowAddItem(true)}>
            + Add Item
          </button>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem 0', border: '1px dashed #d1d5db' }}>
            <p>No items yet</p>
            <p style={{ fontSize: '0.875rem', color: '#999' }}>Begin building your wardrobe archive</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {items.map(item => (
              <div key={item.id} style={{ border: '1px solid #e5e5e5', overflow: 'hidden' }}>
                {item.image && (
                  <div style={{ width: '100%', height: '20rem', backgroundColor: '#f3f4f6' }}>
                    <img 
                      src={item.image} 
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div style={{ padding: '1.5rem' }}>
                  <h3 className="serif" style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>
                    {item.name}
                  </h3>
                  <p>{item.category} • {item.color}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddItem && <AddItemModal onClose={() => setShowAddItem(false)} onSave={(newItem) => { saveItems([...items, { ...newItem, id: Date.now() }]); setShowAddItem(false); }} />}
    </div>
  );
}

function AddItemModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'jacket',
    color: '',
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
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50 }}>
      <div style={{ backgroundColor: 'white', maxWidth: '42rem', width: '100%', padding: '2rem' }}>
        <h2 className="serif" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Add Item</h2>
        
        <form onSubmit={(e) => { e.preventDefault(); if (formData.name && formData.color) onSave(formData); }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Item Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Category</label>
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
              <option value="jacket">Jacket</option>
              <option value="shirt">Shirt</option>
              <option value="trousers">Trousers</option>
              <option value="shoes">Shoes</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Color *</label>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Photo</label>
            <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" onClick={onClose} className="btn-primary" style={{ flex: 1, background: 'white', color: '#000', border: '1px solid #000' }}>
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
