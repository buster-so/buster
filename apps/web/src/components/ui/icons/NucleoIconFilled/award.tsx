import type { iconProps } from './iconProps';

function award(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px award';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,9.5c-1.107,0-2.136-.331-3-.896v2.895c0,.399.445.638.777.416l2.223-1.482,2.223,1.482c.332.221.777-.017.777-.416v-2.895c-.864.565-1.893.896-3,.896Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <circle cx="6" cy="4" fill="currentColor" r="4" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default award;
