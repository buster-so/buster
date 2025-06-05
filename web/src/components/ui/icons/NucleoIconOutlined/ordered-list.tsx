import type { iconProps } from './iconProps';

function orderedList(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ordered list';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.5,11.661c.259-.921,1.152-1.425,2.116-1.411,.965,.014,1.872,.446,1.929,1.411s-.965,1.612-2.023,2.044c-1.058,.432-1.936,.835-2.023,2.044H6.548"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.5 5.25L16.25 5.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.5 12.75L16.25 12.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75,7.5V2s-.63,1.108-1.967,1.364"
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

export default orderedList;
