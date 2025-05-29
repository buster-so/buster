import type { iconProps } from './iconProps';

function ballEatingDots(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ball eating dots';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="13.5" cy="9" fill="currentColor" r="1" />
        <circle cx="17" cy="9" fill="currentColor" r="1" />
        <path
          d="M10.25,9l4.994-3.745c.159-.12,.264-.297,.292-.494,.028-.197-.023-.397-.143-.557-1.53-2.036-3.861-3.204-6.394-3.204C4.589,1,1,4.589,1,9s3.589,8,8,8c2.533,0,4.863-1.168,6.394-3.204,.12-.159,.171-.359,.143-.557-.028-.197-.133-.375-.292-.494l-4.994-3.745Zm-.543-3.293c-.391,.391-1.024,.391-1.414,0-.391-.39-.391-1.024,0-1.414,.391-.391,1.024-.391,1.414,0,.391,.39,.391,1.024,0,1.414Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default ballEatingDots;
