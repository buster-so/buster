import type { iconProps } from './iconProps';

function tag(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px tag';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.679,5.118L6.573,1.013c-.326-.326-.776-.513-1.237-.513h-3.086c-.965,0-1.75.785-1.75,1.75v3.086c0,.467.182.907.513,1.237l4.105,4.105c.536.536,1.24.804,1.944.804s1.408-.268,1.944-.804l1.672-1.672c.52-.519.806-1.209.806-1.944s-.286-1.425-.806-1.944Zm-6.679-.118c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default tag;
