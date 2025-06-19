import type { iconProps } from './iconProps';

function knifeSpoon(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px knife spoon';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.25,15.75V2.25c-.483,.718-.999,1.621-1.438,2.708-.817,2.029-1.028,3.866-1.062,5.147l2.5,2.145"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25 9L12.25 15.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <ellipse
          cx="12.25"
          cy="5.625"
          fill="none"
          rx="2.625"
          ry="3.375"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default knifeSpoon;
