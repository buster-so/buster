import type { iconProps } from './iconProps';

function users3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="6.5"
          cy="4.75"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.54,14.567c.837-.291,1.266-1.257,.866-2.048-.906-1.791-2.761-3.02-4.906-3.02s-4,1.228-4.906,3.02c-.4,.791,.028,1.757,.866,2.048,1.031,.358,2.408,.683,4.04,.683s3.009-.325,4.04-.683Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.547,15.078c.758-.128,1.428-.315,1.993-.511,.837-.291,1.266-1.257,.866-2.048-.78-1.542-2.263-2.667-4.03-2.95"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.733,6.86c.24,.087,.497,.14,.767,.14,1.243,0,2.25-1.007,2.25-2.25s-1.007-2.25-2.25-2.25c-.27,0-.527,.052-.767,.14"
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

export default users3;
