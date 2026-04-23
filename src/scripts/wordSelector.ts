import type { QuizWord, QuizCategory } from '../data/anarika/words';
import type { CategoryGroup } from '../data/anarika/groups';

export type { CategoryGroup };

export function formatJapanese(word: QuizWord): string {
  const primary = word.ja[0];
  const hasKanji = /[一-鿿㐀-䶿]/.test(primary);
  if (!hasKanji) return primary;
  const kana = word.ja.find((r, i) => i > 0 && !/[一-鿿㐀-䶿]/.test(r));
  return kana ? `${primary}（${kana}）` : primary;
}

export function buildCategoryGrid(
  container: HTMLElement,
  groups: CategoryGroup[],
  onGroupClick: (group: CategoryGroup, idx: number) => void
): void {
  groups.forEach((group, idx) => {
    const btn = document.createElement('button');
    btn.className = 'group-header';
    btn.style.borderLeftColor = group.color;
    btn.innerHTML = `
      <span class="group-header-text">
        <span class="group-label">${group.label} ／ ${group.ja}</span>
      </span>
      <span class="group-chevron">▸</span>
    `;
    btn.addEventListener('click', () => onGroupClick(group, idx));
    container.appendChild(btn);
  });
}

export function openModal(group: CategoryGroup, allCategories: QuizCategory[]): void {
  const modal          = document.getElementById('category-modal')!;
  const modalGroupName = document.getElementById('modal-group-name')!;
  const modalGroupJa   = document.getElementById('modal-group-ja')!;
  const modalSubcats   = document.getElementById('modal-subcats')!;
  const selectAllCb    = document.getElementById('select-all-cb') as HTMLInputElement;

  modalGroupName.textContent = group.label;
  modalGroupJa.textContent   = group.ja;
  modal.style.setProperty('--modal-color', group.color);

  modalSubcats.innerHTML = '';
  group.categories.forEach(groupCat => {
    const cat = allCategories.find(c => c.name === groupCat.name);
    if (!cat) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'subcat-wrap';

    const label = document.createElement('label');
    label.className = 'subcat-row';

    const cb = document.createElement('input');
    cb.type    = 'checkbox';
    cb.value   = groupCat.name;
    cb.checked = true;
    cb.addEventListener('change', syncSelectAll);

    const info = document.createElement('span');
    info.className = 'subcat-info';

    const nameRow = document.createElement('span');
    nameRow.className = 'subcat-name-row';

    const enSpan = document.createElement('span');
    enSpan.className   = 'subcat-name-en';
    enSpan.textContent = groupCat.name;

    const sep = document.createElement('span');
    sep.className   = 'subcat-sep';
    sep.textContent = '／';

    const jaSpan = document.createElement('span');
    jaSpan.className   = 'subcat-name-ja';
    jaSpan.textContent = groupCat.ja;

    nameRow.appendChild(enSpan);
    nameRow.appendChild(sep);
    nameRow.appendChild(jaSpan);

    const countSpan = document.createElement('span');
    countSpan.className   = 'subcat-count';
    countSpan.textContent = `${cat.words.length} words ／ ${cat.words.length} たんご`;

    info.appendChild(nameRow);
    info.appendChild(countSpan);

    const previewBtn = document.createElement('button');
    previewBtn.type = 'button';
    previewBtn.className = 'preview-btn';
    previewBtn.setAttribute('aria-label', 'Preview words');
    previewBtn.innerHTML = `<svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true"><path d="M1 8c0 0 2.5-5 7-5s7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="8" r="2.2" stroke="currentColor" stroke-width="1.5"/></svg>`;

    const previewPanel = document.createElement('div');
    previewPanel.className = 'preview-panel';
    previewPanel.style.display = 'none';

    const chipsWrap = document.createElement('div');
    chipsWrap.className = 'word-chips';

    cat.words.forEach(w => {
      const chip = document.createElement('span');
      chip.className = 'word-chip';
      const chipEn = document.createElement('span');
      chipEn.className   = 'chip-en';
      chipEn.textContent = w.en;
      const chipJa = document.createElement('span');
      chipJa.className   = 'chip-ja';
      chipJa.textContent = formatJapanese(w);
      chip.appendChild(chipEn);
      chip.appendChild(chipJa);
      chipsWrap.appendChild(chip);
    });

    previewPanel.appendChild(chipsWrap);

    previewBtn.addEventListener('click', e => {
      e.preventDefault();
      const isOpen = previewPanel.style.display !== 'none';
      previewPanel.style.display = isOpen ? 'none' : 'block';
      previewBtn.classList.toggle('active', !isOpen);
    });

    label.appendChild(cb);
    label.appendChild(info);
    label.appendChild(previewBtn);
    wrapper.appendChild(label);
    wrapper.appendChild(previewPanel);
    modalSubcats.appendChild(wrapper);
  });

  selectAllCb.checked       = true;
  selectAllCb.indeterminate = false;
  updateGoBtn();

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

export function closeModal(): void {
  const modal = document.getElementById('category-modal')!;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

export function initModalListeners(onGo: () => void): void {
  const modal       = document.getElementById('category-modal')!;
  const modalClose  = document.getElementById('modal-close')!;
  const selectAllCb = document.getElementById('select-all-cb') as HTMLInputElement;
  const goBtn       = document.getElementById('modal-go-btn')!;

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  selectAllCb.addEventListener('change', () => {
    document.querySelectorAll<HTMLInputElement>('#modal-subcats input[type=checkbox]')
      .forEach(cb => { cb.checked = selectAllCb.checked; });
    selectAllCb.indeterminate = false;
    updateGoBtn();
  });

  goBtn.addEventListener('click', onGo);
}

export function getSelectedNames(): string[] {
  return [...document.querySelectorAll<HTMLInputElement>('#modal-subcats input[type=checkbox]')]
    .filter(c => c.checked)
    .map(c => c.value);
}

export function getSelectedWords(allCategories: QuizCategory[]): QuizWord[] {
  return getSelectedNames().flatMap(name =>
    allCategories.find(c => c.name === name)?.words ?? []
  );
}

function syncSelectAll(): void {
  const cbs         = [...document.querySelectorAll<HTMLInputElement>('#modal-subcats input[type=checkbox]')];
  const selectAllCb = document.getElementById('select-all-cb') as HTMLInputElement;
  const n           = cbs.filter(c => c.checked).length;
  if (n === 0)             { selectAllCb.checked = false; selectAllCb.indeterminate = false; }
  else if (n === cbs.length) { selectAllCb.checked = true;  selectAllCb.indeterminate = false; }
  else                     { selectAllCb.checked = false; selectAllCb.indeterminate = true;  }
  updateGoBtn();
}

function updateGoBtn(): void {
  const cbs   = [...document.querySelectorAll<HTMLInputElement>('#modal-subcats input[type=checkbox]')];
  const goBtn = document.getElementById('modal-go-btn') as HTMLButtonElement | null;
  if (goBtn) goBtn.disabled = !cbs.some(c => c.checked);
}
