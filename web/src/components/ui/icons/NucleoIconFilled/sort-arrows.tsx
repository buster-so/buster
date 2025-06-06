import type { iconProps } from './iconProps';

function sortArrows(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px sort arrows';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9,3.5L7,.833c-.477-.636-1.523-.636-2,0l-2.001,2.667c-.285.381-.33.882-.117,1.309s.642.691,1.118.691h4c.477,0,.905-.265,1.118-.691s.168-.928-.118-1.309Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9.118,7.191c-.213-.426-.642-.691-1.118-.691h-4c-.477,0-.905.265-1.118.691s-.168.928.118,1.309l2,2.667c.238.318.603.5,1,.5s.762-.182,1-.5l2.001-2.667c.285-.381.33-.882.117-1.309Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default sortArrows;
