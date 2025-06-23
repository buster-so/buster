import type { iconProps } from './iconProps';

function tableRows3Cols3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table rows 3 cols 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M7 2H11V6H7z" fill="currentColor" />
        <path d="M1 7.5H5.5V10.5H1z" fill="currentColor" />
        <path d="M7 12H11V16H7z" fill="currentColor" />
        <path d="M12.5 7.5H17V10.5H12.5z" fill="currentColor" />
        <path d="M7 7.5H11V10.5H7z" fill="currentColor" />
        <path d="M12.5,12v4h1.75c1.517,0,2.75-1.233,2.75-2.75v-1.25h-4.5Z" fill="currentColor" />
        <path d="M5.5,12H1v1.25c0,1.517,1.233,2.75,2.75,2.75h1.75v-4Z" fill="currentColor" />
        <path d="M5.5,6V2h-1.75c-1.517,0-2.75,1.233-2.75,2.75v1.25H5.5Z" fill="currentColor" />
        <path d="M12.5,6h4.5v-1.25c0-1.517-1.233-2.75-2.75-2.75h-1.75V6Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default tableRows3Cols3;
