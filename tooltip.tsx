import { E } from './jsx.ts';
import { addStyle, specialClass } from './content.ts';
import { doAnimation } from './animation.ts';

addStyle(`:where(.my-ant-tooltip-override).ant-tooltip {
  box-sizing: border-box;
  top: -9999px;
  left: -9999px;
}

:where(.my-ant-tooltip-override).ant-tooltip .ant-tooltip-inner {
  color: #232222;
  background-color: #e7e1e0;
}`);

export class Tooltip {
  container?: HTMLDivElement;
  tooltip?: HTMLDivElement;
  inner?: HTMLDivElement;

  constructor() {
    this.container = <div>{
      this.tooltip =
      <div class={`ant-tooltip ant-tooltip-hidden ant-tooltip-placement-top my-ant-tooltip-override ${specialClass}`} style="top: 100px; left: 100px;">
        <div class="ant-tooltip-content">
          {this.inner = <div class="ant-tooltip-inner" role="tooltip"></div>}
        </div>
      </div>
    }</div>;
    document.body.appendChild(this.container!);
  }

  show(e: Element) {
    this.tooltip!.classList.remove('ant-tooltip-hidden');

    const { left, top } = e.getBoundingClientRect();
    const { scrollX, scrollY } = window;
    const s = this.tooltip!.style;
    s.left = (left + scrollX) + 'px';
    s.top = (top + scrollY - this.tooltip!.getBoundingClientRect().height - 4) + 'px';

    doAnimation(this.tooltip!, 'ant-zoom-big-fast', true);
  }

  async destroy() {
    await doAnimation(this.tooltip!, 'ant-zoom-big-fast', false);
    this.tooltip!.classList.add('ant-tooltip-hidden');
    this.container!.remove();
    this.container = this.tooltip = this.inner = undefined;
  }
}
