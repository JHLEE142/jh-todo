import React, { useState, useRef, useEffect } from 'react';
import Card from './Card';

function Column({
  column,
  editingCardId,
  draggedColumnId,
  draggedCard,
  draggedCardColumnId,
  onEditCard,
  onDeleteColumn,
  onToggleColumn,
  onUpdateColumnName,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onMoveCard,
  onDragColumnStart,
  onDragColumnEnd,
  onDragCardStart,
  onDragCardEnd,
  onColumnDrop
}) {
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [cardText, setCardText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCardDragOver, setIsCardDragOver] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [columnName, setColumnName] = useState(column.name);
  const inputRef = useRef(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (showAddCardForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showAddCardForm]);

  useEffect(() => {
    setColumnName(column.name);
  }, [column.name]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleDragStart = (e) => {
    onDragColumnStart(column.id);
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    setIsDragOver(false);
    onDragColumnEnd();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedColumnId && draggedColumnId !== column.id) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (draggedColumnId && draggedColumnId !== column.id) {
      onColumnDrop(draggedColumnId, column.id);
    }
  };

  const handleCardDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedCard && draggedCardColumnId) {
      // 같은 박스 내 이동도 허용
      e.dataTransfer.dropEffect = 'move';
      setIsCardDragOver(true);
      
      // 드롭 위치에 따른 인덱스 계산을 위한 마커 표시
      const cards = column.cards ? Object.entries(column.cards).map(([id, card]) => ({
        id,
        ...card,
        order: card.order !== undefined ? card.order : 999
      })).sort((a, b) => a.order - b.order) : [];
      
      // 드래그 중인 카드 제외
      const otherCards = cards.filter(c => c.id !== draggedCard);
      
      // 마우스 위치에 따른 인덱스 계산
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const cardElements = e.currentTarget.querySelectorAll('.card:not(.dragging)');
      let insertIndex = otherCards.length;
      
      for (let i = 0; i < cardElements.length; i++) {
        const cardRect = cardElements[i].getBoundingClientRect();
        const cardY = cardRect.top + cardRect.height / 2 - rect.top;
        if (y < cardY) {
          insertIndex = i;
          break;
        }
      }
      
      e.currentTarget.dataset.insertIndex = insertIndex;
    } else {
      e.dataTransfer.dropEffect = 'none';
      setIsCardDragOver(false);
    }
  };

  const handleCardDragLeave = (e) => {
    e.stopPropagation();
    // 자식 요소로 이동하는 경우는 무시
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsCardDragOver(false);
    }
  };

  const handleCardDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCardDragOver(false);
    
    if (!draggedCard || !draggedCardColumnId) {
      return;
    }
    
    // 삽입 위치 인덱스 가져오기
    const insertIndex = parseInt(e.currentTarget.dataset.insertIndex || '0', 10);
    
    console.log('드롭 이벤트 발생:', {
      draggedCard,
      draggedCardColumnId,
      targetColumnId: column.id,
      insertIndex
    });
    
    // 같은 박스 내 순서 변경
    if (draggedCardColumnId === column.id) {
      console.log('같은 박스 내 순서 변경:', {
        columnId: column.id,
        cardId: draggedCard,
        targetIndex: insertIndex
      });
      onMoveCard(draggedCardColumnId, column.id, draggedCard, insertIndex);
    } 
    // 다른 박스로 이동
    else {
      console.log('다른 박스로 카드 이동:', {
        from: draggedCardColumnId,
        to: column.id,
        cardId: draggedCard
      });
      onMoveCard(draggedCardColumnId, column.id, draggedCard);
    }
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    const text = cardText.trim();
    if (text) {
      onAddCard(column.id, text);
      setCardText('');
      setShowAddCardForm(false);
    }
  };

  const handleCancel = () => {
    setCardText('');
    setShowAddCardForm(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddCard(e);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div
      className={`column ${isDragOver ? 'drag-over' : ''}`}
      data-column-id={column.id}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="column-header">
        {isEditingName ? (
          <input
            ref={nameInputRef}
            type="text"
            className="column-title-input"
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            onBlur={() => {
              if (columnName.trim()) {
                onUpdateColumnName(column.id, columnName.trim());
              } else {
                setColumnName(column.name);
              }
              setIsEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (columnName.trim()) {
                  onUpdateColumnName(column.id, columnName.trim());
                } else {
                  setColumnName(column.name);
                }
                setIsEditingName(false);
              } else if (e.key === 'Escape') {
                setColumnName(column.name);
                setIsEditingName(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div 
            className="column-title"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingName(true);
            }}
            style={{ cursor: 'pointer' }}
            title="클릭하여 이름 변경"
          >
            {column.name}
          </div>
        )}
        <div className="column-actions">
          <button
            className="toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleColumn(column.id);
            }}
          >
            {column.collapsed ? '▼' : '▲'}
          </button>
          <button
            className="delete-column-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteColumn(column.id);
            }}
          >
            ×
          </button>
        </div>
      </div>

      <div 
        className={`column-content ${column.collapsed ? 'collapsed' : ''}`}
        onDragOver={handleCardDragOver}
        onDragLeave={handleCardDragLeave}
        onDrop={handleCardDrop}
      >
        <div className={`cards-container ${isCardDragOver ? 'drag-over' : ''}`}>
          {column.cards && typeof column.cards === 'object' && 
            Object.entries(column.cards)
              .map(([cardId, card]) => ({
                id: cardId,
                ...card,
                order: card.order !== undefined ? card.order : 999
              }))
              .sort((a, b) => a.order - b.order)
              .map((card) => {
                if (card && typeof card === 'object' && card.text) {
                  return (
                    <Card
                      key={card.id}
                      cardId={card.id}
                      columnId={column.id}
                      text={card.text}
                      isEditing={editingCardId === card.id}
                      onEdit={onEditCard}
                      onUpdate={onUpdateCard}
                      onDelete={onDeleteCard}
                      onDragStart={onDragCardStart}
                      onDragEnd={onDragCardEnd}
                    />
                  );
                }
                return null;
              })
          }
        </div>

        <div className="add-card-section">
          {!showAddCardForm ? (
            <button
              className="add-card-btn"
              onClick={() => setShowAddCardForm(true)}
            >
              + Add a card
            </button>
          ) : (
            <div className="add-card-form active">
              <input
                ref={inputRef}
                type="text"
                className="add-card-input"
                placeholder="카드 내용을 입력하세요"
                value={cardText}
                onChange={(e) => setCardText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="add-card-buttons">
                <button className="btn-add" onClick={handleAddCard}>
                  추가
                </button>
                <button className="btn-cancel" onClick={handleCancel}>
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Column;

