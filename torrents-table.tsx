import { E } from './jsx.ts';
import { specialClass } from './content.ts';
import { Copy, Loading, Check } from './icons.tsx';
import { genDlToken, getTorrentPeers } from './api.ts';
import { modifierState } from './keystate.ts';
import { addDropdownMenu } from './dropdown.tsx';
import { Tooltip } from './tooltip.tsx';

export enum TableType {
  None = 0,
  Torrents = 1,
  Rankings = 2,
}

class TorrentsTableManager {
  type?: TableType;
  table?: HTMLTableElement;
  tbodyObserver: MutationObserver;
  rowsCount?: number;
  peersColIndex?: number;
  linkColor?: CSSStyleValue;
  linkObserver: MutationObserver;
  peersObserver: MutationObserver;

  constructor() {
    this.tbodyObserver = new MutationObserver(this.onTbodyChange.bind(this));
    this.linkObserver = new MutationObserver(this.onLinkChange.bind(this));
    this.peersObserver = new MutationObserver(this.onPeersChange.bind(this));
  }

  set(table?: HTMLTableElement, type?: TableType) {
    this.tbodyObserver.disconnect();
    this.linkObserver.disconnect();
    this.type = type;
    this.table = table;
    this.peersColIndex = undefined;
    if (table) {
      const theadr = table.querySelector('thead > tr'),
        tbody = table.getElementsByTagName('tbody')[0];
      if (theadr && tbody) {
        const c = theadr.children;
        this.rowsCount = c.length;
        if (this.type === TableType.Rankings) {
          for (let i = c.length - 1; i >= 0; --i) {
            const e = c[i].firstElementChild;
            if (e && e.getAttribute('color') === 'red') {
              this.peersColIndex = i + 1;
              break;
            }
          }

          const colgroup = table.getElementsByTagName('colgroup')[0];
          colgroup?.prepend(<col style="width: 42px;"></col>);
        }

        this.modifyPlaceholderColspan(tbody);
        this.addListSelectHead(theadr, tbody);
        this.tbodyObserver.observe(tbody, { childList: true });
      }
    }
  }

  modifyPlaceholderColspan(tbody: HTMLTableSectionElement) {
    const td = tbody.querySelector('tr.ant-table-placeholder > td[colspan]') as HTMLTableCellElement;
    if (td) ++td.colSpan;
  }

  addListSelectHead(theadr: Element, tbody: HTMLTableSectionElement) {
    let span: HTMLSpanElement, loading = false;
    const button: HTMLButtonElement =
      <button
        type="button" class={`ant-btn ant-btn-default ant-btn-sm ant-btn-color-default ant-btn-variant-outlined ant-btn-icon-only ${specialClass}`}
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
              const tooltip = new Tooltip();
              let count = 0;
              const total = selected.length;
              const updateCount = () => {
                tooltip.inner!.textContent = `${count}/${total}`;
              };

              setLoading(true);
              updateCount();
              tooltip.show(this);

              const urls: (string | null)[] = [];
              try {
                for (const tr of selected) {
                  const url = await genDlToken((tr as HTMLElement).dataset.id!);
                  urls.push(url);
                  ++count;
                  updateCount();
                }
              } catch (e) {
                console.error(e);
                tooltip.inner!.textContent = '获取种子链接失败';
              }
              if (!urls.some(i => !i)) {
                for (let i = 0; i < 2; ++i) {
                  try {
                    await navigator.clipboard.writeText(urls.join('\n'));
                    break;
                  } catch (e) {
                    alert('页面不在前台，复制失败，按确定再次尝试复制');
                    await new Promise(r => setTimeout(r, 0));
                  }
                }
                setLoading(false);
                tooltip.destroy();
              }
            }
          }
        }}
      >{span = <span class="ant-btn-icon">{Copy()}</span>}</button>;

    const select = (all: boolean) => {
      const inputs = tbody.getElementsByClassName('ant-checkbox-input') as HTMLCollectionOf<HTMLInputElement>;
      const event = new Event('change');
      for (const i of inputs) {
        i.checked = all || !i.checked;
        i.dispatchEvent(event);
      }
    };
    addDropdownMenu(button, [
      ['全选', select.bind(null, true)],
      ['反选', select.bind(null, false)],
    ]);

    let attr;
    if (this.type === TableType.Torrents) {
      attr = { class: 'border border-solid border-black p-2', style: 'width: 42px;' };
    } else if (this.type === TableType.Rankings) {
      attr = { class: 'ant-table-cell', scope: 'col', style: 'text-align: center;' };
    }
    theadr.prepend(E('th', attr, button));
  }

  onTbodyChange(records: MutationRecord[]) {
    for (const r of records) {
      for (const n of r.addedNodes) {
        if ((n as Element).tagName === 'TR' &&
          (n as HTMLTableRowElement).childElementCount === this.rowsCount &&
          (n as HTMLTableRowElement).className !== 'ant-table-placeholder') {
          const a = this.addListSelect(n as HTMLTableRowElement);
          this.setPeersLinkAndColor(n as HTMLTableRowElement, a);
          this.linkObserver.observe(a, { attributes: true, attributeFilter: ['href'] });
          this.replaceDownloadIcon(n as HTMLTableRowElement);
        }
      }
    }
  }

  onLinkChange(records: MutationRecord[]) {
    for (const r of records) {
      (r.target as any)?.__my_update_id?.();
    }
  }

  addListSelect(tr: HTMLTableRowElement) {
    const origClass = tr.className;
    tr.style.transition = 'background-color .2s';
    const a = tr.querySelector('a[href^="/detail/"]');
    if (a) {
      (a as any).__my_dataset_tr = tr;
      (a as any).__my_update_id = function() {
        const id = this.getAttribute('href')!.slice(8); // '/detail/'.length = 8
        this.__my_dataset_tr.dataset.id = id;
        const links = this.__my_peers_links;
        if (links) {
          const href = `/detail/${id}#peers`;
          for (const l of links) {
            l.href = href;
          }
        }
      };
      (a as any).__my_update_id();
    }

    let label: HTMLLabelElement, span: HTMLSpanElement, attr;
    if (this.type === TableType.Torrents) {
      attr = { class: "border border-solid border-black p-2 ", align: "center" };
    } else if (this.type === TableType.Rankings) {
      attr = { class: 'ant-table-cell', style: 'text-align: center;' };
    }
    tr.prepend(E('td', attr,
      label = <label class={`ant-checkbox-wrapper ${specialClass}`} style="transform: scale(1.5);">{
        span = <span class={`ant-checkbox ${specialClass}`}>
          <input class="ant-checkbox-input" type="checkbox" change={function() {
            const c = (this as HTMLInputElement).checked;
            span.classList.toggle('ant-checkbox-checked', c);
            label.classList.toggle('ant-checkbox-wrapper-checked', c);
            if (c) {
              const l = tr.classList;
              l.remove('bg-sticky_top', 'bg-sticky_normal');
              l.add('bg-black/10', 'ant-table-row-selected');
            } else {
              tr.className = origClass;
            }
          }} />
          <span class="ant-checkbox-inner"></span>
        </span>
      }</label>
    ));

    return a;
  }

  onPeersChange(records: MutationRecord[]) {
    const seedersSet = new Set();
    for (const r of records) {
      let e = r.target;
      if (e.nodeType === Node.TEXT_NODE) {
        e = e.parentElement;
      }
      const s = (e as any).__my_linked_seeders;
      if (s) e = s; // is leechers
      seedersSet.add(e);
    }
    for (const s of seedersSet) {
      (s as any).__my_update_color();
    }
  }

  setPeersLinkAndColor(n: HTMLTableRowElement, a) {
    const [seedersTd, leechersTd] = this.getPeersTd(n)!;
    if (seedersTd && leechersTd) {
      const seeders = seedersTd.lastElementChild as HTMLElement, leechers = leechersTd.lastElementChild as HTMLElement;
      if (seeders && leechers) {
        (leechers as any).__my_linked_seeders = seeders;
        (seeders as any).__my_linked_leechers = leechers;
        (seeders as any).__my_update_color = function() {
          const seedersCount = parseInt(this.textContent, 10), leechersCount = parseInt(this.__my_linked_leechers.textContent, 10);
          if (leechersCount && !Number.isNaN(seedersCount)) {
            // From NexusPHP https://github.com/xiaomlove/nexusphp/blob/master/include/functions.php#L560-L578
            const ratio = seedersCount / leechersCount;
            let color = '';
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
            this.style.color = color;
          }
        };
        (seeders as any).__my_update_color();
        this.peersObserver.observe(seeders, { subtree: true, characterData: true });
        this.peersObserver.observe(leechers, { subtree: true, characterData: true });

        const id = n.dataset.id!;
        a.__my_peers_links = [
          this.addPeersLink(seedersTd, id, seeders, leechers),
          this.addPeersLink(leechersTd, id, seeders, leechers)
        ];
      }
    }
  }

  getPeersTd(n: HTMLTableRowElement): [HTMLSpanElement?, HTMLSpanElement?] {
    if (!this.peersColIndex && this.type === TableType.Torrents) {
      const c = n.children;
      for (let i = c.length - 1; i >= 0; --i) {
        if (c[i].getElementsByClassName('anticon-arrow-down').length !== 0) {
          this.peersColIndex = i;
          break;
        }
      }
    }
    if (!this.peersColIndex)
      return [undefined, undefined];

    const seeders = n.children[this.peersColIndex! - 1], leechers = n.children[this.peersColIndex!];
    return [seeders as HTMLTableCellElement, leechers as HTMLTableCellElement];
  }

  addPeersLink(p: Element, id: string, seeders?: HTMLSpanElement, leechers?: HTMLSpanElement) {
    const c = Array.from(p.children);
    for (const i of c) {
      i.remove();
    }

    const a = <a href={`/detail/${id}#peers`} target="_blank">{c}</a> as HTMLAnchorElement;
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

    return a;
  }

  replaceDownloadIcon(n: HTMLTableRowElement) {
    const i = n.getElementsByClassName('anticon-download')[0];
    i?.replaceWith(Copy());
  }
}

const torrentsTable = new TorrentsTableManager();

export function findAndSetTable(n?: Element, type?: TableType) {
  if (n) {
    const e = n.querySelector('table');
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
