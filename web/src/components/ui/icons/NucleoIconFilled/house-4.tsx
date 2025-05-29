import type { iconProps } from './iconProps';

function house4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.309,5.602L10.059,1.613c-.624-.475-1.495-.474-2.118,0L2.691,5.602c-.433,.329-.691,.85-.691,1.394v7.254c0,1.517,1.233,2.75,2.75,2.75h2c.414,0,.75-.336,.75-.75v-5c0-.138,.112-.25,.25-.25h2.5c.138,0,.25,.112,.25,.25v5c0,.414,.336,.75,.75,.75h2c1.517,0,2.75-1.233,2.75-2.75V6.996c0-.544-.259-1.065-.691-1.394Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default house4;
