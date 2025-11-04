import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, push, set, remove, update } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js';
import Column from './components/Column';
import ColumnModal from './components/ColumnModal';
import './styles.css';

function App() {
  const [columns, setColumns] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [draggedColumnId, setDraggedColumnId] = useState(null);
  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedCardColumnId, setDraggedCardColumnId] = useState(null);

  useEffect(() => {
    const columnsRef = ref(db, 'columns');
    
    const unsubscribe = onValue(columnsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const columnsArray = [];
        for (let key in data) {
          const columnData = data[key];
          let cardsData = {};
          if (columnData.cards && typeof columnData.cards === 'object') {
            cardsData = columnData.cards;
          }
          
          columnsArray.push({
            id: key,
            name: columnData.name || '',
            collapsed: columnData.collapsed || false,
            cards: cardsData,
            order: columnData.order !== undefined ? columnData.order : 999
          });
        }
        // 카드 순서 정렬
        columnsArray.forEach(column => {
          if (column.cards && typeof column.cards === 'object') {
            const sortedCards = {};
            const cardsArray = Object.entries(column.cards).map(([cardId, card]) => ({
              id: cardId,
              ...card,
              order: card.order !== undefined ? card.order : 999
            }));
            cardsArray.sort((a, b) => a.order - b.order);
            cardsArray.forEach(card => {
              sortedCards[card.id] = { text: card.text, order: card.order };
            });
            column.cards = sortedCards;
          }
        });
        columnsArray.sort((a, b) => a.order - b.order);
        setColumns(columnsArray);
      } else {
        createDefaultColumns();
      }
    }, (error) => {
      console.error('Firebase 데이터 읽기 오류:', error);
    });

    return () => unsubscribe();
  }, []);

  const createDefaultColumns = () => {
    const columnsRef = ref(db, 'columns');
    
    const doingRef = push(columnsRef);
    set(doingRef, {
      name: 'doing',
      collapsed: false,
      cards: {},
      order: 0
    });
    
    const doneTodayRef = push(columnsRef);
    set(doneTodayRef, {
      name: 'done today',
      collapsed: false,
      cards: {},
      order: 1
    });
  };

  const handleCreateColumn = (name) => {
    const columnsRef = ref(db, 'columns');
    const newColumnRef = push(columnsRef);
    set(newColumnRef, {
      name: name,
      collapsed: false,
      cards: {},
      order: columns.length
    });
    setIsModalOpen(false);
  };

  const handleDeleteColumn = (columnId) => {
    if (window.confirm('이 박스를 삭제하시겠습니까? 모든 카드도 함께 삭제됩니다.')) {
      const columnRef = ref(db, `columns/${columnId}`);
      remove(columnRef);
    }
  };

  const handleToggleColumn = (columnId) => {
    const column = columns.find(c => c.id === columnId);
    if (column) {
      const columnRef = ref(db, `columns/${columnId}`);
      update(columnRef, {
        collapsed: !column.collapsed
      });
    }
  };

  const handleUpdateColumnName = (columnId, newName) => {
    if (!newName || !newName.trim()) {
      return;
    }
    const columnRef = ref(db, `columns/${columnId}`);
    update(columnRef, {
      name: newName.trim()
    });
  };

  const handleAddCard = (columnId, text) => {
    if (!columnId || !text) {
      console.error('카드 추가 실패: columnId 또는 text가 없습니다.');
      return;
    }
    
    const column = columns.find(c => c.id === columnId);
    const cardCount = column && column.cards ? Object.keys(column.cards).length : 0;
    
    const cardsRef = ref(db, `columns/${columnId}/cards`);
    push(cardsRef, {
      text: text,
      order: cardCount // 새 카드는 마지막에 추가
    }).catch((error) => {
      console.error('카드 추가 오류:', error);
      alert('카드를 추가하는 중 오류가 발생했습니다: ' + error.message);
    });
  };

  const handleUpdateCard = (columnId, cardId, newText) => {
    if (newText) {
      const column = columns.find(c => c.id === columnId);
      const card = column?.cards?.[cardId];
      const currentOrder = card?.order !== undefined ? card.order : 999;
      
      const cardRef = ref(db, `columns/${columnId}/cards/${cardId}`);
      update(cardRef, {
        text: newText,
        order: currentOrder // 기존 order 유지
      });
    }
    setEditingCardId(null);
  };

  const handleDeleteCard = (columnId, cardId) => {
    if (window.confirm('이 카드를 삭제하시겠습니까?')) {
      const cardRef = ref(db, `columns/${columnId}/cards/${cardId}`);
      remove(cardRef);
    }
  };

  const handleMoveCard = (fromColumnId, toColumnId, cardId, targetIndex = null) => {
    const fromColumn = columns.find(c => c.id === fromColumnId);
    if (!fromColumn || !fromColumn.cards || !fromColumn.cards[cardId]) {
      console.error('카드 이동 실패: 카드를 찾을 수 없습니다.');
      return;
    }
    
    const cardData = fromColumn.cards[cardId];
    if (!cardData || !cardData.text) {
      console.error('카드 이동 실패: 카드 데이터가 올바르지 않습니다.');
      return;
    }
    
    // 같은 박스 내에서 순서만 변경하는 경우
    if (fromColumnId === toColumnId && targetIndex !== null) {
      handleCardReorder(fromColumnId, cardId, targetIndex);
      return;
    }
    
    // 다른 박스로 이동하는 경우
    const toColumn = columns.find(c => c.id === toColumnId);
    const toCardCount = toColumn && toColumn.cards ? Object.keys(toColumn.cards).length : 0;
    
    const newCardRef = ref(db, `columns/${toColumnId}/cards`);
    push(newCardRef, {
      text: cardData.text,
      order: toCardCount
    }).then(() => {
      const oldCardRef = ref(db, `columns/${fromColumnId}/cards/${cardId}`);
      remove(oldCardRef).catch((error) => {
        console.error('카드 삭제 오류:', error);
      });
    }).catch((error) => {
      console.error('카드 추가 오류:', error);
      alert('카드를 이동하는 중 오류가 발생했습니다: ' + error.message);
    });
  };

  const handleCardReorder = (columnId, cardId, targetIndex) => {
    const column = columns.find(c => c.id === columnId);
    if (!column || !column.cards) {
      return;
    }
    
    // 카드를 배열로 변환하고 정렬
    const cardsArray = Object.entries(column.cards)
      .map(([id, card]) => ({
        id,
        ...card,
        order: card.order !== undefined ? card.order : 999
      }))
      .sort((a, b) => a.order - b.order);
    
    // 현재 카드 인덱스 찾기
    const currentIndex = cardsArray.findIndex(c => c.id === cardId);
    if (currentIndex === -1 || currentIndex === targetIndex) {
      return;
    }
    
    // 카드 이동
    const [movedCard] = cardsArray.splice(currentIndex, 1);
    cardsArray.splice(targetIndex, 0, movedCard);
    
    // 순서 업데이트
    cardsArray.forEach((card, index) => {
      const cardRef = ref(db, `columns/${columnId}/cards/${card.id}`);
      update(cardRef, {
        order: index
      });
    });
  };

  const handleColumnOrderUpdate = (draggedId, targetId) => {
    const draggedIndex = columns.findIndex(c => c.id === draggedId);
    const targetIndex = columns.findIndex(c => c.id === targetId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const updatedColumns = [...columns];
      const [draggedColumn] = updatedColumns.splice(draggedIndex, 1);
      updatedColumns.splice(targetIndex, 0, draggedColumn);
      
      updatedColumns.forEach((column, index) => {
        const columnRef = ref(db, `columns/${column.id}`);
        update(columnRef, {
          order: index
        });
      });
    }
  };

  return (
    <>
      <div className="background-image"></div>
      <div className="container">
        <div className="header">
          <h1>나의 할 일</h1>
          <button 
            className="add-column-btn"
            onClick={() => setIsModalOpen(true)}
          >
            + 박스 추가
          </button>
        </div>
        <div className="columns-container">
          {columns.map(column => (
            <Column
              key={column.id}
              column={column}
              editingCardId={editingCardId}
              draggedColumnId={draggedColumnId}
              draggedCard={draggedCard}
              draggedCardColumnId={draggedCardColumnId}
              onEditCard={setEditingCardId}
              onDeleteColumn={handleDeleteColumn}
              onToggleColumn={handleToggleColumn}
              onUpdateColumnName={handleUpdateColumnName}
              onAddCard={handleAddCard}
              onUpdateCard={handleUpdateCard}
              onDeleteCard={handleDeleteCard}
              onMoveCard={(fromColumnId, toColumnId, cardId, targetIndex) => {
                handleMoveCard(fromColumnId, toColumnId, cardId, targetIndex);
              }}
              onDragColumnStart={setDraggedColumnId}
              onDragColumnEnd={() => setDraggedColumnId(null)}
              onDragCardStart={(cardId, columnId) => {
                setDraggedCard(cardId);
                setDraggedCardColumnId(columnId);
              }}
              onDragCardEnd={() => {
                setDraggedCard(null);
                setDraggedCardColumnId(null);
              }}
              onColumnDrop={handleColumnOrderUpdate}
            />
          ))}
        </div>
      </div>

      <ColumnModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateColumn}
      />
    </>
  );
}

export default App;
