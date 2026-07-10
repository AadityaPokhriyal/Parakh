import React, { useState } from 'react';
import './QuestionNode.css';

const QuestionNode = ({ question, level = 1, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Helper to handle text updates
  const handleTextChange = (lang, value) => {
    let newText = question.text;
    if (typeof newText === 'string') {
      // If it was a string, convert to object assuming English as base if lang is 'en'
      newText = { [lang]: value };
    } else {
      newText = { ...newText, [lang]: value };
    }
    onUpdate(question.id, { text: newText });
  };

  const handleMarksChange = (e) => {
    onUpdate(question.id, { marks: e.target.value });
  };
  
  const handleDiagramRequiredChange = (e) => {
    onUpdate(question.id, { diagramRequired: e.target.checked });
  };

  // Rubrics
  const addRubric = () => {
    const newRubrics = [...(question.rubric || []), ''];
    onUpdate(question.id, { rubric: newRubrics });
  };

  const updateRubric = (index, value) => {
    const newRubrics = [...(question.rubric || [])];
    newRubrics[index] = value;
    onUpdate(question.id, { rubric: newRubrics });
  };

  const removeRubric = (index) => {
    const newRubrics = (question.rubric || []).filter((_, i) => i !== index);
    onUpdate(question.id, { rubric: newRubrics });
  };

  // Options
  const updateOptionText = (optIndex, lang, value) => {
    const newOptions = [...(question.options || [])];
    const opt = newOptions[optIndex];
    let newText = opt.text;
    if (typeof newText === 'string') {
      newText = { [lang]: value };
    } else {
      newText = { ...newText, [lang]: value };
    }
    newOptions[optIndex] = { ...opt, text: newText };
    onUpdate(question.id, { options: newOptions });
  };

  // Text values for rendering
  const enText = typeof question.text === 'object' ? (question.text?.en || '') : question.text;
  const hiText = typeof question.text === 'object' ? (question.text?.hi || '') : '';

  return (
    <div className={`level-${level} question-wrapper`}>
      <div className="question-node">
        <div className="question-header" onClick={() => setIsExpanded(!isExpanded)}>
          <h3 className="question-title">
            {question.id} {question.children && question.children.length > 0 ? `(${question.children.length} sub-questions)` : ''}
          </h3>
          <span style={{ color: '#8b5cf6', fontSize: '14px' }}>{isExpanded ? '▼' : '▶'}</span>
        </div>

        {isExpanded && (
          <div className="question-body">
            {/* Text Inputs */}
            <div className="field-group">
              <label>Question Text (English)</label>
              <textarea 
                value={enText}
                onChange={(e) => handleTextChange('en', e.target.value)}
                placeholder="Question text in English..."
              />
            </div>

            <div className="field-group">
              <label>Question Text (Hindi)</label>
              <textarea 
                value={hiText}
                onChange={(e) => handleTextChange('hi', e.target.value)}
                placeholder="Question text in Hindi..."
              />
            </div>

            {/* Marks & Diagram Required */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="field-group" style={{ flex: '1', minWidth: '150px' }}>
                <label>Marks</label>
                <input 
                  type="text" 
                  value={question.marks || ''} 
                  onChange={handleMarksChange}
                  placeholder="e.g. 2, or infer..."
                />
              </div>
              <div className="checkbox-group" style={{ flex: '1', minWidth: '150px', marginTop: 'auto', marginBottom: '8px' }}>
                <input 
                  type="checkbox" 
                  id={`diagram-${question.id}`}
                  checked={!!question.diagramRequired}
                  onChange={handleDiagramRequiredChange}
                />
                <label htmlFor={`diagram-${question.id}`}>Diagram required in answer</label>
              </div>
            </div>

            {/* MCQ Options */}
            {question.options && question.options.length > 0 && (
              <div className="field-group">
                <label>Options</label>
                <div className="options-container">
                  {question.options.map((opt, i) => {
                    const optEnText = typeof opt.text === 'object' ? (opt.text?.en || '') : opt.text;
                    const optHiText = typeof opt.text === 'object' ? (opt.text?.hi || '') : '';
                    return (
                      <div key={opt.optionId || i} className="option-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 600 }}>Option {opt.optionId}</div>
                        <input 
                          type="text" 
                          value={optEnText}
                          onChange={(e) => updateOptionText(i, 'en', e.target.value)}
                          placeholder="Option text (EN)"
                        />
                        <input 
                          type="text" 
                          value={optHiText}
                          onChange={(e) => updateOptionText(i, 'hi', e.target.value)}
                          placeholder="Option text (HI)"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rubrics */}
            <div className="field-group">
              <label>Rubrics</label>
              <div className="rubrics-container">
                {(question.rubric || []).map((rubricItem, i) => (
                  <div key={i} className="rubric-item">
                    <input 
                      type="text" 
                      value={rubricItem} 
                      onChange={(e) => updateRubric(i, e.target.value)}
                      placeholder="Enter rubric criterion..."
                    />
                    <button className="btn-icon" onClick={() => removeRubric(i)} title="Remove Rubric">✕</button>
                  </div>
                ))}
                <button className="btn-secondary" onClick={addRubric}>+ Add Rubric</button>
              </div>
            </div>
            
            {/* Nested Children */}
            {question.children && question.children.length > 0 && (
              <div className="children-container">
                {question.children.map(child => (
                  <QuestionNode 
                    key={child.id} 
                    question={child} 
                    level={level + 1} 
                    onUpdate={onUpdate} 
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionNode;
