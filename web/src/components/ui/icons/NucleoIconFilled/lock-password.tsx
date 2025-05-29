import type { iconProps } from './iconProps';

function lockPassword(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px lock password';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.25,7.5c-.414,0-.75-.336-.75-.75v-2.75c0-1.378-1.121-2.5-2.5-2.5s-2.5,1.122-2.5,2.5v2.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.75C5,1.794,6.794,0,9,0s4,1.794,4,4v2.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.25,6H4.75c-.965,0-1.75,.785-1.75,1.75v4.5c0,.965,.785,1.75,1.75,1.75H13.25c.965,0,1.75-.785,1.75-1.75V7.75c0-.965-.785-1.75-1.75-1.75Zm-3.5,4.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1Z"
          fill="currentColor"
        />
        <circle cx="2.25" cy="16.75" fill="currentColor" r="1.25" />
        <circle cx="6.75" cy="16.75" fill="currentColor" r="1.25" />
        <circle cx="11.25" cy="16.75" fill="currentColor" r="1.25" />
        <circle cx="15.75" cy="16.75" fill="currentColor" r="1.25" />
      </g>
    </svg>
  );
}

export default lockPassword;
