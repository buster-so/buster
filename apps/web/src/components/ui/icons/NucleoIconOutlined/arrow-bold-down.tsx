import type { iconProps } from './iconProps';

function arrowBoldDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.609,9.552l4.993,6.581c.2,.264,.597,.264,.797,0l4.993-6.581c.25-.329,.015-.802-.398-.802h-2.743V2.75c0-.552-.448-1-1-1h-2.5c-.552,0-1,.448-1,1v6h-2.743c-.413,0-.648,.473-.398,.802Z"
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

export default arrowBoldDown;
