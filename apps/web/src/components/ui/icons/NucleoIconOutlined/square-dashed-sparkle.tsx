import type { iconProps } from './iconProps';

function squareDashedSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square dashed sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m6.75,15.25h-2c-1.105,0-2-.895-2-2v-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m2.75,6.75v-2c0-1.105.895-2,2-2h2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m15.25,11.25v2c0,1.105-.895,2-2,2h-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 5.25L10.25 7.75 12.75 9 10.25 10.25 9 12.75 7.75 10.25 5.25 9 7.75 7.75 9 5.25z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m16.159,3.49l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263.421c-.204.068-.342.259-.342.474s.138.406.342.474l1.263.421.421,1.263c.068.204.26.342.475.342s.406-.138.475-.342l.421-1.263,1.263-.421c.204-.068.342-.259.342-.474s-.138-.406-.342-.474h-.001Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default squareDashedSparkle;
