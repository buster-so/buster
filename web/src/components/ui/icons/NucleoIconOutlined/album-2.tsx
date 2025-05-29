import type { iconProps } from './iconProps';

function album2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px album 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.25 1.25L5.75 1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25 4.25L3.75 4.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.066,7.25H14.934c.661,0,1.141,.63,.964,1.268l-1.944,7c-.12,.433-.514,.732-.964,.732H5.01c-.449,0-.843-.3-.964-.732l-1.944-7c-.177-.637,.302-1.268,.964-1.268Z"
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

export default album2;
