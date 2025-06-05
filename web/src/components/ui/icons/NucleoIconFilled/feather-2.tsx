import type { iconProps } from './iconProps';

function feather2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px feather 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m15.346,2.654c-1.697-1.697-4.459-1.697-6.156,0l-4.884,4.884c-.52.52-.806,1.21-.806,1.945v3.957l-2.03,2.03c-.293.293-.293.768,0,1.061.146.146.338.22.53.22s.384-.073.53-.22l6.9072-6.9062-2.656,4.8762h1.7368c.734,0,1.425-.286,1.944-.806l4.884-4.883c.822-.823,1.275-1.916,1.275-3.079s-.453-2.256-1.275-3.079Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default feather2;
