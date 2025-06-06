import type { iconProps } from './iconProps';

function backpack3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px backpack 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.25,4.457c-.414,0-.75-.336-.75-.75V1.75c0-.138-.112-.25-.25-.25h-2.5c-.138,0-.25,.112-.25,.25v1.957c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V1.75c0-.965,.785-1.75,1.75-1.75h2.5c.965,0,1.75,.785,1.75,1.75v1.957c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M11.5,11.5h-1v.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-.75h-2.5v5.5h5v-5.5Z"
          fill="currentColor"
        />
        <path
          d="M9,7.5c-1.378,0-2.5,1.122-2.5,2.5h5c0-1.378-1.122-2.5-2.5-2.5Z"
          fill="currentColor"
        />
        <path
          d="M9,2.5c-3.584,0-6.5,2.916-6.5,6.5v5.25c0,1.431,1.102,2.596,2.5,2.725v-6.975c0-2.206,1.794-4,4-4s4,1.794,4,4v6.975c1.398-.128,2.5-1.294,2.5-2.725v-5.25c0-3.584-2.916-6.5-6.5-6.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default backpack3;
