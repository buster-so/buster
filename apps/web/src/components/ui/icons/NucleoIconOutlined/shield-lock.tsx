import type { iconProps } from './iconProps';

function shieldLock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shield lock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="3.5"
          width="6"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="11.25"
          y="12.75"
        />
        <path
          d="M15.25,7.394v-2.914c0-.435-.281-.82-.695-.952l-5.25-1.68c-.198-.063-.411-.063-.61,0L3.445,3.528c-.414,.133-.695,.517-.695,.952v6.52c0,3.03,4.684,4.749,5.942,5.155"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,12.75v-1.5c0-.828,.672-1.5,1.5-1.5h0c.828,0,1.5,.672,1.5,1.5v1.5"
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

export default shieldLock;
