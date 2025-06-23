import type { iconProps } from './iconProps';

function handBookOpen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hand book open';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 2.946L9 4.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,8V3.487c0-.354-.181-.68-.486-.86-.637-.376-1.726-.863-3.14-.863-1.89,0-3.198,.872-3.624,1.182-.425-.31-1.734-1.181-3.624-1.182-1.414,0-2.503,.487-3.14,.863-.305,.18-.486,.502-.486,.856,0,1.618,0,6.498,0,9.09,0,.697,.696,1.188,1.344,.933,.27-.106,.573-.204,.906-.28"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.25,15.225c0-2.059-.236-3.639-1-4.223-.875-.669-3.152-.838-5.295-.232l-1.33-2.827c-.293-.626-1.037-.896-1.663-.603h0c-.625,.292-.896,1.036-.604,1.661l2.561,5.456-2.724-.501c-.587-.108-1.167,.224-1.371,.785h0c-.232,.637,.098,1.34,.736,1.569l2.616,.941"
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

export default handBookOpen;
