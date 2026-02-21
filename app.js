// Service Worker 登録
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

// 気分リスト
const MOODS = [
  { emoji: '😄', label: '最高' },
  { emoji: '😊', label: 'いい感じ' },
  { emoji: '😐', label: 'ふつう' },
  { emoji: '😔', label: 'ちょっと...' },
  { emoji: '😢', label: 'つらい' },
  { emoji: '😡', label: 'イライラ' },
  { emoji: '😴', label: 'ねむい' },
  { emoji: '🤒', label: '体調悪い' },
  { emoji: '😎', label: 'かっこいい' },
  { emoji: '🥰', label: 'ときめき' },
];

// 状態
let selectedMood = null;
let editMode = false;

// LocalStorageキー
const STORAGE_KEY = 'daytalk_entries';

// 今日の日付文字列 (YYYY-MM-DD)
function todayStr() {
  return new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).replace(/\//g, '-');
}

// データ取得
function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

// データ保存
function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// 今日のエントリー取得
function getTodayEntry() {
  const today = todayStr();
  return loadEntries().find(e => e.date === today) || null;
}

// ページ初期化
function initTodayPage() {
  const today = getTodayEntry();
  const formSection = document.getElementById('form-section');
  const savedSection = document.getElementById('saved-section');

  if (today && !editMode) {
    // 保存済み表示
    formSection.style.display = 'none';
    savedSection.style.display = 'block';
    document.getElementById('saved-mood').textContent = today.emoji;
    document.getElementById('saved-comment').textContent = today.comment || '（コメントなし）';
  } else {
    // フォーム表示
    formSection.style.display = 'block';
    savedSection.style.display = 'none';

    // 編集時は既存データを反映
    if (editMode && today) {
      selectedMood = { emoji: today.emoji, label: today.label };
      document.getElementById('comment').value = today.comment || '';
      updateCharCount();
      // 選択済みの気分をハイライト
      document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.emoji === today.emoji);
      });
    } else {
      selectedMood = null;
      document.getElementById('comment').value = '';
      updateCharCount();
      document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('selected'));
    }
    updateSaveBtn();
  }
}

// 気分ボタン生成
function buildMoodGrid() {
  const grid = document.getElementById('mood-grid');
  grid.innerHTML = '';
  MOODS.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'mood-btn';
    btn.dataset.emoji = m.emoji;
    btn.innerHTML = `${m.emoji}<span class="label">${m.label}</span>`;
    btn.addEventListener('click', () => {
      selectedMood = m;
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      updateSaveBtn();
    });
    grid.appendChild(btn);
  });
}

// 保存ボタンの活性/非活性
function updateSaveBtn() {
  const btn = document.getElementById('save-btn');
  btn.disabled = !selectedMood;
}

// 文字数カウント
function updateCharCount() {
  const ta = document.getElementById('comment');
  const count = document.getElementById('char-count');
  const len = ta.value.length;
  count.textContent = `${len} / 140文字`;
  count.classList.toggle('over', len > 140);
}

// 今日のエントリー保存
function saveToday() {
  const comment = document.getElementById('comment').value.trim();
  if (!selectedMood) return;
  if (comment.length > 140) {
    showToast('140文字以内で入力してや！');
    return;
  }

  const entries = loadEntries();
  const today = todayStr();
  const idx = entries.findIndex(e => e.date === today);
  const entry = {
    date: today,
    emoji: selectedMood.emoji,
    label: selectedMood.label,
    comment,
    updatedAt: Date.now()
  };

  if (idx >= 0) {
    entries[idx] = entry;
  } else {
    entries.unshift(entry);
  }
  saveEntries(entries);
  editMode = false;
  showToast('保存したで！');
  initTodayPage();
  renderHistory();
}

// 履歴レンダリング
function renderHistory() {
  const list = document.getElementById('history-list');
  const entries = loadEntries();
  list.innerHTML = '';

  if (entries.length === 0) {
    list.innerHTML = `
      <div class="empty-msg">
        <span class="empty-icon">📖</span>
        まだ記録がないで。<br>「今日」タブから記録してみて！
      </div>`;
    return;
  }

  entries.forEach(entry => {
    const item = document.createElement('div');
    item.className = 'history-item';

    const dateObj = new Date(entry.date.replace(/-/g, '/'));
    const dateLabel = dateObj.toLocaleDateString('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
    });

    item.innerHTML = `
      <div class="history-mood">${entry.emoji}</div>
      <div class="history-content">
        <div class="history-date">${dateLabel}｜${entry.label}</div>
        <div class="history-comment">${escapeHtml(entry.comment) || '<span style="color:#aaa">コメントなし</span>'}</div>
      </div>
      <button class="history-delete" data-date="${entry.date}" aria-label="削除">✕</button>
    `;
    list.appendChild(item);
  });

  // 削除ボタン
  list.querySelectorAll('.history-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const date = btn.dataset.date;
      if (confirm(`${date} の記録を削除してええ？`)) {
        let entries = loadEntries();
        entries = entries.filter(e => e.date !== date);
        saveEntries(entries);
        renderHistory();
        initTodayPage();
        showToast('削除したで');
      }
    });
  });
}

// HTMLエスケープ
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

// トースト表示
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

// ヘッダーの日付更新
function updateHeaderDate() {
  const el = document.getElementById('header-date');
  el.textContent = new Date().toLocaleDateString('ja-JP', {
    month: 'long', day: 'numeric', weekday: 'short'
  });
}

// タブ切り替え
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.page).classList.add('active');
      if (btn.dataset.page === 'page-history') renderHistory();
    });
  });
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderDate();
  buildMoodGrid();
  setupTabs();
  initTodayPage();

  // テキストエリア
  document.getElementById('comment').addEventListener('input', updateCharCount);

  // 保存ボタン
  document.getElementById('save-btn').addEventListener('click', saveToday);

  // 編集ボタン
  document.getElementById('edit-btn').addEventListener('click', () => {
    editMode = true;
    initTodayPage();
  });
});
