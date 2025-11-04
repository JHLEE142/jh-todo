import React, { useState, useEffect } from 'react';
import Column from './components/Column';
import ColumnModal from './components/ColumnModal';
import './styles.css';

const API_URL = 'https://todo-backend-j388.onrender.com';

function App() {
  const [columns, setColumns] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [draggedColumnId, setDraggedColumnId] = useState(null);
  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedCardColumnId, setDraggedCardColumnId] = useState(null);

  useEffect(() => {
    fetchColumns();
  }, []);

  const fetchColumns = async () => {
    try {
      console.log('📤 [칼럼 조회 요청]', `${API_URL}/api/columns`);
      const response = await fetch(`${API_URL}/api/columns`);
      
      console.log('📥 [칼럼 조회 응답]', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [칼럼 조회 성공]', data);
        
        if (data && data.length > 0) {
          const columnsArray = data.map(column => ({
            id: column._id || column.id,
            name: column.name || '',
            collapsed: column.collapsed || false,
            cards: column.cards || {},
            order: column.order !== undefined ? column.order : 999
          }));
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
          console.log('📝 칼럼이 없어서 기본 칼럼 생성');
          createDefaultColumns();
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error('❌ [칼럼 조회 실패]', errorData);
        createDefaultColumns();
      }
    } catch (error) {
      console.error('❌ [API 호출 오류]', error);
      createDefaultColumns();
    }
  };

  const createDefaultColumns = async () => {
    try {
      const defaultColumns = [
        { name: 'doing', collapsed: false, cards: {}, order: 0 },
        { name: 'done today', collapsed: false, cards: {}, order: 1 }
      ];

      for (const column of defaultColumns) {
        await fetch(`${API_URL}/api/columns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(column)
        });
      }
      fetchColumns();
    } catch (error) {
      console.error('기본 칼럼 생성 오류:', error);
    }
  };

  const handleCreateColumn = async (name) => {
    try {
      console.log('📤 [칼럼 생성 요청]', name);
      const response = await fetch(`${API_URL}/api/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          collapsed: false,
          cards: {},
          order: columns.length
        })
      });
      
      console.log('📥 [칼럼 생성 응답]', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [칼럼 생성 성공]', data);
        fetchColumns();
        setIsModalOpen(false);
      } else {
        const errorData = await response.json().catch(() => ({ message: '알 수 없는 오류' }));
        console.error('❌ [칼럼 생성 실패]', errorData);
        alert(`칼럼 생성 실패: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ [칼럼 생성 오류]', error);
      alert(`칼럼 생성 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  const handleDeleteColumn = async (columnId) => {
    if (window.confirm('이 박스를 삭제하시겠습니까? 모든 카드도 함께 삭제됩니다.')) {
      try {
        console.log('📤 [칼럼 삭제 요청]', columnId);
        const response = await fetch(`${API_URL}/api/columns/${columnId}`, {
          method: 'DELETE'
        });
        
        console.log('📥 [칼럼 삭제 응답]', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ [칼럼 삭제 성공]', data);
          fetchColumns();
        } else {
          const errorData = await response.json().catch(() => ({ message: '알 수 없는 오류' }));
          console.error('❌ [칼럼 삭제 실패]', errorData);
          alert(`칼럼 삭제 실패: ${errorData.message || response.statusText}`);
        }
      } catch (error) {
        console.error('❌ [칼럼 삭제 오류]', error);
        alert(`칼럼 삭제 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  };

  const handleToggleColumn = async (columnId) => {
    const column = columns.find(c => c.id === columnId);
    if (column) {
      try {
        const response = await fetch(`${API_URL}/api/columns/${columnId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collapsed: !column.collapsed
          })
        });
        if (response.ok) {
          fetchColumns();
        }
      } catch (error) {
        console.error('칼럼 토글 오류:', error);
      }
    }
  };

  const handleUpdateColumnName = async (columnId, newName) => {
    if (!newName || !newName.trim()) {
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/columns/${columnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim()
        })
      });
      if (response.ok) {
        fetchColumns();
      }
    } catch (error) {
      console.error('칼럼 이름 수정 오류:', error);
    }
  };

  const handleAddCard = async (columnId, text) => {
    if (!columnId || !text) {
      console.error('❌ 카드 추가 실패: columnId 또는 text가 없습니다.');
      return;
    }
    
    try {
      console.log('📤 [카드 추가 요청]', { columnId, text });
      const response = await fetch(`${API_URL}/api/columns/${columnId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          order: columns.find(c => c.id === columnId)?.cards ? Object.keys(columns.find(c => c.id === columnId).cards).length : 0
        })
      });
      
      console.log('📥 [카드 추가 응답]', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [카드 추가 성공]', data);
        fetchColumns();
      } else {
        const errorData = await response.json().catch(() => ({ message: '알 수 없는 오류' }));
        console.error('❌ [카드 추가 실패]', errorData);
        alert(`카드 추가 실패: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ [카드 추가 오류]', error);
      alert(`카드를 추가하는 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  const handleUpdateCard = async (columnId, cardId, newText) => {
    if (newText) {
      try {
        const column = columns.find(c => c.id === columnId);
        const card = column?.cards?.[cardId];
        const currentOrder = card?.order !== undefined ? card.order : 999;
        
        console.log('📤 [카드 수정 요청]', { columnId, cardId, newText });
        const response = await fetch(`${API_URL}/api/columns/${columnId}/cards/${cardId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: newText,
            order: currentOrder
          })
        });
        
        console.log('📥 [카드 수정 응답]', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ [카드 수정 성공]', data);
          fetchColumns();
        } else {
          const errorData = await response.json().catch(() => ({ message: '알 수 없는 오류' }));
          console.error('❌ [카드 수정 실패]', errorData);
          alert(`카드 수정 실패: ${errorData.message || response.statusText}`);
        }
      } catch (error) {
        console.error('❌ [카드 수정 오류]', error);
        alert(`카드 수정 중 오류가 발생했습니다: ${error.message}`);
      }
    }
    setEditingCardId(null);
  };

  const handleDeleteCard = async (columnId, cardId) => {
    if (window.confirm('이 카드를 삭제하시겠습니까?')) {
      try {
        console.log('📤 [카드 삭제 요청]', { columnId, cardId });
        const response = await fetch(`${API_URL}/api/columns/${columnId}/cards/${cardId}`, {
          method: 'DELETE'
        });
        
        console.log('📥 [카드 삭제 응답]', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ [카드 삭제 성공]', data);
          fetchColumns();
        } else {
          const errorData = await response.json().catch(() => ({ message: '알 수 없는 오류' }));
          console.error('❌ [카드 삭제 실패]', errorData);
          alert(`카드 삭제 실패: ${errorData.message || response.statusText}`);
        }
      } catch (error) {
        console.error('❌ [카드 삭제 오류]', error);
        alert(`카드 삭제 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  };

  const handleMoveCard = async (fromColumnId, toColumnId, cardId, targetIndex = null) => {
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
    
    try {
      // 새 위치에 카드 추가
      const addResponse = await fetch(`${API_URL}/api/columns/${toColumnId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cardData.text,
          order: toCardCount
        })
      });
      
      if (addResponse.ok) {
        // 기존 카드 삭제
        const deleteResponse = await fetch(`${API_URL}/api/columns/${fromColumnId}/cards/${cardId}`, {
          method: 'DELETE'
        });
        if (deleteResponse.ok) {
          fetchColumns();
        } else {
          console.error('카드 삭제 오류');
        }
      } else {
        alert('카드를 이동하는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('카드 이동 오류:', error);
      alert('카드를 이동하는 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const handleCardReorder = async (columnId, cardId, targetIndex) => {
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
    try {
      const updatePromises = cardsArray.map((card, index) =>
        fetch(`${API_URL}/api/columns/${columnId}/cards/${card.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: index })
        })
      );
      await Promise.all(updatePromises);
      fetchColumns();
    } catch (error) {
      console.error('카드 순서 업데이트 오류:', error);
    }
  };

  const handleColumnOrderUpdate = async (draggedId, targetId) => {
    const draggedIndex = columns.findIndex(c => c.id === draggedId);
    const targetIndex = columns.findIndex(c => c.id === targetId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const updatedColumns = [...columns];
      const [draggedColumn] = updatedColumns.splice(draggedIndex, 1);
      updatedColumns.splice(targetIndex, 0, draggedColumn);
      
      try {
        const updatePromises = updatedColumns.map((column, index) =>
          fetch(`${API_URL}/api/columns/${column.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: index })
          })
        );
        await Promise.all(updatePromises);
        fetchColumns();
      } catch (error) {
        console.error('칼럼 순서 업데이트 오류:', error);
      }
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
