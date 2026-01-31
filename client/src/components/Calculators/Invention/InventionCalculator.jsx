import React, { useState, useMemo } from 'react';
import './InventionCalculator.css';
import augmentableItems from '../../../data/augmentableItems.json';
import { useCharacter } from '../../../context/CharacterContext';
import { getTargetXp, XP_TABLE } from '../../../utils/rs3';

const InventionCalculator = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemLevel, setItemLevel] = useState(12);
  const [action, setAction] = useState('siphon');

  // List of added items to calculate total
  const [addedItems, setAddedItems] = useState([]);

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

  const calculateXPVal = (item, level, act) => {
    if (!item) return 0;
    const itemLevelInt = parseInt(level);
    if (isNaN(itemLevelInt) || itemLevelInt < 1) return 0;

    let baseXp = 0;
    if (act === 'disassemble') {
        if (itemLevelInt >= 10) baseXp = 540000;
        else if (BASE_XP_TABLE[itemLevelInt]) baseXp = BASE_XP_TABLE[itemLevelInt].disassemble;
    } else {
        // siphon
        if (itemLevelInt >= 12) baseXp = 540000;
        else if (BASE_XP_TABLE[itemLevelInt]) baseXp = BASE_XP_TABLE[itemLevelInt].siphon;
    }

    const tierMultiplier = 1 + 0.015 * (item.tier - 80);
    return Math.floor(baseXp * tierMultiplier);
  };

  // XP for the currently selected item in the form
  const currentPreviewXP = useMemo(() => {
     return calculateXPVal(selectedItem, itemLevel, action);
  }, [selectedItem, itemLevel, action]);

  const handleAddItem = () => {
    if (!selectedItem) return;
    
    const newItem = {
        uniqueId: Date.now(),
        item: selectedItem,
        level: itemLevel,
        action: action,
        xp: currentPreviewXP
    };

    setAddedItems([...addedItems, newItem]);
  };

  const handleRemoveItem = (uniqueId) => {
    setAddedItems(addedItems.filter(item => item.uniqueId !== uniqueId));
  };

  const totalXP = addedItems.reduce((acc, curr) => acc + curr.xp, 0);

  // Character Data Integration
  const { characterData, selectedCharacter } = useCharacter();
  
  const inventionStats = useMemo(() => {
        if (!characterData || characterData.length === 0) return null;
        const skill = characterData.find(s => s.name === 'Invention');
        if (!skill) return null;

        const currentXp = skill.xp;
        const newXp = currentXp + totalXP;
        
        // Target (Generic 99 or 120 or 150)
        const targetXp = getTargetXp('Invention', currentXp);
        const remainingInitial = Math.max(0, targetXp - currentXp);
        const remainingAfter = Math.max(0, targetXp - newXp);

        return {
            currentXp,
            level: skill.level,
            xpGain: totalXP,
            newXp,
            targetXp,
            remainingInitial,
            remainingAfter
        };
  }, [characterData, totalXP]);

  return (
    <div className="invention-calculator">
      <div className="calc-header">
        <h2>Invention Calculator</h2>
        <p>Calculate XP from Siphoning or Disassembling augmented items.</p>
      </div>

      <div className="calc-grid">
        <div className="selection-panel">
          <h3>Add Item</h3>
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

          <div className="preview-xp">
            <span>Item XP: {currentPreviewXP.toLocaleString()}</span>
          </div>
          
          <button 
            className="add-btn" 
            onClick={handleAddItem}
            disabled={!selectedItem}
          >
            Add to List
          </button>
        </div>

        <div className="results-panel">
          {/* XP Analysis Panel */}
          {inventionStats && (
              <div className="xp-analysis-card">
                  <h3>XP Forecast: {selectedCharacter?.name}</h3>
                  <div className="xp-stat-row">
                      <span>Current XP:</span>
                      <span>{inventionStats.currentXp.toLocaleString()}</span>
                  </div>
                  <div className="xp-stat-row gain">
                      <span>+ XP Gain:</span>
                      <span>{inventionStats.xpGain.toLocaleString()}</span>
                  </div>
                  <div className="xp-stat-divider"></div>
                  <div className="xp-stat-row total">
                      <span>Projected XP:</span>
                      <span>{inventionStats.newXp.toLocaleString()}</span>
                  </div>
                  <div className="xp-stat-row remaining">
                      <span>Remaining to Goal:</span>
                      <span>{inventionStats.remainingAfter.toLocaleString()} (was {inventionStats.remainingInitial.toLocaleString()})</span>
                  </div>
              </div>
          )}

          <h3>Total XP Gain</h3>
          <div className="xp-display">
            {totalXP.toLocaleString()} XP
          </div>

          <div className="added-items-list">
             {addedItems.length === 0 ? (
                 <p className="empty-list-msg">No items added to the list yet.</p>
             ) : (
                addedItems.map(entry => (
                    <div key={entry.uniqueId} className="list-item">
                        <div className="list-item-info">
                            <span className="item-name">{entry.item.name}</span>
                            <span className="item-action">
                                {entry.action === 'siphon' ? 'Siphon' : 'DA'} @ Lvl {entry.level}
                            </span>
                            <span className="item-xp">{entry.xp.toLocaleString()} XP</span>
                        </div>
                        <button 
                            className="remove-btn" 
                            onClick={() => handleRemoveItem(entry.uniqueId)} 
                            title="Remove"
                        >
                            &times;
                        </button>
                    </div>
                ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventionCalculator;
