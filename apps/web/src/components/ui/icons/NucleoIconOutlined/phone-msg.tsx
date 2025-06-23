import type { iconProps } from './iconProps';

function phoneMsg(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px phone msg';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.097,10.896l-1.141,1.426c-1.767-1.039-3.24-2.511-4.278-4.278l1.426-1.141c.344-.275,.459-.748,.28-1.15l-1.3-2.927c-.193-.434-.671-.664-1.13-.545l-2.475,.642c-.478,.125-.787,.588-.719,1.077,.892,6.354,5.886,11.348,12.241,12.241,.489,.067,.952-.242,1.076-.719l.642-2.475c.119-.459-.111-.936-.544-1.129l-2.927-1.3c-.402-.179-.874-.064-1.15,.279Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75,1.75h-3.5c-.827,0-1.5,.673-1.5,1.5v1.5c0,.827,.673,1.5,1.5,1.5h.5v2l2.227-2h.773c.827,0,1.5-.673,1.5-1.5v-1.5c0-.827-.673-1.5-1.5-1.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default phoneMsg;
