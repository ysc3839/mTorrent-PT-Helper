import { E } from './jsx.ts';

let dragging = false;
let dragOverlay: HTMLDivElement;
function onDragEnter() {
  if (!dragging) {
    dragging = true;
    if (!dragOverlay) {
      dragOverlay = <div style={`position: fixed; top: 0; left: 0; z-index: 100; width: 100%; height: 100%; color: white; background: #00000080; user-select: none; justify-content: center; align-items: center; display: none;`} dragleave={function() {
        dragging = false;
        this.style.display = 'none';
      }} dragover={function(e: DragEvent) {
        e.preventDefault();
      }} drop={function(e: DragEvent) {
        e.preventDefault();
        dragging = false;
        this.style.display = 'none';
        const items = e.dataTransfer?.items;
        if (items) {
          let f;
          for (const i of items) {
            const entry = i.webkitGetAsEntry();
            if (entry?.isFile) {
              f = i.getAsFile();
              break;
            }
          }
          if (f) {
            const torrentInput = document.getElementById('torrent-input') as HTMLInputElement;
            if (torrentInput) {
              const dt = new DataTransfer();
              dt.items.add(f);
              torrentInput.files = dt.files;
              torrentInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        }
      }}><div style="pointer-events: none; background: #000a; border-radius: 10px; padding: 10px;"><h1 style="margin: 0;">放下以选择该文件</h1></div></div>;
      document.body.append(dragOverlay);
    }
    dragOverlay.style.display = 'flex';
  }
}

export function enterUploadPage() {
  addEventListener('dragenter', onDragEnter);
}

export function exitUploadPage() {
  removeEventListener('dragenter', onDragEnter);
}
