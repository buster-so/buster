import type { iconProps } from './iconProps';

function circleCaretUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle caret up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.379,6.843l-2.022,2.987c-.337,.498,.02,1.17,.621,1.17h4.044c.601,0,.958-.672,.621-1.17l-2.022-2.987c-.297-.439-.945-.439-1.242,0Z"
          fill="currentColor"
        />
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default circleCaretUp;
