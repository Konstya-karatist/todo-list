'use strict';

const STORAGE_KEY = 'todo-tasks';

const form = document.querySelector('#task-form');
const taskInput = document.querySelector('#task-input');
const taskList = document.querySelector('#task-list');
const emptyMessage = document.querySelector('#empty-message');
const storageMessage = document.querySelector('#storage-message');

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');

    if (!Array.isArray(savedTasks)) return [];

    return savedTasks.filter(task =>
      task !== null &&
      typeof task.id === 'string' &&
      typeof task.text === 'string' &&
      typeof task.completed === 'boolean'
    );
  } catch {
    return [];
  }
}

let tasks = loadTasks();

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    storageMessage.hidden = true;
  } catch {
    storageMessage.textContent = 'Не удалось сохранить задачи в браузере.';
    storageMessage.hidden = false;
  }
}

function renderTasks(addedTaskId = null) {
  const items = tasks.map(task => {
    const item = document.createElement('li');
    item.className = task.completed ? 'task task--completed' : 'task';
    if (task.id === addedTaskId) item.classList.add('task--entering');

    const checkbox = document.createElement('input');
    checkbox.className = 'task__checkbox';
    checkbox.type = 'checkbox';
    checkbox.id = `task-${task.id}`;
    checkbox.checked = task.completed;
    checkbox.dataset.action = 'toggle';
    checkbox.dataset.id = task.id;

    const label = document.createElement('label');
    label.className = 'task__label';
    label.htmlFor = checkbox.id;
    label.textContent = task.text;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'task__delete';
    deleteButton.type = 'button';
    deleteButton.textContent = 'Удалить';
    deleteButton.setAttribute('aria-label', `Удалить задачу «${task.text}»`);
    deleteButton.dataset.action = 'delete';
    deleteButton.dataset.id = task.id;

    item.append(checkbox, label, deleteButton);
    return item;
  });

  taskList.replaceChildren(...items);
  emptyMessage.hidden = tasks.length > 0;
}

function addTask(text) {
  const value = text.trim();
  if (!value) return;

  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

  tasks.push({
    id,
    text: value,
    completed: false
  });

  saveTasks();
  renderTasks(id);
}

function toggleTask(id, checkbox) {
  tasks = tasks.map(task =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  checkbox.closest('.task').classList.toggle('task--completed', checkbox.checked);
  saveTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!taskInput.value.trim()) return;

  addTask(taskInput.value);
  form.reset();
  taskInput.focus();
});

taskList.addEventListener('change', event => {
  if (event.target.dataset.action === 'toggle') {
    toggleTask(event.target.dataset.id, event.target);
  }
});

taskList.addEventListener('click', event => {
  const button = event.target.closest('button[data-action="delete"]');
  if (!button) return;

  const item = button.closest('.task');
  if (item.classList.contains('task--removing')) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    deleteTask(button.dataset.id);
    return;
  }

  item.classList.add('task--removing');
  item.addEventListener('animationend', event => {
    if (event.target === item && event.animationName === 'task-exit') {
      deleteTask(button.dataset.id);
    }
  }, { once: true });
});

renderTasks();
