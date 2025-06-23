import type { iconProps } from './iconProps';

function boltSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bolt slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m8.465,13.07l-.319,3.159c-.037.26.299.394.451.18l5.872-8.265c.118-.166,0-.395-.204-.395h-.481"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.25,7.75h-1l.604-5.98c.037-.26-.299-.394-.451-.18L3.531,9.855c-.118.166,0,.395.204.395h4.016"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 16L16 2"
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

export default boltSlash;
