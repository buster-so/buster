import type { iconProps } from './iconProps';

function codeAction(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px code action';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,13c-.414,0-.75-.336-.75-.75V5.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <circle cx="9" cy="3.5" fill="currentColor" r="2.75" />
        <circle cx="9" cy="14.5" fill="currentColor" r="2.75" />
      </g>
    </svg>
  );
}

export default codeAction;
