import type { iconProps } from './iconProps';

function volumeOff(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px volume off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.75,5.143V2.664c0-.395-.437-.634-.77-.421l-5.48,3.508H3.75c-.828,0-1.5,.672-1.5,1.5v3.5c0,.828,.672,1.5,1.5,1.5h2.63"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,13.21l3.981,2.548c.333,.213,.77-.026,.77-.421v-6.72"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75 15.75L16.75 2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default volumeOff;
