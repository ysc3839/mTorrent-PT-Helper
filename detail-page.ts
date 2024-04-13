import { hookXHR } from './xhr-hook.ts';

let peersTr;
function handlePeersTr(trs: HTMLCollection, storeTr: boolean) {
  for (let i = trs.length - 1; i >= 0; --i) {
    const tr = trs[i], labelText = tr.getElementsByClassName('ant-descriptions-item-label')[0]?.textContent;
    if (labelText === '同伴' || labelText === 'Peers') {
      if (storeTr) peersTr = tr;
      return tr.getElementsByTagName('button')[0];
    }
  }
}

function clickButton(button: HTMLButtonElement) {
  hookXHR(true);
  button.click();
}

function hookButtonClick(button: HTMLButtonElement) {
  button.onclick = function() {
    this.onclick = null;
    hookXHR(true);
  };
}

function scrollToPeers() {
  if (peersTr) {
    peersTr.scrollIntoView({ behavior: 'smooth' });
    peersTr = null;
  }
}

export function handleDetailPage(e: Element) {
  e = e.firstElementChild!;
  if (e?.classList.contains('detail-view')) {
    const showPeers = (location.hash === '#peers');
    const tbody = e.querySelector('.ant-descriptions-view > table > tbody');
    if (tbody) {
      const button = handlePeersTr(tbody.children, showPeers);
      if (button) {
        if (showPeers) {
          clickButton(button);
          setTimeout(scrollToPeers, 1000);
        } else {
          hookButtonClick(button);
        }
      }

      let first = true;
      const o = new MutationObserver(function (records) {
        if (first) {
          first = false;
          setTimeout(() => {
            this.disconnect();
            scrollToPeers();
          }, 1000);
        }
        const button = handlePeersTr(tbody.children, showPeers);
        if (button && !showPeers) {
          hookButtonClick(button);
        }
      });
      setTimeout(o.disconnect.bind(o), 10000);
      o.observe(tbody, { childList: true });
    }
  }
}
