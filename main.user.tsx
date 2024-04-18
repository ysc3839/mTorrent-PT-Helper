import { E } from './jsx.ts';
import { ArrowUp, ArrowDown } from './icons.tsx';
import { waitForContent } from './content.ts';
import { TableType, findAndSetTable, handleTorrentsTable } from './torrents-table.tsx';
import { handleDetailPage } from './detail-page.ts';
import './intercept-dl.js';
import { enterUploadPage, exitUploadPage } from './upload-page.tsx';

function addStyle(style) {
  const s = document.createElement('style');
  s.textContent = style;
  document.head.appendChild(s);
}

addStyle(`@media screen and (max-width: 1380px) {
  #app-content > div { width: 100% !important; }
  .mx-auto { margin: 0 !important; }
}

.braft-output-content {
  max-height: none !important;
  overflow-y: auto !important;
}

.ant-image {
  background: unset !important;
}
.ant-image .ant-image-img-placeholder {
  background: unset !important;
}`);

function replaceUpDownIcon() {
  const up = document.querySelector('img.arrowup'),
    down = document.querySelector('img.arrowdown');
  if (up && down) {
    const upIcon = ArrowUp(), downIcon = ArrowDown();
    upIcon.classList.add('text-mt-dark-green');
    downIcon.classList.add('text-mt-dark-red');
    up.replaceWith(upIcon);
    down.replaceWith(downIcon);
  }
}

function getPageType() {
  return location.pathname.split('/')[1];
}

waitForContent().then(e => {
  replaceUpDownIcon();

  const page = getPageType();
  if (page === 'upload') {
    enterUploadPage();
  } else if (page === 'browse') {
    findAndSetTable(e, TableType.Torrents);
  } else if (page === 'rankings') {
    findAndSetTable(e, TableType.Rankings);
  }

  new MutationObserver(function (records) {
    const page = getPageType();
    if (page === 'upload') {
      enterUploadPage();
    } else {
      exitUploadPage();
      if (page === 'browse') {
        handleTorrentsTable(records, TableType.Torrents);
      } else if (page === 'rankings') {
        handleTorrentsTable(records, TableType.Rankings);
      } else {
        findAndSetTable();
        if (page === 'detail') {
          handleDetailPage(e);
        }
      }
    }
  }).observe(e, { childList: true });
});
