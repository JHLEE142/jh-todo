import React, { useState, useRef, useEffect } from 'react';

function Card({
  cardId,
  columnId,
  text,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnd
}) {
  const [editText, setEditText] = useState(text);
  const inputRef = useRef(null);

  useEffect(() => {
    setEditText(text);
  }, [text]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDragStart = (e) => {
    if (isEditing) {
      e.preventDefault();
      return;
    }
    
    // 이벤트 버블링 방지
    e.stopPropagation();
    
    // 드래그 설정
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.dropEffect = 'move';
    
    // 드래그 데이터에 카드 정보 저장 (다양한 형식으로)
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.setData('text/html', cardId);
    try {
      e.dataTransfer.setData('application/json', JSON.stringify({ cardId, columnId }));
    } catch (err) {
      console.warn('JSON 데이터 저장 실패:', err);
    }
    
    // 상태 업데이트 (이것이 가장 중요!)
    console.log('카드 드래그 시작:', { cardId, columnId });
    onDragStart(cardId, columnId);
    
    // 시각적 피드백
    e.currentTarget.classList.add('dragging');
    
    // 다른 카드들이 드래그되지 않도록 명시적으로 설정
    setTimeout(() => {
      document.querySelectorAll('.card').forEach(card => {
        if (card !== e.currentTarget && !card.classList.contains('dragging')) {
          card.draggable = false;
        }
      });
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    e.currentTarget.classList.remove('dragging');
    
    // 다른 카드들의 draggable 속성 복원
    document.querySelectorAll('.card').forEach(card => {
      card.draggable = true;
    });
    
    onDragEnd();
  };

  const handleTextClick = () => {
    if (!isEditing) {
      onEdit(cardId);
    }
  };

  const handleUpdate = () => {
    if (editText.trim()) {
      onUpdate(columnId, cardId, editText.trim());
    } else {
      setEditText(text);
      onEdit(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleUpdate();
    } else if (e.key === 'Escape') {
      setEditText(text);
      onEdit(null);
    }
  };

  const handleBlur = () => {
    handleUpdate();
  };

  if (isEditing) {
    return (
      <div className="card" data-card-id={cardId} data-column-id={columnId}>
        <input
          ref={inputRef}
          type="text"
          className="card-edit-input"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      </div>
    );
  }

  return (
    <div
      className="card"
      data-card-id={cardId}
      data-column-id={columnId}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        // 카드 클릭 시 드래그와 충돌 방지
        e.stopPropagation();
      }}
    >
      <div className="card-text" onClick={handleTextClick}>
        {text}
      </div>
      <div className="card-actions">
        <button
          className="card-edit-btn"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(cardId);
          }}
          draggable={false}
        >
          수정
        </button>
        <button
          className="card-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(columnId, cardId);
          }}
          draggable={false}
        >
          삭제
        </button>
      </div>
    </div>
  );
}

export default Card;

