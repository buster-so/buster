import type { iconProps } from './iconProps';

function sparkle4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px sparkle 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.526,5.303l-3.46-1.369L6.697.474c-.113-.286-.39-.474-.697-.474s-.584.188-.697.474l-1.369,3.46L.474,5.303c-.286.113-.474.39-.474.697s.188.584.474.697l3.46,1.369,1.369,3.46c.113.286.39.474.697.474s.584-.188.697-.474l1.368-3.46,3.46-1.369c.286-.113.474-.39.474-.697s-.188-.584-.474-.697Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default sparkle4;
