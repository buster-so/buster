import type { iconProps } from './iconProps';

function chartDonut(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px chart donut';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6.75,3.106c1.051.272,1.872,1.093,2.144,2.144h3.054C11.608,2.541,9.459.392,6.75.052v3.054Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m3.424,7.515c-.263-.446-.424-.96-.424-1.515,0-1.396.958-2.559,2.25-2.894V.052C2.295.423,0,2.946,0,6c0,1.384.476,2.657,1.266,3.673l2.158-2.158Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m8.894,6.75c-.335,1.292-1.498,2.25-2.894,2.25-.555,0-1.069-.161-1.515-.424l-2.158,2.158c1.016.79,2.289,1.266,3.673,1.266,3.054,0,5.577-2.295,5.948-5.25h-3.054Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default chartDonut;
