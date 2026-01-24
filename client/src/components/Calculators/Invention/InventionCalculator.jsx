import React, { useState, useMemo } from 'react';
import './InventionCalculator.css';
import augmentableItems from '../../../data/augmentableItems.json';

const InventionCalculator = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemLevel, setItemLevel] = useState(12);
  const [action, setAction] = useState('siphon');

  // Tier 80 Base XP Values
  const BASE_XP_TABLE = {
    1: { disassemble: 0, siphon: 0 },
    2: { disassemble: 9000, siphon: 0 },
    3: { disassemble: 27000, siphon: 0 },
    4: { disassemble: 54000, siphon: 9000 },
    5: { disassemble: 108000, siphon: 27000 },
    6: { disassemble: 144000, siphon: 54000 },
    7: { disassemble: 198000, siphon: 108000 },
    8: { disassemble: 270000, siphon: 144000 },
    9: { disassemble: 378000, siphon: 198000 },
    10: { disassemble: 540000, siphon: 270000 },
    11: { disassemble: 540000, siphon: 378000 },
    12: { disassemble: 540000, siphon: 540000 }
  };

  const categories = ['All', ...new Set(augmentableItems.map(item => item.category))];

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return augmentableItems;
    return augmentableItems.filter(item => item.category === selectedCategory);
  }, [selectedCategory]);

  const selectedItem = useMemo(() => {
    return augmentableItems.find(item => item.id.toString() === selectedItemId);
  }, [selectedItemId]);

  const calculateXP = () => {
    if (!selectedItem) return 0;

    const level = parseInt(itemLevel);
    if (isNaN(level) || level < 1) return 0;

    // Determine Base XP (Tier 80 equivalent)
    let baseXp = 0;

    if (action === 'disassemble') {
      if (level >= 10) baseXp = 540000;
      else if (BASE_XP_TABLE[level]) baseXp = BASE_XP_TABLE[level].disassemble;
    } else {
      // siphon
      if (level >= 12) baseXp = 540000;
      else if (BASE_XP_TABLE[level]) baseXp = BASE_XP_TABLE[level].siphon;
    }

    // Apply Tier Multiplier
    // Formula: Base * (1 + 0.015 * (Tier - 80))
    // Example T90: 1 + 0.015 * 10 = 1.15
    const tierMultiplier = 1 + 0.015 * (selectedItem.tier - 80);
    
    return Math.floor(baseXp * tierMultiplier);
  };

  const xp = calculateXP();

  return (
    <div className="invention-calculator">
      <div className="calc-header">
        <h2>Invention Calculator</h2>
        <p>Calculate XP from Siphoning or Disassembling augmented items.</p>
      </div>

      <div className="calc-grid">
        <div className="selection-panel">
          <div className="form-group">
            <label>Category</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedItemId(''); // Reset item selection
              }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Item</label>
            <select 
              value={selectedItemId} 
              onChange={(e) => setSelectedItemId(e.target.value)}
              disabled={filteredItems.length === 0}
            >
              <option value="">-- Select an Item --</option>
              {filteredItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} (T{item.tier})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Action</label>
            <div className="radio-group">
              <label className="radio-label">
                <input 
                  type="radio" 
                  value="siphon" 
                  checked={action === 'siphon'} 
                  onChange={(e) => setAction(e.target.value)} 
                />
                Siphon
              </label>
              <label className="radio-label">
                <input 
                  type="radio" 
                  value="disassemble" 
                  checked={action === 'disassemble'} 
                  onChange={(e) => setAction(e.target.value)} 
                />
                Disassemble
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Item Level (1-20)</label>
            <input 
              type="number" 
              min="1" 
              max="20" 
              value={itemLevel} 
              onChange={(e) => setItemLevel(e.target.value)} 
            />
          </div>
        </div>

        <div className="results-panel">
          <h3>Estimated XP Gain</h3>
          <div className="xp-display">
            {xp.toLocaleString()} XP
          </div>
          
          {selectedItem && (
            <div className="item-details">
              <div className="detail-row">
                <span>Item:</span>
                <span>{selectedItem.name}</span>
              </div>
              <div className="detail-row">
                <span>Tier:</span>
                <span>{selectedItem.tier}</span>
              </div>
              <div className="detail-row">
                <span>Category:</span>
                <span>{selectedItem.category}</span>
              </div>
              <div className="detail-row">
                <span>Wiki Link:</span>
                <a 
                  href={`https://runescape.wiki${selectedItem.wikiLink}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{color: '#4CAF50'}}
                >
                  Open Wiki
                </a>
              </div>
            </div>
          )}
          
          {!selectedItem && (
            <p className="xp-label">Please select an item to see details</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventionCalculator;
