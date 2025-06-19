import type { iconProps } from './iconProps';

function baloonHeart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px baloon heart';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.302,17.25c-.431-.431-.431-1.13,0-1.56l.375-.379c.431-.431,.431-1.13,0-1.56h0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.546,13.639c.287,.148,.621,.148,.908,0,1.514-.78,6.296-3.61,6.296-8.211,.007-2.021-1.643-3.666-3.69-3.678-1.231,.016-2.376,.629-3.06,1.64-.684-1.011-1.829-1.624-3.06-1.64-2.047,.012-3.697,1.658-3.69,3.678,0,4.601,4.782,7.43,6.296,8.211Z"
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

export default baloonHeart;
