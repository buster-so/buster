import type { iconProps } from './iconProps';

function dice3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dice 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75ZM6.707,6.707c-.391,.391-1.024,.391-1.414,0-.391-.39-.391-1.024,0-1.414,.391-.391,1.024-.391,1.414,0,.391,.39,.391,1.024,0,1.414Zm3,3c-.391,.391-1.024,.391-1.414,0-.391-.39-.391-1.024,0-1.414,.391-.391,1.024-.391,1.414,0,.391,.39,.391,1.024,0,1.414Zm3,3c-.391,.391-1.024,.391-1.414,0-.391-.39-.391-1.024,0-1.414,.391-.391,1.024-.391,1.414,0,.391,.39,.391,1.024,0,1.414Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default dice3;
