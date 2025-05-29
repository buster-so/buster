import type { iconProps } from './iconProps';

function tableRows3Cols2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table rows 3 cols 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M9.75,6h7.25v-1.25c0-1.517-1.233-2.75-2.75-2.75h-4.5V6Z" fill="currentColor" />
        <path d="M9.75 7.5H17V10.5H9.75z" fill="currentColor" />
        <path d="M1 7.5H8.25V10.5H1z" fill="currentColor" />
        <path d="M8.25,6V2H3.75c-1.517,0-2.75,1.233-2.75,2.75v1.25h7.25Z" fill="currentColor" />
        <path d="M9.75,12v4h4.5c1.517,0,2.75-1.233,2.75-2.75v-1.25h-7.25Z" fill="currentColor" />
        <path d="M8.25,12H1v1.25c0,1.517,1.233,2.75,2.75,2.75h4.5v-4Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default tableRows3Cols2;
