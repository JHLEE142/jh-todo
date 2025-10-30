// Firebase 모듈 import 및 초기화 (index.html의 <script type=module>에서 수행되므로 영향 없음)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBMMt8WOh_DU1Tek0t-dGvEP8dLFe6ejhw",
  authDomain: "jh-todo.firebaseapp.com",
  databaseURL: "https://jh-todo-default-rtdb.firebaseio.com",
  projectId: "jh-todo",
  storageBucket: "jh-todo.firebasestorage.app",
  messagingSenderId: "782999239856",
  appId: "1:782999239856:web:6b39ae7dc90fa57d0c8f75",
  measurementId: "G-8LBL8RYVMV"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');

let todos = [];
let editingId = null;

function render() {
  list.innerHTML = '';
  todos.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'todo-item';
    if (editingId === todo.id) {
      // 수정 중
      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.value = todo.text;
      editInput.className = 'todo-edit-input';
      editInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          finishEdit(todo.id, editInput.value);
        }
      });
      li.appendChild(editInput);
      const saveBtn = document.createElement('button');
      saveBtn.className = 'edit-btn';
      saveBtn.textContent = '저장';
      saveBtn.onclick = () => finishEdit(todo.id, editInput.value);
      li.appendChild(saveBtn);
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'del-btn';
      cancelBtn.textContent = '취소';
      cancelBtn.onclick = () => cancelEdit();
      li.appendChild(cancelBtn);
    } else {
      const span = document.createElement('span');
      span.className = 'todo-text';
      span.textContent = todo.text;
      li.appendChild(span);
      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.textContent = '수정';
      editBtn.onclick = () => startEdit(todo.id);
      li.appendChild(editBtn);
      const delBtn = document.createElement('button');
      delBtn.className = 'del-btn';
      delBtn.textContent = '삭제';
      delBtn.onclick = () => removeTodo(todo.id);
      li.appendChild(delBtn);
    }
    list.appendChild(li);
  });
}

function addTodo(text) {
  // 기존 로컬 push -> firebase push로 변경
  const todoRef = ref(db, 'todos');
  push(todoRef, {
    text: text
  });
}

// 할 일 데이터 firebase에서 받아오기(실시간 반영)
function fetchTodos() {
  const todoRef = ref(db, 'todos');
  onValue(todoRef, (snapshot) => {
    const data = snapshot.val();
    todos = [];
    for (let key in data) {
      todos.push({ id: key, text: data[key].text });
    }
    render();
  });
}

function removeTodo(id) {
  // 기존 제거 로직은 남겨둡니다 (이후 firebase 연동으로 확장 필요)
  todos = todos.filter(t => t.id !== id);
  render();
}

function startEdit(id) {
  editingId = id;
  render();
}

function finishEdit(id, newText) {
  todos = todos.map(t => t.id === id ? { ...t, text: newText } : t);
  editingId = null;
  render();
}

function cancelEdit() {
  editingId = null;
  render();
}

form.onsubmit = function (e) {
  e.preventDefault();
  addTodo(input.value.trim());
  input.value = '';
};

fetchTodos();
