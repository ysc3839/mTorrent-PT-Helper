import { E } from './jsx.ts';
import { specialClass } from './content.ts';
import { Copy, Loading, Check } from './icons.tsx';
import { genDlToken, getTorrentPeers } from './api.ts';
import { modifierState } from './keystate.ts';

export enum TableType {
  None = 0,
  Torrents = 1,
  Rankings = 2,
}

class TorrentsTableManager {
  type?: TableType;
  table?: HTMLTableElement;
  observer: MutationObserver;
  rowsCount?: number;
  peersColIndex?: number;
  linkColor?: CSSStyleValue;

  constructor() {
    this.observer = new MutationObserver(this.onTbodyChange.bind(this));
  }

  set(table?: HTMLTableElement, type?: TableType) {
    this.observer.disconnect();
    this.type = type;
    this.table = table;
    if (table) {
      const colgroup = table.getElementsByTagName('colgroup')[0],
        theadr = table.querySelector('thead > tr'),
        tbody = table.getElementsByTagName('tbody')[0];
      if (colgroup && theadr && tbody) {
        const c = theadr.children;
        this.rowsCount = c.length;
        if (this.type === TableType.Rankings) {
          for (let i = c.length - 1; i >= 0; --i) {
            const e = c[i].firstElementChild;
            if (e && e.getAttribute('color') === 'green') {
              this.peersColIndex = i;
              break;
            }
          }
        }

        this.modifyPlaceholderColspan(tbody);
        this.addListSelectHead(colgroup, theadr, tbody);
        this.observer.observe(tbody, { childList: true });
      }
    }
  }

  modifyPlaceholderColspan(tbody: HTMLTableSectionElement) {
    const td = tbody.querySelector('tr.ant-table-placeholder > td[colspan]') as HTMLTableCellElement;
    if (td) ++td.colSpan;
  }

  addListSelectHead(colgroup: HTMLTableColElement, theadr: Element, tbody: HTMLTableSectionElement) {
    colgroup.prepend(<col style="width: 42px;" />);

    let span: HTMLSpanElement, loading = false;
    theadr.prepend(<th class="ant-table-cell" scope="col" style="text-align: center;">
      <button
        type="button" class={`ant-btn ant-btn-default ant-btn-sm ant-btn-icon-only ${specialClass}`}
        click={async function() {
          if (!loading) {
            const selected = tbody.getElementsByClassName('ant-table-row-selected');
            if (selected.length !== 0) {
              const setLoading = (l) => {
                loading = l;
                (this as HTMLButtonElement).classList.toggle('ant-btn-loading', l);
                span.classList.toggle('ant-btn-loading-icon', l);
                span.replaceChildren(l ? Loading() : Check());
              };

              setLoading(true);
              const reqs: Promise<string | null>[] = [];
              for (const tr of selected) {
                reqs.push(genDlToken((tr as HTMLElement).dataset.rowKey!));
              }
              const urls = await Promise.all(reqs);
              if (!urls.some(i => !i)) {
                await navigator.clipboard.writeText(urls.join('\n'));
                setLoading(false);
              }
            }
          }
        }}>{span = <span class="ant-btn-icon">{Copy()}</span>}</button>
    </th>);
  }

  addListSelect(tr: HTMLTableRowElement) {
    let label: HTMLLabelElement, span: HTMLSpanElement;
    tr.prepend(<td class="ant-table-cell ant-table-selection-column">{label =
      <label class={`ant-checkbox-wrapper ${specialClass}`} style="transform: scale(1.5);">{span =
        <span class={`ant-checkbox ant-wave-target ${specialClass}`}>
          <input class="ant-checkbox-input" type="checkbox" change={function() {
            const c = (this as HTMLInputElement).checked;
            span.classList.toggle('ant-checkbox-checked', c);
            label.classList.toggle('ant-checkbox-wrapper-checked', c);
            tr.classList.toggle('ant-table-row-selected', c);
          }} />
          <span class="ant-checkbox-inner"></span>
        </span>}
      </label>}</td>);
  }

  getPeersSpan(n: HTMLTableRowElement): [HTMLSpanElement | undefined, HTMLSpanElement | undefined] | undefined {
    if (this.type === TableType.Torrents) {
      if (!this.peersColIndex) {
        const c = n.children;
        for (let i = c.length - 1; i >= 0; --i) {
          const e = c[i];
          if (e.getElementsByClassName('anticon-arrow-up').length !== 0 &&
            e.getElementsByClassName('anticon-arrow-down').length !== 0) {
            this.peersColIndex = i;
            break;
          }
        }
      }

      const peersTd = n.children[this.peersColIndex!];
      let seeders: HTMLSpanElement | undefined, leechers: HTMLSpanElement | undefined;
      if (peersTd) {
        const spans = peersTd.getElementsByTagName('span');
        for (const s of spans) {
          if (s.childElementCount === 0) {
            if (!seeders) {
              seeders = s;
            } else if (!leechers) {
              leechers = s;
              break;
            }
          }
        }
        //const seeders = spans[2], leechers = spans[4];
      }
      return [seeders, leechers];
    } else if (this.type === TableType.Rankings) {
      const seeders = n.children[this.peersColIndex!], leechers = n.children[this.peersColIndex! + 1];
      return [seeders.firstElementChild as HTMLSpanElement, leechers.firstElementChild as HTMLSpanElement];
    }
  }

  addPeersLink(e: Element, id: string, seeders?: HTMLSpanElement, leechers?: HTMLSpanElement) {
    const p = e.parentElement!;
    e.remove();
    const a = <a href={`/detail/${id}#peers`} target="_blank" style="display: flex; justify-content: center;">{e}</a> as HTMLAnchorElement;
    if (seeders && leechers) {
      let loading = false, loadingIcon;
      a.addEventListener('click', async function(e) {
        if (!modifierState) {
          e.preventDefault();
          if (!loading) {
            loading = true;
            if (!loadingIcon) {
              loadingIcon = Loading();
              this.prepend(loadingIcon);
            }

            const peers = await getTorrentPeers(id);
            if (peers) {
              let s = 0, l = 0;
              for (const p of peers) {
                if (p.left === '0') {
                  ++s;
                } else {
                  ++l;
                }
              }

              seeders.textContent = s as any;
              leechers.textContent = l as any;

              loadingIcon.remove();
              loadingIcon = null;
            }
            loading = false;
          }
        }
      });
    }
    if (this.linkColor) {
      a.style.color = this.linkColor as any;
      p.append(a);
    } else {
      p.append(a);
      a.style.color = (this.linkColor = a.computedStyleMap().get('color')) as any;
    }
  }

  setPeersLinkAndColor(n: HTMLTableRowElement) {
    const [seeders, leechers] = this.getPeersSpan(n)!;
    if (seeders && leechers) {
      const seedersCount = parseInt(seeders.innerText, 10), leechersCount = parseInt(leechers.innerText, 10);
      if (leechersCount && !Number.isNaN(seedersCount)) {
        // From NexusPHP https://github.com/xiaomlove/nexusphp/blob/master/include/functions.php#L560-L578
        const ratio = seedersCount / leechersCount;
        let color;
        if (ratio < 0.025) color = '#ff0000';
        else if (ratio < 0.05)  color = '#ee0000';
        else if (ratio < 0.075) color = '#dd0000';
        else if (ratio < 0.1)   color = '#cc0000';
        else if (ratio < 0.125) color = '#bb0000';
        else if (ratio < 0.15)  color = '#aa0000';
        else if (ratio < 0.175) color = '#990000';
        else if (ratio < 0.2)   color = '#880000';
        else if (ratio < 0.225) color = '#770000';
        else if (ratio < 0.25)  color = '#660000';
        else if (ratio < 0.275) color = '#550000';
        else if (ratio < 0.3)   color = '#440000';
        else if (ratio < 0.325) color = '#330000';
        else if (ratio < 0.35)  color = '#220000';
        else if (ratio < 0.375) color = '#110000';
        if (color) seeders.style.color = color;
      }
    }

    if (this.type === TableType.Torrents) {
      const peersTd = n.children[this.peersColIndex!];
      if (peersTd) {
        this.addPeersLink(peersTd.firstElementChild!, n.dataset.rowKey!, seeders, leechers);
      }
    } else if (this.type === TableType.Rankings) {
      if (seeders && leechers) {
        this.addPeersLink(seeders, n.dataset.rowKey!, seeders, leechers);
        this.addPeersLink(leechers, n.dataset.rowKey!, seeders, leechers);
      }
    }
  }

  replaceDownloadIcon(n: HTMLTableRowElement) {
    const i = n.getElementsByClassName('anticon-download')[0];
    if (i) i.replaceWith(Copy());
  }

  onTbodyChange(records: MutationRecord[]) {
    for (const r of records) {
      for (const n of r.addedNodes) {
        if ((n as Element).tagName === 'TR' &&
          (n as HTMLTableRowElement).childElementCount === this.rowsCount &&
          (n as HTMLTableRowElement).className !== 'ant-table-placeholder') {
          this.setPeersLinkAndColor(n as HTMLTableRowElement);
          this.replaceDownloadIcon(n as HTMLTableRowElement);
          this.addListSelect(n as HTMLTableRowElement);
        }
      }
    }
  }
}

const torrentsTable = new TorrentsTableManager();

export function findAndSetTable(n?: Element, type?: TableType) {
  if (n) {
    const e = n.querySelector('.ant-table-content > table');
    if (e) {
      torrentsTable.set(e as HTMLTableElement, type!);
      return true;
    }
  } else {
    torrentsTable.set(undefined, undefined);
  }
}

export function handleTorrentsTable(records: MutationRecord[], type: TableType) {
  for (const r of records) {
    for (const n of r.addedNodes) {
      if (n.nodeType === Node.ELEMENT_NODE) {
        if (findAndSetTable(n as Element, type))
          return;
      }
    }
  }
}
