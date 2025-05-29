import type { iconProps } from './iconProps';

function chartArea2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart area 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.306,3.138c-.429-.213-.931-.166-1.312,.123l-6.017,4.564-3.21-2.207c-.496-.341-1.166-.281-1.592,.146l-2.81,2.81c-.233,.232-.366,.555-.366,.884v2.793c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V4.257c0-.478-.266-.907-.694-1.119Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chartArea2;
