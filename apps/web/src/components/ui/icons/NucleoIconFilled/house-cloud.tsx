import type { iconProps } from './iconProps';

function houseCloud(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house cloud';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.5,15.875c0-1.714,1.264-3.196,2.891-3.546,.839-1.133,2.176-1.829,3.609-1.829,.345,0,.677,.047,1,.121v-3.625c0-.543-.258-1.064-.691-1.394L10.059,1.613c-.624-.475-1.495-.474-2.118,0L2.691,5.603s0,0,0,0c-.433,.329-.691,.85-.691,1.393v7.254c0,1.517,1.233,2.75,2.75,2.75h3.947c-.117-.356-.197-.73-.197-1.125Z"
          fill="currentColor"
        />
        <path
          d="M15,12c-1.186,0-2.241,.714-2.72,1.756-1.197-.091-2.28,.896-2.28,2.119,0,1.172,.953,2.125,2.125,2.125h2.875c1.654,0,3-1.346,3-3s-1.346-3-3-3Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default houseCloud;
