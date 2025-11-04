import React, { useState, useEffect, useRef } from 'react';

function ColumnModal({ isOpen, onClose, onCreate }) {
  const [columnName, setColumnName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setColumnName('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = columnName.trim();
    if (name) {
      onCreate(name);
      setColumnName('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal active" onClick={handleModalClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>새 박스 만들기</h2>
        <input
          ref={inputRef}
          type="text"
          id="column-name-input"
          placeholder="박스 이름을 입력하세요"
          value={columnName}
          onChange={(e) => setColumnName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="modal-buttons">
          <button className="btn-primary" onClick={handleSubmit}>
            생성
          </button>
          <button className="btn-secondary" onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

export default ColumnModal;

