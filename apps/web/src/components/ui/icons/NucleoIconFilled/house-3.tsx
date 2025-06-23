import type { iconProps } from './iconProps';

function house3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.309,5.603L10.059,1.613c-.624-.475-1.495-.474-2.118,0L2.691,5.603s0,0,0,0c-.433,.329-.691,.85-.691,1.393v7.254c0,1.517,1.233,2.75,2.75,2.75h2.75v-4c0-.828,.672-1.5,1.5-1.5s1.5,.672,1.5,1.5v4h2.75c1.517,0,2.75-1.233,2.75-2.75V6.996c0-.543-.258-1.064-.691-1.394Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default house3;
