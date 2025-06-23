import type { iconProps } from './iconProps';

function arrowBoldLeftFromLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold left from line';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.439,4.146L1.833,8.609c-.251,.2-.251,.582,0,.782l5.605,4.463c.328,.261,.811,.028,.811-.391v-2.213h4c.552,0,1-.448,1-1v-2.5c0-.552-.448-1-1-1h-4v-2.213c0-.419-.484-.652-.811-.391Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25 6.75L16.25 11.25"
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

export default arrowBoldLeftFromLine;
