import type { iconProps } from './iconProps';

function phone(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px phone';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.347,10.646l-1.141,1.426c-1.767-1.039-3.24-2.511-4.278-4.278l1.426-1.141c.344-.275,.459-.748,.28-1.15l-1.3-2.927c-.193-.434-.671-.664-1.13-.545l-2.475,.642c-.478,.125-.787,.588-.719,1.077,.892,6.354,5.886,11.348,12.241,12.241,.489,.067,.952-.242,1.076-.719l.642-2.475c.119-.459-.111-.936-.544-1.129l-2.927-1.3c-.402-.179-.874-.064-1.15,.279Z"
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

export default phone;
