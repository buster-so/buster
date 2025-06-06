import type { iconProps } from './iconProps';

function postageStamp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px postage stamp';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.75 5.75H12.25V12.25H5.75z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75,11.75c0-.652,.419-1.202,1-1.408v-2.684c-.581-.207-1-.756-1-1.408s.419-1.202,1-1.408v-1.592c0-.552-.448-1-1-1h-1.592c-.207,.581-.756,1-1.408,1s-1.202-.419-1.408-1h-2.684c-.207,.581-.756,1-1.408,1s-1.202-.419-1.408-1h-1.592c-.552,0-1,.448-1,1v1.592c.581,.207,1,.756,1,1.408s-.419,1.202-1,1.408v2.684c.581,.207,1,.756,1,1.408s-.419,1.202-1,1.408v1.592c0,.552,.448,1,1,1h1.592c.207-.581,.756-1,1.408-1s1.202,.419,1.408,1h2.684c.207-.581,.756-1,1.408-1s1.202,.419,1.408,1h1.592c.552,0,1-.448,1-1v-1.592c-.581-.207-1-.756-1-1.408Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.749,11.216c1.235-1.361,3.018-2.216,5.001-2.216,.516,0,1.018,.058,1.5,.167"
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

export default postageStamp;
