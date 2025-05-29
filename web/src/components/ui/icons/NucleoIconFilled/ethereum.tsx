import type { iconProps } from './iconProps';

function ethereum(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ethereum';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.365,9.071L9.615,.821c-.28-.402-.95-.402-1.23,0L2.635,9.071c-.189,.271-.178,.635,.028,.895l5.75,7.25c.142,.18,.358,.284,.587,.284s.445-.104,.587-.284l5.75-7.25c.206-.259,.217-.623,.028-.895ZM9.75,3.638l3.861,5.54-3.861,1.678V3.638Zm-1.5,8.854v2.105l-2.549-3.213,2.549,1.108Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default ethereum;
