import type { iconProps } from './iconProps';

function levels(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px levels';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.25,10c-.414,0-.75-.336-.75-.75V3.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v5.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,10c-.414,0-.75-.336-.75-.75V1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v7.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12.25,10c-.414,0-.75-.336-.75-.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9.25,10c-.414,0-.75-.336-.75-.75v-3.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M6.25,10c-.414,0-.75-.336-.75-.75V1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v7.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M4.25,17h-1.5c-.965,0-1.75-.785-1.75-1.75v-1.5c0-.182,.066-.357,.186-.494l1.75-2c.285-.326,.844-.326,1.129,0l1.75,2c.12,.137,.186,.312,.186,.494v1.5c0,.965-.785,1.75-1.75,1.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,17h-1.5c-.965,0-1.75-.785-1.75-1.75v-1.5c0-.182,.066-.357,.186-.494l1.75-2c.285-.326,.844-.326,1.129,0l1.75,2c.12,.137,.186,.312,.186,.494v1.5c0,.965-.785,1.75-1.75,1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default levels;
