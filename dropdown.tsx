import { E } from './jsx.ts';
import { addStyle, specialClass } from './content.ts';
import { doAnimation } from './animation.ts';

addStyle(`:where(.my-ant-menu-override).ant-menu {
  --ant-menu-item-height: 1.5714285714285714; /* var(--ant-line-height); */
  box-sizing: border-box;
  position: fixed;
}
:where(.my-ant-menu-override).ant-menu-submenu-popup .ant-menu-vertical >.ant-menu-item {
  height: var(--ant-menu-item-height);
  line-height: var(--ant-menu-item-height);
}
:where(.my-ant-menu-override).ant-menu-submenu-popup .ant-menu-vertical .ant-menu-item {
  padding: 5px 12px; /* var(--ant-dropdown-padding-block) var(--ant-control-padding-horizontal); */
  margin: 0;
  width: auto;
}
:where(.my-ant-menu-override).ant-menu-submenu-popup .ant-menu-vertical.ant-menu-sub {
  min-width: auto;
  padding: 4px !important; /* var(--ant-padding-xxs) */
}
:where(.my-ant-menu-override).ant-menu .ant-menu-item-divider {
  height: 1px;
  margin-block: 4px !important; /* var(--ant-margin-xxs) */
}`);

enum DropdownState {
  Hide,
  Hiding,
  Show,
  Showing,
}

export function addDropdownMenu(target: HTMLElement, items: ([Node | string, (this: HTMLSpanElement, ev: MouseEvent) => any] | null)[]) {
  let dropdown: HTMLDivElement;
  let state = DropdownState.Hide;
  const win = target.ownerDocument.defaultView;
  const clickCallback = (callback: Function) => function(this: HTMLSpanElement, ev: MouseEvent): any {
    const r = callback.call(this, ev);
    if (r === false || !ev.defaultPrevented)
      hide();
    return r;
  };
  const create = () => {
    if (!dropdown) {
      dropdown = <div
        class={`ant-menu ant-menu-css-var ant-menu-light ant-menu-submenu ant-menu-submenu-hidden ant-menu-submenu-popup my-ant-menu-override ${specialClass}`}>
        <ul class="ant-menu ant-menu-sub ant-menu-vertical" role="menu">{items.map(i =>
          /*i === null ?
          <li role="separator" class="ant-menu-item-divider"></li> :*/ // separator unused
          <li role="menuitem" tabindex="-1" class="ant-menu-item ant-menu-item-only-child" click={clickCallback(i[1])}><span class="ant-menu-title-content">{i[0]}</span></li>
        )}</ul>
      </div>;
      document.body.appendChild(<div>{dropdown}</div>);
    }
  };
  const show = async () => {
    state = DropdownState.Showing;

    const { bottom, left } = target.getBoundingClientRect();
    const s = dropdown.style;
    s.top = (bottom + 4) + 'px';
    s.left = left + 'px';

    dropdown.classList.remove('ant-menu-submenu-hidden');
    await doAnimation(dropdown, 'ant-slide-up', true);

    state = DropdownState.Show;

    win?.addEventListener('mousedown', onTriggerClose, true);
    win?.addEventListener('contextmenu', onTriggerClose, true);
  };
  const hide = async () => {
    state = DropdownState.Hiding;

    win?.removeEventListener('mousedown', onTriggerClose, true);
    win?.removeEventListener('contextmenu', onTriggerClose, true);

    await doAnimation(dropdown, 'ant-slide-up', false);
    dropdown.classList.add('ant-menu-submenu-hidden');

    state = DropdownState.Hide;
  };
  const onTriggerClose = (ev: MouseEvent) => {
    if (state === DropdownState.Show && !dropdown.contains(ev.target as Node))
      hide();
  };

  target.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
    create();
    if (state === DropdownState.Hide) {
      show();
    } else if (state === DropdownState.Show) {
      hide();
    }
  });
}
