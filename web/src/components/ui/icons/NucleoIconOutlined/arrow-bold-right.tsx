import type { iconProps } from './iconProps';

function arrowBoldRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.552,14.391l6.581-4.993c.264-.2,.264-.597,0-.797L9.552,3.609c-.329-.25-.802-.015-.802,.398v2.743H2.75c-.552,0-1,.448-1,1v2.5c0,.552,.448,1,1,1h6v2.743c0,.413,.473,.648,.802,.398Z"
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

export default arrowBoldRight;
