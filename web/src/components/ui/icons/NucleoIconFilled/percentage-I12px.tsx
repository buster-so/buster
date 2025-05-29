import type { iconProps } from './iconProps';

function percentage(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px percentage';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5,8c-1.654,0-3-1.346-3-3s1.346-3,3-3,3,1.346,3,3-1.346,3-3,3Zm0-4.5c-.827,0-1.5,.673-1.5,1.5s.673,1.5,1.5,1.5,1.5-.673,1.5-1.5-.673-1.5-1.5-1.5Z"
          fill="currentColor"
        />
        <path
          d="M13,16c-1.654,0-3-1.346-3-3s1.346-3,3-3,3,1.346,3,3-1.346,3-3,3Zm0-4.5c-.827,0-1.5,.673-1.5,1.5s.673,1.5,1.5,1.5,1.5-.673,1.5-1.5-.673-1.5-1.5-1.5Z"
          fill="currentColor"
        />
        <path
          d="M4.75,16c-.146,0-.292-.042-.421-.13-.342-.233-.431-.699-.198-1.042L12.63,2.328c.232-.342,.699-.431,1.042-.198,.342,.233,.431,.699,.198,1.042L5.37,15.672c-.145,.213-.381,.328-.621,.328Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default percentage;
