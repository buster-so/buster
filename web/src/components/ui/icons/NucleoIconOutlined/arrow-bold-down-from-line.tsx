import type { iconProps } from './iconProps';

function arrowBoldDownFromLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold down from line';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.146,10.561l4.463,5.605c.2,.251,.582,.251,.782,0l4.463-5.605c.261-.328,.028-.811-.391-.811h-2.213V5.75c0-.552-.448-1-1-1h-2.5c-.552,0-1,.448-1,1v4h-2.213c-.419,0-.652,.484-.391,.811Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75 1.75L11.25 1.75"
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

export default arrowBoldDownFromLine;
