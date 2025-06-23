import type { iconProps } from './iconProps';

function pin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pin';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C5.791,1,2.471,3.344,2.471,7.267c0,2.792,3.252,6.915,5.189,9.125,.339,.387,.827,.609,1.34,.609s1.001-.222,1.339-.608c1.938-2.21,5.19-6.335,5.19-9.125,0-3.922-3.32-6.267-6.529-6.267Zm0,8.25c-.967,0-1.75-.784-1.75-1.75s.783-1.75,1.75-1.75,1.75,.784,1.75,1.75-.783,1.75-1.75,1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default pin;
