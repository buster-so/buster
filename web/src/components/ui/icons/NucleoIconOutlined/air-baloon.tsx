import type { iconProps } from './iconProps';

function airBaloon(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px air baloon';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.75 14.75H9.25V16.25H6.75z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.452,5.52c-.224-1.151-1.235-2.02-2.452-2.02-1.381,0-2.5,1.119-2.5,2.5-.828,0-1.5,.672-1.5,1.5s.672,1.5,1.5,1.5h4.75c.966,0,1.75-.783,1.75-1.75,0-.897-.678-1.628-1.548-1.73Z"
          fill="currentColor"
        />
        <path
          d="M10.749,2.411c-.813-.428-1.759-.661-2.749-.661-2.782,0-5.25,1.812-5.25,4.773s3.15,5.727,3.15,5.727h4.2s.66-.586,1.375-1.5"
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

export default airBaloon;
